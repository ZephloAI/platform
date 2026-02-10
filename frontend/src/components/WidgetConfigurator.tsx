import { useState, useEffect } from 'react';
import { useUpdateWidgetSettings } from '../hooks/useChatbots';
import type { Chatbot, QuickPrompt } from '../types';

// ============================================================
// WidgetConfigurator
// Lets users customize their chat widget appearance.
// Changes auto-save on apply.
// ============================================================

const ICON_OPTIONS = [
  { value: '🤖', label: 'Robot' },
  { value: '💬', label: 'Chat' },
  { value: '💡', label: 'Idea' },
  { value: '⭐', label: 'Star' },
  { value: '🎯', label: 'Target' },
  { value: '📚', label: 'Books' },
  { value: '🛟', label: 'Support' },
  { value: '🎨', label: 'Creative' },
];

interface WidgetConfiguratorProps {
  chatbot: Chatbot;
}

function WidgetConfigurator({ chatbot }: WidgetConfiguratorProps) {
  const updateMutation = useUpdateWidgetSettings();

  const [icon, setIcon] = useState(chatbot.widget_icon || '🤖');
  const [welcome, setWelcome] = useState(
    chatbot.widget_welcome || 'Hi! How can I help you today?'
  );
  const [position, setPosition] = useState<'right' | 'left'>(
    (chatbot.widget_position as 'right' | 'left') || 'right'
  );
  const [quickPrompts, setQuickPrompts] = useState<QuickPrompt[]>(
    chatbot.quick_prompts || []
  );
  // Sync from chatbot when it updates (e.g. after save + refetch)
  useEffect(() => {
    if (chatbot.widget_icon !== null) setIcon(chatbot.widget_icon);
    if (chatbot.widget_welcome !== null) setWelcome(chatbot.widget_welcome);
    if (chatbot.widget_position !== null)
      setPosition(chatbot.widget_position as 'right' | 'left');
    if (chatbot.quick_prompts) setQuickPrompts(chatbot.quick_prompts);
  }, [chatbot.widget_icon, chatbot.widget_welcome, chatbot.widget_position, chatbot.quick_prompts]);

  const hasChanges =
    icon !== (chatbot.widget_icon || '🤖') ||
    welcome !== (chatbot.widget_welcome || 'Hi! How can I help you today?') ||
    position !== ((chatbot.widget_position as 'right' | 'left') || 'right') ||
    JSON.stringify(quickPrompts) !== JSON.stringify(chatbot.quick_prompts || []);

  const handleSave = () => {
    updateMutation.mutate({
      chatbotId: chatbot.id,
      settings: {
        widget_icon: icon,
        widget_welcome: welcome,
        widget_position: position,
        quick_prompts: quickPrompts,
      },
    });
  };

  const addQuickPrompt = () => {
    setQuickPrompts([...quickPrompts, { title: '', prompt: '' }]);
  };

  const removeQuickPrompt = (index: number) => {
    setQuickPrompts(quickPrompts.filter((_, i) => i !== index));
  };

  const updateQuickPrompt = (index: number, field: keyof QuickPrompt, value: string) => {
    const updated = [...quickPrompts];
    const current = updated[index];
    if (!current) return;
    if (field === 'title') {
      updated[index] = { ...current, title: value };
    } else {
      updated[index] = { ...current, [field]: value || undefined };
    }
    setQuickPrompts(updated);
  };

  const toggleQuickPromptType = (index: number) => {
    const updated = [...quickPrompts];
    const item = updated[index];
    if (!item) return;
    if (item.link !== undefined && item.link !== null) {
      updated[index] = { title: item.title, prompt: item.link || '' };
    } else {
      updated[index] = { title: item.title, link: item.prompt || '' };
    }
    setQuickPrompts(updated);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Widget Preview */}
      <div className="glass-card p-6">
        <h3 className="text-[13px] font-medium text-label-tertiary uppercase tracking-wider mb-4">
          Preview
        </h3>
        <div className="bg-surface-secondary/60 rounded-2xl p-6 flex items-end justify-center"
          style={{ minHeight: 200 }}
        >
          {/* Mini preview of the widget */}
          <div className="relative w-full max-w-[300px]">
            {/* Chat panel preview */}
            <div className="bg-white rounded-2xl shadow-lg border border-black/[0.06] overflow-hidden mb-3">
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-black/[0.04]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-[16px] shrink-0">
                  {icon}
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-label-primary">
                    {chatbot.name}
                  </div>
                  <div className="text-[11px] text-label-tertiary flex items-center gap-1">
                    <span className="w-[5px] h-[5px] rounded-full bg-green-500" />
                    Ask me anything
                  </div>
                </div>
              </div>
              {/* Welcome */}
              <div className="px-4 py-5 text-center">
                <div className="text-[20px] mb-1">{icon}</div>
                <div className="text-[13px] font-semibold text-label-primary mb-0.5">
                  {chatbot.name}
                </div>
                <div className="text-[12px] text-label-secondary leading-relaxed">
                  {welcome}
                </div>
                {quickPrompts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                    {quickPrompts.filter(qp => qp.title).map((qp, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-black/[0.04] text-label-secondary"
                      >
                        {qp.link !== undefined && qp.link !== null ? (
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                        ) : (
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                          </svg>
                        )}
                        {qp.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Toggle button preview */}
            <div
              className={`w-12 h-12 rounded-full bg-accent flex items-center justify-center shadow-lg ${
                position === 'right' ? 'ml-auto' : 'mr-auto'
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <div className="glass-card p-6 space-y-5">
        <h3 className="text-[13px] font-medium text-label-tertiary uppercase tracking-wider">
          Customize
        </h3>

        {/* Icon selector */}
        <div>
          <label className="input-label">Icon</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {ICON_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setIcon(opt.value)}
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-[20px] transition-all duration-200 border-2 ${
                  icon === opt.value
                    ? 'border-accent bg-accent/[0.06] scale-110 shadow-sm'
                    : 'border-transparent bg-surface-secondary/60 hover:bg-surface-secondary'
                }`}
                title={opt.label}
              >
                {opt.value}
              </button>
            ))}
          </div>
        </div>

        {/* Welcome message */}
        <div>
          <label htmlFor="widget-welcome" className="input-label">
            Welcome Message
          </label>
          <textarea
            id="widget-welcome"
            value={welcome}
            onChange={(e) => setWelcome(e.target.value)}
            rows={2}
            className="input-field resize-none"
            placeholder="Hi! How can I help you today?"
          />
        </div>

        {/* Position toggle */}
        <div>
          <label className="input-label">Position</label>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={() => setPosition('left')}
              className={`flex-1 px-4 py-2.5 text-[13px] font-medium rounded-lg border-2 transition-all duration-200 flex items-center justify-center gap-2 ${
                position === 'left'
                  ? 'border-accent bg-accent/[0.06] text-accent'
                  : 'border-transparent bg-surface-secondary/60 text-label-secondary hover:bg-surface-secondary'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8" cy="18" r="2" fill="currentColor" />
              </svg>
              Bottom Left
            </button>
            <button
              type="button"
              onClick={() => setPosition('right')}
              className={`flex-1 px-4 py-2.5 text-[13px] font-medium rounded-lg border-2 transition-all duration-200 flex items-center justify-center gap-2 ${
                position === 'right'
                  ? 'border-accent bg-accent/[0.06] text-accent'
                  : 'border-transparent bg-surface-secondary/60 text-label-secondary hover:bg-surface-secondary'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="16" cy="18" r="2" fill="currentColor" />
              </svg>
              Bottom Right
            </button>
          </div>
        </div>

        {/* Quick Prompts */}
        <div>
          <label className="input-label">Quick Prompts</label>
          <p className="text-[11px] text-label-tertiary mb-3">
            Add buttons that visitors can click to navigate or start a conversation.
          </p>
          <div className="space-y-3">
            {quickPrompts.map((qp, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={qp.title}
                    onChange={(e) => updateQuickPrompt(i, 'title', e.target.value)}
                    placeholder="Button label"
                    className="input-field text-[13px]"
                  />
                  <div className="flex gap-2 items-center">
                    <button
                      type="button"
                      onClick={() => toggleQuickPromptType(i)}
                      className={`shrink-0 px-2.5 py-1.5 text-[11px] font-medium rounded-lg border transition-all duration-200 ${
                        qp.link !== undefined && qp.link !== null
                          ? 'border-blue-200 bg-blue-50 text-blue-600'
                          : 'border-purple-200 bg-purple-50 text-purple-600'
                      }`}
                    >
                      {qp.link !== undefined && qp.link !== null ? 'Link' : 'Prompt'}
                    </button>
                    <input
                      type="text"
                      value={(qp.link !== undefined && qp.link !== null ? qp.link : qp.prompt) || ''}
                      onChange={(e) =>
                        updateQuickPrompt(
                          i,
                          qp.link !== undefined && qp.link !== null ? 'link' : 'prompt',
                          e.target.value
                        )
                      }
                      placeholder={
                        qp.link !== undefined && qp.link !== null
                          ? 'https://example.com'
                          : 'Message to send...'
                      }
                      className="input-field text-[13px] flex-1"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeQuickPrompt(i)}
                  className="mt-1 w-8 h-8 rounded-lg flex items-center justify-center text-label-tertiary hover:bg-red-50 hover:text-red-500 transition-all duration-200"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          {quickPrompts.length < 10 && (
            <button
              type="button"
              onClick={addQuickPrompt}
              className="mt-3 w-full px-4 py-2.5 text-[13px] font-medium rounded-lg border-2 border-dashed border-separator text-label-secondary hover:border-accent hover:text-accent transition-all duration-200 flex items-center justify-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Quick Prompt
            </button>
          )}
        </div>

        {/* Save button */}
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="btn-primary w-full"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        )}

        {updateMutation.isSuccess && !hasChanges && (
          <p className="text-[12px] text-green-600 text-center">
            Settings saved successfully.
          </p>
        )}

        {updateMutation.isError && (
          <p className="text-[12px] text-red-500 text-center">
            Failed to save settings. Please try again.
          </p>
        )}
      </div>

    </div>
  );
}

export default WidgetConfigurator;
