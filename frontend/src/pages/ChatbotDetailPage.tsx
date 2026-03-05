import { useParams, useOutletContext } from 'react-router-dom';
import { useChatbot } from '../hooks/useChatbots';
import GeneralSection from '../components/GeneralSection';
import OverviewSection from '../components/OverviewSection';
import KnowledgeSection from '../components/KnowledgeSection';
import ConfigSection from '../components/ConfigSection';
import ToolsSection from '../components/ToolsSection';

interface ChatbotContext {
  activeSection: string;
  activeConfigTab: string;
  activeToolsTab: string;
}

function ChatbotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const chatbotId = Number(id);
  const { data: chatbot, isLoading, error } = useChatbot(chatbotId);
  const { activeSection, activeConfigTab, activeToolsTab } = useOutletContext<ChatbotContext>();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
          <p className="text-[13px] text-label-tertiary">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !chatbot) {
    return (
      <div className="border border-black/[0.08] rounded-xl p-6 text-center max-w-lg mx-auto">
        <p className="text-[14px] text-red-500">Failed to load chatbot details.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      {activeSection === 'general' && <GeneralSection chatbot={chatbot} />}
      {activeSection === 'overview' && <OverviewSection chatbot={chatbot} />}
      {activeSection === 'knowledge' && <KnowledgeSection chatbot={chatbot} />}
      {activeSection === 'config' && <ConfigSection chatbot={chatbot} activeTab={activeConfigTab as 'appearance' | 'quick-prompts' | 'follow-up-prompts' | 'greeting-prompts'} />}
      {activeSection === 'tools' && <ToolsSection chatbot={chatbot} activeTab={activeToolsTab as 'mcp-servers'} />}
    </div>
  );
}

export default ChatbotDetailPage;
