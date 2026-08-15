/**
 * Chatbot Widget - Embeddable Web Component
 *
 * Usage: Add this single script tag to any page:
 *
 *   <script
 *     src="https://your-domain.com/widget/chatbot-widget.js"
 *     data-chatbot-id="123"
 *   ></script>
 *
 * The widget automatically fetches its configuration (name, icon,
 * welcome message, position) from the API. Users customize these
 * settings from the dashboard.
 */

import { ChatSocket, fetchConfig, createSession, setApiKey, type ChatSource, type FollowUpPrompt, type McpToolResult, type ConnectionStatus, type WidgetConfig } from "./api";
import { toolRegistry, type ToolDefinition } from "./webmcp";
import { FormScanner } from "./form-scanner";
import { WIDGET_STYLES } from "./styles";
import * as storage from "./storage";
import { zephloCore, type CoreEvent, type Message as CoreMessage } from "./zephlo-core";
import { COLOR_TO_CSS_VAR, type ResolvedColors } from "./theme";
import { ICON_CHAT, ICON_CLOSE, ICON_SEND, ICON_BOT, ICON_NEW_CHAT, ICON_MIC, ICON_STOP, ICON_SPEAKER, ICON_KEYBOARD, ICON_SIDEBAR_LEFT_HIDE, ICON_SIDEBAR_RIGHT_HIDE, ICON_PERSON } from "./icons";

const SIDEBAR_WIDTH = 300;

// ---- Types ----

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  followUpPrompts?: FollowUpPrompt[];
  audio?: string | null;
  isAdminMessage?: boolean;
  /** Present on assistant bubbles that stream in token-by-token. */
  streamId?: string;
}

interface WidgetState {
  chatbotId: string;
  apiUrl: string;
  title: string;
  icon: string;
  welcome: string;
  position: "left" | "right" | "left-sidebar" | "right-sidebar";
  quickPrompts: { title: string; link?: string; prompt?: string }[];
  logoUrl: string | null;
  width: number;
  height: number;
  fontFamily: string;
  fontSize: number;
  greetingPrompts: { title: string; prompt: string }[];
  greetingPromptDuration: number;
  voiceEnabled: boolean;
  isActive: boolean;
}

// ---- Helper: detect initial config from the <script> tag ----

const DEFAULT_API_URL = "https://app.zephlo.ai";

function getScriptConfig(): { chatbotId: string; apiUrl: string } {
  const scripts = document.querySelectorAll("script[data-chatbot-id]");
  const el = scripts[scripts.length - 1] as HTMLScriptElement | null;

  const chatbotId = el?.dataset.chatbotId || "";
  const apiUrl = (window as any).FLAPI || DEFAULT_API_URL;

  return { chatbotId, apiUrl };
}

// ---- Web Component ----

export class ChatbotWidget extends HTMLElement {
  private shadow: ShadowRoot;
  protected state!: WidgetState;
  protected isOpen = false;

  // DOM references
  protected panel!: HTMLDivElement;
  protected toggleBtn!: HTMLButtonElement;
  protected messagesEl!: HTMLDivElement;
  protected textarea!: HTMLTextAreaElement;
  protected sendBtn!: HTMLButtonElement;
  protected newChatBtn!: HTMLButtonElement;
  private hostStyleEl: HTMLStyleElement | null = null;
  protected greetingsEl: HTMLDivElement | null = null;
  private greetingsDismissed = false;
  private greetingsTimer: ReturnType<typeof setTimeout> | null = null;
  // bindEvents() runs once per render (twice when the config re-render kicks
  // in); the shadow-root delegated click listener must only attach once.
  private shadowClickBound = false;
  private triggerToastEl: HTMLDivElement | null = null;
  private triggerToastTimer: ReturnType<typeof setTimeout> | null = null;
  private static TRIGGER_TOAST_DURATION_MS = 15000;
  protected micBtn: HTMLButtonElement | null = null;
  private isRecording = false;
  private recognition: any = null;  // SpeechRecognition instance
  private audioMap: Map<number, string> = new Map();
  private currentAudio: HTMLAudioElement | null = null;
  protected isMinimized = false;
  private voiceMode = false;
  private voiceMicBtn: HTMLButtonElement | null = null;
  private voiceOverlay: HTMLDivElement | null = null;
  private voiceStatusEl: HTMLDivElement | null = null;

  // Unsubscribe from core events
  protected coreUnsubscribe: (() => void) | null = null;
  // Flag: is this an inline view? (set by ZephloChat subclass)
  protected isInline = false;

  // ---- Shared state proxies (read/write through zephloCore) ----
  protected get messages(): Message[] { return zephloCore.messages as Message[]; }
  protected set messages(v: Message[]) { zephloCore.messages = v as any; }
  protected get isLoading(): boolean { return zephloCore.isLoading; }
  protected set isLoading(v: boolean) { zephloCore.isLoading = v; }
  protected get personMode(): boolean { return zephloCore.personMode; }
  protected set personMode(v: boolean) { zephloCore.personMode = v; }
  protected get sessionId(): string | null { return zephloCore.sessionId; }
  protected set sessionId(v: string | null) { zephloCore.sessionId = v; }
  protected get chatSocket() { return zephloCore.chatSocket; }
  protected set chatSocket(v: any) { zephloCore.chatSocket = v; }

  // Retry guard (only used by this view's send methods — core has its own)
  private sessionRetried = false;
  // MCP result listeners (SDK-level, registered via core)
  private mcpGlobalListeners: ((results: McpToolResult[]) => void)[] = [];
  private mcpUnsubscribe: (() => void) | null = null;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  async connectedCallback() {
    // Backwards-compat: if a `<script data-chatbot-id>` tag is present, use
    // that config. Otherwise wait for `Zephlo.initialize()` to be called.
    //
    // This is important because custom element upgrade happens during
    // `customElements.define()` inside zephlo.js — which runs BEFORE the
    // inline `<script>` that calls `Zephlo.initialize()`. Without this wait,
    // the view would capture the default (production) apiUrl into its state.
    if (!zephloCore.chatbotId) {
      const scriptConfig = getScriptConfig();
      const chatbotId = this.sdkChatbotId || scriptConfig.chatbotId;
      if (chatbotId) {
        zephloCore.chatbotId = chatbotId;
        zephloCore.apiUrl = scriptConfig.apiUrl;
      } else {
        // No script-tag init — wait for Zephlo.initialize() to run.
        await zephloCore.waitForConfiguration();
      }
    }

    // Start with defaults
    this.state = {
      chatbotId: zephloCore.chatbotId,
      apiUrl: zephloCore.apiUrl,
      title: "Chat Assistant",
      icon: "",
      welcome: "Hi! How can I help you today?",
      position: "right",
      quickPrompts: [],
      logoUrl: null,
      width: 380,
      height: 520,
      fontFamily: "",
      fontSize: 14,
      greetingPrompts: [],
      greetingPromptDuration: 0,
      voiceEnabled: false,
      isActive: true,
    };

    // Subscribe to core events so this view stays in sync with state changes
    // from other views sharing the same core.
    this.coreUnsubscribe = zephloCore.subscribe((ev) => this.onCoreEvent(ev));

    // Paint immediately with defaults so the widget appears instantly — the
    // config fetch below is kept OFF the critical rendering path. Without this
    // the panel would stay blank for the whole config round-trip.
    this.render();
    this.bindEvents();
    this.restoreMessages();

    // Auto-scan HTML forms with zephlo-tool-name attributes
    const formScanner = new FormScanner();
    formScanner.scan();
    formScanner.observe();

    // Fetch widget config via core (cached for all views), then re-render with
    // the real settings. Bounded by a timeout in fetchConfig(), so a slow or
    // misconfigured API host can never stall this.
    const config = await zephloCore.loadConfig();
    if (config) {
      this.applyConfig(config);

      // Hide widget entirely if inactive.
      if (!this.state.isActive) {
        this.style.display = 'none';
        return;
      }

      // Re-render with the loaded config (title, prompts, dimensions, theme…).
      this.render();
      this.bindEvents();
      this.restoreMessages();
    }

    // Reconnect WS only for returning visitors with an existing session.
    // New visitors stay session-less until they send their first message,
    // so empty conversations don't appear on the operator dashboard.
    zephloCore.resumeSessionIfExists();

    if (!this.isInline && this.state.position.includes('sidebar')) {
      this.injectHostTransition();
    }

    // Auto-open after agent-driven navigation. The previous page set this
    // flag right before calling window.location.assign(url). Only FAB views
    // consume the flag — inline views are always visible, and if we let
    // them clear it the FAB on the same page would never see it.
    if (!this.isInline) {
      try {
        const autoOpenKey = `cb_auto_open_${this.state.chatbotId}`;
        if (storage.getItem(autoOpenKey)) {
          storage.removeItem(autoOpenKey);
          if (!this.isOpen) this.toggle();
        }
      } catch { /* ignore */ }

      // Host page asked for the panel to start expanded: `<zephlo-fab open>`.
      if (this.hasAttribute("open") && !this.isOpen) this.toggle();
    }
  }

  /** Map server widget config onto this view's render state. */
  private applyConfig(config: WidgetConfig) {
    this.state.title = config.name || this.state.title;
    this.state.icon = config.widget_icon || "";
    this.state.welcome = config.widget_welcome || this.state.welcome;
    const pos = config.widget_position;
    this.state.position =
      (pos === "left" || pos === "left-sidebar" || pos === "right-sidebar") ? pos : "right";
    this.state.quickPrompts = config.quick_prompts || [];
    this.state.logoUrl = config.widget_logo_url || null;
    this.state.width = config.widget_width || 380;
    this.state.height = config.widget_height || 520;
    this.state.fontFamily = config.widget_font_family || "";
    this.state.fontSize = config.widget_font_size || 14;
    this.state.greetingPrompts = config.greeting_prompts || [];
    this.state.greetingPromptDuration = config.greeting_prompt_duration || 0;
    this.state.voiceEnabled = config.voice_enabled || false;
    this.state.isActive = (config as any).is_active !== false;
  }

  /** React to core state changes coming from other views or the server. */
  protected onCoreEvent(ev: CoreEvent) {
    switch (ev.type) {
      case "messageAdded":
        // Voice mode handles assistant replies specially (TTS playback + mic restart).
        // Streamed bubbles (still in flight) skip the voice path — TTS plays once
        // on the finalized response envelope, not on the empty start frame.
        if (this.voiceMode && ev.message.role === "assistant" && !ev.message.streamId) {
          this.handleVoiceAssistantReply(ev.message);
        } else {
          this.appendMessage(ev.message);
        }
        break;
      case "messageDelta":
        this.setStreamedContent(ev.streamId, ev.fullContent);
        this.scrollToBottom();
        break;
      case "messageFinalized":
        this.finalizeStreamedContent(ev.streamId, ev.message.content);
        break;
      case "messageMetadata":
        this.attachMetadataToStreamedBubble(ev.message);
        if (this.voiceMode) this.handleVoiceAssistantReply(ev.message);
        break;
      case "messagesReset":
        this.renderEmptyState();
        break;
      case "loading":
        this.updateLoadingUi(ev.loading);
        break;
      case "status":
        this.updateStatusLine(ev.label);
        break;
      case "statusChanged":
        this.updateStatusDot(ev.status);
        break;
      case "personModeChanged":
        this.updateHeaderForMode();
        this.updateInputPlaceholder();
        break;
      case "waiting":
        this.showWaitingStatus();
        break;
      case "navigate":
        if (ev.url) {
          // Persist the auto-open flag so the new page's FAB re-opens after
          // navigation, then take the visitor to the URL on the host page.
          try {
            storage.setItem(`cb_auto_open_${this.state.chatbotId}`, "1");
          } catch { /* ignore */ }
          window.location.assign(ev.url);
        }
        // No URL = on-page action by a host-registered tool. Leave the chat
        // alone — collapsing it here hides messages and slides the input to
        // the top of the panel, which feels like the widget broke.
        break;
      case "triggerOpen":
        // Manual trigger in "open" mode — expand the FAB panel if collapsed.
        // Inline views are already visible so this is a no-op for them.
        if (!this.isInline && !this.isOpen) this.toggle();
        break;
      case "triggerToast":
        // Manual trigger in "prompt" mode — show a clickable bubble next to
        // the FAB. Inline views already render the message in-thread so they
        // skip the toast entirely.
        if (!this.isInline && !this.isOpen) this.showTriggerToast(ev.content);
        break;
      case "mcpResults":
        // Dispatch CustomEvent that crosses Shadow DOM for external listeners
        this.dispatchEvent(new CustomEvent("mcp-result", {
          bubbles: true,
          composed: true,
          detail: { results: ev.results },
        }));
        break;
      case "themeChanged":
        this.applyTheme(ev.colors);
        break;
      case "error":
        this.showError(ev.message);
        break;
    }
  }

  private updateLoadingUi(loading: boolean) {
    if (loading) {
      // Show typing indicator if not already shown
      if (!this.messagesEl?.querySelector('.cb-typing')) {
        this.showTyping();
      }
      if (this.sendBtn) this.sendBtn.disabled = true;
    } else {
      // Remove any typing indicators
      this.shadow.querySelectorAll('.cb-typing').forEach((el) => el.remove());
      if (this.sendBtn && this.textarea) {
        this.sendBtn.disabled = this.textarea.value.trim().length === 0;
      }
    }
  }

  private showWaitingStatus() {
    if (!this.messagesEl) return;
    const statusDiv = document.createElement("div");
    statusDiv.className = "cb-message-status";
    statusDiv.textContent = "Message sent";
    this.messagesEl.appendChild(statusDiv);
    this.scrollToBottom();
  }

  private renderEmptyState() {
    if (!this.messagesEl) return;
    const { title, welcome, logoUrl } = this.state;
    const welcomeIcon = logoUrl
      ? `<img src="${this.escapeHtml(logoUrl)}" alt="" class="cb-welcome-logo">`
      : `<span class="cb-welcome-chat-icon">${ICON_CHAT}</span>`;
    this.messagesEl.innerHTML = `
      <div class="cb-welcome">
        <div class="cb-welcome-icon">${welcomeIcon}</div>
        <h3>${this.escapeHtml(title)}</h3>
        <p>${this.escapeHtml(welcome)}</p>
      </div>
    `;
    // Show input prompts again
    const inputPrompts = this.shadow.querySelector('.cb-input-prompts') as HTMLElement | null;
    if (inputPrompts) inputPrompts.style.display = '';
  }

  /** Build the HTML for a single chat panel */
  private renderPanelHtml(extraClasses: string): string {
    const { title, welcome, logoUrl } = this.state;

    const avatarContent = logoUrl
      ? `<img src="${this.escapeHtml(logoUrl)}" alt="" class="cb-avatar-img">`
      : ICON_CHAT;

    const welcomeIcon = logoUrl
      ? `<img src="${this.escapeHtml(logoUrl)}" alt="" class="cb-welcome-logo">`
      : `<span class="cb-welcome-chat-icon">${ICON_CHAT}</span>`;

    return `
      <div class="cb-panel ${extraClasses}" role="dialog" aria-label="Chat widget">
        <div class="cb-header">
          <div class="cb-header-avatar">${avatarContent}</div>
          <div class="cb-header-info">
            <div class="cb-header-title">${this.escapeHtml(title)}</div>
            <div class="cb-header-subtitle">
              <span class="cb-status-dot disconnected"></span>
              Ask me anything
            </div>
          </div>
          <button class="cb-new-chat-btn" aria-label="New conversation" title="New conversation">
            ${ICON_NEW_CHAT}
          </button>
          <button class="cb-close-btn" aria-label="Close chat">
            ${ICON_CLOSE}
          </button>
        </div>
        <div class="cb-messages">
          <div class="cb-welcome">
            <div class="cb-welcome-icon">${welcomeIcon}</div>
            <h3>${this.escapeHtml(title)}</h3>
            <p>${this.escapeHtml(welcome)}</p>
          </div>
        </div>
        <div class="cb-input-prompts">
          ${this.renderQuickPrompts()}
        </div>
        <div class="cb-input-area">
          <div class="cb-input-row">
            <textarea rows="1" placeholder="Type a message..." aria-label="Chat message"></textarea>
            <button class="cb-send-btn" aria-label="Send message" disabled>${ICON_SEND}</button>
          </div>
          ${this.state.voiceEnabled && this.hasSpeechRecognition() ? `<button class="cb-mic-btn" aria-label="Voice mode">${ICON_MIC}</button>` : ''}
        </div>
        <div class="cb-footer">
          Powered by <a href="https://zephlo.ai" target="_blank" rel="noopener noreferrer">Zephlo</a>
        </div>
      </div>
    `;
  }

  /**
   * CSS overrides for non-color styling (font + panel dimensions). Color
   * variables are applied separately by applyTheme() so they can be updated
   * at runtime without re-rendering.
   */
  protected buildCustomStyles(): string {
    const fontStack = this.state.fontFamily
      ? `"${this.state.fontFamily}", -apple-system, BlinkMacSystemFont, sans-serif`
      : '';
    return `
      :host {
        --cb-panel-width: ${this.state.width}px;
        --cb-panel-height: ${this.state.height}px;
        --cb-font-size: ${this.state.fontSize}px;
        ${fontStack ? `--cb-font: ${fontStack};` : ''}
      }
    `;
  }

  /** Apply the active theme's colors as CSS vars on the host element. */
  protected applyTheme(colors: ResolvedColors): void {
    for (const [key, cssVar] of Object.entries(COLOR_TO_CSS_VAR)) {
      this.style.setProperty(cssVar, colors[key as keyof ResolvedColors]);
    }
    // Hover state shares the accent color today.
    this.style.setProperty('--cb-accent-hover', colors.headerColor);
  }

  /** Load a Google font if a custom family is configured. */
  protected loadCustomFont(): void {
    if (!this.state.fontFamily) return;
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(this.state.fontFamily)}:wght@400;500;600&display=swap`;
    this.shadow.appendChild(fontLink);
  }

  protected render() {
    const { position, logoUrl } = this.state;

    // render() can run twice (defaults first, then real config) — clear any
    // pending greeting timer so we don't leak one on the second pass.
    if (this.greetingsTimer) {
      clearTimeout(this.greetingsTimer);
      this.greetingsTimer = null;
    }

    this.loadCustomFont();

    // Position override (left-side placement)
    const isLeftSide = position === "left" || position === "left-sidebar";
    const posStyles = isLeftSide
      ? `
        :host { left: 20px; right: auto; }
        .cb-panel { left: 0; right: auto; }
        .cb-toggle { left: 0; right: auto; }
        .cb-greeting-bubbles { left: 0; right: auto; align-items: flex-start; }
      `
      : "";

    // Toggle button content
    const toggleContent = logoUrl
      ? `<img src="${this.escapeHtml(logoUrl)}" alt="" class="cb-toggle-logo">`
      : `<span class="cb-icon-chat">${ICON_CHAT}</span>`;

    const fabToggle = `
      <button class="cb-toggle${logoUrl ? ' has-logo' : ''}${position.includes('sidebar') ? ' sidebar-toggle' : ''}" aria-label="Open chat">
        ${toggleContent}
        <span class="cb-icon-close">${position === 'left-sidebar' ? ICON_SIDEBAR_LEFT_HIDE : position === 'right-sidebar' ? ICON_SIDEBAR_RIGHT_HIDE : ICON_CLOSE}</span>
      </button>
    `;

    const greetingBubbles = `
      <div class="cb-greeting-bubbles" style="display:none">
        ${this.state.greetingPrompts.map((gp, i) =>
          `<div class="cb-greeting-bubble" data-greeting-index="${i}">${this.escapeHtml(gp.title)}</div>`
        ).join('')}
      </div>
    `;

    const sidebarClass = position.includes('sidebar')
      ? ` sidebar sidebar-${position === 'left-sidebar' ? 'left' : 'right'}`
      : '';

    this.shadow.innerHTML = `
      <style>${WIDGET_STYLES}${posStyles}${this.buildCustomStyles()}</style>
      ${this.renderPanelHtml(sidebarClass.trim())}
      ${greetingBubbles}
      ${fabToggle}
    `;

    this.applyTheme(zephloCore.getResolvedColors());

    // Cache DOM refs
    this.panel = this.shadow.querySelector(".cb-panel")!;
    this.toggleBtn = this.shadow.querySelector(".cb-toggle")!;
    this.messagesEl = this.shadow.querySelector(".cb-messages")!;
    this.textarea = this.shadow.querySelector("textarea")!;
    this.sendBtn = this.shadow.querySelector(".cb-send-btn")!;
    this.newChatBtn = this.shadow.querySelector(".cb-new-chat-btn")!;
    this.greetingsEl = this.shadow.querySelector(".cb-greeting-bubbles");
    this.micBtn = this.shadow.querySelector(".cb-mic-btn");

    // Bind close buttons -- in "both" mode, only the FAB panel has a close button (inline hides it via CSS)
    this.shadow.querySelectorAll('.cb-close-btn').forEach(btn =>
      btn.addEventListener('click', () => this.toggle())
    );

    // Show greeting bubbles on initial load
    if (this.state.greetingPrompts.length > 0 && this.greetingsEl) {
      this.greetingsEl.style.display = '';
      // Start auto-hide timer if duration is set
      if (this.state.greetingPromptDuration > 0) {
        this.greetingsTimer = setTimeout(() => {
          if (this.greetingsEl && !this.greetingsDismissed) {
            this.greetingsEl.classList.add('hidden');
            setTimeout(() => {
              if (this.greetingsEl?.classList.contains('hidden')) {
                this.greetingsEl.style.display = 'none';
              }
            }, 400);
          }
          this.greetingsTimer = null;
        }, this.state.greetingPromptDuration * 1000);
      }
    }
  }

  /** Helper: bind textarea + send button events on a panel */
  private bindPanelInput(textarea: HTMLTextAreaElement, sendBtn: HTMLButtonElement, micBtn: HTMLButtonElement | null) {
    sendBtn.addEventListener("click", () => this.sendFrom(textarea, sendBtn, micBtn));
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendFrom(textarea, sendBtn, micBtn);
      }
    });
    textarea.addEventListener("input", () => {
      sendBtn.disabled = textarea.value.trim().length === 0 || this.isLoading;
      this.autoResizeTextarea(textarea);
      if (micBtn) {
        micBtn.classList.toggle('cb-mic-hidden', textarea.value.trim().length > 0);
      }
    });
    if (micBtn) {
      micBtn.addEventListener("click", () => this.enterVoiceMode());
    }
  }

  private bindEvents() {
    // Toggle button (fab and both modes only)
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener("click", () => this.toggle());

      // Show greeting bubbles on toggle hover
      if (this.state.greetingPrompts.length > 0) {
        const showGreetings = () => {
          if (!this.isOpen && !this.greetingsDismissed && this.greetingsEl) {
            this.greetingsEl.style.display = '';
            void this.greetingsEl.offsetHeight;
            this.greetingsEl.classList.remove('hidden');
          }
        };

        const hideGreetings = () => {
          if (this.greetingsEl && !this.greetingsDismissed) {
            this.greetingsEl.classList.add('hidden');
            setTimeout(() => {
              if (this.greetingsEl?.classList.contains('hidden')) {
                this.greetingsEl.style.display = 'none';
              }
            }, 400);
          }
        };

        this.toggleBtn.addEventListener("mouseenter", showGreetings);
        this.toggleBtn.addEventListener("mouseleave", (e) => {
          const related = e.relatedTarget as HTMLElement | null;
          if (this.greetingsEl?.contains(related)) return;
          hideGreetings();
        });

        if (this.greetingsEl) {
          this.greetingsEl.addEventListener("mouseenter", showGreetings);
          this.greetingsEl.addEventListener("mouseleave", hideGreetings);
        }
      }
    }

    this.bindPanelInput(this.textarea, this.sendBtn, this.micBtn);
    this.newChatBtn.addEventListener("click", () => this.startNewChat());

    // Tap input area to restore from minimized state
    this.shadow.querySelectorAll('.cb-input-area').forEach(inputArea => {
      inputArea.addEventListener('click', () => {
        if (this.isMinimized) this.restore();
      });
    });

    // Button clicks (event delegation on shadow root). The shadow root
    // SURVIVES re-renders — bindEvents() runs again after the config loads,
    // so guard against attaching this listener twice (a duplicate would
    // double-fire every delegated action, including prompt sends).
    if (this.shadowClickBound) return;
    this.shadowClickBound = true;
    this.shadow.addEventListener("click", (e) => {
      // Speaker button clicks (audio replay)
      const speakerBtn = (e.target as HTMLElement).closest(".cb-speaker-btn") as HTMLElement | null;
      if (speakerBtn) {
        const audioIndex = Number(speakerBtn.dataset.audioIndex);
        const audioData = this.audioMap.get(audioIndex);
        if (audioData) {
          this.playAudio(audioData, audioIndex);
        }
        return;
      }

      // Greeting bubble clicks
      const greetingBtn = (e.target as HTMLElement).closest(".cb-greeting-bubble") as HTMLElement | null;
      if (greetingBtn) {
        const index = Number(greetingBtn.dataset.greetingIndex);
        const gp = this.state.greetingPrompts[index];
        if (!gp) return;
        this.dismissGreetings();
        if (!this.isOpen) this.toggle();
        zephloCore.sendMessage(gp.prompt);
        return;
      }

      // Follow-up prompt button clicks
      const fuBtn = (e.target as HTMLElement).closest(".cb-follow-up") as HTMLElement | null;
      if (fuBtn) {
        const msgIndex = Number(fuBtn.dataset.msgIndex);
        const fuIndex = Number(fuBtn.dataset.fuIndex);
        const msg = this.messages[msgIndex];
        if (!msg?.followUpPrompts) return;
        const fp = msg.followUpPrompts[fuIndex];
        if (!fp) return;

        // Remove the prompt row (buttons disappear)
        const promptRow = fuBtn.closest(".cb-prompt-row");
        if (promptRow) promptRow.remove();

        // Handle switch to person mode
        if (fp.prompt === "__switch_to_person__") {
          zephloCore.switchToPerson();
          return;
        }

        if (fp.link) {
          window.open(fp.link, "_blank", "noopener");
        }
        if (fp.prompt) {
          zephloCore.sendMessage(fp.prompt);
        }
        return;
      }

      // Quick prompt button clicks
      const btn = (e.target as HTMLElement).closest(".cb-quick-prompt") as HTMLElement | null;
      if (!btn) return;
      const index = Number(btn.dataset.qpIndex);
      const qp = this.state.quickPrompts[index];
      if (!qp) return;

      const promptRow = btn.closest(".cb-prompt-row");
      if (promptRow) promptRow.remove();

      if (qp.link) {
        window.open(qp.link, "_blank", "noopener");
      }
      if (qp.prompt) {
        zephloCore.sendMessage(qp.prompt);
      }
    });
  }

  protected toggle() {
    if (this.isInline) return; // inline views have no toggle
    this.isOpen = !this.isOpen;

    // Dismiss greeting bubbles + any trigger toast when opening chat. The
    // trigger message is already in history, so opening from the FAB simply
    // hides the nudge.
    if (this.isOpen) {
      this.dismissGreetings();
      this.hideTriggerToast();
    }

    // Stop voice/audio and restore minimized state when closing
    if (!this.isOpen) {
      if (this.isMinimized) this.restore();
      if (this.voiceMode) {
        this.exitVoiceMode();
      } else if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }
    }

    // In "both" mode, only toggle the FAB panel -- inline stays open
    this.panel.classList.toggle("open", this.isOpen);
    if (this.toggleBtn) {
      this.toggleBtn.classList.toggle("open", this.isOpen);
      this.toggleBtn.setAttribute(
        "aria-label",
        this.isOpen ? "Close chat" : "Open chat",
      );
    }

    // Push page content for sidebar mode (skip on mobile — always overlay)
    const isSidebar = this.state.position.includes('sidebar');
    if (isSidebar && !this.isMobile()) {
      const side = this.state.position === 'left-sidebar' ? 'marginLeft' : 'marginRight';
      document.body.style[side] = this.isOpen ? `${SIDEBAR_WIDTH}px` : '';
    }

    if (this.isOpen) {
      setTimeout(() => this.textarea.focus(), 300);
    }
  }

  private isMobile(): boolean {
    return window.innerWidth <= 440;
  }

  private minimize() {
    this.isMinimized = true;
    this.panel.classList.add('minimized');
  }

  private restore() {
    this.isMinimized = false;
    this.panel.classList.remove('minimized');
    setTimeout(() => this.textarea.focus(), 100);
  }

  private injectHostTransition() {
    if (this.hostStyleEl) return;
    this.hostStyleEl = document.createElement('style');
    this.hostStyleEl.id = 'cb-sidebar-transition';
    this.hostStyleEl.textContent = `
      body { transition: margin 0.3s cubic-bezier(0.25, 0.1, 0.25, 1); }
    `;
    document.head.appendChild(this.hostStyleEl);
  }

  private dismissGreetings() {
    this.greetingsDismissed = true;
    if (this.greetingsEl) {
      this.greetingsEl.classList.add('hidden');
      // Remove from DOM after fade-out animation
      setTimeout(() => {
        if (this.greetingsEl) this.greetingsEl.style.display = 'none';
      }, 400);
    }
    if (this.greetingsTimer) {
      clearTimeout(this.greetingsTimer);
      this.greetingsTimer = null;
    }
  }

  /**
   * Show a prompt-mode trigger message as a clickable bubble above the FAB.
   * Click the bubble → open the chat. Close button → dismiss. Auto-dismisses
   * after TRIGGER_TOAST_DURATION_MS unless the user is hovering it.
   */
  private showTriggerToast(content: string) {
    // Reset any existing toast so a second trigger replaces the first.
    this.hideTriggerToast(true);

    const toast = document.createElement("div");
    toast.className = "cb-trigger-toast";
    // Mirror the greeting-bubbles left/right logic for left-positioned FABs.
    const position = this.state.position;
    if (position.includes("left")) toast.classList.add("left");

    const body = document.createElement("div");
    body.className = "cb-trigger-toast-body";
    body.textContent = content;

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "cb-trigger-toast-close";
    closeBtn.setAttribute("aria-label", "Dismiss");
    closeBtn.textContent = "\u00D7"; // ×

    toast.appendChild(body);
    toast.appendChild(closeBtn);

    // Click the bubble (but not the close button) → hide the nudge and open
    // the chat. The message is already in history regardless of interaction.
    toast.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest(".cb-trigger-toast-close")) return;
      this.hideTriggerToast();
      if (!this.isOpen) this.toggle();
    });

    // Close button → just dismiss the toast. Message stays in history.
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.hideTriggerToast();
    });

    // Pause auto-dismiss while hovered
    toast.addEventListener("mouseenter", () => {
      if (this.triggerToastTimer) {
        clearTimeout(this.triggerToastTimer);
        this.triggerToastTimer = null;
      }
    });
    toast.addEventListener("mouseleave", () => {
      this.scheduleTriggerToastDismiss();
    });

    this.shadow.appendChild(toast);
    this.triggerToastEl = toast;
    this.scheduleTriggerToastDismiss();
  }

  private scheduleTriggerToastDismiss() {
    if (this.triggerToastTimer) clearTimeout(this.triggerToastTimer);
    this.triggerToastTimer = setTimeout(
      () => {
        this.hideTriggerToast();
      },
      ChatbotWidget.TRIGGER_TOAST_DURATION_MS,
    );
  }

  private hideTriggerToast(immediate = false) {
    if (this.triggerToastTimer) {
      clearTimeout(this.triggerToastTimer);
      this.triggerToastTimer = null;
    }
    const el = this.triggerToastEl;
    if (!el) return;
    this.triggerToastEl = null;
    if (immediate) {
      el.remove();
      return;
    }
    el.classList.add("hidden");
    setTimeout(() => el.remove(), 300);
  }

  private updateStatusDot(status: ConnectionStatus) {
    this.shadow.querySelectorAll('.cb-status-dot').forEach(dot => {
      dot.className = `cb-status-dot ${status}`;
    });
  }

  disconnectedCallback() {
    // Unsubscribe from core events — but do NOT close the core's WebSocket
    // since another view may still be connected.
    this.coreUnsubscribe?.();
    this.coreUnsubscribe = null;
    if (this.greetingsTimer) {
      clearTimeout(this.greetingsTimer);
      this.greetingsTimer = null;
    }
    this.hideTriggerToast(true);
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if (this.recognition) {
      this.recognition.abort();
      this.recognition = null;
    }
    this.voiceMode = false;
    this.voiceOverlay = null;
    this.voiceMicBtn = null;
    this.voiceStatusEl = null;
    document.body.style.marginLeft = '';
    document.body.style.marginRight = '';
    this.hostStyleEl?.remove();
    this.hostStyleEl = null;
  }

  private hasSpeechRecognition(): boolean {
    return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
  }

  private toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  private startRecording() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isRecording = true;
      if (this.micBtn) {
        this.micBtn.classList.add('recording');
        this.micBtn.innerHTML = ICON_STOP;
      }
    };

    this.recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      this.textarea.value = transcript;
      this.sendBtn.disabled = transcript.trim().length === 0 || this.isLoading;
      this.autoResize();
    };

    this.recognition.onend = () => {
      this.isRecording = false;
      if (this.micBtn) {
        this.micBtn.classList.remove('recording');
        this.micBtn.innerHTML = ICON_MIC;
      }
      // Auto-send if there's text
      const text = this.textarea.value.trim();
      if (text && !this.isLoading) {
        this.sendVoiceMessage(text);
      }
    };

    this.recognition.onerror = (event: any) => {
      this.isRecording = false;
      if (this.micBtn) {
        this.micBtn.classList.remove('recording');
        this.micBtn.innerHTML = ICON_MIC;
      }
      // Only show errors for actual problems, not normal lifecycle events
      if (event.error === 'not-allowed') {
        this.showError('Microphone permission denied. Please allow microphone access and try again.');
      } else if (event.error === 'network') {
        this.showError('Speech recognition requires an internet connection.');
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        this.showError(`Voice input error: ${event.error}`);
      }
    };

    this.recognition.start();
  }

  private stopRecording() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  private enterVoiceMode() {
    this.voiceMode = true;

    // Shrink panel to compact voice size
    this.panel.classList.add('cb-voice-active');
    if (this.isMobile()) this.panel.classList.add('cb-voice-mobile');

    // Hide normal panel content, show voice overlay
    const header = this.shadow.querySelector('.cb-header') as HTMLElement;
    const messages = this.messagesEl as HTMLElement;
    const inputArea = this.shadow.querySelector('.cb-input-area') as HTMLElement;
    const inputPrompts = this.shadow.querySelector('.cb-input-prompts') as HTMLElement;
    const footer = this.shadow.querySelector('.cb-footer') as HTMLElement;
    if (header) header.style.display = 'none';
    if (messages) messages.style.display = 'none';
    if (inputArea) inputArea.style.display = 'none';
    if (inputPrompts) inputPrompts.style.display = 'none';
    if (footer) footer.style.display = 'none';

    // Create voice overlay — horizontal layout: [back] [status/level meter] [mic]
    const overlay = document.createElement('div');
    overlay.className = 'cb-voice-overlay';
    overlay.innerHTML = `
      <button class="cb-voice-back-btn" aria-label="Back to chat">${ICON_KEYBOARD} Chat</button>
      <div class="cb-voice-status"></div>
      <div class="cb-voice-level-meter">
        <div class="cb-voice-level-bar"></div>
        <div class="cb-voice-level-bar"></div>
        <div class="cb-voice-level-bar"></div>
        <div class="cb-voice-level-bar"></div>
        <div class="cb-voice-level-bar"></div>
      </div>
      <button class="cb-voice-mic-btn" aria-label="Microphone">${ICON_MIC}</button>
    `;
    this.panel.appendChild(overlay);
    this.voiceOverlay = overlay;
    this.voiceStatusEl = overlay.querySelector('.cb-voice-status');
    this.voiceMicBtn = overlay.querySelector('.cb-voice-mic-btn');

    // Bind overlay events
    const backBtn = overlay.querySelector('.cb-voice-back-btn')!;
    backBtn.addEventListener('click', () => this.exitVoiceMode());

    this.voiceMicBtn!.addEventListener('click', () => {
      if (this.currentAudio) {
        // Interrupt playback, start listening
        this.currentAudio.pause();
        this.currentAudio = null;
        this.startVoiceRecognition();
      } else if (!this.isRecording) {
        this.startVoiceRecognition();
      } else {
        this.stopRecording();
      }
    });

    // Start listening immediately
    this.startVoiceRecognition();
  }

  private exitVoiceMode() {
    this.voiceMode = false;

    // Stop audio and recognition
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if (this.recognition) {
      this.recognition.abort();
      this.recognition = null;
    }
    this.isRecording = false;

    // Remove voice overlay and restore panel size
    if (this.voiceOverlay) {
      this.voiceOverlay.remove();
      this.voiceOverlay = null;
    }
    this.voiceMicBtn = null;
    this.voiceStatusEl = null;
    this.panel.classList.remove('cb-voice-active');
    this.panel.classList.remove('cb-voice-mobile');

    // Restore normal panel content
    const header = this.shadow.querySelector('.cb-header') as HTMLElement;
    const messages = this.messagesEl as HTMLElement;
    const inputArea = this.shadow.querySelector('.cb-input-area') as HTMLElement;
    const footer = this.shadow.querySelector('.cb-footer') as HTMLElement;
    if (header) header.style.display = '';
    if (messages) messages.style.display = '';
    if (inputArea) inputArea.style.display = '';
    if (footer) footer.style.display = '';

    // Show input prompts only if no messages exist
    const inputPrompts = this.shadow.querySelector('.cb-input-prompts') as HTMLElement;
    if (inputPrompts) {
      inputPrompts.style.display = this.messages.length > 0 ? 'none' : '';
    }

    // Re-render messages in case new ones were added during voice mode
    this.messagesEl.innerHTML = '';
    if (this.messages.length === 0) {
      const { title, welcome, logoUrl } = this.state;
      const welcomeIcon = logoUrl
        ? `<img src="${this.escapeHtml(logoUrl)}" alt="" class="cb-welcome-logo">`
        : `<span class="cb-welcome-chat-icon">${ICON_CHAT}</span>`;
      this.messagesEl.innerHTML = `
        <div class="cb-welcome">
          <div class="cb-welcome-icon">${welcomeIcon}</div>
          <h3>${this.escapeHtml(title)}</h3>
          <p>${this.escapeHtml(welcome)}</p>
        </div>
      `;
    } else {
      for (const msg of this.messages) {
        this.appendMessage(msg);
      }
    }

    this.scrollToBottom();
  }

  private setVoiceStatus(text: string) {
    if (this.voiceStatusEl) {
      this.voiceStatusEl.textContent = text;
    }
    // Update level meter animation state
    const meter = this.voiceOverlay?.querySelector('.cb-voice-level-meter') as HTMLElement | null;
    if (meter) {
      meter.classList.toggle('active', text === 'Listening...' || text === 'Speaking...');
      meter.classList.toggle('speaking', text === 'Speaking...');
    }
  }

  private startVoiceRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (this.recognition) {
      this.recognition.abort();
      this.recognition = null;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isRecording = true;
      this.setVoiceStatus('Listening...');
      if (this.voiceMicBtn) {
        this.voiceMicBtn.classList.add('recording');
        this.voiceMicBtn.classList.remove('disabled');
      }
    };

    this.recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (transcript.trim()) {
        this.setVoiceStatus('Thinking...');
        if (this.voiceMicBtn) {
          this.voiceMicBtn.classList.remove('recording');
          this.voiceMicBtn.classList.add('disabled');
        }
        this.sendVoiceModeMessage(transcript.trim());
      }
    };

    this.recognition.onend = () => {
      this.isRecording = false;
      if (this.voiceMicBtn) {
        this.voiceMicBtn.classList.remove('recording');
      }
      // Clear status when not actively listening (unless thinking/speaking)
      if (this.voiceStatusEl) {
        const current = this.voiceStatusEl.textContent || '';
        if (current === 'Listening...') {
          this.setVoiceStatus('');
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      this.isRecording = false;
      if (this.voiceMicBtn) {
        this.voiceMicBtn.classList.remove('recording');
      }
      if (event.error === 'not-allowed') {
        this.setVoiceStatus('Microphone access denied');
      } else if (event.error === 'no-speech') {
        // Restart listening on no-speech (silence timeout)
        if (this.voiceMode) {
          this.startVoiceRecognition();
        }
      } else if (event.error !== 'aborted') {
        this.setVoiceStatus('Error — tap mic to retry');
        if (this.voiceMicBtn) this.voiceMicBtn.classList.remove('disabled');
      }
    };

    this.recognition.start();
  }

  private async sendVoiceModeMessage(text: string) {
    if (!this.voiceMode) return;
    // Send via core with voice flag; TTS playback happens in onCoreEvent when
    // the messageAdded event fires with audio data.
    try {
      await zephloCore.sendMessage(text, { voice: true });
    } catch {
      this.setVoiceStatus('Error — tap mic to retry');
      if (this.voiceMicBtn) this.voiceMicBtn.classList.remove('disabled');
    }
  }

  /** Play TTS audio for an assistant reply while in voice mode, then restart mic. */
  private handleVoiceAssistantReply(msg: Message) {
    if (msg.audio) {
      this.setVoiceStatus('Speaking...');
      if (this.voiceMicBtn) {
        this.voiceMicBtn.classList.remove('disabled');
        this.voiceMicBtn.classList.remove('recording');
      }
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }
      const msgIndex = this.messages.length - 1;
      this.audioMap.set(msgIndex, msg.audio);
      const audio = new Audio(`data:audio/mp3;base64,${msg.audio}`);
      this.currentAudio = audio;
      audio.onended = () => {
        this.currentAudio = null;
        if (this.voiceMode) this.startVoiceRecognition();
      };
      audio.play().catch(() => {
        if (this.voiceMode) this.startVoiceRecognition();
      });
    } else if (this.voiceMode) {
      // No audio — restart mic immediately
      this.startVoiceRecognition();
    }
  }

  private async sendVoiceMessage(text: string) {
    if (!text) return;
    this.textarea.value = "";
    this.sendBtn.disabled = true;
    this.autoResize();
    // Core handles session creation, WebSocket, retries, and event dispatch.
    await zephloCore.sendMessage(text);
  }

  private playAudio(base64Audio: string, messageIndex: number) {
    // Stop any currently playing audio
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    // Store audio for replay
    this.audioMap.set(messageIndex, base64Audio);

    const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
    this.currentAudio = audio;

    // Update speaker button state
    const speakerBtn = this.shadow.querySelector(`[data-audio-index="${messageIndex}"]`) as HTMLElement;
    if (speakerBtn) speakerBtn.classList.add('playing');

    audio.onended = () => {
      this.currentAudio = null;
      if (speakerBtn) speakerBtn.classList.remove('playing');
    };

    audio.play().catch(() => {
      // Autoplay may be blocked - user can click the speaker button
    });
  }

  /** Returns this view's message container (single-panel per view). */
  private getMessageContainers(): HTMLDivElement[] {
    return this.messagesEl ? [this.messagesEl] : [];
  }

  /** Send from a specific textarea (used by bindPanelInput) */
  private async sendFrom(textarea: HTMLTextAreaElement, sendBtn: HTMLButtonElement, _micBtn: HTMLButtonElement | null) {
    const text = textarea.value.trim();
    if (!text) return;
    textarea.value = "";
    sendBtn.disabled = true;
    this.autoResizeTextarea(textarea);
    // Delegate to core — it handles session, sends, and emits events that
    // every connected view (FAB + chat) receives to update their DOM.
    await zephloCore.sendMessage(text);
  }

  private async send() {
    return this.sendFrom(this.textarea, this.sendBtn, this.micBtn);
  }

  /** Build a message DOM element */
  private buildMessageEl(msg: Message): HTMLDivElement {
    const div = document.createElement("div");
    div.className = `cb-message ${msg.role}${msg.isAdminMessage ? ' admin' : ''}`;
    if (msg.streamId) div.dataset.streamId = msg.streamId;

    if (msg.isAdminMessage) {
      const labelDiv = document.createElement("div");
      labelDiv.className = "cb-admin-label";
      labelDiv.innerHTML = `${ICON_PERSON}<span>Team</span>`;
      div.appendChild(labelDiv);
    }

    const contentDiv = document.createElement("div");
    contentDiv.className = "cb-content";
    // Streaming bubbles start empty and grow via setStreamedContent(); render
    // plain text mid-stream and swap to markdown when streamId is finalized.
    if (msg.streamId && !msg.content) {
      contentDiv.textContent = "";
    } else {
      contentDiv.innerHTML = this.formatContent(msg.content);
    }
    div.appendChild(contentDiv);

    this.attachAssistantMetadata(div, msg);
    return div;
  }

  /**
   * Append audio / sources to an assistant bubble. Idempotent — guards each
   * block by class so a late `response` envelope can't double-append onto a
   * streamed bubble that already has its metadata.
   */
  private attachAssistantMetadata(div: HTMLDivElement, msg: Message): void {
    if (msg.role !== "assistant") return;

    if (msg.audio && !div.querySelector(".cb-speaker-btn")) {
      const msgIndex = this.messages.indexOf(msg);
      const idx = msgIndex >= 0 ? msgIndex : this.messages.length - 1;
      this.audioMap.set(idx, msg.audio);
      const speakerDiv = document.createElement("div");
      speakerDiv.innerHTML = `<button class="cb-speaker-btn" data-audio-index="${idx}" aria-label="Replay audio">${ICON_SPEAKER} Replay</button>`;
      div.appendChild(speakerDiv);
    }

    if (msg.sources && msg.sources.length > 0 && !div.querySelector(".cb-sources")) {
      const sourcesDiv = document.createElement("div");
      sourcesDiv.className = "cb-sources";
      const linkIcon = `<svg class="cb-source-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
      sourcesDiv.innerHTML = `
        <div class="cb-sources-label">Sources</div>
        <div class="cb-sources-list">
          ${msg.sources
            .map(
              (s) =>
                `<a href="${this.escapeHtml(s.url)}" target="_blank" rel="noopener">${linkIcon}${this.escapeHtml(s.title || s.url)}</a>`,
            )
            .join("")}
        </div>
      `;
      div.appendChild(sourcesDiv);
    }
  }

  /** Write `fullContent` into every bubble for `streamId` as plain text. */
  private setStreamedContent(streamId: string, fullContent: string): void {
    for (const container of this.getMessageContainers()) {
      const wrap = container.querySelector(`[data-stream-id="${streamId}"]`);
      const contentDiv = wrap?.querySelector(".cb-content") as HTMLElement | null;
      if (contentDiv) contentDiv.textContent = fullContent;
    }
  }

  /** Swap a finalized bubble's plain-text content to formatted markdown. */
  private finalizeStreamedContent(streamId: string, fullContent: string): void {
    for (const container of this.getMessageContainers()) {
      const wrap = container.querySelector(`[data-stream-id="${streamId}"]`);
      const contentDiv = wrap?.querySelector(".cb-content") as HTMLElement | null;
      if (contentDiv) contentDiv.innerHTML = this.formatContent(fullContent);
    }
  }

  /**
   * Latch the final response envelope (sources / audio / follow-ups) onto a
   * streamed bubble. Idempotent — guards every block so a duplicate envelope
   * never double-appends. Also defensively re-renders markdown in case the
   * stream_end frame was dropped.
   */
  private attachMetadataToStreamedBubble(msg: Message): void {
    if (!msg.streamId) return;
    for (const container of this.getMessageContainers()) {
      const wrap = container.querySelector(
        `[data-stream-id="${msg.streamId}"]`,
      ) as HTMLDivElement | null;
      if (!wrap) continue;
      const contentDiv = wrap.querySelector(".cb-content") as HTMLElement | null;
      if (contentDiv) contentDiv.innerHTML = this.formatContent(msg.content);
      this.attachAssistantMetadata(wrap, msg);

      const followUps = this.buildFollowUpsEl(msg);
      if (followUps) {
        // Drop any prior follow-up row for this bubble so we don't stack rows
        // if the envelope arrives twice (defensive — shouldAccept guards too).
        const next = wrap.nextElementSibling;
        if (next?.classList.contains("cb-prompt-row")) next.remove();
        wrap.after(followUps);
      }
    }
    this.scrollToBottom();
  }

  /** Build follow-up prompts DOM element */
  private buildFollowUpsEl(msg: Message): HTMLDivElement | null {
    if (!msg.followUpPrompts || msg.followUpPrompts.length === 0) return null;

    const followUpsDiv = document.createElement("div");
    followUpsDiv.className = "cb-prompt-row";
    const linkIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
    const chatIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`;
    followUpsDiv.innerHTML = msg.followUpPrompts
      .map((fp, i) => {
        const icon = fp.link ? linkIcon : chatIcon;
        const style = fp.link ? 'cb-prompt-btn--outline' : '';
        return `<button class="cb-prompt-btn ${style} cb-follow-up" data-fu-index="${i}" data-msg-index="${this.messages.length - 1}">${icon}${this.escapeHtml(fp.title)}</button>`;
      })
      .join("");
    return followUpsDiv;
  }

  private appendMessage(msg: Message) {
    // Remove welcome screens and hide quick prompts in ALL panels
    for (const container of this.getMessageContainers()) {
      const welcome = container.querySelector(".cb-welcome");
      if (welcome) welcome.remove();
    }
    this.shadow.querySelectorAll('.cb-input-prompts').forEach(el =>
      (el as HTMLElement).style.display = 'none'
    );

    // Add the message to all message containers. If the typing/status bubble
    // is showing (e.g. the agent's mid-run lead-in arriving before the final
    // answer), insert the message ABOVE it so the status stays at the bottom.
    const containers = this.getMessageContainers();
    for (const container of containers) {
      const typing = container.querySelector(".cb-typing");
      const msgEl = this.buildMessageEl(msg);
      const followUps = this.buildFollowUpsEl(msg);
      if (typing) {
        container.insertBefore(msgEl, typing);
        if (followUps) container.insertBefore(followUps, typing);
      } else {
        container.appendChild(msgEl);
        if (followUps) container.appendChild(followUps);
      }
    }

    this.scrollToBottom();
  }

  private showTyping(): HTMLDivElement {
    const div = document.createElement("div");
    div.className = "cb-typing";
    div.innerHTML = "<span></span><span></span><span></span>";
    // Add typing indicator to all panels
    const containers = this.getMessageContainers();
    for (const container of containers) {
      container.appendChild(container === this.messagesEl ? div : div.cloneNode(true));
    }
    this.scrollToBottom();

    // Return a proxy div whose remove() clears typing from ALL panels
    const originalRemove = div.remove.bind(div);
    div.remove = () => {
      originalRemove();
      // Also remove from inline panel in "both" mode
      this.shadow.querySelectorAll('.cb-typing').forEach(el => el.remove());
    };
    return div;
  }

  /**
   * Show a live status sentence (e.g. "Searching the site…", "Thinking…") in
   * place of the bouncing dots while the agent works. Reuses the existing
   * typing bubble so the dots morph into a status line without a layout jump,
   * and fades each new label in. Cleared by updateLoadingUi(false) when the
   * final answer arrives, exactly like the dots.
   */
  private updateStatusLine(label: string) {
    if (!label) return;
    for (const container of this.getMessageContainers()) {
      let el = container.querySelector(".cb-typing") as HTMLElement | null;
      if (!el) {
        el = document.createElement("div");
        el.className = "cb-typing";
        container.appendChild(el);
      }
      el.classList.add("cb-typing--status");

      let textEl = el.querySelector(".cb-status-text") as HTMLElement | null;
      if (!textEl) {
        // First status: swap the plain dots for smaller dots + a text label.
        el.innerHTML =
          '<span class="cb-status-dots"><span></span><span></span><span></span></span>' +
          '<span class="cb-status-text"></span>';
        textEl = el.querySelector(".cb-status-text") as HTMLElement;
      }

      if (textEl && textEl.textContent !== label) {
        // Re-trigger the fade/slide-in each time the label changes.
        textEl.classList.remove("cb-status-text--in");
        void textEl.offsetWidth; // force reflow so the animation restarts
        textEl.textContent = label;
        textEl.classList.add("cb-status-text--in");
      }
    }
    this.scrollToBottom();
  }

  private showError(message: string) {
    for (const container of this.getMessageContainers()) {
      const div = document.createElement("div");
      div.className = "cb-error";
      div.textContent = message;
      container.appendChild(div);
    }
    this.scrollToBottom();
  }

  private saveMessages() {
    storage.setItem(
      `cb_messages_${this.state.chatbotId}`,
      JSON.stringify(this.messages),
    );
  }

  private restoreMessages() {
    if (this.messages.length === 0) return;

    // Remove welcome screens from ALL panels and render saved messages
    for (const container of this.getMessageContainers()) {
      const welcome = container.querySelector(".cb-welcome");
      if (welcome) welcome.remove();
    }

    for (const msg of this.messages) {
      this.appendMessage(msg);
    }
  }

  private async startNewChat() {
    if (this.isMinimized) this.restore();
    // Core clears messages/session and emits "messagesReset", which triggers
    // renderEmptyState() in onCoreEvent.
    await zephloCore.startNewChat();
    this.textarea?.focus();
  }

  private renderQuickPrompts(): string {
    if (this.state.quickPrompts.length === 0) return '';
    const linkIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
    const chatIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`;
    const buttons = this.state.quickPrompts
      .map((qp, i) => {
        const icon = qp.link ? linkIcon : chatIcon;
        const style = qp.link ? 'cb-prompt-btn--outline' : '';
        return `<button class="cb-prompt-btn ${style} cb-quick-prompt" data-qp-index="${i}">${icon}${this.escapeHtml(qp.title)}</button>`;
      })
      .join('');
    return `<div class="cb-prompt-row">${buttons}</div>`;
  }

  private updateHeaderForMode() {
    this.shadow.querySelectorAll('.cb-header-title').forEach(el => {
      el.textContent = this.personMode ? "Chatting with our team" : this.state.title;
    });
    this.shadow.querySelectorAll('.cb-header-avatar').forEach(el => {
      if (this.personMode) {
        el.innerHTML = ICON_PERSON;
      } else {
        const { logoUrl } = this.state;
        el.innerHTML = logoUrl
          ? `<img src="${this.escapeHtml(logoUrl)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
          : ICON_CHAT;
      }
    });
  }

  private updateInputPlaceholder() {
    const placeholder = this.personMode ? "Message our team..." : "Type a message...";
    if (this.textarea) this.textarea.placeholder = placeholder;
  }

  private scrollToBottom() {
    requestAnimationFrame(() => {
      for (const container of this.getMessageContainers()) {
        container.scrollTop = container.scrollHeight;
      }
    });
  }

  private autoResizeTextarea(textarea: HTMLTextAreaElement) {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 80) + "px";
  }

  private autoResize() {
    this.autoResizeTextarea(this.textarea);
  }

  private formatContent(text: string): string {
    return this.escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>");
  }

  private escapeHtml(str: string): string {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Register a WebMCP tool that can be invoked by the agent.
   */
  registerTool(tool: ToolDefinition): void {
    toolRegistry.register(tool);
  }

  /**
   * Register a global listener for MCP tool results.
   * Returns an unsubscribe function.
   */
  onMcpResult(callback: (results: McpToolResult[]) => void): () => void {
    return zephloCore.registerMcpListener(callback);
  }

  /**
   * Initialize widget from the Zephlo SDK (programmatic init).
   * Stores api_key and chatbotId, then triggers connectedCallback if not already run.
   */
  private sdkApiKey: string | null = null;
  private sdkChatbotId: string | null = null;

  initFromSdk(apiKey: string, chatbotId: string | number): void {
    this.sdkApiKey = apiKey;
    this.sdkChatbotId = String(chatbotId);
    setApiKey(apiKey);

    // If connectedCallback already ran, re-initialize with new config
    if (this.state) {
      this.state.chatbotId = String(chatbotId);
      // Re-fetch config with the new chatbotId
      this.connectedCallback();
    }
    // Otherwise connectedCallback will pick up sdkChatbotId when it fires
  }

  /**
   * Send page context to the agent via WebSocket.
   */
  sendContextUpdate(data: Record<string, any>, includePageDetails?: boolean): void {
    zephloCore.sendContextUpdate(data, includePageDetails);
  }
}

// ==============================================================
// ZephloFab — alias for the FAB-rendering widget.
// ==============================================================
// ChatbotWidget IS the FAB renderer; we export it under a new name.
export class ZephloFab extends ChatbotWidget {}

// ==============================================================
// ZephloChat — inline chat view.
// ==============================================================
// Renders the same chat panel as the FAB but without the toggle button,
// greeting bubbles, or fixed positioning. Fills its host container.
// Supports `width` and `height` attributes to size the host element.
export class ZephloChat extends ChatbotWidget {
  static get observedAttributes(): string[] {
    return ["width", "height"];
  }

  constructor() {
    super();
    this.isInline = true;
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    if (name === "width" && value != null) {
      (this as unknown as HTMLElement).style.width = /^\d+$/.test(value) ? `${value}px` : value;
    }
    if (name === "height" && value != null) {
      (this as unknown as HTMLElement).style.height = /^\d+$/.test(value) ? `${value}px` : value;
    }
  }

  /** Inline render: only the chat panel, no FAB, no greetings. */
  protected render() {
    this.loadCustomFont();

    // Mark host element as inline so styles.ts `:host([data-zephlo-inline])` applies
    this.setAttribute("data-zephlo-inline", "");

    this.shadow.innerHTML = `
      <style>${WIDGET_STYLES}${this.buildCustomStyles()}</style>
      ${this.renderPanelHtml("cb-inline open")}
    `;

    this.applyTheme(zephloCore.getResolvedColors());

    // Cache DOM refs
    this.panel = this.shadow.querySelector(".cb-panel")!;
    this.messagesEl = this.shadow.querySelector(".cb-messages")!;
    this.textarea = this.shadow.querySelector("textarea")!;
    this.sendBtn = this.shadow.querySelector(".cb-send-btn")!;
    this.newChatBtn = this.shadow.querySelector(".cb-new-chat-btn")!;
    this.micBtn = this.shadow.querySelector(".cb-mic-btn");
    // Inline views have no toggle or greeting bubbles
    this.toggleBtn = null as any;
    this.greetingsEl = null;
    // Inline panel is always "open"
    this.isOpen = true;
  }
}

// ---- Register custom elements ----

if (!customElements.get("zephlo-fab")) {
  customElements.define("zephlo-fab", ZephloFab);
}
if (!customElements.get("zephlo-chat")) {
  customElements.define("zephlo-chat", ZephloChat);
}

// Backwards-compat: `<chatbot-widget>` is an alias of `<zephlo-fab>`.
// customElements.define requires a one-to-one mapping, so we wrap in a stub class.
class ChatbotWidgetAlias extends ZephloFab {}
if (!customElements.get("chatbot-widget")) {
  customElements.define("chatbot-widget", ChatbotWidgetAlias);
}

// Expose global SDK shim (backwards compatible)
interface ZephloSDKHandle {
  sendContextUpdate(data: Record<string, any>, includePageDetails?: boolean): void;
  onMcpResult(callback: (results: McpToolResult[]) => void): () => void;
  registerTool(tool: ToolDefinition): void;
}

declare global {
  interface Window {
    Zephlo: any;
    ChatbotWidget?: {
      onMcpResult: (callback: (results: McpToolResult[]) => void) => () => void;
    };
  }
}

// Backwards-compatible fallback: auto-inject `<zephlo-fab>` if a data-chatbot-id
// script tag is present and the SDK hasn't been initialized.
if (!(window as any).__ZEPHLO_SDK__) {
  const hasAnyZephloElement =
    document.querySelector("zephlo-fab") ||
    document.querySelector("zephlo-chat") ||
    document.querySelector("chatbot-widget");

  if (!hasAnyZephloElement && document.querySelector("script[data-chatbot-id]")) {
    document.body.appendChild(document.createElement("zephlo-fab"));
  }

  const widgetEl = document.querySelector("zephlo-fab") as ZephloFab | null;
  if (widgetEl) {
    window.ChatbotWidget = {
      onMcpResult: (callback) => widgetEl.onMcpResult(callback),
    };
  }
}
