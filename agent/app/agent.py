"""
Agno Agent module.

This module sets up and runs the AI agent using the Agno framework.
The agent uses OpenRouter as its LLM provider (OpenAI-compatible API).

How the chat flow works:
1. User sends a question about a website.
2. We retrieve relevant chunks from Qdrant (via rag.py).
3. We build a prompt combining the website context + user question.
4. The Agno agent sends this to the LLM and returns the answer.
5. We also return the source URLs so the user knows where info came from.
"""

from agno.agent import Agent
from agno.models.openrouter import OpenRouter

from app.config import settings
from app.rag import retrieve_context, format_context_for_llm


def create_agent() -> Agent:
    """
    Create an Agno agent configured with OpenRouter as the LLM provider.

    The agent is instructed to:
    - Only answer based on the provided website context.
    - Admit when it doesn't have enough information.
    - Reference source pages in its answers.

    Returns:
        Configured Agno Agent instance ready to process messages.
    """
    agent = Agent(
        model=OpenRouter(
            id=settings.LLM_MODEL,
            api_key=settings.OPENROUTER_API_KEY,
        ),
        description="You are a helpful website assistant chatbot.",
        instructions=[
            "Answer questions based ONLY on the provided context from the website.",
            "If the context doesn't contain relevant information, say so honestly.",
            "Be concise and helpful.",
            "Always reference which parts of the website your answer comes from.",
        ],
        markdown=True,
    )
    return agent


async def chat_with_agent(chatbot_id: int, message: str, chatbot_name: str = "") -> dict:
    """
    Process a user's chat message using RAG + the Agno agent.

    This is the main function that ties everything together:
    1. Retrieve relevant website chunks from Qdrant.
    2. Format them into a context string.
    3. Build the full prompt (context + user question).
    4. Send to the Agno agent / LLM for a response.
    5. Return the response text and source URLs.

    Args:
        chatbot_id: ID of the chatbot (determines which Qdrant collection).
        message:    The user's question or message.

    Returns:
        Dict with "response" (the LLM's answer) and "sources" (list of URLs).
    """
    # Step 1: Retrieve relevant context from Qdrant
    contexts = retrieve_context(chatbot_id, message, top_k=settings.TOP_K, chatbot_name=chatbot_name)

    # Step 2: Format the retrieved chunks into a text block
    context_str = format_context_for_llm(contexts)

    # Step 3: Build the full prompt with context + user question
    full_prompt = f"""Context from the website:
{context_str}

User question: {message}

Please answer the user's question based on the provided context."""

    # Step 4: Create agent and get response from the LLM
    agent = create_agent()
    response = agent.run(full_prompt)

    # Step 5: Extract the response text
    response_text = response.content

    # Step 6: Build a deduplicated list of source URLs
    # Only include sources with a relevance score above 0.3
    seen_urls: set[str] = set()
    sources: list[dict] = []
    for ctx in contexts:
        if ctx["url"] not in seen_urls and ctx["score"] > 0.3:
            seen_urls.add(ctx["url"])
            sources.append({"url": ctx["url"], "title": ctx["title"]})

    return {"response": response_text, "sources": sources}
