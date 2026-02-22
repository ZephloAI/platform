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

from agno.agent import Agent
from agno.models.openrouter import OpenRouter
from agno.db.postgres import PostgresDb
from agno.tools import Toolkit

from app.config import settings
from app.rag import retrieve_context, format_context_for_llm

logger = logging.getLogger(__name__)


def clean_response(text: str) -> str:
    """Strip leaked LLM tool-call syntax and internal reasoning from response text."""
    text = re.sub(r"\n*human_thought:.*$", "", text, flags=re.MULTILINE).rstrip()
    text = re.sub(r"\n*social_tool_call:.*$", "", text, flags=re.MULTILINE).rstrip()
    text = re.sub(r"\n*tool_call:.*$", "", text, flags=re.MULTILINE).rstrip()
    text = re.sub(r"\n*Follow-ups? set:.*$", "", text, flags=re.MULTILINE).rstrip()
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
            stop_after_tool_call_tools=["suggest_follow_ups"],
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


def create_agent(
    chatbot_name: str = "Assistant",
    session_id: str | None = None,
    follow_up_pool: list[dict] | None = None,
) -> tuple[Agent, FollowUpTools | None]:
    """
    Create an Agno agent with PostgreSQL-backed session storage.

    When follow_up_pool is provided, a FollowUpTools toolkit is attached
    so the agent can suggest a contextual follow-up button via tool use.

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

    agent = Agent(
        model=OpenRouter(
            id=settings.LLM_MODEL,
            api_key=settings.OPENROUTER_API_KEY,
        ),
        description="You are a friendly and knowledgeable team member.",
        instructions=[
            "Speak confidently as a member of the team, not as an external tool.",
            "Answer questions using the provided context. Speak in first person plural ('we offer', 'our packages') as if you work there.",
            "NEVER say 'based on the website', 'according to the context', or reference your sources in the text. Just state the information directly and confidently.",
            "NEVER include source URLs, citations, or reference numbers in your response text. Sources are handled separately.",
            "Be warm, helpful, and conversational - like a real team member chatting with a visitor.",
            "If the context doesn't have enough information, say something like 'I don't have the details on that right now, but I'd be happy to connect you with someone who can help.'",
            "ALWAYS end your response with a helpful follow-up question or suggested next step to keep the conversation going. For example: 'Would you like me to share more details about any of these?' or 'Shall I help you with booking?'",
            "Keep responses concise and scannable. Use bullet points for lists.",
            *extra_instructions,
        ],
        markdown=False,
        tools=tools if tools else None,
        # PostgreSQL session storage - pass session_id so Agno loads history
        db=db,
        session_id=session_id,
        add_history_to_context=True,
        num_history_runs=5,
        learning=True
    )
    return agent, follow_up_toolkit


async def chat_with_agent(
    chatbot_id: int,
    message: str,
    chatbot_name: str = "",
    session_id: str | None = None,
    follow_up_prompts: list[dict] | None = None,
) -> dict:
    """
    Process a user's chat message using RAG + the Agno agent.

    Args:
        chatbot_id:        ID of the chatbot (determines which Qdrant collection).
        message:           The user's question or message.
        chatbot_name:      Name of the chatbot (used in collection name + persona).
        session_id:        UUID identifying the conversation thread.
        follow_up_prompts: Admin-configured pool of follow-up prompts.

    Returns:
        Dict with "response", "sources", "session_id", and "follow_up_prompts".
    """
    # Step 1: Retrieve relevant context from Qdrant
    contexts = retrieve_context(chatbot_id, message, top_k=settings.TOP_K, chatbot_name=chatbot_name)

    # Step 2: Format the retrieved chunks into a text block
    context_str = format_context_for_llm(contexts)

    # Step 3: Build the full prompt with context + user question
    full_prompt = f"""Here is what you know:
{context_str}

The visitor asks: {message}

Respond naturally and confidently as a team member. Do not mention sources or URLs in your answer."""

    # Step 4: Create agent with follow-up tool attached
    agent, follow_up_toolkit = create_agent(
        chatbot_name=chatbot_name or "Assistant",
        session_id=session_id,
        follow_up_pool=follow_up_prompts or [],
    )

    # Step 5: Run — the agent responds and optionally calls suggest_follow_up
    response = agent.run(full_prompt)
    response_text = response.content

    # Strip any tool result text / LLM reasoning that may leak into the response
    response_text = clean_response(response_text)

    # Step 6: Build a deduplicated list of source URLs
    seen_urls: set[str] = set()
    sources: list[dict] = []
    for ctx in contexts:
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
    }
