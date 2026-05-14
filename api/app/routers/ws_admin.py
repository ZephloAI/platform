"""
Admin WebSocket router for live chat.

Provides a WebSocket endpoint that admin users connect to for real-time
messaging in a specific chat session. Also exposes helper functions
for pushing messages to connected admin clients.
"""

import httpx
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.http_client import get_client
from app.models.message import Message
from app.services.auth_service import AuthService

router = APIRouter(tags=["ws_admin"])

# Global registry: session_id -> set of connected admin WebSockets
admin_connections: dict[str, set[WebSocket]] = {}


async def notify_admin_ws(session_id: str, data: dict):
    """Send a JSON payload to every admin connected to the given session."""
    connections = admin_connections.get(session_id, set())
    dead: list[WebSocket] = []
    for ws in connections:
        try:
            await ws.send_json(data)
        except Exception:
            dead.append(ws)
    # Clean up broken connections
    for ws in dead:
        connections.discard(ws)


async def notify_admin_message(session_id: str, message_data: dict):
    """Convenience wrapper used by other routers to push a new message event."""
    await notify_admin_ws(session_id, {
        "message_type": "new_message",
        "message": message_data,
    })


@router.websocket("/ws/admin/chat")
async def admin_chat_ws(websocket: WebSocket, session_id: str, token: str):
    """
    WebSocket for admin live chat.

    Query params:
      - session_id: the chat session UUID
      - token: JWT access token

    The server validates the token, then keeps the connection open.
    Incoming messages from the admin are stored and broadcast.
    """
    # Get a database session to validate the JWT token
    from app.database import async_session as session_factory

    async with session_factory() as db:
        auth_service = AuthService(db)
        user = await auth_service.get_current_user(token)
        if user is None:
            await websocket.close(code=4001, reason="Invalid token")
            return

    await websocket.accept()

    # Register connection
    if session_id not in admin_connections:
        admin_connections[session_id] = set()
    admin_connections[session_id].add(websocket)

    try:
        while True:
            # Listen for messages from the admin client
            data = await websocket.receive_json()
            content = data.get("content", "")
            if not content:
                continue

            # Store the admin message
            async with session_factory() as db:
                message = Message(
                    session_id=session_id,
                    role="admin",
                    content=content,
                )
                db.add(message)
                await db.commit()
                await db.refresh(message)

                # Broadcast to other admin connections on this session
                await notify_admin_ws(session_id, {
                    "message_type": "new_message",
                    "message": {
                        "id": message.id,
                        "session_id": str(message.session_id),
                        "role": message.role,
                        "content": message.content,
                        "created_at": message.created_at.isoformat(),
                    },
                })

                # Push to visitor's widget via agent service
                try:
                    http_client = get_client()
                    push_resp = await http_client.post(
                        f"{settings.AGENT_SERVICE_URL}/api/internal/push",
                        json={"session_id": session_id, "content": content},
                        timeout=5.0,
                    )
                    import logging
                    logging.getLogger(__name__).info(
                        f"WS admin push: status={push_resp.status_code}, body={push_resp.text}"
                    )
                except Exception as e:
                    import logging
                    logging.getLogger(__name__).warning(f"WS admin push failed: {e}")
    except WebSocketDisconnect:
        pass
    finally:
        admin_connections.get(session_id, set()).discard(websocket)
        # Remove the set if empty
        if session_id in admin_connections and not admin_connections[session_id]:
            del admin_connections[session_id]


@router.post("/api/internal/push/{session_id}")
async def push_admin_message(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Internal endpoint: push an admin message to the visitor.

    The agent service can poll or call this to relay admin replies
    back to the visitor's chat stream.
    """
    from sqlalchemy import select, desc

    # Get the latest admin message for this session
    result = await db.execute(
        select(Message)
        .where(Message.session_id == session_id, Message.role == "admin")
        .order_by(desc(Message.created_at))
        .limit(1)
    )
    message = result.scalar_one_or_none()

    if not message:
        raise HTTPException(status_code=404, detail="No admin message found")

    return {
        "id": message.id,
        "session_id": str(message.session_id),
        "role": message.role,
        "content": message.content,
        "created_at": message.created_at.isoformat(),
    }
