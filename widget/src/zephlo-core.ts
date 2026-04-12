/**
 * ZephloCore - shared state singleton for all Zephlo widget views.
 *
 * The core owns:
 *   - Configuration (apiKey, chatbotId, apiUrl, widget config from server)
 *   - Chat session (sessionId, WebSocket)
 *   - Message history
 *   - Person mode state
 *
 * Views (`<zephlo-fab>`, `<zephlo-chat>`) subscribe to core events to render.
 * All state mutations go through the core so every connected view stays in sync.
 */

import {
  ChatSocket,
  fetchConfig,
  createSession,
  setApiKey,
  type ChatSource,
  type FollowUpPrompt,
  type McpToolResult,
  type ConnectionStatus,
  type WidgetConfig,
} from "./api";
import { toolRegistry, type ToolDefinition } from "./webmcp";
import * as storage from "./storage";

// ---- Types ----

export interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  followUpPrompts?: FollowUpPrompt[];
  audio?: string | null;
  isAdminMessage?: boolean;
}

export type CoreEvent =
  | { type: "configLoaded" }
  | { type: "statusChanged"; status: ConnectionStatus }
  | { type: "messageAdded"; message: Message }
  | { type: "messagesReset" }
  | { type: "loading"; loading: boolean }
  | { type: "waiting" } // "Message sent" indicator
  | { type: "personModeChanged" }
  | { type: "adminMessage"; content: string }
  | { type: "navigate" }
  | { type: "mcpResults"; results: McpToolResult[] }
  | { type: "error"; message: string };

type Subscriber = (event: CoreEvent) => void;

const DEFAULT_API_URL = "https://app.zephlo.ai";

// ---- Core class ----

class ZephloCoreClass {
  // Config
  apiKey: string | null = null;
  chatbotId: string = "";
  apiUrl: string = DEFAULT_API_URL;
  widgetConfig: WidgetConfig | null = null;
  configLoaded = false;

  // Live session state
  sessionId: string | null = null;
  chatSocket: ChatSocket | null = null;
  connectionStatus: ConnectionStatus = "disconnected";
  messages: Message[] = [];
  isLoading = false;
  personMode = false;

  // MCP / tool results
  mcpGlobalListeners: ((results: McpToolResult[]) => void)[] = [];

  // Retry guard
  private sessionRetried = false;

  // Subscribers
  private subscribers: Set<Subscriber> = new Set();

  // Views waiting for configure() to be called. See waitForConfiguration().
  private configWaiters: Array<() => void> = [];

  // ---- Configuration ----

  configure(opts: { key: string; chatbotId: string; apiUrl?: string }): void {
    this.apiKey = opts.key;
    this.chatbotId = String(opts.chatbotId);
    if (opts.apiUrl) this.apiUrl = opts.apiUrl;
    setApiKey(opts.key);

    // Wake up any views that connected before initialize() was called.
    const waiters = this.configWaiters;
    this.configWaiters = [];
    waiters.forEach((resolve) => resolve());
  }

  /**
   * Returns a promise that resolves once the core has been configured
   * (i.e. `Zephlo.initialize()` has been called). Resolves immediately if
   * config is already present. Views should await this before reading
   * config-dependent state — otherwise they race against the inline
   * `<script>` tag that calls initialize().
   */
  waitForConfiguration(): Promise<void> {
    if (this.chatbotId) return Promise.resolve();
    return new Promise((resolve) => {
      this.configWaiters.push(resolve);
    });
  }

  /** Fetch widget config from the server (called once, cached). */
  async loadConfig(): Promise<WidgetConfig | null> {
    if (this.configLoaded) return this.widgetConfig;
    if (!this.chatbotId) return null;

    this.widgetConfig = await fetchConfig(this.apiUrl, this.chatbotId);
    this.configLoaded = true;

    // Load any persisted messages for this chatbot
    const saved = storage.getItem(`cb_messages_${this.chatbotId}`);
    if (saved) {
      try {
        this.messages = JSON.parse(saved);
      } catch {
        this.messages = [];
      }
    }

    this.emit({ type: "configLoaded" });
    return this.widgetConfig;
  }

  /** Create (or reuse) a session + WebSocket connection. */
  async ensureSession(): Promise<void> {
    if (this.sessionId && this.chatSocket) return;

    let sessionId = storage.getItem(`cb_session_${this.chatbotId}`);
    if (!sessionId) {
      try {
        sessionId = await createSession(this.apiUrl, this.chatbotId);
        storage.setItem(`cb_session_${this.chatbotId}`, sessionId);
      } catch {
        return; // will retry on next send
      }
    }
    this.sessionId = sessionId;
    this.chatSocket = new ChatSocket(this.apiUrl, this.chatbotId, sessionId);
    this.chatSocket.onStatusChange = (status) => {
      this.connectionStatus = status;
      this.emit({ type: "statusChanged", status });
    };
    this.setupSocketListeners();

    // Eagerly connect so admin messages come through immediately
    this.chatSocket.connect().catch(() => {});
  }

  private setupSocketListeners(): void {
    if (!this.chatSocket) return;

    // Wire WebMCP tool handlers
    toolRegistry.discoverExternal();
    this.chatSocket.setZephloToolHandler(async (req: any) => toolRegistry.execute(req.tool, req.arguments));
    this.chatSocket.setZephloTools(() => toolRegistry.getSchemas());

    this.chatSocket.onAdminMessage((content) => {
      const msg: Message = {
        role: "assistant",
        content,
        isAdminMessage: true,
      };
      this.messages.push(msg);
      this.saveMessages();
      this.emit({ type: "messageAdded", message: msg });
    });

    this.chatSocket.onModeChanged((mode: string) => {
      this.personMode = mode === "person";
      this.emit({ type: "personModeChanged" });
    });

    this.chatSocket.onWaiting(() => {
      this.emit({ type: "waiting" });
    });

    this.chatSocket.onNavigate(() => {
      this.emit({ type: "navigate" });
    });

    this.chatSocket.onMcpResult((results) => {
      this.mcpGlobalListeners.forEach((cb) => cb(results));
      this.emit({ type: "mcpResults", results });
    });
  }

  // ---- Actions ----

  /** Send a user message and wait for assistant response. */
  async sendMessage(text: string, options: { voice?: boolean } = {}): Promise<void> {
    if (!text.trim() || this.isLoading) return;

    await this.ensureSession();
    if (!this.chatSocket) {
      this.emit({ type: "error", message: "Unable to connect. Please try again." });
      return;
    }

    const userMsg: Message = { role: "user", content: text };
    this.messages.push(userMsg);
    this.saveMessages();
    this.emit({ type: "messageAdded", message: userMsg });

    this.isLoading = true;
    this.emit({ type: "loading", loading: true });

    try {
      const data = await this.chatSocket.sendMessage(text, options.voice);
      this.sessionRetried = false;

      const assistantMsg: Message = {
        role: "assistant",
        content: data.response,
        sources: data.sources,
        followUpPrompts: data.follow_up_prompts,
        audio: data.audio || null,
      };
      this.messages.push(assistantMsg);
      this.saveMessages();
      this.emit({ type: "messageAdded", message: assistantMsg });
    } catch (err) {
      // Retry once with a fresh session (handles stale sessions)
      if (!this.sessionRetried) {
        this.sessionRetried = true;
        if (await this.resetSession()) {
          try {
            const data = await this.chatSocket!.sendMessage(text, options.voice);
            this.sessionRetried = false;
            const assistantMsg: Message = {
              role: "assistant",
              content: data.response,
              sources: data.sources,
              followUpPrompts: data.follow_up_prompts,
              audio: data.audio || null,
            };
            this.messages.push(assistantMsg);
            this.saveMessages();
            this.emit({ type: "messageAdded", message: assistantMsg });
            return;
          } catch {
            // Fall through to error
          }
        }
      }
      this.emit({
        type: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      this.isLoading = false;
      this.emit({ type: "loading", loading: false });
    }
  }

  /** Add a user message that was already sent (e.g. from quick-prompt clicks). */
  async sendPrompt(prompt: string): Promise<void> {
    return this.sendMessage(prompt);
  }

  /** Clear everything and create a fresh session. */
  async startNewChat(): Promise<void> {
    this.chatSocket?.close();
    this.chatSocket = null;
    this.sessionId = null;
    this.messages = [];
    this.personMode = false;
    storage.removeItem(`cb_session_${this.chatbotId}`);
    storage.removeItem(`cb_messages_${this.chatbotId}`);

    this.emit({ type: "messagesReset" });
    this.emit({ type: "personModeChanged" });

    await this.ensureSession();
  }

  /** Switch to human agent handoff. */
  switchToPerson(): void {
    this.chatSocket?.sendRaw({ message_type: "switch_to_person" });
    const msg: Message = {
      role: "assistant",
      content: "You're now connected with our team. We'll reply shortly.",
      isAdminMessage: true,
    };
    this.messages.push(msg);
    this.saveMessages();
    this.personMode = true;
    this.emit({ type: "messageAdded", message: msg });
    this.emit({ type: "personModeChanged" });
  }

  /** Send page context metadata to the agent. */
  sendContextUpdate(data: Record<string, any>, includePageDetails?: boolean): void {
    this.chatSocket?.sendContextUpdate(data, includePageDetails);
  }

  /** Register a callback for MCP tool results. */
  registerMcpListener(cb: (results: McpToolResult[]) => void): () => void {
    this.mcpGlobalListeners.push(cb);
    return () => {
      this.mcpGlobalListeners = this.mcpGlobalListeners.filter((x) => x !== cb);
    };
  }

  // ---- Subscription ----

  subscribe(cb: Subscriber): () => void {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  private emit(event: CoreEvent): void {
    this.subscribers.forEach((cb) => cb(event));
  }

  // ---- Helpers ----

  private saveMessages(): void {
    try {
      storage.setItem(
        `cb_messages_${this.chatbotId}`,
        JSON.stringify(this.messages),
      );
    } catch {
      // ignore storage errors
    }
  }

  private async resetSession(): Promise<boolean> {
    try {
      this.chatSocket?.close();
      storage.removeItem(`cb_session_${this.chatbotId}`);
      const sessionId = await createSession(this.apiUrl, this.chatbotId);
      this.sessionId = sessionId;
      storage.setItem(`cb_session_${this.chatbotId}`, sessionId);
      this.chatSocket = new ChatSocket(this.apiUrl, this.chatbotId, sessionId);
      this.chatSocket.onStatusChange = (status) => {
        this.connectionStatus = status;
        this.emit({ type: "statusChanged", status });
      };
      this.setupSocketListeners();
      return true;
    } catch {
      return false;
    }
  }

  /** Tear down the core (called from destroy()). */
  destroy(): void {
    this.chatSocket?.close();
    this.chatSocket = null;
    this.subscribers.clear();
    this.mcpGlobalListeners = [];
    this.messages = [];
    this.sessionId = null;
    this.widgetConfig = null;
    this.configLoaded = false;
    toolRegistry.clear();
  }
}

// Singleton instance
export const zephloCore = new ZephloCoreClass();

// Re-export types for views
export type { WidgetConfig, ConnectionStatus, ChatSource, FollowUpPrompt, McpToolResult, ToolDefinition };
