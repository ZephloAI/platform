"""
WebSocket chat router.

Provides a persistent WebSocket connection for real-time chat.
The client connects with session_id and chatbot_id query params,
which are validated against the database before accepting.

Endpoint:
    WS /ws/chat?session_id=<uuid>&chatbot_id=<id>
    Client sends: { "message": "..." }
    Server sends: { "response": "...", "sources": [...], "session_id": "...", "follow_up_prompts": [...] }
"""

import hashlib
import json
import logging
import re
import secrets
import uuid

import asyncpg
import httpx
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from agno.run.agent import RunOutput, RunEvent

from app.config import settings
from app.agent import create_agent, clean_response, extract_resolution, connect_mcp_servers
from app.rag import retrieve_context, format_context_for_llm, collection_exists_for_chatbot
from app.tts import text_to_speech
from app.mcp_meta import McpMetaCollector, set_active_collector, install_patch
from app.usage_client import extract_token_counts, precheck_usage, record_usage
from app.webmcp_tools import create_web_tools, WebSocketDispatcher

logger = logging.getLogger(__name__)

router = APIRouter()

install_patch()

# Active visitor WebSocket connections: session_id -> WebSocket
active_connections: dict[str, WebSocket] = {}


def _compute_message_id(response_text: str, tools) -> str:
    """Stable content hash for client-side dedup. Combines tool calls
    (name + arguments) and response text into a sorted-key JSON payload,
    SHA-256 hashed, truncated to 16 hex chars. Transient — not persisted.
    """
    tool_sigs = [
        {"name": t.tool_name, "args": getattr(t, "arguments", None)}
        for t in (tools or [])
    ]
    payload = json.dumps(
        {"tools": tool_sigs, "text": response_text},
        sort_keys=True,
        default=str,
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:16]


# --- Friendly status labels surfaced to the visitor while the agent works ---
# Known tools get a hand-written phrase. Anything else (dynamic web tools or
# arbitrary MCP server tools) falls back to a humanized snake_case rendering,
# e.g. "check_availability" -> "Checking availability…". To refine a specific
# tool's wording, just add it to _TOOL_STATUS_LABELS.
_TOOL_STATUS_LABELS: dict[str, str] = {
    "navigate_to_page": "Taking you there…",
}

# Tools whose calls are pure plumbing — they should not show a status line.
_SILENT_TOOLS: frozenset[str] = frozenset({"suggest_follow_ups"})

# Common leading verbs mapped to their "-ing" form so a tool like
# "check_availability" reads "Checking availability…" instead of the clumsy
# "Checking check availability…". Anything not listed gets a "Checking …" prefix.
_VERB_GERUNDS: dict[str, str] = {
    "check": "Checking", "get": "Getting", "fetch": "Fetching",
    "search": "Searching", "find": "Finding", "lookup": "Looking up",
    "look": "Looking up", "list": "Listing", "load": "Loading",
    "read": "Reading", "query": "Querying", "create": "Creating",
    "update": "Updating", "book": "Booking", "send": "Sending",
}


# Agent is prompted to append `[RESOLVED]` / `[UNRESOLVED]` at the end of its
# answer so the server can record whether the turn resolved the visitor's
# question. Without filtering, those tags stream through to the widget and
# appear at the end of the bubble. `_StreamMarkerStripper` holds back the
# last ~12 chars of every chunk so a marker split across token boundaries is
# caught before it reaches the client.
_RESOLUTION_RE = re.compile(r"\[(?:UN)?RESOLVED\]")
_RESOLUTION_TAIL_HOLD = len("[UNRESOLVED]")


class _StreamMarkerStripper:
    """Filter resolution markers out of a token stream without breaking when
    a marker is split across multiple chunks."""

    __slots__ = ("_buf",)

    def __init__(self) -> None:
        self._buf = ""

    def push(self, chunk: str) -> str:
        """Append `chunk` and return text that's safe to forward right now."""
        self._buf = _RESOLUTION_RE.sub("", self._buf + chunk)
        if len(self._buf) <= _RESOLUTION_TAIL_HOLD:
            return ""
        out = self._buf[:-_RESOLUTION_TAIL_HOLD]
        self._buf = self._buf[-_RESOLUTION_TAIL_HOLD:]
        return out

    def flush(self) -> str:
        """Drain the buffer at end-of-stream and strip a trailing marker +
        the newline it usually sits on (the prompt asks for it on its own
        line, so a hanging "\\n" left behind would render as a blank line)."""
        out = _RESOLUTION_RE.sub("", self._buf)
        self._buf = ""
        return out.rstrip() if out and out != out.strip() else out


def _friendly_tool_label(tool_name: str) -> str | None:
    """Turn a raw tool name into a short, user-facing status sentence.

    Returns None for internal/plumbing tools that should stay silent.
    """
    if not tool_name or tool_name in _SILENT_TOOLS:
        return None
    if tool_name in _TOOL_STATUS_LABELS:
        return _TOOL_STATUS_LABELS[tool_name]
    words = [w for w in tool_name.replace("-", "_").split("_") if w]
    if not words:
        return "Working…"
    gerund = _VERB_GERUNDS.get(words[0].lower())
    if gerund:
        rest = " ".join(words[1:])
        return f"{gerund} {rest}…" if rest else f"{gerund}…"
    return f"Checking {' '.join(words)}…"


async def store_message(session_id: str, role: str, content: str, is_resolved: bool | None = None):
    """Store a message via the API internal endpoint."""
    try:
        payload = {"session_id": session_id, "role": role, "content": content}
        if is_resolved is not None:
            payload["is_resolved"] = is_resolved
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"{settings.API_CALLBACK_URL}/api/internal/messages",
                json=payload,
            )
    except Exception:
        logger.warning(f"Failed to store message for session {session_id}")


async def check_session_mode(session_id: str, chatbot_id: int) -> str:
    """Check the current mode of a session from the database."""
    try:
        conn = await asyncpg.connect(settings.DATABASE_URL_ASYNCPG)
        try:
            row = await conn.fetchrow(
                "SELECT mode FROM chat_sessions WHERE id = $1 AND chatbot_id = $2",
                uuid.UUID(session_id), chatbot_id,
            )
            return row["mode"] if row else "ai"
        finally:
            await conn.close()
    except Exception:
        logger.warning(f"Failed to check session mode for {session_id}, defaulting to ai")
        return "ai"


async def mark_session_unread(session_id: str):
    """Mark session as unread via API internal endpoint."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.put(
                f"{settings.API_CALLBACK_URL}/api/internal/conversations/{session_id}/unread",
            )
    except Exception:
        logger.warning(f"Failed to mark session unread: {session_id}")


async def fetch_message_history(session_id: str) -> list[dict]:
    """Fetch message history from API for context."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"{settings.API_CALLBACK_URL}/api/internal/messages/{session_id}",
            )
            if resp.status_code == 200:
                return resp.json()
    except Exception:
        logger.warning(f"Failed to fetch message history for {session_id}")
    return []


@router.post("/api/internal/push")
async def push_to_visitor(request_data: dict):
    """Push an admin message to a connected visitor WebSocket."""
    session_id = request_data.get("session_id")
    content = request_data.get("content")
    logger.info(f"Push request: session={session_id}, active_connections={list(active_connections.keys())}")
    if session_id and session_id in active_connections:
        ws = active_connections[session_id]
        try:
            await ws.send_json({
                "message_type": "admin_message",
                "content": content,
            })
            logger.info(f"Pushed admin message to visitor: session={session_id}")
            return {"ok": True}
        except Exception as e:
            logger.error(f"Failed to push to visitor: session={session_id}, error={e}")
            return {"ok": False, "error": "Failed to send"}
    logger.warning(f"No active connection for session={session_id}")
    return {"ok": False, "error": "No active connection"}


@router.websocket("/ws/chat")
async def ws_chat(ws: WebSocket):
    """
    WebSocket endpoint for real-time chat.

    Authentication:
        Pass session_id and chatbot_id as query params:
        /ws/chat?session_id=<uuid>&chatbot_id=<id>
        The session must exist in the database and belong to the chatbot.

    Message flow:
        1. Client sends JSON: { "message": "..." }
        2. Server retrieves RAG context from Qdrant.
        3. Server runs the Agno agent and sends back a JSON response.
    """
    # --- Validate query params ---
    session_id = ws.query_params.get("session_id")
    chatbot_id_str = ws.query_params.get("chatbot_id")

    if not session_id or not chatbot_id_str:
        await ws.close(code=4001, reason="Missing session_id or chatbot_id")
        return

    try:
        session_uuid = uuid.UUID(session_id)
    except (ValueError, TypeError):
        await ws.close(code=4001, reason="Invalid session_id")
        return

    # --- Resolve chatbot by public_id (UUID) only ---
    conn = await asyncpg.connect(settings.DATABASE_URL_ASYNCPG)
    try:
        chatbot_row = await conn.fetchrow(
            "SELECT id, name, follow_up_prompts, mcp_servers, webmcp_enabled, instructions, person_mode_enabled, navigation_enabled, llm_model, lead_capture_enabled FROM chatbots WHERE public_id = $1",
            chatbot_id_str,
        )

        if not chatbot_row:
            await ws.close(code=4002, reason="Chatbot not found")
            return

        chatbot_id = chatbot_row["id"]

        session_row = await conn.fetchrow(
            "SELECT id FROM chat_sessions WHERE id = $1 AND chatbot_id = $2",
            session_uuid, chatbot_id,
        )
        if not session_row:
            await ws.close(code=4001, reason="Invalid session")
            return
    finally:
        await conn.close()

    chatbot_name = chatbot_row["name"]
    follow_up_prompts = json.loads(chatbot_row["follow_up_prompts"] or "[]")
    mcp_configs = json.loads(chatbot_row["mcp_servers"] or "[]")
    custom_instructions = chatbot_row["instructions"] or None
    person_mode_enabled = chatbot_row["person_mode_enabled"] if chatbot_row["person_mode_enabled"] is not None else True
    navigation_enabled = bool(chatbot_row["navigation_enabled"])
    # The agent's configured model (NULL ⇒ global default). Read here at
    # connect time so the next session picks up an admin's model change.
    agent_model = chatbot_row["llm_model"]
    resolved_model = agent_model or settings.LLM_MODEL
    lead_capture_enabled = bool(chatbot_row["lead_capture_enabled"])

    await ws.accept()
    active_connections[session_id] = ws

    # --- Set up dispatcher for safe concurrent WebSocket reads ---
    dispatcher = WebSocketDispatcher(ws)

    # --- Wait for init message (always sent by widget on connect) ---
    init_raw = await ws.receive_text()
    init_data = json.loads(init_raw)
    zephlo_tool_schemas = init_data.get("zephlo_tools", [])
    logger.info(f"Init message received: session={session_id}, tools={len(zephlo_tool_schemas)}")

    # Start dispatcher AFTER init so the init read is synchronous
    await dispatcher.start()

    page_context = {}

    # --- Add "Talk to a real person" to the follow-up pool so the agent can suggest it ---
    # Only surfaced when the visitor *explicitly* asks for a human ("can I
    # talk to a person?", "I want a real agent"). The strict description
    # below is what gates the LLM — without it, the model tends to offer
    # this proactively, which feels like the AI is giving up on the visitor.
    if person_mode_enabled:
        follow_up_prompts.append({
            "title": "Talk to a real person",
            "description": (
                "Suggest this ONLY when the visitor has explicitly asked to "
                "speak with a human, a real person, or a live agent (e.g. "
                "\"can I talk to a person?\", \"I want a human\", \"connect "
                "me with someone\"). NEVER suggest it proactively, on "
                "greetings, when the AI can answer, or when the visitor is "
                "merely frustrated — only on a direct request for a human."
            ),
            "prompt": "__switch_to_person__",
        })

    # --- Check if the Qdrant collection exists (website has been crawled) ---
    has_rag_data = collection_exists_for_chatbot(chatbot_id, chatbot_name)

    # --- Connect MCP servers ---
    mcp_tools = await connect_mcp_servers(mcp_configs)

    # --- Build web tool functions from schemas ---
    web_tool_fns = create_web_tools(zephlo_tool_schemas, dispatcher) if zephlo_tool_schemas else []
    all_tools = list(mcp_tools) + web_tool_fns

    # --- Create ONE agent for the lifetime of this connection ---
    agent, follow_up_toolkit = create_agent(
        chatbot_name=chatbot_name,
        session_id=session_id,
        follow_up_pool=follow_up_prompts,
        mcp_tools=all_tools,
        custom_instructions=custom_instructions,
        has_rag_data=has_rag_data,
        navigation_enabled=navigation_enabled,
        dispatcher=dispatcher,
        llm_model=agent_model,
        lead_capture_enabled=lead_capture_enabled,
        chatbot_id=chatbot_id,
    )

    try:
        while True:
            raw = await dispatcher.get_user_message()
            data = json.loads(raw)

            # Handle page context updates from widget SDK
            if data.get("message_type") == "context_update":
                page_context = data.get("page_context", {})
                continue

            # Handle switch to person mode
            if data.get("message_type") == "switch_to_person":
                conn = await asyncpg.connect(settings.DATABASE_URL_ASYNCPG)
                try:
                    await conn.execute(
                        "UPDATE chat_sessions SET mode = 'person', updated_at = now() WHERE id = $1",
                        uuid.UUID(session_id),
                    )
                finally:
                    await conn.close()
                await dispatcher.send_json({
                    "message_type": "mode_changed",
                    "mode": "person",
                    "session_id": session_id,
                })
                continue

            # Manual agent trigger fired from the widget SDK. The `prompt`
            # is an instruction to the agent — not user-facing text. We wrap
            # it as a proactive-turn system instruction and fall through to
            # the normal pipeline. No synthetic "user" message is stored in
            # history because the visitor didn't actually type anything.
            is_trigger = data.get("message_type") == "trigger"
            trigger_mode = data.get("mode", "open") if is_trigger else None
            if is_trigger:
                trigger_prompt = data.get("prompt", "")
                trigger_id = data.get("trigger_id", "")
                # Merge trigger page_context into the ambient page_context so
                # the agent's dependencies see the fresh data.
                trigger_ctx = data.get("page_context") or {}
                if trigger_ctx:
                    page_context = {**(page_context or {}), **trigger_ctx}
                message = (
                    "You are being invoked proactively by the website — the "
                    "visitor did NOT type anything. Do not pretend they did. "
                    "Greet briefly (1-2 sentences) and offer help based on "
                    f"this reason: {trigger_prompt}"
                )
                voice = False
                logger.info(
                    f"Processing trigger: session={session_id}, trigger_id={trigger_id}, mode={trigger_mode}, prompt={trigger_prompt[:100]}"
                )
            else:
                message = data.get("message", "")
                voice = data.get("voice", False)
                # Guard: only genuine chat frames with content may reach the
                # agent. A stray frame (e.g. a duplicate "init" from an old
                # widget racing its sockets) would otherwise fall through here
                # as an empty message and trigger a phantom agent run.
                if data.get("message_type") not in (None, "chat") or not message.strip():
                    logger.warning(
                        f"Ignoring non-chat/empty frame: session={session_id}, msg_type={data.get('message_type')}"
                    )
                    continue
                logger.info(f"Processing message: session={session_id}, msg_type={data.get('message_type')}, message={message[:100]}")

            # Check session mode
            session_mode = await check_session_mode(session_id, chatbot_id)
            logger.info(f"Session mode: {session_mode}")

            # Proactive triggers are always handled by the AI path — a
            # trigger fired while a human agent is taking over would be
            # confusing, so we just silently ignore it.
            if is_trigger and session_mode == "person":
                continue

            if session_mode == "person":
                # In person mode: store the user message and notify admin, skip AI
                await store_message(session_id, "user", message)
                await mark_session_unread(session_id)
                await dispatcher.send_json({
                    "message_type": "waiting",
                    "response": "",
                    "sources": [],
                    "session_id": session_id,
                    "follow_up_prompts": [],
                })
                continue

            # Step 1: Retrieve relevant context from Qdrant (skip if no collection)
            contexts = []
            if has_rag_data:
                # Let the visitor know we're looking things up before the run.
                await dispatcher.send_json(
                    {"message_type": "status", "label": "Searching the site…"}
                )
                contexts = retrieve_context(
                    chatbot_id, message, top_k=settings.TOP_K, chatbot_name=chatbot_name
                ) or []

            # Step 2: Build the full prompt
            # If returning from person mode, prepend admin conversation context
            admin_context = ""
            history = await fetch_message_history(session_id)
            admin_messages = [m for m in history if m.get("role") == "admin"]
            if admin_messages:
                context_lines = []
                for m in history[-10:]:  # Last 10 messages for context
                    if m["role"] in ("admin", "user"):
                        label = "Admin" if m["role"] == "admin" else "Visitor"
                        context_lines.append(f"{label}: {m['content']}")
                if context_lines:
                    admin_context = "Previous conversation with a human team member:\n" + "\n".join(context_lines) + "\n\n"

            voice_instruction = (
                "Keep your answer to 1-2 short sentences. Be conversational and direct. "
            ) if voice else ""

            if has_rag_data:
                context_str = format_context_for_llm(contexts)
                full_prompt = (
                    f"{admin_context}"
                    f"Here is what you know:\n{context_str}\n\n"
                    f"The visitor asks: {message}\n\n"
                    f"{voice_instruction}"
                    "Respond naturally and confidently as a team member. "
                    "Do not mention sources or URLs in your answer."
                )
            else:
                full_prompt = (
                    f"{admin_context}"
                    f"The visitor asks: {message}\n\n"
                    f"{voice_instruction}"
                    "Respond naturally and confidently as a team member."
                )

            # Pre-flight usage check. If the org is over its token budget or
            # suspended, surface a structured error and skip the LLM run.
            precheck = await precheck_usage(chatbot_id)
            if precheck.is_blocked:
                await dispatcher.send_json({
                    "message_type": "error",
                    "error": precheck.message or "Usage limit reached.",
                    "code": precheck.code,
                    "limit": precheck.limit,
                })
                continue

            # Step 4: Run the agent with streaming events so we can surface
            # live status to the widget as it works. `yield_run_output=True`
            # makes the final aggregated RunOutput the last item we receive —
            # identical to the old non-streaming arun() return — so all the
            # response handling below is unchanged.
            collector = McpMetaCollector()
            set_active_collector(collector)

            # Initial status while the model gets going.
            await dispatcher.send_json({"message_type": "status", "label": "Thinking…"})

            response = None
            final_text = ""        # text after the LAST tool call → the real answer
            stream_id: str | None = None  # open stream's id, or None if none open
            last_stream_id: str | None = None  # most recent stream — matched by response envelope
            stripper = _StreamMarkerStripper()

            async def send_delta(text: str) -> None:
                """Open a stream lazily and forward a chunk to the widget."""
                nonlocal stream_id, last_stream_id
                if not text:
                    return
                if stream_id is None:
                    stream_id = secrets.token_hex(4)
                    last_stream_id = stream_id
                    await dispatcher.send_json(
                        {"message_type": "stream_start", "stream_id": stream_id}
                    )
                await dispatcher.send_json(
                    {
                        "message_type": "stream_delta",
                        "stream_id": stream_id,
                        "delta": text,
                    }
                )

            async def close_stream() -> None:
                """Flush the marker stripper and close the in-flight bubble."""
                nonlocal stream_id
                tail = stripper.flush()
                if tail:
                    await send_delta(tail)
                if stream_id is not None:
                    await dispatcher.send_json(
                        {"message_type": "stream_end", "stream_id": stream_id}
                    )
                    stream_id = None

            try:
                async for event in agent.arun(
                    full_prompt,
                    dependencies={"page_context": page_context} if page_context else None,
                    stream=True,
                    stream_events=True,
                    yield_run_output=True,
                ):
                    if isinstance(event, RunOutput):
                        response = event  # final aggregated output
                        continue
                    event_type = getattr(event, "event", None)
                    if event_type == RunEvent.run_content:
                        # run_content events are deltas. Stream them straight
                        # through; the widget grows the in-flight bubble live.
                        # Resolution markers are filtered out here so they
                        # never appear in the user-visible bubble.
                        chunk = getattr(event, "content", None)
                        if not isinstance(chunk, str) or not chunk:
                            continue
                        final_text += chunk
                        await send_delta(stripper.push(chunk))
                    elif event_type == RunEvent.tool_call_started:
                        # Close the current bubble (lead-in) and reset the
                        # buffer — the real answer is whatever the model writes
                        # AFTER the last tool call.
                        await close_stream()
                        final_text = ""
                        # Keep a short status going until the final answer lands.
                        tool = getattr(event, "tool", None)
                        tool_name = getattr(tool, "tool_name", "") if tool else ""
                        label = _friendly_tool_label(tool_name)
                        if label:
                            await dispatcher.send_json(
                                {"message_type": "status", "label": label}
                            )
                    elif event_type in (RunEvent.reasoning_started, RunEvent.reasoning_step):
                        # Best-effort: not every model emits reasoning events.
                        await dispatcher.send_json(
                            {"message_type": "status", "label": "Thinking…"}
                        )
            finally:
                set_active_collector(None)
                await close_stream()

            # Defensive: yield_run_output should always hand us the final
            # output, but fall back to a plain run so the code below never
            # sees None.
            if response is None:
                response = await agent.arun(
                    full_prompt,
                    dependencies={"page_context": page_context} if page_context else None,
                )

            mcp_results = collector.drain() or None

            # Record token usage (best-effort; never blocks the response).
            prompt_tokens, completion_tokens, total_tokens = extract_token_counts(response)
            await record_usage(
                chatbot_id=chatbot_id,
                session_id=session_id,
                model=resolved_model,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
            )

            # Extract text. Prefer what the model wrote AFTER its last tool call
            # — that's the real answer. With streaming, response.content
            # concatenates every turn (the pre-tool lead-in + the answer), and
            # the lead-in was already shown as a status, so it must not reappear
            # here. Fall back to response.content, then the last assistant
            # message, if the streamed answer came back empty.
            raw_content = final_text if clean_response(final_text).strip() else ""
            if not raw_content:
                raw_content = response.content if isinstance(response.content, str) else ""
            if not clean_response(raw_content).strip() and response.messages:
                parts: list[str] = []
                for msg in response.messages:
                    if msg.role == "assistant" and msg.content and isinstance(msg.content, str):
                        cleaned = clean_response(msg.content).strip()
                        if cleaned:
                            parts.append(cleaned)
                if parts:
                    raw_content = parts[-1]

            if not isinstance(raw_content, str):
                raw_content = str(raw_content)

            logger.info(
                "Agent response: content=%r, tools=%s, session=%s",
                raw_content[:200] if raw_content else None,
                [t.tool_name for t in response.tools] if response.tools else [],
                response.session_id,
            )

            # Extract resolution classification before cleaning
            raw_content, is_resolved = extract_resolution(raw_content)

            response_text = clean_response(raw_content)

            # Safety net: if the response is still empty, re-run without tools
            if not response_text.strip():
                logger.warning("Empty response after cleaning, re-running without tools")
                original_tools = agent.tools
                agent.tools = None
                try:
                    retry = await agent.arun(full_prompt)
                    retry_content = retry.content if isinstance(retry.content, str) else ""
                    if retry_content.strip():
                        response_text = clean_response(retry_content)
                finally:
                    agent.tools = original_tools

            # Step 5: Build deduplicated source list
            seen_urls: set[str] = set()
            sources: list[dict] = []
            for ctx in contexts:
                if ctx["url"] not in seen_urls and ctx["score"] > 0.3:
                    seen_urls.add(ctx["url"])
                    sources.append({"url": ctx["url"], "title": ctx["title"]})

            # Step 6: Read and reset follow-up selections
            selected = follow_up_toolkit.selected if follow_up_toolkit else []
            if follow_up_toolkit:
                follow_up_toolkit.selected = []

            # Step 6.5: Generate audio if voice mode requested
            audio = None
            if voice and response_text.strip():
                audio = await text_to_speech(response_text)

            message_id = _compute_message_id(response_text, response.tools)

            await dispatcher.send_json(
                {
                    "message_type": "response",
                    "message_id": message_id,
                    "stream_id": last_stream_id,
                    "response": response_text,
                    "sources": sources,
                    "session_id": session_id,
                    "follow_up_prompts": selected,
                    "audio": audio,
                    "mcp_results": mcp_results,
                }
            )

            # Store messages via API callback. Triggers skip the "user" side
            # because the visitor didn't actually type anything; the assistant
            # side is always persisted so trigger turns live in history.
            if not is_trigger:
                await store_message(session_id, "user", message)
            await store_message(session_id, "assistant", response_text, is_resolved=is_resolved)

    except WebSocketDisconnect:
        logger.info(f"Client disconnected (chatbot_id={chatbot_id})")
    except Exception as e:
        logger.exception(f"WebSocket error (chatbot_id={chatbot_id})")
        try:
            await dispatcher.send_json({"message_type": "error", "error": str(e)})
        except Exception:
            pass
    finally:
        # Stop the dispatcher read loop
        await dispatcher.stop()
        # Remove from active connections
        active_connections.pop(session_id, None)
        # Disconnect all MCP servers
        for mcp in mcp_tools:
            try:
                await mcp.disconnect()
            except Exception:
                pass
