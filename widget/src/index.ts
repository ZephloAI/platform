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

import { ChatSocket, fetchConfig, createSession, setApiKey, type ChatSource, type FollowUpPrompt, type McpToolResult, type ConnectionStatus } from "./api";
import { toolRegistry, type ToolDefinition } from "./webmcp";
import { FormScanner } from "./form-scanner";
import { WIDGET_STYLES } from "./styles";
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
}

interface WidgetState {
  chatbotId: number;
  apiUrl: string;
  title: string;
  icon: string;
  welcome: string;
  position: "left" | "right" | "left-sidebar" | "right-sidebar";
  quickPrompts: { title: string; link?: string; prompt?: string }[];
  logoUrl: string | null;
  width: number;
  height: number;
  headerColor: string;
  userBubbleColor: string;
  assistantBubbleColor: string;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  greetingPrompts: { title: string; prompt: string }[];
  greetingPromptDuration: number;
  voiceEnabled: boolean;
  isActive: boolean;
}

// ---- Helper: detect initial config from the <script> tag ----

function getScriptConfig(): { chatbotId: number; apiUrl: string } {
  const scripts = document.querySelectorAll("script[data-chatbot-id]");
  const el = scripts[scripts.length - 1] as HTMLScriptElement | null;

  const chatbotId = Number(el?.dataset.chatbotId || "0");
  const apiUrl =
    el?.dataset.apiUrl ||
    (el?.src ? new URL(el.src).origin : window.location.origin);

  return { chatbotId, apiUrl };
}

// ---- Web Component ----

export class ChatbotWidget extends HTMLElement {
  private shadow: ShadowRoot;
  private state!: WidgetState;
  private messages: Message[] = [];
  private isOpen = false;
  private isLoading = false;
  private sessionId: string | null = null;

  // DOM references
  private panel!: HTMLDivElement;
  private toggleBtn!: HTMLButtonElement;
  private messagesEl!: HTMLDivElement;
  private textarea!: HTMLTextAreaElement;
  private sendBtn!: HTMLButtonElement;
  private newChatBtn!: HTMLButtonElement;
  private hostStyleEl: HTMLStyleElement | null = null;
  private chatSocket: ChatSocket | null = null;
  private greetingsEl: HTMLDivElement | null = null;
  private greetingsDismissed = false;
  private greetingsTimer: ReturnType<typeof setTimeout> | null = null;
  private micBtn: HTMLButtonElement | null = null;
  private isRecording = false;
  private recognition: any = null;  // SpeechRecognition instance
  private audioMap: Map<number, string> = new Map();
  private currentAudio: HTMLAudioElement | null = null;
  private sessionRetried = false;  // prevent infinite retry loops
  private mcpUnsubscribe: (() => void) | null = null;
  private mcpGlobalListeners: ((results: McpToolResult[]) => void)[] = [];
  private personMode = false;
  private voiceMode = false;
  private voiceMicBtn: HTMLButtonElement | null = null;
  private voiceOverlay: HTMLDivElement | null = null;
  private voiceStatusEl: HTMLDivElement | null = null;


  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  async connectedCallback() {
    const scriptConfig = getScriptConfig();
    const chatbotId = this.sdkChatbotId || scriptConfig.chatbotId;
    const apiUrl = scriptConfig.apiUrl;

    // Start with defaults
    this.state = {
      chatbotId,
      apiUrl,
      title: "Chat Assistant",
      icon: "",
      welcome: "Hi! How can I help you today?",
      position: "right",
      quickPrompts: [],
      logoUrl: null,
      width: 380,
      height: 520,
      headerColor: "#0071e3",
      userBubbleColor: "#0071e3",
      assistantBubbleColor: "#f5f5f7",
      fontFamily: "",
      fontSize: 14,
      textColor: "#1d1d1f",
      greetingPrompts: [],
      greetingPromptDuration: 0,
      voiceEnabled: false,
      isActive: true,
    };

    // Fetch config from API to get user-customized settings
    const config = await fetchConfig(apiUrl, chatbotId);
    if (config) {
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
      this.state.headerColor = config.widget_header_color || "#0071e3";
      this.state.userBubbleColor = config.widget_user_bubble_color || "#0071e3";
      this.state.assistantBubbleColor = config.widget_assistant_bubble_color || "#f5f5f7";
      this.state.fontFamily = config.widget_font_family || "";
      this.state.fontSize = config.widget_font_size || 14;
      this.state.textColor = config.widget_text_color || "#1d1d1f";
      this.state.greetingPrompts = config.greeting_prompts || [];
      this.state.greetingPromptDuration = config.greeting_prompt_duration || 0;
      this.state.voiceEnabled = config.voice_enabled || false;
      this.state.isActive = config.is_active !== false;

    }

    // Hide widget entirely if inactive
    if (!this.state.isActive) {
      this.style.display = 'none';
      return;
    }

    // Create or reuse session, then create WebSocket client
    let sessionId = localStorage.getItem(`cb_session_${chatbotId}`);
    if (!sessionId) {
      try {
        sessionId = await createSession(apiUrl, chatbotId);
        localStorage.setItem(`cb_session_${chatbotId}`, sessionId);
      } catch {
        // Session creation failed — will retry on first message
      }
    }
    this.sessionId = sessionId;
    this.chatSocket = sessionId
      ? new ChatSocket(apiUrl, chatbotId, sessionId)
      : null;

    if (this.chatSocket) {
      this.chatSocket.onStatusChange = (status) => this.updateStatusDot(status);
      this.setupMcpListener();
      // Eagerly connect so admin messages can be received immediately
      this.chatSocket.connect().catch(() => {
        // Will retry on first message send
      });
    }

    // Load existing messages from localStorage (if any)
    const savedMessages = localStorage.getItem(`cb_messages_${chatbotId}`);
    if (savedMessages) {
      try {
        this.messages = JSON.parse(savedMessages);
      } catch {
        this.messages = [];
      }
    }

    this.render();
    this.bindEvents();
    this.restoreMessages();

    // Auto-scan HTML forms with flunkie-tool-name attributes
    const formScanner = new FormScanner();
    formScanner.scan();
    formScanner.observe();

    if (this.state.position.includes('sidebar')) {
      this.injectHostTransition();
    }

    // Auto-hide timer is now started on hover in bindEvents
  }

  private render() {
    const { title, icon, welcome, position, logoUrl } = this.state;

    // Position override
    const isLeftSide = position === "left" || position === "left-sidebar";
    const posStyles = isLeftSide
      ? `
        :host { left: 20px; right: auto; }
        .cb-panel { left: 0; right: auto; }
        .cb-toggle { left: 0; right: auto; }
        .cb-greeting-bubbles { left: 0; right: auto; align-items: flex-start; }
      `
      : "";

    // Load Google Font if custom font is set
    if (this.state.fontFamily) {
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(this.state.fontFamily)}:wght@400;500;600&display=swap`;
      this.shadow.appendChild(fontLink);
    }

    // Apply all config values as CSS variable overrides
    const fontStack = this.state.fontFamily
      ? `"${this.state.fontFamily}", -apple-system, BlinkMacSystemFont, sans-serif`
      : '';
    const customStyles = `
      :host {
        --cb-accent: ${this.state.headerColor};
        --cb-accent-hover: ${this.state.headerColor};
        --cb-user-bubble: ${this.state.userBubbleColor};
        --cb-assistant-bubble: ${this.state.assistantBubbleColor};
        --cb-text: ${this.state.textColor};
        --cb-panel-width: ${this.state.width}px;
        --cb-panel-height: ${this.state.height}px;
        --cb-font-size: ${this.state.fontSize}px;
        ${fontStack ? `--cb-font: ${fontStack};` : ''}
      }
    `;

    // Avatar content: logo image > default chat SVG
    const avatarContent = logoUrl
      ? `<img src="${this.escapeHtml(logoUrl)}" alt="" class="cb-avatar-img">`
      : ICON_CHAT;

    // Welcome icon
    const welcomeIcon = logoUrl
      ? `<img src="${this.escapeHtml(logoUrl)}" alt="" class="cb-welcome-logo">`
      : `<span class="cb-welcome-chat-icon">${ICON_CHAT}</span>`;

    // Toggle button content
    const toggleContent = logoUrl
      ? `<img src="${this.escapeHtml(logoUrl)}" alt="" class="cb-toggle-logo">`
      : `<span class="cb-icon-chat">${ICON_CHAT}</span>`;

    this.shadow.innerHTML = `
      <style>${WIDGET_STYLES}${posStyles}${customStyles}</style>

      <div class="cb-panel${position.includes('sidebar') ? ` sidebar sidebar-${position === 'left-sidebar' ? 'left' : 'right'}` : ''}" role="dialog" aria-label="Chat widget">
        <!-- Header -->
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
        </div>

        <!-- Messages -->
        <div class="cb-messages">
          <div class="cb-welcome">
            <div class="cb-welcome-icon">${welcomeIcon}</div>
            <h3>${this.escapeHtml(title)}</h3>
            <p>${this.escapeHtml(welcome)}</p>
          </div>
        </div>

        <!-- Quick prompts (always visible) -->
        <div class="cb-input-prompts">
          ${this.renderQuickPrompts()}
        </div>

        <!-- Input -->
        <div class="cb-input-area">
          <div class="cb-input-row">
            <textarea
              rows="1"
              placeholder="Type a message..."
              aria-label="Chat message"
            ></textarea>
            <button class="cb-send-btn" aria-label="Send message" disabled>
              ${ICON_SEND}
            </button>
          </div>
          ${this.state.voiceEnabled && this.hasSpeechRecognition() ? `<button class="cb-mic-btn" aria-label="Voice mode">${ICON_MIC}</button>` : ''}
        </div>

        <!-- Footer -->
        <div class="cb-footer">
          Powered by <a href="#" target="_blank">Flunkie</a>
        </div>
      </div>

      <!-- Greeting bubbles -->
      <div class="cb-greeting-bubbles" style="display:none">
        ${this.state.greetingPrompts.map((gp, i) =>
          `<div class="cb-greeting-bubble" data-greeting-index="${i}">${this.escapeHtml(gp.title)}</div>`
        ).join('')}
      </div>

      <!-- Toggle button -->
      <button class="cb-toggle${logoUrl ? ' has-logo' : ''}${position.includes('sidebar') ? ' sidebar-toggle' : ''}" aria-label="Open chat">
        ${toggleContent}
        <span class="cb-icon-close">${position === 'left-sidebar' ? ICON_SIDEBAR_LEFT_HIDE : position === 'right-sidebar' ? ICON_SIDEBAR_RIGHT_HIDE : ICON_CLOSE}</span>
      </button>
    `;

    // Cache DOM refs
    this.panel = this.shadow.querySelector(".cb-panel")!;
    this.toggleBtn = this.shadow.querySelector(".cb-toggle")!;
    this.messagesEl = this.shadow.querySelector(".cb-messages")!;
    this.textarea = this.shadow.querySelector("textarea")!;
    this.sendBtn = this.shadow.querySelector(".cb-send-btn")!;
    this.newChatBtn = this.shadow.querySelector(".cb-new-chat-btn")!;
    this.greetingsEl = this.shadow.querySelector(".cb-greeting-bubbles");
    this.micBtn = this.shadow.querySelector(".cb-mic-btn");

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

  private bindEvents() {
    this.toggleBtn.addEventListener("click", () => this.toggle());

    // Show greeting bubbles on toggle hover
    if (this.state.greetingPrompts.length > 0) {
      const showGreetings = () => {
        if (!this.isOpen && !this.greetingsDismissed && this.greetingsEl) {
          this.greetingsEl.style.display = '';
          // Force reflow so the animation replays
          void this.greetingsEl.offsetHeight;
          this.greetingsEl.classList.remove('hidden');
        }
      };

      const hideGreetings = () => {
        if (this.greetingsEl && !this.greetingsDismissed) {
          this.greetingsEl.classList.add('hidden');
          setTimeout(() => {
            // Only set display:none if still hidden (not re-hovered)
            if (this.greetingsEl?.classList.contains('hidden')) {
              this.greetingsEl.style.display = 'none';
            }
          }, 400);
        }
      };

      this.toggleBtn.addEventListener("mouseenter", showGreetings);
      this.toggleBtn.addEventListener("mouseleave", (e) => {
        // Don't hide if mouse moved to the greeting bubbles
        const related = e.relatedTarget as HTMLElement | null;
        if (this.greetingsEl?.contains(related)) return;
        hideGreetings();
      });

      // Keep bubbles visible when hovering over them
      if (this.greetingsEl) {
        this.greetingsEl.addEventListener("mouseenter", showGreetings);
        this.greetingsEl.addEventListener("mouseleave", hideGreetings);
      }
    }
    this.sendBtn.addEventListener("click", () => this.send());
    this.newChatBtn.addEventListener("click", () => this.startNewChat());

    this.textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.send();
      }
    });

    this.textarea.addEventListener("input", () => {
      this.sendBtn.disabled =
        this.textarea.value.trim().length === 0 || this.isLoading;
      this.autoResize();

      // Hide/show mic button based on textarea content
      if (this.micBtn) {
        if (this.textarea.value.trim().length > 0) {
          this.micBtn.classList.add('cb-mic-hidden');
        } else {
          this.micBtn.classList.remove('cb-mic-hidden');
        }
      }
    });

    if (this.micBtn) {
      this.micBtn.addEventListener("click", () => this.enterVoiceMode());
    }

    // Button clicks (event delegation on shadow root)
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

        // Dismiss all greeting bubbles
        this.dismissGreetings();

        // Open chat if not already open
        if (!this.isOpen) {
          this.toggle();
        }

        // Send the prompt as a user message
        // Remove welcome screen if present
        const welcome = this.messagesEl.querySelector(".cb-welcome");
        if (welcome) welcome.remove();

        // Hide input quick prompts
        const inputPrompts = this.shadow.querySelector(".cb-input-prompts");
        if (inputPrompts) (inputPrompts as HTMLElement).style.display = "none";

        this.messages.push({ role: "user", content: gp.prompt });
        this.appendMessage({ role: "user", content: gp.prompt });
        this.saveMessages();

        this.isLoading = true;
        const typingEl = this.showTyping();
        this.sendBtn.disabled = true;

        this.chatSocket!.sendMessage(gp.prompt)
          .then((data) => {
            typingEl.remove();
            const msg: Message = { role: "assistant", content: data.response, sources: data.sources, followUpPrompts: data.follow_up_prompts };
            this.messages.push(msg);
            this.appendMessage(msg);
            this.saveMessages();
          })
          .catch((err) => {
            typingEl.remove();
            this.showError(err instanceof Error ? err.message : "Something went wrong.");
          })
          .finally(() => {
            this.isLoading = false;
            this.sendBtn.disabled = this.textarea.value.trim().length === 0;
          });
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
          this.chatSocket?.sendRaw({ message_type: "switch_to_person" });
          const switchMsg: Message = {
            role: "assistant",
            content: "You're now connected with our team. We'll reply shortly.",
            isAdminMessage: true,
          };
          this.messages.push(switchMsg);
          this.appendMessage(switchMsg);
          this.saveMessages();
          this.personMode = true;
          this.updateHeaderForMode();
          this.updateInputPlaceholder();
          return;
        }

        if (fp.link) {
          window.open(fp.link, "_blank", "noopener");
        }
        if (fp.prompt) {
          this.messages.push({ role: "user", content: fp.prompt });
          this.appendMessage({ role: "user", content: fp.prompt });
          this.saveMessages();

          this.isLoading = true;
          const typingEl = this.showTyping();
          this.sendBtn.disabled = true;

          this.chatSocket!.sendMessage(fp.prompt)
            .then((data) => {
              typingEl.remove();
              const responseMsg: Message = { role: "assistant", content: data.response, sources: data.sources, followUpPrompts: data.follow_up_prompts };
              this.messages.push(responseMsg);
              this.appendMessage(responseMsg);
              this.saveMessages();
            })
            .catch((err) => {
              typingEl.remove();
              this.showError(err instanceof Error ? err.message : "Something went wrong.");
            })
            .finally(() => {
              this.isLoading = false;
              this.sendBtn.disabled = this.textarea.value.trim().length === 0;
            });
        }
        return;
      }

      // Quick prompt button clicks
      const btn = (e.target as HTMLElement).closest(".cb-quick-prompt") as HTMLElement | null;
      if (!btn) return;
      const index = Number(btn.dataset.qpIndex);
      const qp = this.state.quickPrompts[index];
      if (!qp) return;

      // Remove the prompt row (buttons disappear)
      const promptRow = btn.closest(".cb-prompt-row");
      if (promptRow) promptRow.remove();

      // Hide quick prompts above input
      const inputPrompts = this.shadow.querySelector(".cb-input-prompts");
      if (inputPrompts) (inputPrompts as HTMLElement).style.display = "none";

      if (qp.link) {
        window.open(qp.link, "_blank", "noopener");
      }
      if (qp.prompt) {
        // Remove welcome screen if present
        const welcome = this.messagesEl.querySelector(".cb-welcome");
        if (welcome) welcome.remove();

        // Send the prompt as a user message
        this.messages.push({ role: "user", content: qp.prompt });
        this.appendMessage({ role: "user", content: qp.prompt });
        this.saveMessages();

        this.isLoading = true;
        const typingEl = this.showTyping();
        this.sendBtn.disabled = true;

        this.chatSocket!.sendMessage(qp.prompt)
          .then((data) => {
            typingEl.remove();
            const msg: Message = { role: "assistant", content: data.response, sources: data.sources, followUpPrompts: data.follow_up_prompts };
            this.messages.push(msg);
            this.appendMessage(msg);
            this.saveMessages();
          })
          .catch((err) => {
            typingEl.remove();
            this.showError(err instanceof Error ? err.message : "Something went wrong.");
          })
          .finally(() => {
            this.isLoading = false;
            this.sendBtn.disabled = this.textarea.value.trim().length === 0;
          });
      }
    });
  }

  private toggle() {
    this.isOpen = !this.isOpen;

    // Dismiss greeting bubbles when opening chat
    if (this.isOpen) {
      this.dismissGreetings();
    }

    // Stop voice/audio when closing the widget
    if (!this.isOpen) {
      if (this.voiceMode) {
        this.exitVoiceMode();
      } else if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }
    }

    this.panel.classList.toggle("open", this.isOpen);
    this.toggleBtn.classList.toggle("open", this.isOpen);
    this.toggleBtn.setAttribute(
      "aria-label",
      this.isOpen ? "Close chat" : "Open chat",
    );

    // Push page content for sidebar mode
    const isSidebar = this.state.position.includes('sidebar');
    if (isSidebar) {
      const side = this.state.position === 'left-sidebar' ? 'marginLeft' : 'marginRight';
      document.body.style[side] = this.isOpen ? `${SIDEBAR_WIDTH}px` : '';
    }

    if (this.isOpen) {
      setTimeout(() => this.textarea.focus(), 300);
    }
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

  private updateStatusDot(status: ConnectionStatus) {
    const dot = this.shadow.querySelector('.cb-status-dot') as HTMLElement | null;
    if (!dot) return;
    dot.className = `cb-status-dot ${status}`;
  }

  disconnectedCallback() {
    this.chatSocket?.close();
    this.chatSocket = null;
    if (this.greetingsTimer) {
      clearTimeout(this.greetingsTimer);
      this.greetingsTimer = null;
    }
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

    // Create voice overlay — horizontal layout: [back] [status] [mic]
    const overlay = document.createElement('div');
    overlay.className = 'cb-voice-overlay';
    overlay.innerHTML = `
      <button class="cb-voice-back-btn" aria-label="Back to chat">${ICON_KEYBOARD} Chat</button>
      <div class="cb-voice-status"></div>
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

    // Create session if needed
    if (!this.chatSocket) {
      try {
        const sessionId = await createSession(this.state.apiUrl, this.state.chatbotId);
        this.sessionId = sessionId;
        localStorage.setItem(`cb_session_${this.state.chatbotId}`, sessionId);
        this.chatSocket = new ChatSocket(this.state.apiUrl, this.state.chatbotId, sessionId);
        this.chatSocket.onStatusChange = (status) => this.updateStatusDot(status);
        this.setupMcpListener();
      } catch {
        this.setVoiceStatus('Connection failed');
        if (this.voiceMicBtn) this.voiceMicBtn.classList.remove('disabled');
        return;
      }
    }

    // Push user message (stored but not rendered)
    this.messages.push({ role: "user", content: text });
    this.saveMessages();

    try {
      const data = await this.chatSocket!.sendMessage(text, true);
      this.sessionRetried = false;

      if (!this.voiceMode) return; // exited during request

      const msg: Message = {
        role: "assistant",
        content: data.response,
        sources: data.sources,
        followUpPrompts: data.follow_up_prompts,
        audio: data.audio,
      };
      this.messages.push(msg);
      this.saveMessages();

      if (data.audio && this.voiceMode) {
        // Play TTS, then auto-restart mic
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
        this.audioMap.set(msgIndex, data.audio);

        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
        this.currentAudio = audio;

        audio.onended = () => {
          this.currentAudio = null;
          if (this.voiceMode) {
            this.startVoiceRecognition();
          }
        };

        audio.play().catch(() => {
          // Autoplay blocked — restart mic
          if (this.voiceMode) {
            this.startVoiceRecognition();
          }
        });
      } else if (this.voiceMode) {
        // No audio — restart mic
        this.startVoiceRecognition();
      }
    } catch (err) {
      if (!this.sessionRetried) {
        this.sessionRetried = true;
        const recovered = await this.resetSession();
        if (recovered && this.voiceMode) {
          try {
            const data = await this.chatSocket!.sendMessage(text, true);
            this.sessionRetried = false;
            if (!this.voiceMode) return;
            const msg: Message = {
              role: "assistant",
              content: data.response,
              sources: data.sources,
              followUpPrompts: data.follow_up_prompts,
              audio: data.audio,
            };
            this.messages.push(msg);
            this.saveMessages();
            if (data.audio && this.voiceMode) {
              this.setVoiceStatus('Speaking...');
              if (this.voiceMicBtn) {
                this.voiceMicBtn.classList.remove('disabled');
                this.voiceMicBtn.classList.remove('recording');
              }
              const msgIndex = this.messages.length - 1;
              this.audioMap.set(msgIndex, data.audio);
              const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
              this.currentAudio = audio;
              audio.onended = () => {
                this.currentAudio = null;
                if (this.voiceMode) this.startVoiceRecognition();
              };
              audio.play().catch(() => {
                if (this.voiceMode) this.startVoiceRecognition();
              });
            } else if (this.voiceMode) {
              this.startVoiceRecognition();
            }
            return;
          } catch {
            // fall through
          }
        }
      }
      this.setVoiceStatus('Error — tap mic to retry');
      if (this.voiceMicBtn) this.voiceMicBtn.classList.remove('disabled');
    }
  }

  private async sendVoiceMessage(text: string) {
    if (!text || this.isLoading) return;

    // Create session if needed
    if (!this.chatSocket) {
      try {
        const sessionId = await createSession(this.state.apiUrl, this.state.chatbotId);
        this.sessionId = sessionId;
        localStorage.setItem(`cb_session_${this.state.chatbotId}`, sessionId);
        this.chatSocket = new ChatSocket(this.state.apiUrl, this.state.chatbotId, sessionId);
        this.chatSocket.onStatusChange = (status) => this.updateStatusDot(status);
        this.setupMcpListener();
      } catch {
        this.showError("Unable to connect. Please try again.");
        return;
      }
    }

    this.messages.push({ role: "user", content: text });
    this.appendMessage({ role: "user", content: text });
    this.saveMessages();

    this.textarea.value = "";
    this.sendBtn.disabled = true;
    this.autoResize();

    this.isLoading = true;
    const typingEl = this.showTyping();

    try {
      const data = await this.chatSocket!.sendMessage(text, true);
      this.sessionRetried = false;
      typingEl.remove();

      const msg: Message = {
        role: "assistant",
        content: data.response,
        sources: data.sources,
        followUpPrompts: data.follow_up_prompts,
        audio: data.audio,
      };
      this.messages.push(msg);
      this.appendMessage(msg);
      this.saveMessages();

      // Auto-play audio
      if (data.audio) {
        this.playAudio(data.audio, this.messages.length - 1);
      }
    } catch (err) {
      // If this looks like a stale session, retry once with a fresh session
      if (!this.sessionRetried) {
        this.sessionRetried = true;
        const recovered = await this.resetSession();
        if (recovered) {
          try {
            const data = await this.chatSocket!.sendMessage(text, true);
            this.sessionRetried = false;
            typingEl.remove();
            const msg: Message = {
              role: "assistant",
              content: data.response,
              sources: data.sources,
              followUpPrompts: data.follow_up_prompts,
              audio: data.audio,
            };
            this.messages.push(msg);
            this.appendMessage(msg);
            this.saveMessages();
            if (data.audio) {
              this.playAudio(data.audio, this.messages.length - 1);
            }
            return;
          } catch {
            // Retry also failed — fall through to show error
          }
        }
      }
      typingEl.remove();
      this.showError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      this.isLoading = false;
      this.sendBtn.disabled = this.textarea.value.trim().length === 0;
    }
  }

  /** Invalidate current session and create a fresh one. */
  private async resetSession(): Promise<boolean> {
    if (this.chatSocket) {
      this.chatSocket.close();
      this.chatSocket = null;
    }
    localStorage.removeItem(`cb_session_${this.state.chatbotId}`);
    try {
      const sessionId = await createSession(this.state.apiUrl, this.state.chatbotId);
      this.sessionId = sessionId;
      localStorage.setItem(`cb_session_${this.state.chatbotId}`, sessionId);
      this.chatSocket = new ChatSocket(this.state.apiUrl, this.state.chatbotId, sessionId);
      this.chatSocket.onStatusChange = (status: ConnectionStatus) => this.updateStatusDot(status);
      this.setupMcpListener();
      this.chatSocket.connect().catch(() => {});
      return true;
    } catch {
      return false;
    }
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

  private async send() {
    const text = this.textarea.value.trim();
    if (!text || this.isLoading) return;

    // Create session if we don't have one yet
    if (!this.chatSocket) {
      try {
        const sessionId = await createSession(this.state.apiUrl, this.state.chatbotId);
        this.sessionId = sessionId;
        localStorage.setItem(`cb_session_${this.state.chatbotId}`, sessionId);
        this.chatSocket = new ChatSocket(this.state.apiUrl, this.state.chatbotId, sessionId);
        this.chatSocket.onStatusChange = (status) => this.updateStatusDot(status);
        this.setupMcpListener();
      } catch {
        this.showError("Unable to connect. Please try again.");
        return;
      }
    }

    this.messages.push({ role: "user", content: text });
    this.appendMessage({ role: "user", content: text });
    this.saveMessages();

    this.textarea.value = "";
    this.sendBtn.disabled = true;
    this.autoResize();

    this.isLoading = true;
    const typingEl = this.showTyping();

    try {
      const data = await this.chatSocket!.sendMessage(text);
      this.sessionRetried = false;

      typingEl.remove();

      const msg: Message = {
        role: "assistant",
        content: data.response,
        sources: data.sources,
        followUpPrompts: data.follow_up_prompts,
      };
      this.messages.push(msg);
      this.appendMessage(msg);
      this.saveMessages();
    } catch (err) {
      // If this looks like a stale session (connection closed/error), retry once with a fresh session
      if (!this.sessionRetried) {
        this.sessionRetried = true;
        const recovered = await this.resetSession();
        if (recovered) {
          try {
            const data = await this.chatSocket!.sendMessage(text);
            this.sessionRetried = false;
            typingEl.remove();
            const msg: Message = {
              role: "assistant",
              content: data.response,
              sources: data.sources,
              followUpPrompts: data.follow_up_prompts,
            };
            this.messages.push(msg);
            this.appendMessage(msg);
            this.saveMessages();
            return;
          } catch {
            // Retry also failed — fall through to show error
          }
        }
      }
      typingEl.remove();
      this.showError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      this.isLoading = false;
      this.sendBtn.disabled = this.textarea.value.trim().length === 0;
    }
  }

  private appendMessage(msg: Message) {
    const welcome = this.messagesEl.querySelector(".cb-welcome");
    if (welcome) welcome.remove();

    // Hide input quick prompts once messages start
    const inputPrompts = this.shadow.querySelector(".cb-input-prompts");
    if (inputPrompts) (inputPrompts as HTMLElement).style.display = "none";

    const div = document.createElement("div");
    div.className = `cb-message ${msg.role}${msg.isAdminMessage ? ' admin' : ''}`;

    // Add team label for admin messages
    if (msg.isAdminMessage) {
      const labelDiv = document.createElement("div");
      labelDiv.className = "cb-admin-label";
      labelDiv.innerHTML = `${ICON_PERSON}<span>Team</span>`;
      div.appendChild(labelDiv);
    }

    const contentDiv = document.createElement("div");
    contentDiv.innerHTML = this.formatContent(msg.content);
    div.appendChild(contentDiv);

    // Add speaker button for messages with audio
    if (msg.role === "assistant" && msg.audio) {
      const msgIndex = this.messages.length - 1;
      this.audioMap.set(msgIndex, msg.audio);
      const speakerDiv = document.createElement("div");
      speakerDiv.innerHTML = `<button class="cb-speaker-btn" data-audio-index="${msgIndex}" aria-label="Replay audio">${ICON_SPEAKER} Replay</button>`;
      div.appendChild(speakerDiv);
    }

    if (msg.sources && msg.sources.length > 0) {
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

    this.messagesEl.appendChild(div);

    // Render follow-up prompts as a separate right-aligned row below the message
    if (msg.followUpPrompts && msg.followUpPrompts.length > 0) {
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
      this.messagesEl.appendChild(followUpsDiv);
    }

    this.scrollToBottom();
  }

  private showTyping(): HTMLDivElement {
    const div = document.createElement("div");
    div.className = "cb-typing";
    div.innerHTML = "<span></span><span></span><span></span>";
    this.messagesEl.appendChild(div);
    this.scrollToBottom();
    return div;
  }

  private showError(message: string) {
    const div = document.createElement("div");
    div.className = "cb-error";
    div.textContent = message;
    this.messagesEl.appendChild(div);
    this.scrollToBottom();
  }

  private saveMessages() {
    localStorage.setItem(
      `cb_messages_${this.state.chatbotId}`,
      JSON.stringify(this.messages),
    );
  }

  private restoreMessages() {
    if (this.messages.length === 0) return;

    // Remove welcome screen and render saved messages
    const welcome = this.messagesEl.querySelector(".cb-welcome");
    if (welcome) welcome.remove();

    for (const msg of this.messages) {
      this.appendMessage(msg);
    }
  }

  private async startNewChat() {
    // Close existing WS
    this.chatSocket?.close();
    this.chatSocket = null;

    // Clear session, messages, and person mode
    this.sessionId = null;
    this.messages = [];
    this.personMode = false;
    this.updateHeaderForMode();
    this.updateInputPlaceholder();
    localStorage.removeItem(`cb_session_${this.state.chatbotId}`);
    localStorage.removeItem(`cb_messages_${this.state.chatbotId}`);

    // Create a new session
    try {
      const sessionId = await createSession(this.state.apiUrl, this.state.chatbotId);
      this.sessionId = sessionId;
      localStorage.setItem(`cb_session_${this.state.chatbotId}`, sessionId);
      this.chatSocket = new ChatSocket(this.state.apiUrl, this.state.chatbotId, sessionId);
      this.chatSocket.onStatusChange = (status) => this.updateStatusDot(status);
      this.setupMcpListener();
      this.chatSocket.connect().catch(() => {});
    } catch {
      // Will retry on next message
    }

    // Reset messages area with welcome screen
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

    // Show input prompts again for new chat
    const inputPrompts = this.shadow.querySelector(".cb-input-prompts");
    if (inputPrompts) (inputPrompts as HTMLElement).style.display = "";

    this.textarea.focus();
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
    const titleEl = this.shadow.querySelector('.cb-header-title');
    if (titleEl) {
      titleEl.textContent = this.personMode ? "Chatting with our team" : this.state.title;
    }
    const avatarEl = this.shadow.querySelector('.cb-header-avatar');
    if (avatarEl) {
      if (this.personMode) {
        avatarEl.innerHTML = ICON_PERSON;
      } else {
        const { logoUrl } = this.state;
        avatarEl.innerHTML = logoUrl
          ? `<img src="${this.escapeHtml(logoUrl)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
          : ICON_CHAT;
      }
    }
  }

  private updateInputPlaceholder() {
    if (this.textarea) {
      this.textarea.placeholder = this.personMode ? "Message our team..." : "Type a message...";
    }
  }

  private scrollToBottom() {
    requestAnimationFrame(() => {
      this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    });
  }

  private autoResize() {
    this.textarea.style.height = "auto";
    this.textarea.style.height =
      Math.min(this.textarea.scrollHeight, 80) + "px";
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
   * Wire up listeners and Flunkie tools on the current chatSocket.
   * Call this after creating a new ChatSocket instance.
   */
  private setupMcpListener() {
    if (this.mcpUnsubscribe) {
      this.mcpUnsubscribe();
      this.mcpUnsubscribe = null;
    }
    if (!this.chatSocket) return;

    // Wire Flunkie tool handler and schemas on every new socket
    toolRegistry.discoverExternal();
    this.chatSocket.setFlunkieToolHandler(async (req) => toolRegistry.execute(req.tool, req.arguments));
    this.chatSocket.setFlunkieTools(() => toolRegistry.getSchemas());

    // Wire live chat handlers
    this.chatSocket.onAdminMessage((content) => {
      const msg: Message = { role: "assistant", content, isAdminMessage: true };
      this.messages.push(msg);
      this.appendMessage(msg);
      this.saveMessages();
    });

    this.chatSocket.onModeChanged((mode) => {
      this.personMode = mode === "person";
      this.updateHeaderForMode();
      this.updateInputPlaceholder();
    });

    this.chatSocket.onWaiting(() => {
      // Show a subtle "Message sent" status below the last user message
      const statusDiv = document.createElement("div");
      statusDiv.className = "cb-message-status";
      statusDiv.textContent = "Message sent";
      this.messagesEl.appendChild(statusDiv);
      this.scrollToBottom();
    });

    this.mcpUnsubscribe = this.chatSocket.onMcpResult((results) => {
      // Dispatch CustomEvent that crosses Shadow DOM
      this.dispatchEvent(new CustomEvent("mcp-result", {
        bubbles: true,
        composed: true,
        detail: { results },
      }));
      // Notify global listeners
      for (const cb of this.mcpGlobalListeners) {
        try { cb(results); } catch { /* listener error */ }
      }
    });
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
    this.mcpGlobalListeners.push(callback);
    return () => {
      this.mcpGlobalListeners = this.mcpGlobalListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Initialize widget from the Flunkie SDK (programmatic init).
   * Stores api_key and chatbotId, then triggers connectedCallback if not already run.
   */
  private sdkApiKey: string | null = null;
  private sdkChatbotId: number | null = null;

  initFromSdk(apiKey: string, chatbotId: number): void {
    this.sdkApiKey = apiKey;
    this.sdkChatbotId = chatbotId;
    setApiKey(apiKey);

    // If connectedCallback already ran, re-initialize with new config
    if (this.state) {
      this.state.chatbotId = chatbotId;
      // Re-fetch config with the new chatbotId
      this.connectedCallback();
    }
    // Otherwise connectedCallback will pick up sdkChatbotId when it fires
  }

  /**
   * Send page context to the agent via WebSocket.
   */
  sendContextUpdate(data: Record<string, any>, includePageDetails?: boolean): void {
    this.chatSocket?.sendContextUpdate(data, includePageDetails);
  }
}

// ---- Register and auto-inject ----

if (!customElements.get("chatbot-widget")) {
  customElements.define("chatbot-widget", ChatbotWidget);
}

// Expose global API for host page integration
interface FlunkieSDKHandle {
  sendContextUpdate(data: Record<string, any>, includePageDetails?: boolean): void;
  onMcpResult(callback: (results: McpToolResult[]) => void): () => void;
  registerTool(tool: ToolDefinition): void;
}

interface FlunkieSDK {
  initialize(config: { api_key: string; chatbotId: number }): FlunkieSDKHandle;
}

declare global {
  interface Window {
    Flunkie: FlunkieSDK;
    ChatbotWidget?: {
      onMcpResult: (callback: (results: McpToolResult[]) => void) => () => void;
    };
  }
}

// Expose Flunkie SDK globally
window.Flunkie = {
  initialize({ api_key, chatbotId }: { api_key: string; chatbotId: number }): FlunkieSDKHandle {
    (window as any).__FLUNKIE_SDK__ = true;

    // Create and inject the widget element
    if (!document.querySelector("chatbot-widget")) {
      document.body.appendChild(document.createElement("chatbot-widget"));
    }
    const widgetEl = document.querySelector("chatbot-widget") as ChatbotWidget;

    // Pass config to the widget
    widgetEl.initFromSdk(api_key, chatbotId);

    // Return SDK handle
    return {
      sendContextUpdate(data: Record<string, any>, includePageDetails?: boolean) {
        widgetEl.sendContextUpdate(data, includePageDetails);
      },
      onMcpResult(callback) {
        return widgetEl.onMcpResult(callback);
      },
      registerTool(tool: ToolDefinition) {
        widgetEl.registerTool(tool);
      },
    };
  },
};

// Backwards-compatible fallback: auto-inject via data-chatbot-id script tag
if (!(window as any).__FLUNKIE_SDK__) {
  if (!document.querySelector("chatbot-widget")) {
    document.body.appendChild(document.createElement("chatbot-widget"));
  }

  const widgetEl = document.querySelector("chatbot-widget") as ChatbotWidget | null;
  if (widgetEl) {
    window.ChatbotWidget = {
      onMcpResult: (callback) => widgetEl.onMcpResult(callback),
    };
  }
}
