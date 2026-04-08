import { useEffect } from 'react';
import type { PreviewState } from './ConfigSection';

// ============================================================
// WidgetPreview
// Realistic live preview of the chat widget — no card wrapper.
// Uses a fixed scale so width/height changes are visually apparent.
// Sidebar positions render as edge-docked, full-height panels.
// ============================================================

// Dynamically load a Google Font by name
function loadGoogleFont(fontFamily: string) {
  if (!fontFamily || fontFamily.startsWith('-apple-system')) return;
  const id = `gfont-${fontFamily.replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;500;600&display=swap`;
  document.head.appendChild(link);
}

// Fixed scale: max width (480) fits comfortably in the 340px column
const FIXED_SCALE = 0.64;
const SIDEBAR_SCALE = 0.48;
const SIDEBAR_PREVIEW_HEIGHT = 500;

interface WidgetPreviewProps {
  chatbotName: string;
  state: PreviewState;
}

function WidgetPreview({ chatbotName, state }: WidgetPreviewProps) {
  // Load the selected Google Font
  useEffect(() => {
    loadGoogleFont(state.fontFamily);
  }, [state.fontFamily]);

  const isSidebar = state.position.includes('sidebar');
  const isLeft = state.position === 'left' || state.position === 'left-sidebar';

  const fontStack = state.fontFamily && !state.fontFamily.startsWith('-apple-system')
    ? `"${state.fontFamily}", -apple-system, BlinkMacSystemFont, sans-serif`
    : '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  const avatarContent = state.logoUrl
    ? <img src={state.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
    : <span style={{ fontSize: 18, lineHeight: 1 }}>{state.icon}</span>;

  // Font sizes relative to the base fontSize
  const fs = state.fontSize;
  const headerTitle = Math.round(fs * 1.07);
  const headerSub = Math.round(fs * 0.86);
  const welcomeTitle = Math.round(fs * 1.14);
  const welcomeBody = Math.round(fs * 0.93);
  const msgSize = fs;
  const pillSize = Math.round(fs * 0.71);

  // Panel border radius: no rounding on the docked edge for sidebar
  const panelRadius = isSidebar
    ? 0
    : 18;

  const panelHeight = isSidebar ? SIDEBAR_PREVIEW_HEIGHT / SIDEBAR_SCALE : state.height;
  const scale = isSidebar ? SIDEBAR_SCALE : FIXED_SCALE;

  // Scaled height for the wrapper
  const scaledHeight = isSidebar
    ? SIDEBAR_PREVIEW_HEIGHT + 20
    : (state.height + 68) * FIXED_SCALE;

  const panelWidth = isSidebar ? 300 : state.width;

  // The chat panel content (shared between both layouts)
  const chatPanel = (
    <div
      style={{
        background: '#fff',
        width: panelWidth,
        height: panelHeight,
        fontFamily: fontStack,
        color: state.textColor,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: panelRadius,
        overflow: 'hidden',
        boxShadow: isSidebar
          ? '4px 0 20px rgba(0,0,0,0.08)'
          : '0 20px 60px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.06)',
        ...(isSidebar ? {} : { marginBottom: 12 }),
      }}
    >
      {/* Header */}
      <div
        style={{
          background: state.headerColor,
          color: '#fff',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, overflow: 'hidden',
        }}>
          {avatarContent}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: headerTitle, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>
            {chatbotName}
          </div>
          <div style={{ fontSize: headerSub, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34c759', display: 'inline-block' }} />
            Ask me anything
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
        {/* Welcome */}
        <div style={{ textAlign: 'center', padding: '24px 16px' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>
            {state.logoUrl
              ? <img src={state.logoUrl} alt="" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: '50%', margin: '0 auto', display: 'block' }} />
              : state.icon}
          </div>
          <div style={{ fontSize: welcomeTitle, fontWeight: 600, color: state.textColor, marginBottom: 4 }}>
            {chatbotName}
          </div>
          <div style={{ fontSize: welcomeBody, color: state.textColor, opacity: 0.6, lineHeight: 1.5 }}>
            {state.welcome}
          </div>
        </div>

        {/* Sample messages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
          <div style={{
            alignSelf: 'flex-end',
            background: state.userBubbleColor,
            color: '#fff',
            padding: '10px 14px',
            borderRadius: '16px 16px 6px 16px',
            fontSize: msgSize,
            lineHeight: 1.45,
            maxWidth: '82%',
          }}>
            Hello!
          </div>
          <div style={{
            alignSelf: 'flex-start',
            background: state.assistantBubbleColor,
            color: state.textColor,
            padding: '10px 14px',
            borderRadius: '16px 16px 16px 6px',
            fontSize: msgSize,
            lineHeight: 1.45,
            maxWidth: '82%',
          }}>
            Hi there! How can I help you today?
          </div>
        </div>

        {/* Quick prompts preview */}
        {state.quickPrompts.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end', padding: '4px 0' }}>
            {state.quickPrompts.filter(qp => qp.title).slice(0, 3).map((qp, i) => (
              <span
                key={i}
                style={{
                  padding: '8px 16px',
                  borderRadius: 100,
                  fontSize: pillSize,
                  fontWeight: 500,
                  background: `linear-gradient(135deg, ${state.headerColor}, ${state.headerColor})`,
                  color: '#fff',
                  boxShadow: `0 2px 8px ${state.headerColor}40`,
                }}
              >
                {qp.title}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Input area */}
      <div style={{
        padding: '12px 16px 14px',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#f5f5f7',
          borderRadius: 14,
          padding: '4px 4px 4px 14px',
        }}>
          <span style={{ flex: 1, fontSize: msgSize, color: '#86868b' }}>
            Type a message...
          </span>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: state.headerColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0.35,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        padding: '6px 0 10px',
        fontSize: Math.round(fs * 0.79),
        color: '#86868b',
        flexShrink: 0,
      }}>
        Powered by <span style={{ fontWeight: 500, color: '#6e6e73' }}>Zephlo</span>
      </div>
    </div>
  );

  // Toggle button (shared)
  const toggleButton = (
    <div
      style={{
        width: 56, height: 56, borderRadius: '50%',
        background: state.logoUrl ? 'transparent' : state.headerColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: state.logoUrl
          ? '0 4px 20px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)'
          : `0 4px 20px ${state.headerColor}59, 0 2px 8px rgba(0,0,0,0.1)`,
        overflow: 'hidden',
      }}
    >
      {state.logoUrl ? (
        <img src={state.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
      ) : (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      )}
    </div>
  );

  // Sidebar layout: panel docked to edge with page content beside it
  if (isSidebar) {
    return (
      <div
        style={{ height: scaledHeight }}
        className="flex items-start justify-center"
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: isLeft ? 'top left' : 'top right',
            display: 'flex',
            flexDirection: isLeft ? 'row' : 'row-reverse',
            width: panelWidth + 120,
            position: 'relative',
          }}
        >
          {/* Docked panel */}
          {chatPanel}

          {/* Simulated page content beside the panel */}
          <div style={{
            flex: 1,
            background: '#f9f9f9',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: isLeft ? 'flex-start' : 'flex-end',
            padding: 16,
            minHeight: panelHeight,
          }}>
            {/* Greeting bubbles above toggle */}
            {state.greetingPrompts.length > 0 && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                alignItems: isLeft ? 'flex-start' : 'flex-end',
                marginBottom: 8,
              }}>
                {state.greetingPrompts.filter(gp => gp.title).slice(0, 3).map((gp, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 16,
                      fontSize: Math.round(fs * 0.86),
                      fontWeight: 500,
                      color: state.headerColor,
                      background: '#fff',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)',
                      maxWidth: 200,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      cursor: 'pointer',
                    }}
                  >
                    {gp.title}
                  </div>
                ))}
              </div>
            )}
            {/* Toggle at bottom corner */}
            {toggleButton}
          </div>
        </div>
      </div>
    );
  }

  // Default floating layout (bottom-left / bottom-right)
  return (
    <div
      style={{ height: scaledHeight }}
      className="flex items-end justify-center"
    >
      <div
        style={{
          transform: `scale(${FIXED_SCALE})`,
          transformOrigin: 'bottom center',
          width: state.width,
        }}
      >
        {chatPanel}
        {state.greetingPrompts.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            alignItems: isLeft ? 'flex-start' : 'flex-end',
            marginBottom: 8,
          }}>
            {state.greetingPrompts.filter(gp => gp.title).slice(0, 3).map((gp, i) => (
              <div
                key={i}
                style={{
                  padding: '8px 14px',
                  borderRadius: 16,
                  fontSize: Math.round(fs * 0.86),
                  fontWeight: 500,
                  color: state.headerColor,
                  background: '#fff',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)',
                  maxWidth: 200,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  cursor: 'pointer',
                }}
              >
                {gp.title}
              </div>
            ))}
          </div>
        )}
        <div style={{
          marginLeft: isLeft ? undefined : 'auto',
          marginRight: isLeft ? 'auto' : undefined,
          width: 'fit-content',
        }}>
          {toggleButton}
        </div>
      </div>
    </div>
  );
}

export default WidgetPreview;
