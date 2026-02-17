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
  headerColor: string;
  userBubbleColor: string;
  assistantBubbleColor: string;
  fontFamily: string;
  fontSize: number;
  textColor: string;
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
    headerColor: chatbot.widget_header_color || '#0071e3',
    userBubbleColor: chatbot.widget_user_bubble_color || '#0071e3',
    assistantBubbleColor: chatbot.widget_assistant_bubble_color || '#f5f5f7',
    fontFamily: chatbot.widget_font_family || '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    fontSize: chatbot.widget_font_size || 14,
    textColor: chatbot.widget_text_color || '#1d1d1f',
    width: chatbot.widget_width || 380,
    height: chatbot.widget_height || 520,
  });

  return (
    <div className="flex gap-8 animate-fade-in">
      <div className="flex-1 min-w-0">
        <WidgetConfigurator chatbot={chatbot} activeTab={activeTab} onPreviewChange={setPreviewState} />
      </div>
      <div className="w-[340px] shrink-0">
        <div className="sticky top-6">
          <WidgetPreview chatbotName={chatbot.name} state={previewState} />
        </div>
      </div>
    </div>
  );
}

export default ConfigSection;
