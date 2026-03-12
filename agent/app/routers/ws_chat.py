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

import json
import logging
import uuid

import asyncpg
import httpx
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.config import settings
from app.agent import create_agent, clean_response, connect_mcp_servers
from app.rag import retrieve_context, format_context_for_llm
from app.tts import text_to_speech
from app.mcp_meta import McpMetaCollector, set_active_collector, install_patch
from app.webmcp_tools import create_web_tools

logger = logging.getLogger(__name__)

router = APIRouter()

install_patch()

# Active visitor WebSocket connections: session_id -> WebSocket
active_connections: dict[str, WebSocket] = {}


async def store_message(session_id: str, role: str, content: str):
    """Store a message via the API internal endpoint."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"{settings.API_CALLBACK_URL}/api/internal/messages",
                json={"session_id": session_id, "role": role, "content": content},
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
        chatbot_id = int(chatbot_id_str)
        session_uuid = uuid.UUID(session_id)
    except (ValueError, TypeError):
        await ws.close(code=4001, reason="Invalid session_id or chatbot_id")
        return

    # --- Validate session in DB ---
    conn = await asyncpg.connect(settings.DATABASE_URL_ASYNCPG)
    try:
        session_row = await conn.fetchrow(
            "SELECT id FROM chat_sessions WHERE id = $1 AND chatbot_id = $2",
            session_uuid, chatbot_id,
        )
        if not session_row:
            await ws.close(code=4001, reason="Invalid session")
            return

        chatbot_row = await conn.fetchrow(
            "SELECT name, follow_up_prompts, mcp_servers, webmcp_enabled, instructions, person_mode_enabled FROM chatbots WHERE id = $1",
            chatbot_id,
        )
    finally:
        await conn.close()

    if not chatbot_row:
        await ws.close(code=4002, reason="Chatbot not found")
        return

    chatbot_name = chatbot_row["name"]
    follow_up_prompts = json.loads(chatbot_row["follow_up_prompts"] or "[]")
    mcp_configs = json.loads(chatbot_row["mcp_servers"] or "[]")
    custom_instructions = chatbot_row["instructions"] or None
    person_mode_enabled = chatbot_row["person_mode_enabled"] if chatbot_row["person_mode_enabled"] is not None else True

    await ws.accept()
    active_connections[session_id] = ws

    # --- Wait for init message (always sent by widget on connect) ---
    init_raw = await ws.receive_text()
    init_data = json.loads(init_raw)
    flunkie_tool_schemas = init_data.get("flunkie_tools", [])
    print(init_data)

    # --- Connect MCP servers ---
    mcp_tools = await connect_mcp_servers(mcp_configs)

    # --- Build web tool functions from schemas ---
    web_tool_fns = create_web_tools(flunkie_tool_schemas, ws) if flunkie_tool_schemas else []
    all_tools = list(mcp_tools) + web_tool_fns

    # --- Create ONE agent for the lifetime of this connection ---
    agent, follow_up_toolkit = create_agent(
        chatbot_name=chatbot_name,
        session_id=session_id,
        follow_up_pool=follow_up_prompts,
        mcp_tools=all_tools,
        custom_instructions=custom_instructions,
    )

    try:
        while True:
            raw = await ws.receive_text()
            data = json.loads(raw)

            # Skip tool results — handled inline by web tool functions
            if data.get("message_type") == "tool_result":
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
                await ws.send_json({
                    "message_type": "mode_changed",
                    "mode": "person",
                    "session_id": session_id,
                })
                continue

            message: str = data.get("message", "")
            voice: bool = data.get("voice", False)
            logger.info(f"Processing message: session={session_id}, msg_type={data.get('message_type')}, message={message[:100] if message else ''}")

            # Check session mode
            session_mode = await check_session_mode(session_id, chatbot_id)
            logger.info(f"Session mode: {session_mode}")

            if session_mode == "person":
                # In person mode: store the user message and notify admin, skip AI
                await store_message(session_id, "user", message)
                await mark_session_unread(session_id)
                await ws.send_json({
                    "message_type": "waiting",
                    "response": "",
                    "sources": [],
                    "session_id": session_id,
                    "follow_up_prompts": [],
                })
                continue

            # Step 1: Retrieve relevant context from Qdrant
            contexts = retrieve_context(
                chatbot_id, message, top_k=settings.TOP_K, chatbot_name=chatbot_name
            )

            # Step 2: Format context for the LLM prompt
            context_str = format_context_for_llm(contexts)

            # Step 3: Build the full prompt
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
            full_prompt = (
                f"{admin_context}"
                f"Here is what you know:\n{context_str}\n\n"
                f"The visitor asks: {message}\n\n"
                f"{voice_instruction}"
                "Respond naturally and confidently as a team member. "
                "Do not mention sources or URLs in your answer."
            )

            # Step 4: Run the agent (async for MCP tool support)
            collector = McpMetaCollector()
            set_active_collector(collector)
            response = await agent.arun(full_prompt)
            set_active_collector(None)
            mcp_results = collector.drain() or None

            # Extract text — content can be empty when the agent made a tool
            # call and the main response only contains the tool result.
            # Walk assistant messages to collect any real text the LLM produced.
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

            response_text = clean_response(raw_content)

            # Safety net: if the response is still empty, re-run without tools
            if not response_text.strip():
                logger.warning("Empty response after cleaning, re-running without tools")
                retry = await agent.arun(full_prompt, tools=[])
                retry_content = retry.content if isinstance(retry.content, str) else ""
                if retry_content.strip():
                    response_text = clean_response(retry_content)

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

            # Inject "Talk to a person" if person mode is enabled and not already in person mode
            if person_mode_enabled and session_mode == "ai":
                selected.append({
                    "title": "Talk to a real person",
                    "prompt": "__switch_to_person__",
                })

            # Step 6.5: Generate audio if voice mode requested
            audio = None
            if voice and response_text.strip():
                audio = await text_to_speech(response_text)

            await ws.send_json(
                {
                    "message_type": "response",
                    "response": response_text,
                    "sources": sources,
                    "session_id": session_id,
                    "follow_up_prompts": selected,
                    "audio": audio,
                    "mcp_results": mcp_results,
                }
            )

            # Store messages via API callback
            await store_message(session_id, "user", message)
            await store_message(session_id, "assistant", response_text)

    except WebSocketDisconnect:
        logger.info(f"Client disconnected (chatbot_id={chatbot_id})")
    except Exception as e:
        logger.exception(f"WebSocket error (chatbot_id={chatbot_id})")
        try:
            await ws.send_json({"message_type": "error", "error": str(e)})
        except Exception:
            pass
    finally:
        # Remove from active connections
        active_connections.pop(session_id, None)
        # Disconnect all MCP servers
        for mcp in mcp_tools:
            try:
                await mcp.disconnect()
            except Exception:
                pass
