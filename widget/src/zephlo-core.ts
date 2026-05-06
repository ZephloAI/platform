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
import {
  resolveColors,
  resolveActiveMode,
  type ThemeMode,
  type ThemeColors,
  type ThemeOptions,
  type ResolvedColors,
} from "./theme";

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
  | { type: "navigate"; url?: string }
  | { type: "mcpResults"; results: McpToolResult[] }
  | { type: "themeChanged"; colors: ResolvedColors }
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

  // Theme
  private themeMode: ThemeMode = "auto";
  private lightOverrides: ThemeColors = {};
  private darkOverrides: ThemeColors = {};
  private mediaQuery: MediaQueryList | null = null;
  private mediaListener: ((e: MediaQueryListEvent) => void) | null = null;
  private hostThemeObserver: MutationObserver | null = null;

  // MCP / tool results
  mcpGlobalListeners: ((results: McpToolResult[]) => void)[] = [];

  // Prompt-mode triggers hold their assistant response here until the user
  // clicks the toast. If the toast is dismissed or auto-expires, the message
  // is discarded and never touches chat history (client or server).
  private pendingTriggerMessage: Message | null = null;

  // Retry guard
  private sessionRetried = false;

  // Navigate messages arrive mid-`arun()` — before the assistant response.
  // Buffer the URL until sendMessage()'s finally block flushes it, so the
  // new page loads with the full chat history saved to localStorage.
  // Triggers/switchToPerson don't set isLoading, so they pass through.
  private pendingNavigateUrl: string | null = null;
  private pendingNavigateTimer: ReturnType<typeof setTimeout> | null = null;

  // Subscribers
  private subscribers: Set<Subscriber> = new Set();

  // Views waiting for configure() to be called. See waitForConfiguration().
  private configWaiters: Array<() => void> = [];

  // ---- Configuration ----

  configure(opts: {
    key: string;
    chatbotId: string;
    apiUrl?: string;
    theme?: ThemeOptions;
  }): void {
    this.apiKey = opts.key;
    this.chatbotId = String(opts.chatbotId);
    if (opts.apiUrl) this.apiUrl = opts.apiUrl;
    setApiKey(opts.key);

    if (opts.theme) this.configureTheme(opts.theme);

    // Wake up any views that connected before initialize() was called.
    const waiters = this.configWaiters;
    this.configWaiters = [];
    waiters.forEach((resolve) => resolve());
  }

  // ---- Theme ----

  configureTheme(theme: ThemeOptions): void {
    if (theme.light) this.lightOverrides = { ...this.lightOverrides, ...theme.light };
    if (theme.dark) this.darkOverrides = { ...this.darkOverrides, ...theme.dark };
    if (theme.mode) this.setThemeMode(theme.mode);
    else this.emitThemeChanged();
  }

  setThemeMode(mode: ThemeMode): void {
    this.themeMode = mode;
    this.detachThemeListeners();
    if (mode === "auto") this.attachThemeListeners();
    this.emitThemeChanged();
  }

  /**
   * In auto mode, react when the host page's theme changes — either via
   * `data-theme` / class toggles on <html>, or via the OS-level
   * prefers-color-scheme media query.
   */
  private attachThemeListeners(): void {
    if (typeof window !== "undefined" && window.matchMedia) {
      this.mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      this.mediaListener = () => this.emitThemeChanged();
      this.mediaQuery.addEventListener("change", this.mediaListener);
    }
    if (typeof document !== "undefined" && document.documentElement) {
      this.hostThemeObserver = new MutationObserver(() => this.emitThemeChanged());
      this.hostThemeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "data-theme"],
      });
    }
  }

  getThemeMode(): ThemeMode {
    return this.themeMode;
  }

  /** Concrete mode currently active ("auto" resolved against the OS). */
  getActiveMode(): "light" | "dark" {
    return resolveActiveMode(this.themeMode);
  }

  /** Update colors for one mode without switching the active mode. */
  setThemeColors(mode: "light" | "dark", colors: ThemeColors): void {
    if (mode === "dark") this.darkOverrides = { ...this.darkOverrides, ...colors };
    else this.lightOverrides = { ...this.lightOverrides, ...colors };
    this.emitThemeChanged();
  }

  /** Update a single color on the currently active mode. */
  setActiveColor(key: keyof ThemeColors, value: string): void {
    this.setThemeColors(this.getActiveMode(), { [key]: value });
  }

  getResolvedColors(): ResolvedColors {
    const active = this.getActiveMode();
    const overrides = active === "dark" ? this.darkOverrides : this.lightOverrides;
    return resolveColors(active, overrides);
  }

  private emitThemeChanged(): void {
    this.emit({ type: "themeChanged", colors: this.getResolvedColors() });
  }

  private detachThemeListeners(): void {
    if (this.mediaQuery && this.mediaListener) {
      this.mediaQuery.removeEventListener("change", this.mediaListener);
    }
    this.mediaQuery = null;
    this.mediaListener = null;
    this.hostThemeObserver?.disconnect();
    this.hostThemeObserver = null;
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

  /** Reconnect the WS to an existing session, but never create a new one. */
  async resumeSessionIfExists(): Promise<void> {
    if (!storage.getItem(`cb_session_${this.chatbotId}`)) return;
    await this.ensureSession();
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

    this.chatSocket.onNavigate((url) => {
      if (url && this.isLoading) {
        this.pendingNavigateUrl = url;
        // Safety net: flush even if isLoading stays stuck (lost response, bug).
        if (this.pendingNavigateTimer) clearTimeout(this.pendingNavigateTimer);
        this.pendingNavigateTimer = setTimeout(() => this.flushPendingNavigate(), 5000);
        return;
      }
      this.emit({ type: "navigate", url });
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
      this.flushPendingNavigate();
    }
  }

  private flushPendingNavigate(): void {
    if (this.pendingNavigateTimer) {
      clearTimeout(this.pendingNavigateTimer);
      this.pendingNavigateTimer = null;
    }
    const url = this.pendingNavigateUrl;
    if (!url) return;
    this.pendingNavigateUrl = null;
    this.emit({ type: "navigate", url });
  }

  /** Add a user message that was already sent (e.g. from quick-prompt clicks). */
  async sendPrompt(prompt: string): Promise<void> {
    return this.sendMessage(prompt);
  }

  /** Clear local chat state. The next sendMessage() will create a fresh session lazily. */
  async startNewChat(): Promise<void> {
    this.chatSocket?.close();
    this.chatSocket = null;
    this.sessionId = null;
    this.messages = [];
    this.personMode = false;
    this.pendingNavigateUrl = null;
    if (this.pendingNavigateTimer) {
      clearTimeout(this.pendingNavigateTimer);
      this.pendingNavigateTimer = null;
    }
    storage.removeItem(`cb_session_${this.chatbotId}`);
    storage.removeItem(`cb_messages_${this.chatbotId}`);

    this.emit({ type: "messagesReset" });
    this.emit({ type: "personModeChanged" });
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

  /**
   * Commit a pending prompt-mode trigger into chat history. Called by the
   * view when the user clicks the toast.
   */
  commitPendingTrigger(): void {
    const msg = this.pendingTriggerMessage;
    if (!msg) return;
    this.pendingTriggerMessage = null;
    this.messages.push(msg);
    this.saveMessages();
    this.emit({ type: "messageAdded", message: msg });
  }

  /** Discard a pending prompt-mode trigger (toast dismissed / expired). */
  clearPendingTrigger(): void {
    this.pendingTriggerMessage = null;
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
    this.pendingNavigateUrl = null;
    if (this.pendingNavigateTimer) {
      clearTimeout(this.pendingNavigateTimer);
      this.pendingNavigateTimer = null;
    }
    this.detachThemeListeners();
    toolRegistry.clear();
  }
}

// Singleton instance
export const zephloCore = new ZephloCoreClass();

// Re-export types for views
export type { WidgetConfig, ConnectionStatus, ChatSource, FollowUpPrompt, McpToolResult, ToolDefinition };
export type { ThemeMode, ThemeColors, ThemeOptions, ResolvedColors };
