"""
Agno Agent module.

This module sets up and runs the AI agent using the Agno framework.
The agent uses OpenRouter as its LLM provider (OpenAI-compatible API)
and PostgreSQL for session storage (conversation history).

How the chat flow works:
1. User sends a question + session_id.
2. We retrieve relevant chunks from Qdrant (via rag.py).
3. We build a prompt combining the website context + user question.
4. The Agno agent loads prior conversation history from Postgres via session_id.
5. The agent sends context + history + question to the LLM and returns the answer.
6. If relevant, the agent calls suggest_follow_up to surface a contextual action button.
7. The run is automatically persisted to Postgres under that session_id.
"""
import logging
import re
from urllib.parse import urlparse

import asyncpg
from agno.agent import Agent
from agno.models.openrouter import OpenRouter
from agno.db.postgres import PostgresDb
from agno.tools import Toolkit
from agno.tools.mcp import MCPTools
from agno.tools.mcp.params import SSEClientParams, StreamableHTTPClientParams

from app.config import settings
from app.rag import retrieve_context, format_context_for_llm, collection_exists_for_chatbot
from app.mcp_meta import McpMetaCollector, set_active_collector, install_patch
from app.usage_client import extract_token_counts, record_usage

logger = logging.getLogger(__name__)



async def connect_mcp_servers(mcp_configs: list[dict]) -> list[MCPTools]:
    """Connect to MCP servers from a list of config dicts.

    Each config should have at least a ``url`` key. Optional keys:
    ``name``, ``transport`` (default ``"sse"``), ``headers``, and
    ``enabled`` (default ``True``).  Servers where ``enabled`` is
    ``False`` are skipped.  Connection failures are logged and skipped
    so one bad server doesn't block the agent.
    """
    connected: list[MCPTools] = []
    for cfg in mcp_configs:
        if not cfg.get("enabled", True):
            continue
        name = cfg.get("name", "unnamed")
        try:
            transport = cfg.get("transport", "sse")
            url = cfg["url"]
            headers = cfg.get("headers") or {}

            if transport == "streamable-http":
                params = StreamableHTTPClientParams(url=url, headers=headers)
            else:
                params = SSEClientParams(url=url, headers=headers)

            mcp = MCPTools(
                server_params=params,
                url=url,
                transport=transport,
                timeout_seconds=60
            )
            await mcp.connect()
            connected.append(mcp)
            logger.info(f"MCP server connected: {name} ({url})")
        except Exception:
            logger.warning(f"MCP server failed to connect (skipping): {name}", exc_info=True)
    return connected


def extract_resolution(text: str) -> tuple[str, bool | None]:
    """Extract and strip resolution tag. Returns (cleaned_text, is_resolved)."""
    if "[RESOLVED]" in text:
        return text.replace("[RESOLVED]", "").strip(), True
    if "[UNRESOLVED]" in text:
        return text.replace("[UNRESOLVED]", "").strip(), False
    return text, None


def clean_response(text: str) -> str:
    """Strip leaked LLM tool-call syntax, internal reasoning, and instruction echo from response text."""
    # Remove tool-call / reasoning leaks
    text = re.sub(r"\n*human_thought:.*$", "", text, flags=re.MULTILINE).rstrip()
    text = re.sub(r"\n*social_tool_call:.*$", "", text, flags=re.MULTILINE).rstrip()
    text = re.sub(r"\n*tool_call:.*$", "", text, flags=re.MULTILINE).rstrip()
    text = re.sub(r"\n*Follow-ups? set:.*$", "", text, flags=re.MULTILINE).rstrip()

    # Remove leaked instruction/guideline blocks that the LLM sometimes echoes.
    # These start with a markdown header like "# Response Content Guidelines"
    # or bullet lines that look like system instructions.
    text = re.sub(
        r"^#\s+(Response|Task-Specific|Style|Content|Format).*?(?=\n[A-Z]|\n\n[A-Z]|\Z)",
        "",
        text,
        flags=re.MULTILINE | re.DOTALL,
    ).strip()

    # Remove lines that are clearly echoed system instructions
    instruction_patterns = [
        r"^-\s+Use the first person plural.*$",
        r"^-\s+Be warm and (professional|conversational).*$",
        r"^-\s+Use bullet points for lists.*$",
        r"^-\s+End with a follow[- ]?up question.*$",
        r"^-\s+Do not mention URLs.*$",
        r"^-\s+Do not use markdown headers.*$",
        r"^-\s+Keep responses concise.*$",
        r"^-\s+Avoid sounding like a machine.*$",
        r"^-\s+Be confident in your answers.*$",
        r"^-\s+If information is missing.*$",
        r"^-\s+Keep your answer to 1-2 short sentences.*$",
        r"^-\s+Use the suggest_follow_ups tool.*$",
        r'^-\s+"[^"]+"\s*$',  # bare follow-up titles like - "Book a trip"
        r"^Use bullet points for lists\..*$",
        r"^Use the suggest_follow_ups tool.*$",
    ]
    for pat in instruction_patterns:
        text = re.sub(pat, "", text, flags=re.MULTILINE)

    # Safety net: strip resolution tags that may have leaked through
    text = re.sub(r"\[RESOLVED\]", "", text)
    text = re.sub(r"\[UNRESOLVED\]", "", text)

    # Collapse multiple blank lines left by removals
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text

# Single PostgresDb instance reused across requests.
# Agno auto-creates the session table if it doesn't exist.
db = PostgresDb(db_url=settings.DATABASE_URL)


class FollowUpTools(Toolkit):
    """
    Toolkit that lets the agent suggest a follow-up action button.

    The agent only sees titles and descriptions (via system prompt).
    When it decides a follow-up fits, it calls suggest_follow_up(title)
    and this toolkit resolves the full details (link/prompt) from the pool.
    """

    def __init__(self, follow_up_pool: list[dict]):
        # Index the pool by title for fast lookup
        self.pool_by_title: dict[str, dict] = {
            fp["title"]: fp for fp in follow_up_pool
        }
        self.selected: list[dict] = []
        super().__init__(
            name="follow_up_tools",
            tools=[self.suggest_follow_ups],
            show_result_tools=[],
        )

    def _lookup(self, title: str) -> dict | None:
        """Find a follow-up by title (case-insensitive fallback)."""
        match = self.pool_by_title.get(title)
        if not match:
            for pool_title, fp in self.pool_by_title.items():
                if pool_title.lower() == title.lower():
                    return fp
        return match

    def suggest_follow_ups(self, titles: str) -> str:
        """
        Suggest follow-up action buttons for the visitor.
        Only call this when follow-ups would help the visitor take the next step.
        Pass one or more exact titles from the available list, comma-separated.

        Args:
            titles: Comma-separated titles of follow-ups to suggest.
                    Example: "Book a trip" or "Book a trip, View packages"

        Returns:
            Confirmation or error message.
        """
        self.selected = []
        for raw_title in titles.split(","):
            title = raw_title.strip()
            if not title:
                continue
            match = self._lookup(title)
            if match:
                self.selected.append({k: v for k, v in match.items() if v is not None and k != "description"})
            else:
                logger.warning("suggest_follow_ups: title not found in pool: %s", title)

        if not self.selected:
            return "No matching follow-ups found."

        names = [s["title"] for s in self.selected]
        return f"Follow-ups set: {', '.join(names)}"


def _sanitize_navigate_url(url: str) -> str | None:
    """
    Strip stray markup the LLM may have copied out of indexed markdown
    (angle brackets, closing tags, surrounding parens/quotes) and confirm
    the result parses as an http(s) URL with a host. Returns the cleaned
    URL, or None if it can't be salvaged.
    """
    cleaned = url.strip().strip("<>\"'() ")
    # Collapse "/<" and "/</" (stray angle-bracket residue from markdown/HTML)
    # into a single "/", so "host:3000/</path" and "host:3000/<path" both
    # become "host:3000/path".
    cleaned = re.sub(r"/<+/?", "/", cleaned)
    # Drop any trailing angle-bracket / quote noise.
    cleaned = cleaned.rstrip("<>\"' ")

    parsed = urlparse(cleaned)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        return None
    return cleaned


class NavigationTools(Toolkit):
    """
    Toolkit that lets the agent navigate the visitor to a page on the website.

    The tool emits a "navigate" WebSocket message which the widget handles by
    persisting an auto-open flag and calling window.location.assign(url). The
    agent should only pass URLs it saw in the retrieved context above — never
    invent URLs.
    """

    def __init__(self, dispatcher):
        self.dispatcher = dispatcher
        super().__init__(
            name="navigation_tools",
            tools=[self.navigate_to_page],
            show_result_tools=[],
        )

    async def navigate_to_page(self, url: str, reason: str = "") -> str:
        """
        Navigate the visitor to a page on this website. Only call this when
        the visitor clearly wants to go to a specific page, or when the page
        will answer their question more fully than a text reply. Do NOT
        navigate on vague chit-chat or follow-up clarifications.

        Args:
            url: Full URL of the page to navigate to. Must be a URL that
                appears in the provided context above — do not invent URLs.
            reason: Short reason string (not user-facing, used for logging).

        Returns:
            Confirmation or error message.
        """
        if not url or not url.strip():
            return "Error: url is required"

        cleaned = _sanitize_navigate_url(url)
        if not cleaned:
            logger.warning(f"navigate_to_page rejected malformed url: {url!r}")
            return f"Error: '{url}' is not a valid URL"

        try:
            await self.dispatcher.send_json({
                "message_type": "navigate",
                "url": cleaned,
            })
            logger.info(f"navigate_to_page: url={cleaned} reason={reason}")
            return f"Navigating visitor to {cleaned}"
        except Exception as e:
            logger.warning(f"navigate_to_page failed: {e}")
            return "Error: could not navigate"


def create_agent(
    chatbot_name: str = "Assistant",
    session_id: str | None = None,
    follow_up_pool: list[dict] | None = None,
    mcp_tools: list | None = None,
    custom_instructions: str | None = None,
    has_rag_data: bool = True,
    navigation_enabled: bool = False,
    dispatcher=None,
    llm_model: str | None = None,
) -> tuple[Agent, FollowUpTools | None]:
    """
    Create an Agno agent with PostgreSQL-backed session storage.

    When follow_up_pool is provided, a FollowUpTools toolkit is attached
    so the agent can suggest a contextual follow-up button via tool use.

    llm_model is the agent's configured model; when None, the global
    LLM_MODEL default is used.

    Returns:
        (agent, follow_up_toolkit) — toolkit is None when pool is empty.
    """
    tools = []
    follow_up_toolkit = None
    extra_instructions = []

    if follow_up_pool:
        follow_up_toolkit = FollowUpTools(follow_up_pool)
        tools.append(follow_up_toolkit)

        # Show only title + description — the LLM doesn't see links/prompts
        pool_lines = []
        for fp in follow_up_pool:
            desc = fp.get("description", "")
            desc_part = f" — {desc}" if desc else ""
            pool_lines.append(f'- "{fp["title"]}"{desc_part}')
        pool_text = "\n".join(pool_lines)

        extra_instructions.append(
            f"""You have a suggest_follow_ups tool. Think like a closer — when the
conversation suggests the visitor is interested enough that a follow-up
action would help them take the next step, call it. For example:
asking about a specific product/package, asking about pricing or availability,
comparing options, or expressing excitement.
Do NOT call it on greetings or vague questions like 'what do you do'.
Choose one or more follow-ups from this list:\n{pool_text}
Pass the exact titles comma-separated to the tool. The system handles the rest."""
        )

    # Navigation tool: only available when the site has been crawled AND
    # the agent owner has explicitly enabled it in settings. Needs the
    # dispatcher to emit the navigate WebSocket message.
    if navigation_enabled and has_rag_data and dispatcher is not None:
        tools.append(NavigationTools(dispatcher))
        extra_instructions.append(
            "You have a navigate_to_page tool. When the visitor asks to go "
            "somewhere specific (e.g. 'take me to pricing', 'open the booking "
            "page') or when a page in the provided context is clearly the best "
            "answer to their question, call navigate_to_page(url) with a URL "
            "taken directly from the context above. NEVER invent URLs. Do not "
            "navigate for greetings, vague questions, or casual chat. After "
            "calling the tool, also reply with a short confirmation like "
            "'Taking you there now.'"
        )

    if mcp_tools:
        tools.extend(mcp_tools)

    # Prepend custom chatbot instructions if provided
    custom_instruction_lines = []
    if custom_instructions:
        custom_instruction_lines = [
            f"IMPORTANT — Custom instructions from the chatbot owner:\n{custom_instructions}",
        ]

    # Swap instructions based on whether RAG data (crawled website) is available
    if has_rag_data:
        core_instructions = [
            "Speak confidently as a member of the team, not as an external tool.",
            "Answer questions using the provided context. Speak in first person plural ('we offer', 'our packages') as if you work there.",
            "NEVER say 'based on the website', 'according to the context', or reference your sources in the text. Just state the information directly and confidently.",
            "NEVER include source URLs, citations, or reference numbers in your response text. Sources are handled separately.",
            "Be warm, helpful, and conversational - like a real team member chatting with a visitor.",
            "If the context doesn't have enough information, say something like 'I don't have the details on that right now, but I'd be happy to connect you with someone who can help.'",
            "ALWAYS end your response with a helpful follow-up question or suggested next step to keep the conversation going. For example: 'Would you like me to share more details about any of these?' or 'Shall I help you with booking?'",
            "Keep responses concise and scannable. Use bullet points for lists.",
            "After your response, on a new line, add exactly [RESOLVED] if you answered the visitor's question or helped them, or [UNRESOLVED] if you couldn't fully help or need more information.",
        ]
    else:
        core_instructions = [
            "Speak confidently as a member of the team, not as an external tool.",
            "The website content hasn't been set up yet, so you don't have specific information about this business.",
            "Use your general knowledge to be helpful, but be honest when you don't have specific details about this business.",
            "If the visitor asks something specific about the business, say something like 'I don't have those details just yet, but I'd be happy to help with general questions or connect you with someone who can help.'",
            "Be warm, helpful, and conversational - like a real team member chatting with a visitor.",
            "ALWAYS end your response with a helpful follow-up question or suggested next step to keep the conversation going.",
            "Keep responses concise and scannable. Use bullet points for lists.",
            "After your response, on a new line, add exactly [RESOLVED] if you answered the visitor's question or helped them, or [UNRESOLVED] if you couldn't fully help or need more information.",
        ]

    agent = Agent(
        model=OpenRouter(
            id=llm_model or settings.LLM_MODEL,
            api_key=settings.OPENROUTER_API_KEY,
        ),
        description="You are a friendly and knowledgeable team member.",
        instructions=[
            *custom_instruction_lines,
            *core_instructions,
            *extra_instructions,
        ],
        markdown=False,
        tools=tools if tools else None,
        # PostgreSQL session storage - pass session_id so Agno loads history
        db=db,
        session_id=session_id,
        add_history_to_context=True,
        num_history_runs=5,
        add_dependencies_to_context=True,
    )
    return agent, follow_up_toolkit


async def chat_with_agent(
    chatbot_id: int,
    message: str,
    chatbot_name: str = "",
    session_id: str | None = None,
    follow_up_prompts: list[dict] | None = None,
    mcp_configs: list[dict] | None = None,
    custom_instructions: str | None = None,
) -> dict:
    """
    Process a user's chat message using RAG + the Agno agent.

    Args:
        chatbot_id:        ID of the chatbot (determines which Qdrant collection).
        message:           The user's question or message.
        chatbot_name:      Name of the chatbot (used in collection name + persona).
        session_id:        UUID identifying the conversation thread.
        follow_up_prompts: Admin-configured pool of follow-up prompts.
        mcp_configs:       MCP server configurations to connect.

    Returns:
        Dict with "response", "sources", "session_id", and "follow_up_prompts".
    """
    mcp_tools: list[MCPTools] = []
    try:
        # Connect MCP servers if configured
        if mcp_configs:
            mcp_tools = await connect_mcp_servers(mcp_configs)

        # Step 1: Retrieve relevant context from Qdrant
        contexts = retrieve_context(chatbot_id, message, top_k=settings.TOP_K, chatbot_name=chatbot_name)
        has_rag_data = contexts is not None

        # Step 2: Build the full prompt based on whether RAG data exists
        if has_rag_data:
            context_str = format_context_for_llm(contexts)
            full_prompt = f"""Here is what you know:
{context_str}

The visitor asks: {message}

Respond naturally and confidently as a team member. Do not mention sources or URLs in your answer."""
        else:
            full_prompt = f"""The visitor asks: {message}

Respond naturally and confidently as a team member."""

        # Resolve the agent's configured model (NULL ⇒ global default).
        agent_model = None
        try:
            conn = await asyncpg.connect(settings.DATABASE_URL_ASYNCPG)
            try:
                agent_model = await conn.fetchval(
                    "SELECT llm_model FROM chatbots WHERE id = $1", chatbot_id
                )
            finally:
                await conn.close()
        except Exception:
            pass  # Fall back to the global default if the lookup fails.
        resolved_model = agent_model or settings.LLM_MODEL

        # Step 3: Create agent with follow-up tool and MCP tools attached
        agent, follow_up_toolkit = create_agent(
            chatbot_name=chatbot_name or "Assistant",
            session_id=session_id,
            follow_up_pool=follow_up_prompts or [],
            mcp_tools=mcp_tools if mcp_tools else None,
            custom_instructions=custom_instructions,
            has_rag_data=has_rag_data,
            llm_model=agent_model,
        )

        # Step 5: Run async — required when MCP tools are attached
        install_patch()
        collector = McpMetaCollector()
        set_active_collector(collector)
        response = await agent.arun(full_prompt)
        set_active_collector(None)
        mcp_results = collector.drain() or None

        # Record token usage (best-effort; never blocks the response).
        prompt_tokens, completion_tokens, total_tokens = extract_token_counts(response)
        await record_usage(
            chatbot_id=chatbot_id,
            session_id=session_id or response.session_id,
            model=resolved_model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
        )

        # Log tool calls
        if response.messages:
            for msg in response.messages:
                if msg.tool_name:
                    logger.info(f"Tool call: {msg.tool_name}({msg.tool_args})")

        # Extract text — content can be empty when the agent made a tool call
        # and the main response only contains the tool result.
        # Walk assistant messages to collect any real text the LLM produced.
        response_text = response.content if isinstance(response.content, str) else ""
        if not clean_response(response_text).strip() and response.messages:
            parts: list[str] = []
            for msg in response.messages:
                if msg.role == "assistant" and msg.content and isinstance(msg.content, str):
                    cleaned = clean_response(msg.content).strip()
                    if cleaned:
                        parts.append(cleaned)
            if parts:
                response_text = parts[-1]

        if not isinstance(response_text, str):
            response_text = str(response_text)

        # Extract resolution classification before cleaning
        response_text, is_resolved = extract_resolution(response_text)

        # Strip any tool result text / LLM reasoning that may leak into the response
        response_text = clean_response(response_text)

        # Step 6: Build a deduplicated list of source URLs
        seen_urls: set[str] = set()
        sources: list[dict] = []
        for ctx in (contexts or []):
            if ctx["url"] not in seen_urls and ctx["score"] > 0.3:
                seen_urls.add(ctx["url"])
                sources.append({"url": ctx["url"], "title": ctx["title"]})

        # Step 7: Read follow-up selections from the toolkit
        selected_follow_ups = follow_up_toolkit.selected if follow_up_toolkit else []

        return {
            "response": response_text,
            "sources": sources,
            "session_id": session_id or response.session_id,
            "follow_up_prompts": selected_follow_ups,
            "mcp_results": mcp_results,
            "is_resolved": is_resolved,
        }
    finally:
        # Disconnect all MCP servers
        for mcp in mcp_tools:
            try:
                await mcp.disconnect()
            except Exception:
                pass
