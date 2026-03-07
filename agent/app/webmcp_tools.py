"""
Flunkie web tools — creates plain async functions from tool schemas.

Each function's signature is built dynamically from inputSchema.properties
using inspect.Parameter + inspect.Signature. When the LLM calls a tool,
execution routes through the WebSocket to the browser widget.
"""

import asyncio
import inspect
import json
import logging
import uuid

from fastapi import WebSocket

logger = logging.getLogger(__name__)

MAX_TOOLS = 20
TOOL_TIMEOUT = 30

JSON_TYPE_MAP = {
    "string": str, "integer": int, "number": float,
    "boolean": bool, "array": list, "object": dict,
}


def _build_parameters(schema: dict) -> list[inspect.Parameter]:
    """Build inspect.Parameter list from inputSchema properties."""
    properties = schema.get("inputSchema", {}).get("properties", {})
    required = set(schema.get("inputSchema", {}).get("required", []))
    params = []
    for prop_name, prop_def in properties.items():
        py_type = JSON_TYPE_MAP.get(prop_def.get("type", "string"), str)
        if prop_name in required:
            param = inspect.Parameter(
                prop_name, inspect.Parameter.POSITIONAL_OR_KEYWORD, annotation=py_type
            )
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
        params.append(param)
    return params


def create_web_tools(tool_schemas: list[dict], ws: WebSocket) -> list:
    """Create plain async functions from tool schemas.

    Each returned function has a proper signature built from inputSchema,
    and forwards calls to the browser widget via WebSocket.
    """
    tools = []
    for schema in tool_schemas[:MAX_TOOLS]:
        tool_name = schema["name"]
        description = schema.get("description", f"Browser tool: {tool_name}")
        sig_params = _build_parameters(schema)

        async def call_tool(*args, _name=tool_name, _params=sig_params, **kwargs) -> str:
            arguments = {}
            for i, param in enumerate(_params):
                if i < len(args):
                    arguments[param.name] = args[i]
            arguments.update(kwargs)

            call_id = str(uuid.uuid4())
            await ws.send_text(json.dumps({
                "message_type": "web_tool_call",
                "call_id": call_id,
                "details": {"tool": _name, "arguments": arguments},
            }))

            while True:
                raw = await asyncio.wait_for(ws.receive_text(), timeout=TOOL_TIMEOUT)
                data = json.loads(raw)
                if data.get("message_type") == "tool_result" and data.get("call_id") == call_id:
                    if data.get("error"):
                        return f"Error: {data['error']}"
                    return data.get("content", "")
                logger.debug(f"Skipping non-matching message during tool wait: {data.get('message_type')}")

        call_tool.__name__ = tool_name
        call_tool.__doc__ = description
        call_tool.__signature__ = inspect.Signature(parameters=sig_params, return_annotation=str, _name=tool_name)
        call_tool.__annotations__ = {p.name: p.annotation for p in sig_params}
        call_tool.__annotations__["return"] = str
        tools.append(call_tool)
    return tools
