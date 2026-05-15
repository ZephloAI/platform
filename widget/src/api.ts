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
  chatbot_id: string;
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
  widget_font_family?: string | null;
  widget_font_size?: number | null;
  voice_enabled?: boolean;
  webmcp_enabled?: boolean;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

/**
 * Fetch widget configuration from the API.
 */
export async function fetchConfig(
  apiUrl: string,
  chatbotId: string,
): Promise<WidgetConfig | null> {
  try {
    const res = await fetch(`${apiUrl}/api/public/agents/${chatbotId}/config`, {
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
  chatbotId: string,
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
  private chatbotId: string;
  private sessionId: string;
  private pending: ((value: ChatResponse) => void) | null = null;
  private pendingReject: ((reason: Error) => void) | null = null;
  private mcpListeners: ((results: McpToolResult[]) => void)[] = [];
  private zephloToolHandler: ((req: { tool: string; arguments: Record<string, unknown> }) => Promise<{ content: string; error?: string }>) | null = null;
  private zephloToolSchemas: { name: string; description: string; inputSchema: Record<string, unknown> }[] = [];
  private zephloToolGetter: (() => { name: string; description: string; inputSchema: Record<string, unknown> }[]) | null = null;
  private adminMessageHandler: ((content: string) => void) | null = null;
  private modeChangedHandler: ((mode: string) => void) | null = null;
  private waitingHandler: (() => void) | null = null;
  private navigateHandler: ((url?: string) => void) | null = null;

  public status: ConnectionStatus = 'disconnected';
  public onStatusChange?: (status: ConnectionStatus) => void;

  constructor(apiUrl: string, chatbotId: string, sessionId: string) {
    this.apiUrl = apiUrl;
    this.chatbotId = chatbotId;
    this.sessionId = sessionId;
  }

  private setStatus(status: ConnectionStatus) {
    this.status = status;
    this.onStatusChange?.(status);
  }

  private buildWsUrl(): string {
    const url = new URL(this.apiUrl);
    const proto = url.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${url.host}/ws/chat?session_id=${this.sessionId}&chatbot_id=${this.chatbotId}`;
  }

  setZephloToolHandler(handler: (req: { tool: string; arguments: Record<string, unknown> }) => Promise<{ content: string; error?: string }>): void {
    this.zephloToolHandler = handler;
  }

  setZephloTools(schemasOrGetter: { name: string; description: string; inputSchema: Record<string, unknown> }[] | (() => { name: string; description: string; inputSchema: Record<string, unknown> }[])): void {
    if (typeof schemasOrGetter === 'function') {
      this.zephloToolGetter = schemasOrGetter;
    } else {
      this.zephloToolSchemas = schemasOrGetter;
    }
  }

  sendRaw(data: object): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  onAdminMessage(handler: (content: string) => void): void {
    this.adminMessageHandler = handler;
  }

  onModeChanged(handler: (mode: string) => void): void {
    this.modeChangedHandler = handler;
  }

  onWaiting(handler: () => void): void {
    this.waitingHandler = handler;
  }

  onNavigate(handler: (url?: string) => void): void {
    this.navigateHandler = handler;
  }

  private getZephloToolSchemas(): { name: string; description: string; inputSchema: Record<string, unknown> }[] {
    if (this.zephloToolGetter) {
      return this.zephloToolGetter();
    }
    return this.zephloToolSchemas;
  }

  private async handleMessage(event: MessageEvent): Promise<void> {
    let data: any;
    try {
      data = JSON.parse(event.data);
    } catch {
      this.pendingReject?.(new Error("Invalid response from server"));
      this.pending = null;
      this.pendingReject = null;
      return;
    }

    // Handle admin message from live chat
    if (data.message_type === "admin_message") {
      this.adminMessageHandler?.(data.content);
      return;
    }
    if (data.message_type === "mode_changed") {
      this.modeChangedHandler?.(data.mode);
      return;
    }
    // Agent-driven navigation: server tells the widget to take the user to a page.
    if (data.message_type === "navigate") {
      this.navigateHandler?.(data.url);
      return;
    }

    if (data.message_type === "waiting") {
      this.waitingHandler?.();
      // Resolve the pending promise so the UI doesn't hang
      this.pending?.({
        response: "",
        sources: [],
        session_id: data.session_id || null,
        follow_up_prompts: [],
      });
      this.pending = null;
      this.pendingReject = null;
      return;
    }

    // Handle tool call from agent
    if (data.message_type === "web_tool_call" && this.zephloToolHandler) {
      const args = data.details.arguments || {};
      const result = await this.zephloToolHandler({
        tool: data.details.tool,
        arguments: args,
      });
      this.ws?.send(JSON.stringify({
        message_type: "tool_result",
        call_id: data.call_id,
        content: result.content,
        error: result.error,
      }));
      if (args.navigate === true && this.navigateHandler) {
        this.navigateHandler();
      }
      return;
    }

    // Handle error
    if (data.message_type === "error") {
      this.pendingReject?.(new Error(data.error));
      this.pending = null;
      this.pendingReject = null;
      return;
    }

    // Handle normal response
    if (data.mcp_results && data.mcp_results.length > 0) {
      this.notifyMcpListeners(data.mcp_results);
    }
    this.pending?.(data as ChatResponse);
    this.pending = null;
    this.pendingReject = null;
  }

  private setupWsHandlers(): void {
    if (!this.ws) return;

    this.ws.onmessage = (event) => this.handleMessage(event);

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
  }

  private static MAX_RETRIES = 3;
  private static BASE_DELAY_MS = 1000;

  // Shared promise so concurrent connect() callers join the same handshake
  // instead of racing and opening duplicate WebSockets.
  private connectPromise: Promise<void> | null = null;

  async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = this.doConnect();
    try {
      await this.connectPromise;
    } finally {
      this.connectPromise = null;
    }
  }

  private async doConnect(): Promise<void> {
    let lastError: Error | null = null;
    const wsUrl = this.buildWsUrl();

    for (let attempt = 0; attempt <= ChatSocket.MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delay = ChatSocket.BASE_DELAY_MS * Math.pow(2, attempt - 1);
        await new Promise(r => setTimeout(r, delay));
      }

      this.setStatus('connecting');

      try {
        await new Promise<void>((resolve, reject) => {
          this.ws = new WebSocket(wsUrl);

          this.ws.onopen = () => {
            this.setStatus('connected');
            this.ws!.send(JSON.stringify({
              message_type: "init",
              zephlo_tools: this.getZephloToolSchemas(),
            }));
            this.setupWsHandlers();
            resolve();
          };

          this.ws.onerror = () => {
            this.setStatus('disconnected');
            reject(new Error("WebSocket connection error"));
          };

          this.ws.onclose = () => {
            this.setStatus('disconnected');
            this.ws = null;
          };
        });
        return;
      } catch (err) {
        lastError = err as Error;
        this.ws = null;
      }
    }

    throw lastError ?? new Error("WebSocket connection failed");
  }

  async sendMessage(message: string, voice?: boolean): Promise<ChatResponse> {
    const payload = JSON.stringify({
      message_type: "chat",
      message,
      ...(voice ? { voice: true } : {}),
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
        this.ws!.send(JSON.stringify({
            message_type: "init",
            zephlo_tools: this.getZephloToolSchemas(),
        }));
        this.ws!.send(payload);
      };

      this.setupWsHandlers();
    });
  }

  /**
   * Fire a manual trigger. The `prompt` is an instruction to the agent
   * (not user-facing text); the agent generates an assistant response.
   * Resolves on the same `response` envelope as sendMessage.
   */
  async sendTrigger(
    triggerId: string,
    prompt: string,
    mode: "open" | "prompt",
    pageContext?: Record<string, unknown>,
  ): Promise<ChatResponse> {
    const payload = JSON.stringify({
      message_type: "trigger",
      trigger_id: triggerId,
      prompt,
      mode,
      page_context: pageContext || {},
    });

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return new Promise((resolve, reject) => {
        this.pending = resolve;
        this.pendingReject = reject;
        this.ws!.send(payload);
      });
    }

    this.setStatus('connecting');
    const wsUrl = this.buildWsUrl();

    return new Promise((resolve, reject) => {
      this.pending = resolve;
      this.pendingReject = reject;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.setStatus('connected');
        this.ws!.send(JSON.stringify({
          message_type: "init",
          zephlo_tools: this.getZephloToolSchemas(),
        }));
        this.ws!.send(payload);
      };

      this.setupWsHandlers();
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

  sendContextUpdate(data: Record<string, any>, includePageDetails?: boolean): void {
    const pageDetails = includePageDetails ? getPageContext() : {};
    const payload = { ...pageDetails, ...data };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        message_type: "context_update",
        page_context: payload,
      }));
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

function getPageContext(): Record<string, string> {
  const metaEl = document.querySelector('meta[name="description"]');
  return {
    url: window.location.href,
    title: document.title,
    meta_description: metaEl?.getAttribute("content") || "",
  };
}
