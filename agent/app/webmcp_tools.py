"""
Zephlo web tools — creates plain async functions from tool schemas.

Each function's signature is built dynamically from inputSchema.properties
using inspect.Parameter + inspect.Signature. When the LLM calls a tool,
execution routes through the WebSocket to the browser widget.
"""

import asyncio
import inspect
import json
import logging
import uuid

from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

MAX_TOOLS = 20
TOOL_TIMEOUT = 30


class WebSocketDispatcher:
    """Single-reader dispatcher that routes WebSocket messages into queues.

    Only one coroutine reads from the WebSocket (the internal _read_loop).
    Tool results are routed to per-call_id queues; everything else goes to
    the user_messages queue for the main chat loop.
    """

    def __init__(self, ws: WebSocket):
        self.ws = ws
        self._tool_queues: dict[str, asyncio.Queue] = {}
        self._user_queue: asyncio.Queue = asyncio.Queue()
        self._reader_task: asyncio.Task | None = None
        self._closed = False

    async def start(self):
        self._reader_task = asyncio.create_task(self._read_loop())

    async def _read_loop(self):
        try:
            while True:
                raw = await self.ws.receive_text()
                try:
                    data = json.loads(raw)
                except json.JSONDecodeError:
                    await self._user_queue.put(raw)
                    continue

                if data.get("message_type") == "tool_result":
                    call_id = data.get("call_id")
                    if call_id and call_id in self._tool_queues:
                        await self._tool_queues[call_id].put(data)
                    else:
                        logger.warning(f"Orphaned tool_result: call_id={call_id}")
                else:
                    await self._user_queue.put(raw)
        except WebSocketDisconnect:
            logger.info("WebSocket disconnected in dispatcher read loop")
        except Exception as e:
            logger.exception(f"Dispatcher read loop error: {e}")
        finally:
            self._closed = True
            # Unblock all waiters with a sentinel so they don't hang forever
            for q in self._tool_queues.values():
                await q.put(None)
            await self._user_queue.put(None)

    def register_tool_call(self, call_id: str) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        self._tool_queues[call_id] = q
        return q

    def unregister_tool_call(self, call_id: str):
        self._tool_queues.pop(call_id, None)

    async def get_user_message(self) -> str:
        """Get the next user message. Raises WebSocketDisconnect if closed."""
        raw = await self._user_queue.get()
        if raw is None:
            raise WebSocketDisconnect()
        return raw

    async def send_text(self, data: str):
        await self.ws.send_text(data)

    async def send_json(self, data: dict):
        await self.ws.send_json(data)

    async def stop(self):
        if self._reader_task and not self._reader_task.done():
            self._reader_task.cancel()
            try:
                await self._reader_task
            except asyncio.CancelledError:
                pass

JSON_TYPE_MAP = {
    "string": str, "integer": int, "number": float,
    "boolean": bool, "array": list, "object": dict,
}


def _build_parameters(schema: dict) -> list[inspect.Parameter]:
    """Build inspect.Parameter list from inputSchema properties.

    Required params are placed first so that Python's inspect.Signature
    doesn't raise 'non-default argument follows default argument'.
    """
    properties = schema.get("inputSchema", {}).get("properties", {})
    required = set(schema.get("inputSchema", {}).get("required", []))
    required_params = []
    optional_params = []
    for prop_name, prop_def in properties.items():
        py_type = JSON_TYPE_MAP.get(prop_def.get("type", "string"), str)
        if prop_name in required:
            param = inspect.Parameter(
                prop_name, inspect.Parameter.POSITIONAL_OR_KEYWORD, annotation=py_type
            )
            required_params.append(param)
        else:
            default = (
                "" if py_type is str
                else 0 if py_type in (int, float)
                else False if py_type is bool
                else None
            )
            param = inspect.Parameter(
                prop_name, inspect.Parameter.POSITIONAL_OR_KEYWORD,
                default=default, annotation=py_type,
            )
            optional_params.append(param)
    return required_params + optional_params


def _build_docstring(schema: dict) -> str:
    """Build a detailed docstring from tool description and inputSchema.

    Includes parameter descriptions, enum values, and numeric constraints
    so the LLM knows what valid values look like.
    """
    description = schema.get("description", "")
    properties = schema.get("inputSchema", {}).get("properties", {})
    required = set(schema.get("inputSchema", {}).get("required", []))

    if not properties:
        return description

    lines = [description, "", "Args:"]
    for prop_name, prop_def in properties.items():
        prop_type = prop_def.get("type", "string")
        prop_desc = prop_def.get("description", "")
        constraints = []

        if "enum" in prop_def:
            constraints.append(f"one of: {', '.join(str(v) for v in prop_def['enum'])}")
        if "minimum" in prop_def:
            constraints.append(f"min: {prop_def['minimum']}")
        if "maximum" in prop_def:
            constraints.append(f"max: {prop_def['maximum']}")

        is_required = prop_name in required
        req_label = "required" if is_required else "optional"
        parts = [f"    {prop_name} ({prop_type}, {req_label}): {prop_desc}"]
        if constraints:
            parts[0] += f" ({'; '.join(constraints)})"
        lines.append(parts[0])

    return "\n".join(lines)


def create_web_tools(tool_schemas: list[dict], dispatcher: WebSocketDispatcher) -> list:
    """Create plain async functions from tool schemas.

    Each returned function has a proper signature built from inputSchema,
    and forwards calls to the browser widget via the WebSocketDispatcher.
    """
    tools = []
    for schema in tool_schemas[:MAX_TOOLS]:
        tool_name = schema["name"]
        docstring = _build_docstring(schema)
        sig_params = _build_parameters(schema)

        async def call_tool(*args, _name=tool_name, _params=sig_params, **kwargs) -> str:
            arguments = {}
            for i, param in enumerate(_params):
                if i < len(args):
                    arguments[param.name] = args[i]
            arguments.update(kwargs)

            call_id = str(uuid.uuid4())
            queue = dispatcher.register_tool_call(call_id)
            try:
                logger.info(f"Web tool call: {_name}({arguments}), call_id={call_id}")
                await dispatcher.send_text(json.dumps({
                    "message_type": "web_tool_call",
                    "call_id": call_id,
                    "details": {"tool": _name, "arguments": arguments},
                }))

                data = await asyncio.wait_for(queue.get(), timeout=TOOL_TIMEOUT)
                if data is None:
                    return "Error: WebSocket disconnected"
                result_content = data.get("content", "")
                logger.info(f"Web tool result: {_name}, call_id={call_id}, content_len={len(result_content)}, error={data.get('error')}")
                if data.get("error"):
                    return f"Error: {data['error']}"
                return result_content
            except asyncio.TimeoutError:
                logger.warning(f"Web tool timeout: {_name}, call_id={call_id}")
                return f"Error: Tool {_name} timed out after {TOOL_TIMEOUT}s"
            finally:
                dispatcher.unregister_tool_call(call_id)

        call_tool.__name__ = tool_name
        call_tool.__doc__ = docstring
        call_tool.__signature__ = inspect.Signature(parameters=sig_params, return_annotation=str)
        call_tool.__annotations__ = {p.name: p.annotation for p in sig_params}
        call_tool.__annotations__["return"] = str
        tools.append(call_tool)
    return tools
