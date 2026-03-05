"""
WebMCP Toolkit — bridges browser-side tools into the Agno agent.

When the LLM decides to call a browser tool, execution routes through
the WebSocket: send request → wait for browser response → return result.
"""

import asyncio
import json
import logging
import uuid

from agno.tools import Toolkit
from fastapi import WebSocket

logger = logging.getLogger(__name__)

MAX_TOOLS = 20
TOOL_TIMEOUT = 30


class WebMcpToolkit(Toolkit):
    """Wraps browser-side WebMCP tools as Agno toolkit functions.

    Each tool sends a call request over WebSocket and waits for the
    browser to execute it and return the result.
    """

    def __init__(self, tool_schemas: list[dict], ws: WebSocket):
        super().__init__(name="webmcp")
        self.ws = ws
        for schema in tool_schemas[:MAX_TOOLS]:
            self._register_tool(schema)

    def _register_tool(self, schema: dict):
        tool_name = schema["name"]
        description = schema.get("description", f"Browser tool: {tool_name}")
        ws = self.ws

        async def call_browser_tool(params: str = "{}") -> str:
            """Call a browser-side WebMCP tool. Pass arguments as a JSON string."""
            call_id = str(uuid.uuid4())
            try:
                parsed_params = json.loads(params)
            except json.JSONDecodeError:
                parsed_params = {}

            await ws.send_text(json.dumps({
                "type": "webmcp_tool_call",
                "call_id": call_id,
                "tool_name": tool_name,
                "arguments": parsed_params,
            }))

            # Wait for matching response
            while True:
                raw = await asyncio.wait_for(ws.receive_text(), timeout=TOOL_TIMEOUT)
                data = json.loads(raw)
                if data.get("type") == "webmcp_tool_result" and data.get("call_id") == call_id:
                    if data.get("error"):
                        return f"Error: {data['error']}"
                    return data.get("content", "")
                # Not our response — only tool results come during tool execution. Log and skip.
                logger.debug(f"Skipping non-matching message during tool wait: {data.get('type')}")

        call_browser_tool.__name__ = tool_name
        call_browser_tool.__doc__ = description
        self.register(call_browser_tool)
