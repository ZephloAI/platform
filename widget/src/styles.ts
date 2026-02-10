/**
 * All widget styles live here. They're injected into the Shadow DOM
 * so they never leak into or get affected by the host page's CSS.
 */

export const WIDGET_STYLES = /* css */ `
  :host {
    --cb-accent: #0071e3;
    --cb-accent-hover: #0077ed;
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

    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
    font-family: var(--cb-font);
    font-size: 14px;
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
                background-color 0.2s;
    position: absolute;
    bottom: 0;
    right: 0;
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

  /* ---- Chat Panel ---- */
  .cb-panel {
    position: absolute;
    bottom: 72px;
    right: 0;
    width: 380px;
    height: 520px;
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

  /* ---- Header ---- */
  .cb-header {
    padding: 18px 20px;
    background: var(--cb-bg);
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
    background: linear-gradient(135deg, var(--cb-accent), #34c759);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
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
    color: var(--cb-text-tertiary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background-color 0.2s, color 0.2s, transform 0.15s;
  }

  .cb-new-chat-btn:hover {
    background: var(--cb-bg-secondary);
    color: var(--cb-text);
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
    color: var(--cb-text);
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .cb-header-subtitle {
    font-size: 12px;
    color: var(--cb-text-tertiary);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .cb-online-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #34c759;
  }

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
    font-size: 14px;
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
    background: var(--cb-accent);
    color: white;
    border-bottom-right-radius: 6px;
  }

  .cb-message.assistant {
    align-self: flex-start;
    background: var(--cb-bg-secondary);
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
    background: var(--cb-bg-secondary);
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
  }

  .cb-input-row {
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
    font-size: 14px;
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

  /* ---- Quick Prompts ---- */
  .cb-quick-prompts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    padding: 0 16px 4px;
  }

  .cb-quick-prompt {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 8px 16px;
    background: var(--cb-bg);
    border: 1px solid var(--cb-border);
    border-radius: 100px;
    font-family: var(--cb-font);
    font-size: 13px;
    font-weight: 500;
    color: var(--cb-text);
    cursor: pointer;
    white-space: nowrap;
    transition: background-color 0.2s, border-color 0.2s, transform 0.15s, box-shadow 0.2s;
    letter-spacing: -0.01em;
  }

  .cb-quick-prompt:hover {
    background: var(--cb-bg-secondary);
    border-color: rgba(0, 0, 0, 0.1);
    transform: scale(1.02);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .cb-quick-prompt:active {
    transform: scale(0.97);
  }

  .cb-quick-prompt svg {
    width: 12px;
    height: 12px;
    color: var(--cb-text-tertiary);
  }

  .cb-input-prompts {
    flex-shrink: 0;
    padding: 8px 0 0;
  }

  .cb-input-prompts:empty {
    display: none;
  }

  /* ---- Responsive: full-screen on small viewports ---- */
  @media (max-width: 440px) {
    :host {
      bottom: 0;
      right: 0;
      left: 0;
    }

    .cb-panel {
      width: 100vw;
      height: 100vh;
      height: 100dvh;
      bottom: 0;
      right: 0;
      border-radius: 0;
    }

    .cb-panel.open ~ .cb-toggle {
      opacity: 0;
      pointer-events: none;
    }
  }
`;
