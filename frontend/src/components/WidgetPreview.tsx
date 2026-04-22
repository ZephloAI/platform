import { useEffect, useMemo, useRef } from 'react';
import { useChatbotPreviewKey } from '../hooks/useChatbots';
import { getWidgetApiUrl } from '../lib/appConfig';
import type { PreviewState } from './ConfigSection';

// Default origin used by the Zephlo widget when no apiUrl is configured.
// Mirrors DEFAULT_API_URL in widget/src/zephlo-core.ts.
const DEFAULT_WIDGET_API_URL = 'https://app.zephlo.ai';

// ============================================================
// WidgetPreview
// Live <zephlo-chat> instance running inside an isolated iframe.
// Color, font family, font size, and text color updates are pushed
// to the iframe via postMessage and applied as CSS variable
// overrides inside the widget's shadow DOM.
//
// Position, width/height, welcome message, prompts, and logo are
// intentionally NOT reflected here — they're saved to the live
// widget config when the user clicks Save.
// ============================================================

interface WidgetPreviewProps {
  chatbotId: string;
  state: PreviewState;
}

const PREVIEW_FRAME_HEIGHT = 560;

function WidgetPreview({ chatbotId, state }: WidgetPreviewProps) {
  const { data: previewKey, isLoading, isError } = useChatbotPreviewKey(chatbotId);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const readyRef = useRef(false);

  const apiOrigin = getWidgetApiUrl() ?? DEFAULT_WIDGET_API_URL;
  // The iframe still needs to load /widget/zephlo.js from somewhere; that
  // file is served by the dashboard's frontend container, so use the current
  // page origin for the script source regardless of where the API lives.
  const scriptOrigin = window.location.origin;

  // Build the iframe HTML once per chatbot/key — re-mounting the iframe is
  // expensive (full widget re-init + new chat session), so we keep it stable
  // and push style updates via postMessage instead.
  const srcDoc = useMemo(() => {
    if (!previewKey) return '';
    return buildIframeHtml({
      scriptOrigin,
      apiOrigin,
      apiKey: previewKey.key,
      chatbotId,
    });
  }, [scriptOrigin, apiOrigin, previewKey, chatbotId]);

  // Push current colors to the iframe. Sent on every state change AND on
  // initial "ready" handshake so the widget paints with the right colors
  // from the first frame.
  useEffect(() => {
    function postOverrides() {
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: 'zephlo-preview-style',
          css: buildOverrideCss(state),
        },
        '*',
      );
    }

    function onMessage(e: MessageEvent) {
      if (e.source !== iframeRef.current?.contentWindow) return;
      if (e.data?.type === 'zephlo-preview-ready') {
        readyRef.current = true;
        postOverrides();
      }
    }
    window.addEventListener('message', onMessage);

    if (readyRef.current) postOverrides();

    return () => window.removeEventListener('message', onMessage);
  }, [state]);

  // Reset readiness when iframe is replaced
  useEffect(() => {
    readyRef.current = false;
  }, [srcDoc]);

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-separator flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-sage-500" />
        <span className="text-[12px] font-medium text-label-secondary">Live preview</span>
      </div>
      <div className="bg-surface-secondary" style={{ height: PREVIEW_FRAME_HEIGHT }}>
        {isLoading && (
          <div className="h-full flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
          </div>
        )}
        {isError && (
          <div className="h-full flex items-center justify-center px-6 text-center">
            <p className="text-[12px] text-label-tertiary">
              Couldn't load the live preview. Try refreshing the page.
            </p>
          </div>
        )}
        {!isLoading && !isError && srcDoc && (
          <iframe
            ref={iframeRef}
            title="Widget preview"
            srcDoc={srcDoc}
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-full border-0 bg-transparent"
          />
        )}
      </div>
      <div className="px-4 py-2 border-t border-separator">
        <p className="text-[11px] text-label-quaternary">
          Position, size, and prompts apply to your deployed widget — not shown here.
        </p>
      </div>
    </div>
  );
}

function buildOverrideCss(state: PreviewState): string {
  const fontStack = state.fontFamily && !state.fontFamily.startsWith('-apple-system')
    ? `"${state.fontFamily}", -apple-system, BlinkMacSystemFont, sans-serif`
    : '';
  // Force the panel to fill its host (the iframe body) regardless of the
  // chatbot's saved widget_width/widget_height — the preview frame controls
  // sizing here.
  return `
    :host {
      --cb-accent: ${state.headerColor};
      --cb-accent-hover: ${state.headerColor};
      --cb-user-bubble: ${state.userBubbleColor};
      --cb-assistant-bubble: ${state.assistantBubbleColor};
      --cb-text: ${state.textColor};
      --cb-panel-width: 100%;
      --cb-panel-height: 100%;
      --cb-font-size: ${state.fontSize}px;
      ${fontStack ? `--cb-font: ${fontStack};` : ''}
    }
  `;
}

function buildIframeHtml(opts: {
  scriptOrigin: string;
  apiOrigin: string;
  apiKey: string;
  chatbotId: string;
}): string {
  // The widget script is served by the frontend at /widget/zephlo.js.
  // We initialize Zephlo with the dashboard's preview API key and mount
  // <zephlo-chat>. A small bridge listens for postMessage from the parent
  // to update CSS variable overrides inside the widget shadow root.
  const escaped = (s: string) => s.replace(/</g, '\\u003c');
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body { margin: 0; padding: 0; height: 100%; background: transparent; }
      body { display: block; }
      zephlo-chat {
        display: block !important;
        width: 100% !important;
        height: 100% !important;
        box-sizing: border-box;
      }
    </style>
  </head>
  <body>
    <zephlo-chat width="100%" height="100%"></zephlo-chat>
    <script src="${escaped(opts.scriptOrigin)}/widget/zephlo.js"></script>
    <script>
      (function () {
        var OVERRIDE_ID = 'zephlo-preview-overrides';

        Zephlo.initialize({
          key: ${JSON.stringify(opts.apiKey)},
          chatbotId: ${JSON.stringify(opts.chatbotId)},
          apiUrl: ${JSON.stringify(opts.apiOrigin)}
        });

        function applyOverrides(css) {
          var chat = document.querySelector('zephlo-chat');
          if (!chat || !chat.shadowRoot) return false;
          var styleEl = chat.shadowRoot.getElementById(OVERRIDE_ID);
          if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = OVERRIDE_ID;
            chat.shadowRoot.appendChild(styleEl);
          }
          styleEl.textContent = css;
          return true;
        }

        var pending = null;
        window.addEventListener('message', function (e) {
          if (!e.data || e.data.type !== 'zephlo-preview-style') return;
          pending = e.data.css;
          if (!applyOverrides(pending)) {
            // Shadow DOM not ready yet — retry on the next animation frame.
            var retry = function () {
              if (applyOverrides(pending)) return;
              requestAnimationFrame(retry);
            };
            requestAnimationFrame(retry);
          }
        });

        // Tell the parent we're ready so it can send the initial overrides.
        function announceReady() {
          parent.postMessage({ type: 'zephlo-preview-ready' }, '*');
        }
        if (document.readyState === 'complete') announceReady();
        else window.addEventListener('load', announceReady);
      })();
    </script>
  </body>
</html>`;
}

export default WidgetPreview;
