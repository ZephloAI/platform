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
  type ChatResponse,
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
  /** Set on assistant bubbles whose content streams in token-by-token. */
  streamId?: string;
}

export type CoreEvent =
  | { type: "configLoaded" }
  | { type: "statusChanged"; status: ConnectionStatus }
  | { type: "messageAdded"; message: Message }
  | { type: "messagesReset" }
  | { type: "loading"; loading: boolean }
  | { type: "status"; label: string } // live progress while the agent works
  | { type: "waiting" } // "Message sent" indicator
  | { type: "personModeChanged" }
  | { type: "adminMessage"; content: string }
  | { type: "navigate"; url?: string }
  | { type: "mcpResults"; results: McpToolResult[] }
  | { type: "themeChanged"; colors: ResolvedColors }
  | { type: "triggerOpen" }
  | { type: "triggerToast"; content: string }
  // Streaming: a token chunk arrived for an in-flight assistant bubble.
  | { type: "messageDelta"; streamId: string; fullContent: string; message: Message }
  // Streaming: the bubble finished streaming and content is final.
  | { type: "messageFinalized"; streamId: string; message: Message }
  // Final response envelope arrived — sources/follow-ups/audio latched onto
  // the streamed bubble instead of creating a new one.
  | { type: "messageMetadata"; message: Message }
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

  // Transient dedup set. The server attaches a content hash to every
  // assistant response; we drop a repeat occurrence so the same turn never
  // renders twice (retries, races between FAB + inline views). Not persisted.
  private seenMessageIds: Set<string> = new Set();

  // The in-flight streamed assistant bubble, if any. Tokens arrive as
  // `delta` events and append to `msg.content`; cleared on `end`.
  private currentStream: { streamId: string; msg: Message } | null = null;

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

    this.chatSocket.onStatus((label) => {
      this.emit({ type: "status", label });
    });

    // Streaming: the agent opens a bubble (start), pushes token deltas, and
    // closes it (end). One bubble per stream; a tool call between deltas
    // closes the lead-in bubble and the answer arrives in a new stream.
    this.chatSocket.onStreamEvent((ev) => {
      if (ev.kind === "start") {
        const msg: Message = { role: "assistant", content: "", streamId: ev.streamId };
        this.messages.push(msg);
        this.currentStream = { streamId: ev.streamId, msg };
        this.emit({ type: "messageAdded", message: msg });
      } else if (ev.kind === "delta") {
        if (!this.currentStream || this.currentStream.streamId !== ev.streamId) return;
        this.currentStream.msg.content += ev.delta;
        this.emit({
          type: "messageDelta",
          streamId: ev.streamId,
          fullContent: this.currentStream.msg.content,
          message: this.currentStream.msg,
        });
      } else {
        // end
        const finished = this.currentStream;
        this.currentStream = null;
        if (!finished || finished.streamId !== ev.streamId) return;
        this.saveMessages();
        this.emit({ type: "messageFinalized", streamId: ev.streamId, message: finished.msg });
      }
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

  /**
   * Returns true if a server-provided message_id is new and the assistant
   * message should be rendered. Returns false if we've already accepted this
   * id (drop the dupe). Missing ids pass through — older agents without the
   * hash field still work.
   */
  private shouldAccept(messageId: string | undefined): boolean {
    if (!messageId) return true;
    if (this.seenMessageIds.has(messageId)) return false;
    this.seenMessageIds.add(messageId);
    return true;
  }

  /**
   * Finalize an assistant response envelope: if the streamed bubble is still
   * here (matched by stream_id), latch metadata onto it; otherwise fall back
   * to pushing a full new bubble (handles dropped streams).
   */
  private finalizeAssistantResponse(data: ChatResponse): Message {
    const existing = data.stream_id
      ? [...this.messages].reverse().find((m) => m.streamId === data.stream_id)
      : undefined;
    if (existing) {
      // Backfill content if the stream's deltas never landed (dropped frames,
      // a competing stream stomping currentStream). The envelope carries the
      // full text, so the bubble must never stay empty when we have it.
      if (!existing.content && data.response) {
        existing.content = data.response;
        this.emit({ type: "messageFinalized", streamId: existing.streamId!, message: existing });
      }
      existing.sources = data.sources;
      existing.followUpPrompts = data.follow_up_prompts;
      existing.audio = data.audio || null;
      this.saveMessages();
      this.emit({ type: "messageMetadata", message: existing });
      return existing;
    }
    const msg: Message = {
      role: "assistant",
      content: data.response,
      sources: data.sources,
      followUpPrompts: data.follow_up_prompts,
      audio: data.audio || null,
    };
    this.messages.push(msg);
    this.saveMessages();
    this.emit({ type: "messageAdded", message: msg });
    return msg;
  }

  /** Send a user message and wait for assistant response. */
  async sendMessage(text: string, options: { voice?: boolean } = {}): Promise<void> {
    if (!text.trim() || this.isLoading) return;

    // Claim the loading lock BEFORE the first await: two same-tick calls
    // (double-bound listener, rapid double-click) would otherwise both pass
    // the guard above and send the message twice.
    this.isLoading = true;
    this.emit({ type: "loading", loading: true });

    try {
      await this.ensureSession();
      if (!this.chatSocket) {
        this.emit({ type: "error", message: "Unable to connect. Please try again." });
        return;
      }

      const userMsg: Message = { role: "user", content: text };
      this.messages.push(userMsg);
      this.saveMessages();
      this.emit({ type: "messageAdded", message: userMsg });

      const data = await this.chatSocket.sendMessage(text, options.voice);
      this.sessionRetried = false;

      if (this.shouldAccept(data.message_id)) {
        this.finalizeAssistantResponse(data);
      }
    } catch (err) {
      // Retry once with a fresh session (handles stale sessions)
      if (!this.sessionRetried) {
        this.sessionRetried = true;
        if (await this.resetSession()) {
          try {
            const data = await this.chatSocket!.sendMessage(text, options.voice);
            this.sessionRetried = false;
            if (this.shouldAccept(data.message_id)) {
              this.finalizeAssistantResponse(data);
            }
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
    this.seenMessageIds.clear();
    this.currentStream = null;
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
   * Fire a manual agent trigger.
   *
   * - mode "open": the agent's response is pushed into chat history and
   *   the FAB panel auto-expands.
   * - mode "prompt" (default): the response shows as a clickable toast
   *   above the FAB; it's only committed to chat history if the user
   *   clicks the toast.
   *
   * Cooldown:
   *   null            -> always fire (default)
   *   "session"       -> once per browser tab/session
   *   "once"          -> once forever per device
   *   { minutes: N }  -> at most every N minutes
   *
   * Returns { fired: false } when the cooldown blocked the call.
   */
  async trigger(
    id: string,
    prompt: string,
    options: {
      mode?: "open" | "prompt";
      cooldown?: storage.CooldownPolicy;
      pageContext?: Record<string, unknown>;
    } = {},
  ): Promise<{ fired: boolean }> {
    const mode = options.mode ?? "prompt";
    const cooldown = options.cooldown ?? null;

    if (!storage.shouldFire(id, cooldown)) return { fired: false };

    await this.ensureSession();
    if (!this.chatSocket) {
      this.emit({ type: "error", message: "Unable to connect. Please try again." });
      return { fired: false };
    }

    // ensureSession() kicks off connect() fire-and-forget. Await it here so
    // the WS is OPEN before sendTrigger runs — otherwise sendTrigger sees a
    // CONNECTING socket, opens a duplicate, and the orphan's close handler
    // can reject the pending promise.
    try {
      await this.chatSocket.connect();
    } catch (err) {
      this.emit({
        type: "error",
        message: err instanceof Error ? err.message : "Connection failed.",
      });
      return { fired: false };
    }

    // Record BEFORE awaiting so a slow agent reply can't let a second call
    // sneak through under "once"/"session" policies.
    storage.recordFire(id, cooldown);

    try {
      const data = await this.chatSocket.sendTrigger(id, prompt, mode, options.pageContext);

      // Trigger replies always join history regardless of mode. The toast is
      // a nudge for prompt-mode but no longer gates whether the message lives
      // in the conversation.
      if (this.shouldAccept(data.message_id)) {
        this.finalizeAssistantResponse(data);
      }

      if (mode === "open") {
        this.emit({ type: "triggerOpen" });
      } else {
        this.emit({ type: "triggerToast", content: data.response });
      }

      return { fired: true };
    } catch (err) {
      this.emit({
        type: "error",
        message: err instanceof Error ? err.message : "Trigger failed.",
      });
      return { fired: false };
    }
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
