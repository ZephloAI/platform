"""
MCP Meta collector and monkey-patch.

Intercepts MCP tool results before Agno discards `_meta` fields.
When a tool result contains `_meta.ui_path`, the result is captured
in a per-request collector so it can be forwarded to the client.

Uses contextvars for async safety — each request gets its own collector.
"""

import logging
from contextvars import ContextVar
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

_active_collector: ContextVar["McpMetaCollector | None"] = ContextVar(
    "_active_collector", default=None
)

_patch_installed = False


@dataclass
class McpMetaCollector:
    """Collects MCP tool results that contain _meta.ui_path."""

    results: list[dict] = field(default_factory=list)

    def add(self, tool_name: str, meta: dict, content: str) -> None:
        self.results.append({
            "tool_name": tool_name,
            "meta": meta,
            "content": content,
        })

    def drain(self) -> list[dict]:
        """Return all collected results and clear the list."""
        items = self.results[:]
        self.results.clear()
        return items


def set_active_collector(collector: "McpMetaCollector | None") -> None:
    _active_collector.set(collector)


def get_active_collector() -> "McpMetaCollector | None":
    return _active_collector.get()


def install_patch() -> None:
    """Monkey-patch mcp.ClientSession.call_tool to capture _meta fields."""
    global _patch_installed
    if _patch_installed:
        return

    try:
        from mcp import ClientSession
    except ImportError:
        logger.warning("mcp package not installed, skipping meta patch")
        return

    original_call_tool = ClientSession.call_tool

    async def patched_call_tool(self, name, arguments=None, read_timeout_seconds=None):
        # Build kwargs to forward — only pass read_timeout_seconds if provided
        kwargs = {}
        if arguments is not None:
            kwargs["arguments"] = arguments
        if read_timeout_seconds is not None:
            kwargs["read_timeout_seconds"] = read_timeout_seconds

        result = await original_call_tool(self, name, **kwargs)

        collector = get_active_collector()
        if collector and result and getattr(result, "meta", None):
            meta = result.meta
            # meta can be a dict or a pydantic model — normalize to dict
            if hasattr(meta, "model_dump"):
                meta = meta.model_dump()
            elif not isinstance(meta, dict):
                meta = dict(meta) if meta else {}

            if meta.get("ui_path"):
                # Extract text content from result
                content_parts = []
                for item in getattr(result, "content", []) or []:
                    if hasattr(item, "text"):
                        content_parts.append(item.text)
                content = "\n".join(content_parts)

                collector.add(name, meta, content)
                logger.info(f"Captured MCP meta for tool '{name}': ui_path={meta['ui_path']}")

        return result

    ClientSession.call_tool = patched_call_tool
    _patch_installed = True
    logger.info("MCP meta patch installed")
