/**
 * All widget styles live here. They're injected into the Shadow DOM
 * so they never leak into or get affected by the host page's CSS.
 *
 * CSS variables used for customizable properties:
 *   --cb-accent          Header, toggle, send button, user bubble
 *   --cb-accent-hover    Hover states
 *   --cb-user-bubble     User message background (defaults to accent)
 *   --cb-assistant-bubble  Assistant message background
 *   --cb-text            Primary text color
 *   --cb-font            Font family stack
 *   --cb-panel-width     Chat panel width
 *   --cb-panel-height    Chat panel height
 *   --cb-font-size       Base font size
 */

export const WIDGET_STYLES = /* css */ `
  :host {
    --cb-accent: #0071e3;
    --cb-accent-hover: #0077ed;
    --cb-user-bubble: var(--cb-accent);
    --cb-assistant-bubble: #f5f5f7;
    --cb-bg: #ffffff;
    --cb-bg-secondary: #f5f5f7;
    --cb-bg-tertiary: #e8e8ed;
    --cb-text: #1d1d1f;
    --cb-text-secondary: #6e6e73;
    --cb-text-tertiary: #86868b;
    --cb-border: rgba(0, 0, 0, 0.06);
    --cb-shadow: 0 20px 60px rgba(0, 0, 0, 0.16), 0 4px 16px rgba(0, 0, 0, 0.08);
    --cb-radius: 18px;
    --cb-font: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    --cb-panel-width: 380px;
    --cb-panel-height: 520px;
    --cb-font-size: 14px;

    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
    font-family: var(--cb-font);
    font-size: var(--cb-font-size);
    line-height: 1.5;
    color: var(--cb-text);
    -webkit-font-smoothing: antialiased;
  }

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* ---- Toggle Button ---- */
  .cb-toggle {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: none;
    background: var(--cb-accent);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 20px rgba(0, 113, 227, 0.35), 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.25s cubic-bezier(0.25, 0.1, 0.25, 1),
                box-shadow 0.25s cubic-bezier(0.25, 0.1, 0.25, 1),
                background-color 0.2s,
                left 0.3s cubic-bezier(0.25, 0.1, 0.25, 1),
                right 0.3s cubic-bezier(0.25, 0.1, 0.25, 1),
                margin 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
    position: absolute;
    bottom: 0;
    right: 0;
    overflow: hidden;
  }

  .cb-toggle.has-logo {
    background: transparent;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .cb-toggle.has-logo:hover {
    background: transparent;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2), 0 3px 12px rgba(0, 0, 0, 0.1);
  }

  /* When open with a logo, revert to accent color and hide the logo */
  .cb-toggle.has-logo.open {
    background: var(--cb-accent);
    box-shadow: 0 4px 20px rgba(0, 113, 227, 0.35), 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .cb-toggle.has-logo.open:hover {
    background: var(--cb-accent-hover);
    box-shadow: 0 6px 24px rgba(0, 113, 227, 0.4), 0 3px 12px rgba(0, 0, 0, 0.12);
  }

  .cb-toggle.has-logo.open .cb-toggle-logo {
    opacity: 0;
    transform: rotate(90deg) scale(0.6);
  }

  .cb-toggle:hover {
    transform: scale(1.06);
    box-shadow: 0 6px 24px rgba(0, 113, 227, 0.4), 0 3px 12px rgba(0, 0, 0, 0.12);
    background: var(--cb-accent-hover);
  }

  .cb-toggle:active {
    transform: scale(0.96);
  }

  .cb-toggle svg {
    width: 26px;
    height: 26px;
    transition: transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1),
                opacity 0.2s;
  }

  .cb-toggle .cb-icon-close {
    position: absolute;
    opacity: 0;
    transform: rotate(-90deg) scale(0.6);
  }

  .cb-toggle.open .cb-icon-chat {
    opacity: 0;
    transform: rotate(90deg) scale(0.6);
  }

  .cb-toggle.open .cb-icon-close {
    opacity: 1;
    transform: rotate(0deg) scale(1);
  }

  /* Sidebar toggle: no rotation for sidebar hide icons */
  .cb-toggle.sidebar-toggle .cb-icon-close {
    transform: scale(0.6);
  }

  .cb-toggle.sidebar-toggle.open .cb-icon-close {
    transform: scale(1);
  }

  /* ---- Chat Panel ---- */
  .cb-panel {
    position: absolute;
    bottom: 72px;
    right: 0;
    width: var(--cb-panel-width);
    height: var(--cb-panel-height);
    background: var(--cb-bg);
    border-radius: var(--cb-radius);
    box-shadow: var(--cb-shadow);
    border: 1px solid var(--cb-border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    opacity: 0;
    transform: translateY(16px) scale(0.96);
    pointer-events: none;
    transition: opacity 0.3s cubic-bezier(0.25, 0.1, 0.25, 1),
                transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
  }

  .cb-panel.open {
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: auto;
  }

  /* ---- Sidebar Mode ---- */
  .cb-panel.sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    height: 100vh;
    height: 100dvh;
    border-radius: 0;
    width: 300px;
    transform: translateX(100%) scale(1);
    opacity: 1;
    transition: transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
  }

  .cb-panel.sidebar.open {
    transform: translateX(0) scale(1);
  }

  .cb-panel.sidebar-left {
    left: 0;
    right: auto;
    transform: translateX(-100%) scale(1);
  }

  .cb-panel.sidebar-left.open {
    transform: translateX(0) scale(1);
  }

  .cb-panel.sidebar-right {
    right: 0;
    left: auto;
  }

  /* Sidebar toggle: animate to the outer edge of the sidebar when open */
  .cb-panel.sidebar ~ .cb-toggle {
    position: fixed;
    bottom: 20px;
    transition: transform 0.25s cubic-bezier(0.25, 0.1, 0.25, 1),
                box-shadow 0.25s cubic-bezier(0.25, 0.1, 0.25, 1),
                background-color 0.2s,
                left 0.3s cubic-bezier(0.25, 0.1, 0.25, 1),
                right 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
  }

  .cb-panel.sidebar-left ~ .cb-toggle {
    left: 20px;
    right: auto;
  }

  .cb-panel.sidebar-left.open ~ .cb-toggle {
    left: 312px;
  }

  .cb-panel.sidebar-right ~ .cb-toggle {
    right: 20px;
    left: auto;
  }

  .cb-panel.sidebar-right.open ~ .cb-toggle {
    right: 312px;
  }

  /* ---- Header ---- */
  .cb-header {
    padding: 18px 20px;
    background: var(--cb-accent);
    color: #fff;
    border-bottom: 1px solid var(--cb-border);
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }

  .cb-header-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
  }

  .cb-header-avatar svg {
    width: 18px;
    height: 18px;
    color: white;
  }

  .cb-header-info {
    flex: 1;
    min-width: 0;
  }

  .cb-new-chat-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background-color 0.2s, color 0.2s, transform 0.15s;
  }

  .cb-new-chat-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
  }

  .cb-new-chat-btn:active {
    transform: scale(0.9);
  }

  .cb-new-chat-btn svg {
    width: 16px;
    height: 16px;
  }

  .cb-header-title {
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .cb-header-subtitle {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .cb-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    display: inline-block;
    margin-right: 4px;
    transition: background-color 0.3s ease;
  }
  .cb-status-dot.connected { background-color: #34c759; }
  .cb-status-dot.connecting { background-color: #ffcc00; }
  .cb-status-dot.disconnected { background-color: #8e8e93; }

  /* ---- Messages ---- */
  .cb-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px 16px 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    scroll-behavior: smooth;
  }

  .cb-messages::-webkit-scrollbar {
    width: 4px;
  }

  .cb-messages::-webkit-scrollbar-track {
    background: transparent;
  }

  .cb-messages::-webkit-scrollbar-thumb {
    background: var(--cb-bg-tertiary);
    border-radius: 2px;
  }

  .cb-welcome {
    text-align: center;
    padding: 24px 16px;
  }

  .cb-welcome-icon {
    font-size: 32px;
    margin-bottom: 8px;
  }

  .cb-welcome h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--cb-text);
    margin-bottom: 4px;
  }

  .cb-welcome p {
    font-size: 13px;
    color: var(--cb-text-secondary);
  }

  .cb-message {
    max-width: 82%;
    padding: 10px 14px;
    border-radius: 16px;
    font-size: inherit;
    line-height: 1.45;
    word-wrap: break-word;
    animation: cb-msg-in 0.25s cubic-bezier(0.25, 0.1, 0.25, 1);
  }

  @keyframes cb-msg-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .cb-message.user {
    align-self: flex-end;
    background: var(--cb-user-bubble);
    color: white;
    border-bottom-right-radius: 6px;
  }

  .cb-message.assistant {
    align-self: flex-start;
    background: var(--cb-assistant-bubble);
    color: var(--cb-text);
    border-bottom-left-radius: 6px;
  }

  .cb-message.assistant a {
    color: var(--cb-accent);
    text-decoration: none;
  }

  .cb-message.assistant a:hover {
    text-decoration: underline;
  }

  /* Sources */
  .cb-sources {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--cb-border);
  }

  .cb-sources-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--cb-text-tertiary);
    margin-bottom: 6px;
  }

  .cb-sources-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .cb-sources-list a {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    background: var(--cb-bg);
    border: 1px solid var(--cb-border);
    border-radius: 20px;
    color: var(--cb-text-secondary);
    font-size: 11px;
    font-weight: 500;
    text-decoration: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
    cursor: pointer;
    letter-spacing: -0.01em;
    transition: background-color 0.2s, border-color 0.2s, color 0.2s, transform 0.15s;
  }

  .cb-sources-list a:hover {
    background: var(--cb-bg-secondary);
    border-color: rgba(0, 0, 0, 0.1);
    color: var(--cb-accent);
  }

  .cb-sources-list a:active {
    transform: scale(0.97);
  }

  .cb-source-icon {
    width: 11px;
    height: 11px;
    flex-shrink: 0;
    opacity: 0.5;
  }

  /* Typing indicator */
  .cb-typing {
    align-self: flex-start;
    display: flex;
    gap: 4px;
    padding: 12px 16px;
    background: var(--cb-assistant-bubble);
    border-radius: 16px;
    border-bottom-left-radius: 6px;
    animation: cb-msg-in 0.25s cubic-bezier(0.25, 0.1, 0.25, 1);
  }

  .cb-typing span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--cb-text-tertiary);
    animation: cb-bounce 1.2s infinite ease-in-out;
  }

  .cb-typing span:nth-child(1) { animation-delay: 0s; }
  .cb-typing span:nth-child(2) { animation-delay: 0.15s; }
  .cb-typing span:nth-child(3) { animation-delay: 0.3s; }

  @keyframes cb-bounce {
    0%, 60%, 100% {
      transform: translateY(0);
      opacity: 0.4;
    }
    30% {
      transform: translateY(-4px);
      opacity: 1;
    }
  }

  /* ---- Input ---- */
  .cb-input-area {
    padding: 12px 16px 14px;
    border-top: 1px solid var(--cb-border);
    background: var(--cb-bg);
    flex-shrink: 0;
    display: flex;
    align-items: flex-end;
    gap: 8px;
  }

  .cb-input-row {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: flex-end;
    gap: 8px;
    background: var(--cb-bg-secondary);
    border-radius: 14px;
    padding: 4px 4px 4px 14px;
    border: 1px solid transparent;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .cb-input-row:focus-within {
    border-color: var(--cb-accent);
    box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.1);
  }

  .cb-input-row textarea {
    flex: 1;
    border: none;
    background: transparent;
    font-family: var(--cb-font);
    font-size: inherit;
    color: var(--cb-text);
    resize: none;
    outline: none;
    max-height: 80px;
    padding: 8px 0;
    line-height: 1.4;
  }

  .cb-input-row textarea::placeholder {
    color: var(--cb-text-tertiary);
  }

  .cb-send-btn {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    border: none;
    background: var(--cb-accent);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background-color 0.2s, opacity 0.2s, transform 0.15s;
  }

  .cb-send-btn:hover {
    background: var(--cb-accent-hover);
  }

  .cb-send-btn:active {
    transform: scale(0.92);
  }

  .cb-send-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .cb-send-btn svg {
    width: 16px;
    height: 16px;
  }

  /* ---- Footer ---- */
  .cb-footer {
    text-align: center;
    padding: 6px 0 10px;
    font-size: 11px;
    color: var(--cb-text-tertiary);
    background: var(--cb-bg);
    flex-shrink: 0;
  }

  .cb-footer a {
    color: var(--cb-text-secondary);
    text-decoration: none;
    font-weight: 500;
  }

  .cb-footer a:hover {
    color: var(--cb-accent);
  }

  /* ---- Error ---- */
  .cb-error {
    align-self: flex-start;
    font-size: 12px;
    color: #ff3b30;
    padding: 8px 14px;
    background: rgba(255, 59, 48, 0.06);
    border-radius: 12px;
    animation: cb-msg-in 0.25s cubic-bezier(0.25, 0.1, 0.25, 1);
  }

  /* ---- Prompt Buttons (shared by quick prompts & follow-ups) ---- */
  .cb-prompt-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: flex-end;
    padding: 4px 16px;
    animation: cb-msg-in 0.25s cubic-bezier(0.25, 0.1, 0.25, 1);
  }

  .cb-prompt-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 8px 16px;
    background: linear-gradient(135deg, var(--cb-accent), var(--cb-accent-hover));
    border: none;
    border-radius: 100px;
    font-family: var(--cb-font);
    font-size: 13px;
    font-weight: 500;
    color: white;
    cursor: pointer;
    white-space: nowrap;
    letter-spacing: -0.01em;
    box-shadow: 0 2px 8px rgba(0, 113, 227, 0.25);
    transition: transform 0.15s cubic-bezier(0.25, 0.1, 0.25, 1),
                box-shadow 0.2s,
                opacity 0.2s;
  }

  .cb-prompt-btn:hover {
    transform: scale(1.04);
    box-shadow: 0 4px 14px rgba(0, 113, 227, 0.35);
  }

  .cb-prompt-btn:active {
    transform: scale(0.96);
  }

  .cb-prompt-btn svg {
    width: 12px;
    height: 12px;
    color: rgba(255, 255, 255, 0.8);
  }

  .cb-prompt-btn--outline {
    background: var(--cb-bg);
    color: var(--cb-accent);
    border: 1.5px solid rgba(0, 113, 227, 0.25);
    box-shadow: none;
  }

  .cb-prompt-btn--outline:hover {
    background: rgba(0, 113, 227, 0.06);
    border-color: rgba(0, 113, 227, 0.4);
    box-shadow: 0 2px 8px rgba(0, 113, 227, 0.1);
  }

  .cb-prompt-btn--outline svg {
    color: var(--cb-accent);
    opacity: 0.6;
  }

  .cb-input-prompts {
    flex-shrink: 0;
    padding: 8px 0 0;
  }

  .cb-input-prompts:empty {
    display: none;
  }

  /* ---- Logo Images ---- */
  .cb-avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }

  .cb-welcome-logo {
    width: 32px;
    height: 32px;
    object-fit: cover;
    border-radius: 50%;
  }

  .cb-toggle-logo {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
    transition: opacity 0.3s cubic-bezier(0.25, 0.1, 0.25, 1),
                transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
  }

  /* ---- Google Font loader ---- */
  .cb-font-loader {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
  }

  /* ---- Greeting Bubbles ---- */
  .cb-greeting-bubbles {
    position: absolute;
    bottom: 68px;
    right: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
    pointer-events: auto;
    transition: opacity 0.4s ease, transform 0.4s ease;
  }

  .cb-greeting-bubble {
    padding: 10px 16px;
    background: var(--cb-bg);
    color: var(--cb-accent);
    border-radius: 16px;
    font-family: var(--cb-font);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 220px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(0, 0, 0, 0.06);
    border: 1px solid var(--cb-border);
    transition: transform 0.2s cubic-bezier(0.25, 0.1, 0.25, 1),
                box-shadow 0.2s,
                background-color 0.2s;
    animation: cb-greeting-in 0.4s cubic-bezier(0.25, 0.1, 0.25, 1) backwards;
  }

  .cb-greeting-bubble:nth-child(1) { animation-delay: 0.1s; }
  .cb-greeting-bubble:nth-child(2) { animation-delay: 0.25s; }
  .cb-greeting-bubble:nth-child(3) { animation-delay: 0.4s; }
  .cb-greeting-bubble:nth-child(4) { animation-delay: 0.55s; }
  .cb-greeting-bubble:nth-child(5) { animation-delay: 0.7s; }

  .cb-greeting-bubble:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.14), 0 2px 6px rgba(0, 0, 0, 0.08);
    background: var(--cb-bg-secondary);
  }

  .cb-greeting-bubble:active {
    transform: scale(0.97);
  }

  @keyframes cb-greeting-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .cb-greeting-bubbles.hidden {
    opacity: 0;
    transform: translateY(8px);
    pointer-events: none;
  }

  /* ---- Mic Button (right of input row) ---- */
  .cb-mic-btn {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: none;
    background: var(--cb-accent);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: opacity 0.2s, width 0.2s, margin 0.2s, transform 0.15s, background-color 0.2s;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 113, 227, 0.3);
  }

  .cb-mic-btn:hover {
    background: var(--cb-accent-hover);
    transform: scale(1.06);
  }

  .cb-mic-btn:active {
    transform: scale(0.92);
  }

  .cb-mic-btn svg {
    width: 18px;
    height: 18px;
  }

  .cb-mic-btn.recording {
    background: #ff3b30;
    color: white;
    animation: cb-mic-pulse 1.5s ease-in-out infinite;
  }

  .cb-mic-btn.recording:hover {
    background: #e0342b;
    color: white;
  }

  .cb-mic-btn.cb-mic-hidden {
    width: 0;
    opacity: 0;
    pointer-events: none;
    margin-left: -8px;
  }

  @keyframes cb-mic-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.85; transform: scale(1.06); }
  }

  /* ---- Voice Mode: compact panel ---- */
  .cb-panel.cb-voice-active {
    height: 80px;
    background: transparent;
    box-shadow: none;
    border-color: transparent;
    transition: height 0.3s cubic-bezier(0.25, 0.1, 0.25, 1),
                background 0.3s,
                box-shadow 0.3s,
                opacity 0.3s cubic-bezier(0.25, 0.1, 0.25, 1),
                transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
  }

  /* ---- Voice Mode Overlay ---- */
  .cb-voice-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 12px 16px;
    gap: 12px;
    background: linear-gradient(90deg, rgba(26, 26, 26, 0.2) 0%, rgba(26, 92, 92, 0.2) 50%, rgba(240, 240, 240, 0.2) 100%);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    z-index: 10;
    animation: cb-voice-in 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
    border-radius: inherit;
  }

  @keyframes cb-voice-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .cb-voice-back-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    background: rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 100px;
    font-family: var(--cb-font);
    font-size: 12px;
    font-weight: 500;
    color: var(--cb-text);
    cursor: pointer;
    flex-shrink: 0;
    transition: background-color 0.2s, transform 0.15s;
  }

  .cb-voice-back-btn:hover {
    background: rgba(0, 0, 0, 0.14);
  }

  .cb-voice-back-btn:active {
    transform: scale(0.96);
  }

  .cb-voice-back-btn svg {
    width: 13px;
    height: 13px;
  }

  .cb-voice-status {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    color: var(--cb-text);
    text-align: center;
  }

  .cb-voice-mic-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: none;
    background: #1a1a1a;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    transition: background-color 0.2s, color 0.2s, transform 0.15s, box-shadow 0.2s;
  }

  .cb-voice-mic-btn:hover {
    transform: scale(1.06);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
  }

  .cb-voice-mic-btn:active {
    transform: scale(0.94);
  }

  .cb-voice-mic-btn svg {
    width: 24px;
    height: 24px;
  }

  .cb-voice-mic-btn.recording {
    background: #ff3b30;
    color: white;
    animation: cb-voice-pulse 1.5s ease-in-out infinite;
  }

  .cb-voice-mic-btn.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  @keyframes cb-voice-pulse {
    0%, 100% { box-shadow: 0 4px 20px rgba(255, 59, 48, 0.3); transform: scale(1); }
    50% { box-shadow: 0 4px 32px rgba(255, 59, 48, 0.5); transform: scale(1.06); }
  }

  /* ---- Speaker Button (replay audio) ---- */
  .cb-speaker-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 6px;
    padding: 4px 10px;
    background: transparent;
    border: 1px solid var(--cb-border);
    border-radius: 12px;
    font-family: var(--cb-font);
    font-size: 11px;
    color: var(--cb-text-tertiary);
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s, border-color 0.2s;
  }

  .cb-speaker-btn:hover {
    background: var(--cb-bg-secondary);
    color: var(--cb-text-secondary);
    border-color: rgba(0, 0, 0, 0.1);
  }

  .cb-speaker-btn:active {
    transform: scale(0.96);
  }

  .cb-speaker-btn svg {
    width: 12px;
    height: 12px;
  }

  .cb-speaker-btn.playing {
    color: var(--cb-accent);
    border-color: var(--cb-accent);
    background: rgba(0, 113, 227, 0.06);
  }

  /* ---- Responsive: full-screen on small viewports ---- */
  @media (max-width: 440px) {
    :host {
      bottom: 0;
      right: 0;
      left: 0;
    }

    .cb-panel {
      width: 100vw !important;
      height: 100vh !important;
      height: 100dvh !important;
      bottom: 0;
      right: 0;
      border-radius: 0;
    }

    .cb-panel.sidebar {
      width: 100vw !important;
    }

    .cb-panel.open ~ .cb-toggle {
      opacity: 0;
      pointer-events: none;
    }

    .cb-greeting-bubbles {
      right: 16px;
      bottom: 76px;
    }
  }
`;
