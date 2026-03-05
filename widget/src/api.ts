/**
 * API client for the chat widget.
 * Uses WebSocket for chat messages, HTTP GET for config.
 * Session-based auth: POST /api/session creates a session, then WS connects with session_id.
 */

let _apiKey: string | undefined;

export function setApiKey(key: string) {
  _apiKey = key;
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (_apiKey) headers["X-API-Key"] = _apiKey;
  return headers;
}

export interface ChatSource {
  url: string;
  title: string;
}

export interface FollowUpPrompt {
  title: string;
  link?: string;
  prompt?: string;
}

export interface McpToolResult {
  tool_name: string;
  meta: Record<string, unknown>;
  content: string;
}

export interface ChatResponse {
  response: string;
  sources: ChatSource[];
  session_id: string | null;
  follow_up_prompts?: FollowUpPrompt[];
  audio?: string | null;
  mcp_results?: McpToolResult[] | null;
}

export interface WidgetConfig {
  chatbot_id: number;
  name: string;
  widget_icon: string | null;
  widget_welcome: string | null;
  widget_position: string | null;
  quick_prompts?: { title: string; link?: string; prompt?: string }[];
  greeting_prompts?: { title: string; prompt: string }[];
  greeting_prompt_duration?: number | null;
  widget_logo_url?: string | null;
  widget_width?: number | null;
  widget_height?: number | null;
  widget_header_color?: string | null;
  widget_user_bubble_color?: string | null;
  widget_assistant_bubble_color?: string | null;
  widget_font_family?: string | null;
  widget_font_size?: number | null;
  widget_text_color?: string | null;
  voice_enabled?: boolean;
  webmcp_enabled?: boolean;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

/**
 * Fetch widget configuration from the API.
 */
export async function fetchConfig(
  apiUrl: string,
  chatbotId: number,
): Promise<WidgetConfig | null> {
  try {
    const res = await fetch(`${apiUrl}/api/public/chatbots/${chatbotId}/config`, {
      headers: authHeaders(),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/**
 * Create a new chat session via the API.
 */
export async function createSession(
  apiUrl: string,
  chatbotId: number,
): Promise<string> {
  const res = await fetch(`${apiUrl}/api/session`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ chatbot_id: chatbotId }),
  });
  if (!res.ok) throw new Error('Failed to create session');
  const data = await res.json();
  return data.session_id;
}

/**
 * WebSocket client for chat messages.
 * Connects using session_id + chatbot_id query params.
 * Exposes connection status via onStatusChange callback.
 */
export class ChatSocket {
  private ws: WebSocket | null = null;
  private apiUrl: string;
  private chatbotId: number;
  private sessionId: string;
  private pending: ((value: ChatResponse) => void) | null = null;
  private pendingReject: ((reason: Error) => void) | null = null;
  private mcpListeners: ((results: McpToolResult[]) => void)[] = [];
  private webMcpHandler: ((req: { tool_name: string; arguments: Record<string, unknown> }) => Promise<{ content: string; error?: string }>) | null = null;
  private webMcpToolSchemas: { name: string; description: string; inputSchema: Record<string, unknown> }[] = [];

  public status: ConnectionStatus = 'disconnected';
  public onStatusChange?: (status: ConnectionStatus) => void;

  constructor(apiUrl: string, chatbotId: number, sessionId: string) {
    this.apiUrl = apiUrl;
    this.chatbotId = chatbotId;
    this.sessionId = sessionId;
  }

  private setStatus(status: ConnectionStatus) {
    this.status = status;
    this.onStatusChange?.(status);
  }

  private buildWsUrl(): string {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = this.apiUrl.includes("://")
      ? new URL(this.apiUrl).host
      : window.location.host;
    return `${proto}//${host}/ws/chat?session_id=${this.sessionId}&chatbot_id=${this.chatbotId}`;
  }

  setWebMcpHandler(handler: (req: { tool_name: string; arguments: Record<string, unknown> }) => Promise<{ content: string; error?: string }>): void {
    this.webMcpHandler = handler;
  }

  setWebMcpTools(schemas: { name: string; description: string; inputSchema: Record<string, unknown> }[]): void {
    this.webMcpToolSchemas = schemas;
  }

  async sendMessage(message: string, voice?: boolean): Promise<ChatResponse> {
    const payload = JSON.stringify({
      message,
      ...(voice ? { voice: true } : {}),
      ...(this.webMcpToolSchemas.length > 0 ? { webmcp_tools: this.webMcpToolSchemas } : {}),
    });

    // Reuse open connection
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return new Promise((resolve, reject) => {
        this.pending = resolve;
        this.pendingReject = reject;
        this.ws!.send(payload);
      });
    }

    // Connect with session_id
    this.setStatus('connecting');
    const wsUrl = this.buildWsUrl();

    return new Promise((resolve, reject) => {
      this.pending = resolve;
      this.pendingReject = reject;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.setStatus('connected');
        this.ws!.send(payload);
      };

      this.ws.onmessage = async (event) => {
        let data: any;
        try {
          data = JSON.parse(event.data);
        } catch {
          this.pendingReject?.(new Error("Invalid response from server"));
          this.pending = null;
          this.pendingReject = null;
          return;
        }

        // Handle intermediate webmcp tool call — do NOT resolve pending
        if (data.type === "webmcp_tool_call" && this.webMcpHandler) {
          const result = await this.webMcpHandler({
            tool_name: data.tool_name,
            arguments: data.arguments || {},
          });
          this.ws?.send(JSON.stringify({
            type: "webmcp_tool_result",
            call_id: data.call_id,
            content: result.content,
            error: result.error,
          }));
          return;
        }

        if (data.error) {
          this.pendingReject?.(new Error(data.error));
        } else {
          if (data.mcp_results && data.mcp_results.length > 0) {
            this.notifyMcpListeners(data.mcp_results);
          }
          this.pending?.(data as ChatResponse);
        }
        this.pending = null;
        this.pendingReject = null;
      };

      this.ws.onerror = () => {
        this.setStatus('disconnected');
        this.pendingReject?.(new Error("WebSocket connection error"));
        this.pending = null;
        this.pendingReject = null;
      };

      this.ws.onclose = () => {
        this.setStatus('disconnected');
        if (this.pendingReject) {
          this.pendingReject(new Error("Connection closed"));
          this.pending = null;
          this.pendingReject = null;
        }
        this.ws = null;
      };
    });
  }

  onMcpResult(callback: (results: McpToolResult[]) => void): () => void {
    this.mcpListeners.push(callback);
    return () => {
      this.mcpListeners = this.mcpListeners.filter(cb => cb !== callback);
    };
  }

  private notifyMcpListeners(results: McpToolResult[]) {
    for (const cb of this.mcpListeners) {
      try { cb(results); } catch { /* listener error */ }
    }
  }

  close() {
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
  }
}
