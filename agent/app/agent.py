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
6. The run is automatically persisted to Postgres under that session_id.
"""

from agno.agent import Agent
from agno.models.openrouter import OpenRouter
from agno.db.postgres import PostgresDb

from app.config import settings
from app.rag import retrieve_context, format_context_for_llm

# Single PostgresDb instance reused across requests.
# Agno auto-creates the session table if it doesn't exist.
db = PostgresDb(db_url=settings.DATABASE_URL)


def create_agent(chatbot_name: str = "Assistant", session_id: str | None = None) -> Agent:
    """
    Create an Agno agent with PostgreSQL-backed session storage.

    When a session_id is provided, the agent automatically loads
    conversation history from Postgres and includes it in the LLM context.
    After each run, the new messages are persisted back to the same session.
    """
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
        ],
        markdown=True,
        # PostgreSQL session storage - pass session_id so Agno loads history
        db=db,
        session_id=session_id,
        add_history_to_context=True,
        num_history_runs=5,
    )
    return agent


async def chat_with_agent(
    chatbot_id: int,
    message: str,
    chatbot_name: str = "",
    session_id: str | None = None,
) -> dict:
    """
    Process a user's chat message using RAG + the Agno agent.

    Args:
        chatbot_id:   ID of the chatbot (determines which Qdrant collection).
        message:      The user's question or message.
        chatbot_name: Name of the chatbot (used in collection name + persona).
        session_id:   UUID identifying the conversation thread. When provided,
                      the agent loads prior messages from Postgres and persists
                      this run back to the same session.

    Returns:
        Dict with "response", "sources", and "session_id".
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

    # Step 4: Create agent and get response from the LLM
    # session_id is set on the Agent constructor so Agno loads/saves history
    agent = create_agent(chatbot_name=chatbot_name or "Assistant", session_id=session_id)
    response = agent.run(full_prompt)

    # Step 5: Extract the response text
    response_text = response.content

    # Step 6: Build a deduplicated list of source URLs
    seen_urls: set[str] = set()
    sources: list[dict] = []
    for ctx in contexts:
        if ctx["url"] not in seen_urls and ctx["score"] > 0.3:
            seen_urls.add(ctx["url"])
            sources.append({"url": ctx["url"], "title": ctx["title"]})

    return {
        "response": response_text,
        "sources": sources,
        "session_id": session_id or response.session_id,
    }
