import { useState } from 'react';
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

interface ConfigSectionProps {
  chatbot: Chatbot;
  activeTab: ConfigTab;
}

function ConfigSection({ chatbot, activeTab }: ConfigSectionProps) {
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
      <div className="flex-1 min-w-0">
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
