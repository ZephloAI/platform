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

import { sendMessage, fetchConfig, type ChatSource } from "./api";
import { WIDGET_STYLES } from "./styles";
import { ICON_CHAT, ICON_CLOSE, ICON_SEND, ICON_BOT, ICON_NEW_CHAT } from "./icons";

// ---- Types ----

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
}

interface WidgetState {
  chatbotId: number;
  apiUrl: string;
  title: string;
  icon: string;
  welcome: string;
  position: "left" | "right";
  quickPrompts: { title: string; link?: string; prompt?: string }[];
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

class ChatbotWidget extends HTMLElement {
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

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  async connectedCallback() {
    const { chatbotId, apiUrl } = getScriptConfig();

    // Start with defaults
    this.state = {
      chatbotId,
      apiUrl,
      title: "Chat Assistant",
      icon: "",
      welcome: "Hi! How can I help you today?",
      position: "right",
      quickPrompts: [],
    };

    // Fetch config from API to get user-customized settings
    const config = await fetchConfig(apiUrl, chatbotId);
    if (config) {
      this.state.title = config.name || this.state.title;
      this.state.icon = config.widget_icon || "";
      this.state.welcome = config.widget_welcome || this.state.welcome;
      this.state.position =
        config.widget_position === "left" ? "left" : "right";
      this.state.quickPrompts = config.quick_prompts || [];
    }

    // Load existing session and messages from localStorage (if any)
    this.sessionId = localStorage.getItem(`cb_session_${chatbotId}`);
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
  }

  private render() {
    const { title, icon, welcome, position } = this.state;

    // Position override
    const posStyles =
      position === "left"
        ? `
        :host { left: 20px; right: auto; }
        .cb-panel { left: 0; right: auto; }
        .cb-toggle { left: 0; right: auto; }
      `
        : "";

    // Determine avatar content: emoji icon or default SVG bot icon
    const avatarContent = icon
      ? `<span style="font-size:18px;line-height:1">${this.escapeHtml(icon)}</span>`
      : ICON_BOT;

    // Welcome icon
    const welcomeIcon = icon ? this.escapeHtml(icon) : "💬";

    this.shadow.innerHTML = `
      <style>${WIDGET_STYLES}${posStyles}</style>

      <div class="cb-panel" role="dialog" aria-label="Chat widget">
        <!-- Header -->
        <div class="cb-header">
          <div class="cb-header-avatar">${avatarContent}</div>
          <div class="cb-header-info">
            <div class="cb-header-title">${this.escapeHtml(title)}</div>
            <div class="cb-header-subtitle">
              <span class="cb-online-dot"></span>
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
        </div>

        <!-- Footer -->
        <div class="cb-footer">
          Powered by <a href="#" target="_blank">Chatbot</a>
        </div>
      </div>

      <!-- Toggle button -->
      <button class="cb-toggle" aria-label="Open chat">
        <span class="cb-icon-chat">${ICON_CHAT}</span>
        <span class="cb-icon-close">${ICON_CLOSE}</span>
      </button>
    `;

    // Cache DOM refs
    this.panel = this.shadow.querySelector(".cb-panel")!;
    this.toggleBtn = this.shadow.querySelector(".cb-toggle")!;
    this.messagesEl = this.shadow.querySelector(".cb-messages")!;
    this.textarea = this.shadow.querySelector("textarea")!;
    this.sendBtn = this.shadow.querySelector(".cb-send-btn")!;
    this.newChatBtn = this.shadow.querySelector(".cb-new-chat-btn")!;
  }

  private bindEvents() {
    this.toggleBtn.addEventListener("click", () => this.toggle());
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
    });

    // Quick prompt button clicks (event delegation on shadow root)
    this.shadow.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest(".cb-quick-prompt") as HTMLElement | null;
      if (!btn) return;
      const index = Number(btn.dataset.qpIndex);
      const qp = this.state.quickPrompts[index];
      if (!qp) return;

      if (qp.link) {
        window.open(qp.link, "_blank", "noopener");
      } else if (qp.prompt) {
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

        sendMessage(this.state.apiUrl, this.state.chatbotId, qp.prompt, this.sessionId)
          .then((data) => {
            if (data.session_id) {
              this.sessionId = data.session_id;
              localStorage.setItem(`cb_session_${this.state.chatbotId}`, data.session_id);
            }
            typingEl.remove();
            const msg: Message = { role: "assistant", content: data.response, sources: data.sources };
            this.messages.push(msg);
            this.appendMessage(msg);
            this.saveMessages();

            // Hide quick prompts above input after first message
            const inputPrompts = this.shadow.querySelector(".cb-input-prompts");
            if (inputPrompts) (inputPrompts as HTMLElement).style.display = "none";
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
    this.panel.classList.toggle("open", this.isOpen);
    this.toggleBtn.classList.toggle("open", this.isOpen);
    this.toggleBtn.setAttribute(
      "aria-label",
      this.isOpen ? "Close chat" : "Open chat",
    );

    if (this.isOpen) {
      setTimeout(() => this.textarea.focus(), 300);
    }
  }

  private async send() {
    const text = this.textarea.value.trim();
    if (!text || this.isLoading) return;

    this.messages.push({ role: "user", content: text });
    this.appendMessage({ role: "user", content: text });
    this.saveMessages();

    this.textarea.value = "";
    this.sendBtn.disabled = true;
    this.autoResize();

    this.isLoading = true;
    const typingEl = this.showTyping();

    try {
      const data = await sendMessage(
        this.state.apiUrl,
        this.state.chatbotId,
        text,
        this.sessionId,
      );

      // Persist the session_id so the conversation continues across page loads
      if (data.session_id) {
        this.sessionId = data.session_id;
        localStorage.setItem(`cb_session_${this.state.chatbotId}`, data.session_id);
      }

      typingEl.remove();

      const msg: Message = {
        role: "assistant",
        content: data.response,
        sources: data.sources,
      };
      this.messages.push(msg);
      this.appendMessage(msg);
      this.saveMessages();
    } catch (err) {
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
    div.className = `cb-message ${msg.role}`;
    div.innerHTML = this.formatContent(msg.content);

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

  private startNewChat() {
    // Clear session and messages
    this.sessionId = null;
    this.messages = [];
    localStorage.removeItem(`cb_session_${this.state.chatbotId}`);
    localStorage.removeItem(`cb_messages_${this.state.chatbotId}`);

    // Reset messages area with welcome screen
    const { title, icon, welcome } = this.state;
    const welcomeIcon = icon ? this.escapeHtml(icon) : "💬";
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
        return `<button class="cb-quick-prompt" data-qp-index="${i}">${icon}${this.escapeHtml(qp.title)}</button>`;
      })
      .join('');
    return `<div class="cb-quick-prompts">${buttons}</div>`;
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
}

// ---- Register and auto-inject ----

if (!customElements.get("chatbot-widget")) {
  customElements.define("chatbot-widget", ChatbotWidget);
}

if (!document.querySelector("chatbot-widget")) {
  document.body.appendChild(document.createElement("chatbot-widget"));
}
