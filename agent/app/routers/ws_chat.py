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
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.config import settings
from app.agent import create_agent, clean_response
from app.rag import retrieve_context, format_context_for_llm
from app.tts import text_to_speech

logger = logging.getLogger(__name__)

router = APIRouter()


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
            "SELECT name, follow_up_prompts FROM chatbots WHERE id = $1",
            chatbot_id,
        )
    finally:
        await conn.close()

    if not chatbot_row:
        await ws.close(code=4002, reason="Chatbot not found")
        return

    chatbot_name = chatbot_row["name"]
    follow_up_prompts = json.loads(chatbot_row["follow_up_prompts"] or "[]")

    await ws.accept()

    # --- Create ONE agent for the lifetime of this connection ---
    agent, follow_up_toolkit = create_agent(
        chatbot_name=chatbot_name,
        session_id=session_id,
        follow_up_pool=follow_up_prompts,
    )

    try:
        while True:
            raw = await ws.receive_text()
            data = json.loads(raw)
            message: str = data.get("message", "")
            voice: bool = data.get("voice", False)

            # Step 1: Retrieve relevant context from Qdrant
            contexts = retrieve_context(
                chatbot_id, message, top_k=settings.TOP_K, chatbot_name=chatbot_name
            )

            # Step 2: Format context for the LLM prompt
            context_str = format_context_for_llm(contexts)

            # Step 3: Build the full prompt
            voice_instruction = (
                "Keep your answer to 1-2 short sentences. Be conversational and direct. "
            ) if voice else ""
            full_prompt = (
                f"Here is what you know:\n{context_str}\n\n"
                f"The visitor asks: {message}\n\n"
                f"{voice_instruction}"
                "Respond naturally and confidently as a team member. "
                "Do not mention sources or URLs in your answer."
            )

            # Step 4: Run the agent
            response = agent.run(full_prompt)

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
                retry = agent.run(full_prompt, tools=[])
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

            # Step 6.5: Generate audio if voice mode requested
            audio = None
            if voice and response_text.strip():
                audio = await text_to_speech(response_text)

            await ws.send_json(
                {
                    "response": response_text,
                    "sources": sources,
                    "session_id": session_id,
                    "follow_up_prompts": selected,
                    "audio": audio,
                }
            )

    except WebSocketDisconnect:
        logger.info("Client disconnected (chatbot_id=%s)", chatbot_id)
    except Exception as e:
        logger.exception("WebSocket error (chatbot_id=%s)", chatbot_id)
        try:
            await ws.send_json({"error": str(e)})
        except Exception:
            pass
