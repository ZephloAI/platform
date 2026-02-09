/**
 * API client for the chat widget.
 * Talks to the public endpoints - no authentication needed.
 */

export interface ChatSource {
  url: string;
  title: string;
}

export interface ChatResponse {
  response: string;
  sources: ChatSource[];
  session_id: string | null;
}

export interface WidgetConfig {
  chatbot_id: number;
  name: string;
  widget_icon: string | null;
  widget_welcome: string | null;
  widget_position: string | null;
}

/**
 * Fetch widget configuration from the API.
 * Returns null if the chatbot doesn't exist or the request fails.
 */
export async function fetchConfig(
  apiUrl: string,
  chatbotId: number,
): Promise<WidgetConfig | null> {
  try {
    const res = await fetch(`${apiUrl}/api/public/chatbots/${chatbotId}/config`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function sendMessage(
  apiUrl: string,
  chatbotId: number,
  message: string,
  sessionId: string | null = null,
): Promise<ChatResponse> {
  const res = await fetch(`${apiUrl}/api/public/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatbot_id: chatbotId,
      message,
      session_id: sessionId,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail || `Request failed (${res.status})`);
  }

  return res.json();
}
