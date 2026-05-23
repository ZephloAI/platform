import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import WidgetConfigurator from './WidgetConfigurator';
import WidgetPreview from './WidgetPreview';
import type { Chatbot, QuickPrompt, GreetingPrompt } from '../types';

// ============================================================
// ConfigSection
// Two-column layout: configurator form (left) + live preview (right).
// ============================================================

export interface PreviewState {
  icon: string;
  welcome: string;
  position: 'right' | 'left' | 'right-sidebar' | 'left-sidebar';
  quickPrompts: QuickPrompt[];
  greetingPrompts: GreetingPrompt[];
  greetingPromptDuration: number;
  logoUrl: string | null;
  fontFamily: string;
  fontSize: number;
  width: number;
  height: number;
}

type ConfigTab = 'appearance' | 'quick-prompts' | 'follow-up-prompts' | 'greeting-prompts';

const CONFIG_TABS: { key: ConfigTab; label: string }[] = [
  { key: 'appearance', label: 'Appearance' },
  { key: 'quick-prompts', label: 'Quick Prompts' },
  { key: 'follow-up-prompts', label: 'Follow-Up Prompts' },
  { key: 'greeting-prompts', label: 'Greeting Prompts' },
];

interface ConfigSectionProps {
  chatbot: Chatbot;
  activeTab: ConfigTab;
}

function ConfigSection({ chatbot, activeTab }: ConfigSectionProps) {
  const [, setSearchParams] = useSearchParams();
  const [previewState, setPreviewState] = useState<PreviewState>({
    icon: chatbot.widget_icon || '🤖',
    welcome: chatbot.widget_welcome || 'Hi! How can I help you today?',
    position: (chatbot.widget_position as PreviewState['position']) || 'right',
    quickPrompts: chatbot.quick_prompts || [],
    greetingPrompts: chatbot.greeting_prompts || [],
    greetingPromptDuration: chatbot.greeting_prompt_duration || 0,
    logoUrl: chatbot.widget_logo_url || null,
    fontFamily: chatbot.widget_font_family || '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    fontSize: chatbot.widget_font_size || 14,
    width: chatbot.widget_width || 380,
    height: chatbot.widget_height || 520,
  });

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-fade-in">
      <div className="flex-1 min-w-0 space-y-6">
        {/* Config tabs (replaces the old sidebar accordion) */}
        <div className="flex gap-6 border-b border-black/[0.06] overflow-x-auto scrollbar-hide">
          {CONFIG_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSearchParams({ section: 'config', configTab: tab.key })}
              className={`pb-3 pt-1 text-[14px] font-semibold border-b-2 whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-label-tertiary hover:text-label-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <WidgetConfigurator chatbot={chatbot} activeTab={activeTab} onPreviewChange={setPreviewState} />
      </div>
      <div className="hidden lg:block w-[400px] shrink-0">
        <div className="sticky top-[5.5rem]">
          <WidgetPreview chatbotId={chatbot.public_id} state={previewState} />
        </div>
      </div>
    </div>
  );
}

export default ConfigSection;
