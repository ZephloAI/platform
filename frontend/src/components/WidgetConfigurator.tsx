import { useState, useEffect, useRef } from 'react';
import { useUpdateWidgetSettings, useUploadLogo } from '../hooks/useChatbots';
import type { Chatbot, QuickPrompt, FollowUpPrompt, GreetingPrompt } from '../types';
import type { PreviewState } from './ConfigSection';

// ============================================================
// WidgetConfigurator
// Tabbed form for customizing the chat widget.
// Three tabs: Appearance, Quick Prompts, Follow-Up Prompts.
// Reports state changes to parent via onPreviewChange for live preview.
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

const FONT_OPTIONS = [
  { value: '', label: 'System Default' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro' },
];

type Tab = 'appearance' | 'quick-prompts' | 'follow-up-prompts' | 'greeting-prompts';

interface WidgetConfiguratorProps {
  chatbot: Chatbot;
  activeTab: Tab;
  onPreviewChange: (state: PreviewState) => void;
}

function WidgetConfigurator({ chatbot, activeTab, onPreviewChange }: WidgetConfiguratorProps) {
  const updateMutation = useUpdateWidgetSettings();
  const uploadLogoMutation = useUploadLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track which prompt is being edited (null = all collapsed)
  const [editingQuickPrompt, setEditingQuickPrompt] = useState<number | null>(null);
  const [editingFollowUpPrompt, setEditingFollowUpPrompt] = useState<number | null>(null);
  const [editingGreetingPrompt, setEditingGreetingPrompt] = useState<number | null>(null);

  // Existing state
  const [icon, setIcon] = useState(chatbot.widget_icon || '🤖');
  const [welcome, setWelcome] = useState(
    chatbot.widget_welcome || 'Hi! How can I help you today?'
  );
  const [position, setPosition] = useState<'right' | 'left' | 'right-sidebar' | 'left-sidebar'>(
    (chatbot.widget_position as 'right' | 'left' | 'right-sidebar' | 'left-sidebar') || 'right'
  );
  const [quickPrompts, setQuickPrompts] = useState<QuickPrompt[]>(
    chatbot.quick_prompts || []
  );
  const [followUpPrompts, setFollowUpPrompts] = useState<FollowUpPrompt[]>(
    chatbot.follow_up_prompts || []
  );
  const [greetingPrompts, setGreetingPrompts] = useState<GreetingPrompt[]>(
    chatbot.greeting_prompts || []
  );
  const [greetingPromptDuration, setGreetingPromptDuration] = useState<number>(
    chatbot.greeting_prompt_duration || 0
  );

  // Styling state
  const [logoUrl, setLogoUrl] = useState<string | null>(chatbot.widget_logo_url || null);
  const [headerColor, setHeaderColor] = useState(chatbot.widget_header_color || '#0071e3');
  const [userBubbleColor, setUserBubbleColor] = useState(chatbot.widget_user_bubble_color || '#0071e3');
  const [assistantBubbleColor, setAssistantBubbleColor] = useState(chatbot.widget_assistant_bubble_color || '#f5f5f7');
  const [fontFamily, setFontFamily] = useState(chatbot.widget_font_family || '');
  const [fontSize, setFontSize] = useState(chatbot.widget_font_size || 14);
  const [textColor, setTextColor] = useState(chatbot.widget_text_color || '#1d1d1f');
  const [width, setWidth] = useState(chatbot.widget_width || 380);
  const [height, setHeight] = useState(chatbot.widget_height || 520);
  const [voiceEnabled, setVoiceEnabled] = useState(chatbot.voice_enabled || false);

  // Sync from chatbot when it updates (e.g. after save + refetch)
  useEffect(() => {
    if (chatbot.widget_icon !== null) setIcon(chatbot.widget_icon);
    if (chatbot.widget_welcome !== null) setWelcome(chatbot.widget_welcome);
    if (chatbot.widget_position !== null)
      setPosition(chatbot.widget_position as 'right' | 'left' | 'right-sidebar' | 'left-sidebar');
    if (chatbot.quick_prompts) setQuickPrompts(chatbot.quick_prompts);
    if (chatbot.follow_up_prompts) setFollowUpPrompts(chatbot.follow_up_prompts);
    if (chatbot.greeting_prompts) setGreetingPrompts(chatbot.greeting_prompts);
    if (chatbot.greeting_prompt_duration !== undefined) setGreetingPromptDuration(chatbot.greeting_prompt_duration || 0);
    if (chatbot.widget_logo_url !== undefined) setLogoUrl(chatbot.widget_logo_url || null);
    if (chatbot.widget_header_color) setHeaderColor(chatbot.widget_header_color);
    if (chatbot.widget_user_bubble_color) setUserBubbleColor(chatbot.widget_user_bubble_color);
    if (chatbot.widget_assistant_bubble_color) setAssistantBubbleColor(chatbot.widget_assistant_bubble_color);
    if (chatbot.widget_font_family !== undefined) setFontFamily(chatbot.widget_font_family || '');
    if (chatbot.widget_font_size) setFontSize(chatbot.widget_font_size);
    if (chatbot.widget_text_color) setTextColor(chatbot.widget_text_color);
    if (chatbot.widget_width) setWidth(chatbot.widget_width);
    if (chatbot.widget_height) setHeight(chatbot.widget_height);
    if (chatbot.voice_enabled !== undefined) setVoiceEnabled(chatbot.voice_enabled || false);
  }, [
    chatbot.widget_icon, chatbot.widget_welcome, chatbot.widget_position,
    chatbot.quick_prompts, chatbot.follow_up_prompts, chatbot.greeting_prompts, chatbot.greeting_prompt_duration, chatbot.widget_logo_url,
    chatbot.widget_header_color, chatbot.widget_user_bubble_color, chatbot.widget_assistant_bubble_color,
    chatbot.widget_font_family, chatbot.widget_font_size, chatbot.widget_text_color,
    chatbot.widget_width, chatbot.widget_height, chatbot.voice_enabled,
  ]);

  // Sync preview state to parent
  useEffect(() => {
    onPreviewChange({
      icon,
      welcome,
      position,
      quickPrompts,
      greetingPrompts,
      greetingPromptDuration,
      logoUrl,
      headerColor,
      userBubbleColor,
      assistantBubbleColor,
      fontFamily: fontFamily || '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
      fontSize,
      textColor,
      width,
      height,
    });
  }, [icon, welcome, position, quickPrompts, greetingPrompts, greetingPromptDuration, logoUrl, headerColor, userBubbleColor, assistantBubbleColor, fontFamily, fontSize, textColor, width, height, voiceEnabled]);

  const hasChanges =
    icon !== (chatbot.widget_icon || '🤖') ||
    welcome !== (chatbot.widget_welcome || 'Hi! How can I help you today?') ||
    position !== ((chatbot.widget_position as typeof position) || 'right') ||
    JSON.stringify(quickPrompts) !== JSON.stringify(chatbot.quick_prompts || []) ||
    JSON.stringify(followUpPrompts) !== JSON.stringify(chatbot.follow_up_prompts || []) ||
    JSON.stringify(greetingPrompts) !== JSON.stringify(chatbot.greeting_prompts || []) ||
    greetingPromptDuration !== (chatbot.greeting_prompt_duration || 0) ||
    logoUrl !== (chatbot.widget_logo_url || null) ||
    headerColor !== (chatbot.widget_header_color || '#0071e3') ||
    userBubbleColor !== (chatbot.widget_user_bubble_color || '#0071e3') ||
    assistantBubbleColor !== (chatbot.widget_assistant_bubble_color || '#f5f5f7') ||
    fontFamily !== (chatbot.widget_font_family || '') ||
    fontSize !== (chatbot.widget_font_size || 14) ||
    textColor !== (chatbot.widget_text_color || '#1d1d1f') ||
    width !== (chatbot.widget_width || 380) ||
    height !== (chatbot.widget_height || 520) ||
    voiceEnabled !== (chatbot.voice_enabled || false);

  const handleSave = () => {
    updateMutation.mutate({
      chatbotId: chatbot.id,
      settings: {
        widget_icon: icon,
        widget_welcome: welcome,
        widget_position: position,
        quick_prompts: quickPrompts,
        follow_up_prompts: followUpPrompts,
        greeting_prompts: greetingPrompts,
        greeting_prompt_duration: greetingPromptDuration,
        widget_logo_url: logoUrl,
        widget_width: width,
        widget_height: height,
        widget_header_color: headerColor,
        widget_user_bubble_color: userBubbleColor,
        widget_assistant_bubble_color: assistantBubbleColor,
        widget_font_family: fontFamily || null,
        widget_font_size: fontSize,
        widget_text_color: textColor,
        voice_enabled: voiceEnabled,
      },
    });
  };

  const handleLogoUpload = (file: File) => {
    uploadLogoMutation.mutate(
      { chatbotId: chatbot.id, file },
      {
        onSuccess: (data) => {
          setLogoUrl(data.url);
        },
      }
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleLogoUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleLogoUpload(file);
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

  const addFollowUpPrompt = () => {
    setFollowUpPrompts([...followUpPrompts, { title: '', description: '', prompt: '' }]);
  };

  const removeFollowUpPrompt = (index: number) => {
    setFollowUpPrompts(followUpPrompts.filter((_, i) => i !== index));
  };

  const updateFollowUpPrompt = (index: number, field: keyof FollowUpPrompt, value: string) => {
    const updated = [...followUpPrompts];
    const current = updated[index];
    if (!current) return;
    if (field === 'title' || field === 'description') {
      updated[index] = { ...current, [field]: value };
    } else {
      updated[index] = { ...current, [field]: value || undefined };
    }
    setFollowUpPrompts(updated);
  };

  const toggleFollowUpPromptType = (index: number) => {
    const updated = [...followUpPrompts];
    const item = updated[index];
    if (!item) return;
    if (item.link !== undefined && item.link !== null) {
      updated[index] = { ...item, link: undefined, prompt: item.link || '' };
    } else {
      updated[index] = { ...item, prompt: undefined, link: item.prompt || '' };
    }
    setFollowUpPrompts(updated);
  };

  const addGreetingPrompt = () => {
    setGreetingPrompts([...greetingPrompts, { title: '', prompt: '' }]);
  };

  const removeGreetingPrompt = (index: number) => {
    setGreetingPrompts(greetingPrompts.filter((_, i) => i !== index));
  };

  const updateGreetingPrompt = (index: number, field: 'title' | 'prompt', value: string) => {
    const updated = [...greetingPrompts];
    const current = updated[index];
    if (!current) return;
    updated[index] = { ...current, [field]: value };
    setGreetingPrompts(updated);
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
    <div className="space-y-5">
      {/* ============ Appearance Tab ============ */}
      {activeTab === 'appearance' && (
        <div className="space-y-5">
          {/* Logo Upload */}
          <div className="card p-5">
            <h3 className="text-[14px] font-display font-semibold text-label-primary mb-4">
              Logo
            </h3>
            {logoUrl ? (
              <div className="flex items-center gap-4">
                <img
                  src={logoUrl}
                  alt="Widget logo"
                  className="w-16 h-16 rounded-2xl object-cover border border-black/[0.06]"
                />
                <button
                  type="button"
                  onClick={() => setLogoUrl(null)}
                  className="px-3 py-1.5 text-[12px] font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-separator rounded-2xl p-8 text-center cursor-pointer hover:border-accent hover:bg-accent/[0.02] transition-all duration-200"
              >
                <svg className="mx-auto mb-2 text-label-tertiary" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className="text-[13px] text-label-secondary">
                  Drop an image here or click to upload
                </p>
                <p className="text-[11px] text-label-tertiary mt-1">
                  PNG, JPG up to 2MB
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            {uploadLogoMutation.isPending && (
              <p className="text-[12px] text-label-tertiary mt-2">Uploading...</p>
            )}
          </div>

          {/* Icon */}
          <div className="card p-5">
            <h3 className="text-[14px] font-display font-semibold text-label-primary mb-4">
              Icon
            </h3>
            <div className="flex flex-wrap gap-2">
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

          {/* Colors */}
          <div className="card p-5">
            <h3 className="text-[14px] font-display font-semibold text-label-primary mb-4">
              Colors
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Header Color', value: headerColor, onChange: setHeaderColor },
                { label: 'User Message Color', value: userBubbleColor, onChange: setUserBubbleColor },
                { label: 'Assistant Message Color', value: assistantBubbleColor, onChange: setAssistantBubbleColor },
                { label: 'Text Color', value: textColor, onChange: setTextColor },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-[13px] text-label-primary">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-label-tertiary font-mono">{item.value}</span>
                    <label className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-black/[0.06] cursor-pointer shadow-sm hover:shadow-md transition-shadow">
                      <input
                        type="color"
                        value={item.value}
                        onChange={(e) => item.onChange(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="w-full h-full rounded-full" style={{ background: item.value }} />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div className="card p-5 space-y-5">
            <h3 className="text-[14px] font-display font-semibold text-label-primary">
              Typography
            </h3>
            <div>
              <label htmlFor="font-family" className="input-label">Font Family</label>
              <select
                id="font-family"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="input-field text-[13px]"
              >
                {FONT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">
                Font Size: {fontSize}px
              </label>
              <input
                type="range"
                min={12}
                max={20}
                step={1}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full mt-1 accent-[var(--color-accent)]"
              />
              <div className="flex justify-between text-[11px] text-label-tertiary mt-0.5">
                <span>12px</span>
                <span>20px</span>
              </div>
            </div>
          </div>

          {/* Dimensions */}
          <div className="card p-5 space-y-5">
            <h3 className="text-[14px] font-display font-semibold text-label-primary">
              Dimensions
            </h3>
            {position.includes('sidebar') ? (
              <p className="text-[12px] text-label-tertiary">
                Sidebar uses full viewport height and a fixed width.
              </p>
            ) : (
              <>
                <div>
                  <label className="input-label">Width: {width}px</label>
                  <input
                    type="range"
                    min={240}
                    max={480}
                    step={10}
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    className="w-full mt-1 accent-[var(--color-accent)]"
                  />
                  <div className="flex justify-between text-[11px] text-label-tertiary mt-0.5">
                    <span>240px</span>
                    <span>480px</span>
                  </div>
                </div>
                <div>
                  <label className="input-label">Height: {height}px</label>
                  <input
                    type="range"
                    min={400}
                    max={700}
                    step={10}
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="w-full mt-1 accent-[var(--color-accent)]"
                  />
                  <div className="flex justify-between text-[11px] text-label-tertiary mt-0.5">
                    <span>400px</span>
                    <span>700px</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Position & Welcome */}
          <div className="card p-5 space-y-5">
            <h3 className="text-[14px] font-display font-semibold text-label-primary">
              Layout
            </h3>
            <div>
              <label className="input-label">Position</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {([
                  { value: 'left' as const, label: 'Bottom Left', icon: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8" cy="18" r="2" fill="currentColor" />
                    </svg>
                  )},
                  { value: 'right' as const, label: 'Bottom Right', icon: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="16" cy="18" r="2" fill="currentColor" />
                    </svg>
                  )},
                  { value: 'left-sidebar' as const, label: 'Left Sidebar', icon: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="3" y1="3" x2="3" y2="21" strokeWidth="3" />
                      <circle cx="8" cy="18" r="2" fill="currentColor" />
                    </svg>
                  )},
                  { value: 'right-sidebar' as const, label: 'Right Sidebar', icon: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="21" y1="3" x2="21" y2="21" strokeWidth="3" />
                      <circle cx="16" cy="18" r="2" fill="currentColor" />
                    </svg>
                  )},
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPosition(opt.value)}
                    className={`px-3 py-2.5 text-[12px] font-medium rounded-lg border-2 transition-all duration-200 flex items-center justify-center gap-1.5 ${
                      position === opt.value
                        ? 'border-accent bg-accent/[0.06] text-accent'
                        : 'border-transparent bg-surface-secondary/60 text-label-secondary hover:bg-surface-secondary'
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
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
          </div>

          {/* Voice */}
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-display font-semibold text-label-primary">
                  Voice
                </h3>
                <p className="text-[12px] text-label-tertiary mt-1">
                  Allow visitors to use their microphone to speak to the agent and hear spoken responses.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={voiceEnabled}
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`relative inline-flex h-[28px] w-[50px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  voiceEnabled ? 'bg-[#34c759]' : 'bg-surface-tertiary'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-[24px] w-[24px] transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    voiceEnabled ? 'translate-x-[22px]' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ Quick Prompts Tab ============ */}
      {activeTab === 'quick-prompts' && (
        <div className="card p-5 space-y-5">
          <div>
            <h3 className="text-[14px] font-display font-semibold text-label-primary">
              Quick Prompts
            </h3>
            <p className="text-[12px] text-label-tertiary mt-1">
              Add buttons that visitors can click to navigate or start a conversation.
            </p>
          </div>
          <div className="space-y-2">
            {quickPrompts.map((qp, i) => (
              <div key={i} className="rounded-xl border border-separator bg-surface-secondary/30 overflow-hidden transition-all duration-200">
                {/* Collapsed card */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className={`shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                    qp.link !== undefined && qp.link !== null
                      ? 'bg-blue-50 text-blue-500'
                      : 'bg-purple-50 text-purple-500'
                  }`}>
                    {qp.link !== undefined && qp.link !== null ? 'LINK' : 'PROMPT'}
                  </span>
                  <span className="flex-1 text-[13px] font-medium text-label-primary truncate">
                    {qp.title || 'Untitled'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingQuickPrompt(editingQuickPrompt === i ? null : i)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-label-tertiary hover:bg-accent/[0.08] hover:text-accent transition-all duration-200"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => { removeQuickPrompt(i); setEditingQuickPrompt(null); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-label-tertiary hover:bg-red-50 hover:text-red-500 transition-all duration-200"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                {/* Expanded edit area */}
                {editingQuickPrompt === i && (
                  <div className="px-4 pb-4 pt-1 space-y-2 border-t border-separator">
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
                )}
              </div>
            ))}
          </div>
          {quickPrompts.length < 10 && (
            <button
              type="button"
              onClick={() => { addQuickPrompt(); setEditingQuickPrompt(quickPrompts.length); }}
              className="w-full px-4 py-2.5 text-[13px] font-medium rounded-lg border-2 border-dashed border-separator text-label-secondary hover:border-accent hover:text-accent transition-all duration-200 flex items-center justify-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Quick Prompt
            </button>
          )}
        </div>
      )}

      {/* ============ Follow-Up Prompts Tab ============ */}
      {activeTab === 'follow-up-prompts' && (
        <div className="card p-5 space-y-5">
          <div>
            <h3 className="text-[14px] font-display font-semibold text-label-primary">
              Follow-Up Prompts
            </h3>
            <p className="text-[12px] text-label-tertiary mt-1">
              Define prompts the AI can suggest after responses. The AI picks the most relevant ones based on conversation context.
            </p>
          </div>
          <div className="space-y-2">
            {followUpPrompts.map((fp, i) => (
              <div key={i} className="rounded-xl border border-separator bg-surface-secondary/30 overflow-hidden transition-all duration-200">
                {/* Collapsed card */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className={`shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                    fp.link !== undefined && fp.link !== null
                      ? 'bg-blue-50 text-blue-500'
                      : 'bg-purple-50 text-purple-500'
                  }`}>
                    {fp.link !== undefined && fp.link !== null ? 'LINK' : 'PROMPT'}
                  </span>
                  <span className="flex-1 text-[13px] font-medium text-label-primary truncate">
                    {fp.title || 'Untitled'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingFollowUpPrompt(editingFollowUpPrompt === i ? null : i)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-label-tertiary hover:bg-accent/[0.08] hover:text-accent transition-all duration-200"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => { removeFollowUpPrompt(i); setEditingFollowUpPrompt(null); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-label-tertiary hover:bg-red-50 hover:text-red-500 transition-all duration-200"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                {/* Expanded edit area */}
                {editingFollowUpPrompt === i && (
                  <div className="px-4 pb-4 pt-1 space-y-2 border-t border-separator">
                    <input
                      type="text"
                      value={fp.title}
                      onChange={(e) => updateFollowUpPrompt(i, 'title', e.target.value)}
                      placeholder="Button label"
                      className="input-field text-[13px]"
                    />
                    <textarea
                      value={fp.description || ''}
                      onChange={(e) => updateFollowUpPrompt(i, 'description', e.target.value)}
                      placeholder="Help the AI know when to show this, e.g. 'Show when user expresses interest in booking'"
                      rows={2}
                      className="input-field text-[13px] resize-none"
                    />
                    <div className="flex gap-2 items-center">
                      <button
                        type="button"
                        onClick={() => toggleFollowUpPromptType(i)}
                        className={`shrink-0 px-2.5 py-1.5 text-[11px] font-medium rounded-lg border transition-all duration-200 ${
                          fp.link !== undefined && fp.link !== null
                            ? 'border-blue-200 bg-blue-50 text-blue-600'
                            : 'border-purple-200 bg-purple-50 text-purple-600'
                        }`}
                      >
                        {fp.link !== undefined && fp.link !== null ? 'Link' : 'Prompt'}
                      </button>
                      <input
                        type="text"
                        value={(fp.link !== undefined && fp.link !== null ? fp.link : fp.prompt) || ''}
                        onChange={(e) =>
                          updateFollowUpPrompt(
                            i,
                            fp.link !== undefined && fp.link !== null ? 'link' : 'prompt',
                            e.target.value
                          )
                        }
                        placeholder={
                          fp.link !== undefined && fp.link !== null
                            ? 'https://example.com'
                            : 'Message to send...'
                        }
                        className="input-field text-[13px] flex-1"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {followUpPrompts.length < 10 && (
            <button
              type="button"
              onClick={() => { addFollowUpPrompt(); setEditingFollowUpPrompt(followUpPrompts.length); }}
              className="w-full px-4 py-2.5 text-[13px] font-medium rounded-lg border-2 border-dashed border-separator text-label-secondary hover:border-accent hover:text-accent transition-all duration-200 flex items-center justify-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Follow-Up Prompt
            </button>
          )}
        </div>
      )}

      {/* ============ Greeting Prompts Tab ============ */}
      {activeTab === 'greeting-prompts' && (
        <div className="card p-5 space-y-5">
          <div>
            <h3 className="text-[14px] font-display font-semibold text-label-primary">
              Greeting Prompts
            </h3>
            <p className="text-[12px] text-label-tertiary mt-1">
              Add speech bubbles that appear when visitors hover over the chat button. Clicking a bubble opens the chat and sends it as a message.
            </p>
          </div>
          <div className="space-y-2">
            {greetingPrompts.map((gp, i) => (
              <div key={i} className="rounded-xl border border-separator bg-surface-secondary/30 overflow-hidden transition-all duration-200">
                {/* Collapsed card */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-md bg-green-50 text-green-500">
                    GREETING
                  </span>
                  <span className="flex-1 text-[13px] font-medium text-label-primary truncate">
                    {gp.title || 'Untitled'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingGreetingPrompt(editingGreetingPrompt === i ? null : i)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-label-tertiary hover:bg-accent/[0.08] hover:text-accent transition-all duration-200"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => { removeGreetingPrompt(i); setEditingGreetingPrompt(null); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-label-tertiary hover:bg-red-50 hover:text-red-500 transition-all duration-200"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                {/* Expanded edit area */}
                {editingGreetingPrompt === i && (
                  <div className="px-4 pb-4 pt-1 space-y-2 border-t border-separator">
                    <input
                      type="text"
                      value={gp.title}
                      onChange={(e) => updateGreetingPrompt(i, 'title', e.target.value)}
                      placeholder="Button label"
                      className="input-field text-[13px]"
                    />
                    <input
                      type="text"
                      value={gp.prompt}
                      onChange={(e) => updateGreetingPrompt(i, 'prompt', e.target.value)}
                      placeholder="Message to send when clicked..."
                      className="input-field text-[13px]"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          {greetingPrompts.length < 5 && (
            <button
              type="button"
              onClick={() => { addGreetingPrompt(); setEditingGreetingPrompt(greetingPrompts.length); }}
              className="w-full px-4 py-2.5 text-[13px] font-medium rounded-lg border-2 border-dashed border-separator text-label-secondary hover:border-accent hover:text-accent transition-all duration-200 flex items-center justify-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Greeting Prompt
            </button>
          )}
          <div className="pt-2 border-t border-separator">
            <label className="input-label">
              Auto-hide after {greetingPromptDuration} seconds {greetingPromptDuration === 0 ? '(always visible)' : ''}
            </label>
            <input
              type="range"
              min={0}
              max={60}
              step={5}
              value={greetingPromptDuration}
              onChange={(e) => setGreetingPromptDuration(Number(e.target.value))}
              className="w-full mt-1 accent-[var(--color-accent)]"
            />
            <div className="flex justify-between text-[11px] text-label-tertiary mt-0.5">
              <span>0 (always)</span>
              <span>60s</span>
            </div>
          </div>
        </div>
      )}

      {/* Save button — always visible */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isPending}
          className={`w-full px-4 py-2.5 text-[13px] font-semibold rounded-xl transition-all duration-200 ${
            hasChanges
              ? 'btn-primary'
              : 'bg-surface-secondary text-label-tertiary cursor-not-allowed'
          }`}
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>

        {updateMutation.isSuccess && !hasChanges && (
          <p className="text-[12px] text-green-600 text-center mt-2">
            Settings saved successfully.
          </p>
        )}

        {updateMutation.isError && (
          <p className="text-[12px] text-red-500 text-center mt-2">
            Failed to save settings. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}

export default WidgetConfigurator;
