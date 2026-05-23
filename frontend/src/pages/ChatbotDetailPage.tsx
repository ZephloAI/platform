import { useParams, useOutletContext, useSearchParams } from 'react-router-dom';
import { useChatbot } from '../hooks/useChatbots';
import GeneralSection from '../components/GeneralSection';
import OverviewSection from '../components/OverviewSection';
import KnowledgeSection from '../components/KnowledgeSection';
import ConfigSection from '../components/ConfigSection';
import ToolsSection from '../components/ToolsSection';
import ConversationsSection from '../components/ConversationsSection';

interface ChatbotContext {
  activeSection: string;
  activeConfigTab: string;
  activeToolsTab: string;
}

function ChatbotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const chatbotId = id!;
  const { data: chatbot, isLoading, error } = useChatbot(chatbotId);
  const { activeSection, activeConfigTab, activeToolsTab } = useOutletContext<ChatbotContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const generalTab = (searchParams.get('generalTab') as 'overview' | 'details') || 'overview';

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

  if (activeSection === 'conversations') {
    return (
      <div className="animate-fade-in h-full">
        <ConversationsSection />
      </div>
    );
  }

  // General page: Overview + Details tabs (data-dense, full width).
  if (activeSection === 'general') {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex gap-6 border-b border-black/[0.06] overflow-x-auto scrollbar-hide">
          {([
            { key: 'overview', label: 'Overview' },
            { key: 'details', label: 'Details' },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSearchParams({ section: 'general', generalTab: tab.key })}
              className={`pb-3 pt-1 text-[14px] font-semibold border-b-2 whitespace-nowrap transition-all ${
                generalTab === tab.key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-label-tertiary hover:text-label-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {generalTab === 'overview' ? (
          <OverviewSection chatbot={chatbot} />
        ) : (
          <GeneralSection chatbot={chatbot} />
        )}
      </div>
    );
  }
  if (activeSection === 'knowledge') {
    return (
      <div className="animate-fade-in">
        <KnowledgeSection chatbot={chatbot} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {activeSection === 'config' && <ConfigSection chatbot={chatbot} activeTab={activeConfigTab as 'appearance' | 'quick-prompts' | 'follow-up-prompts' | 'greeting-prompts'} />}
      {activeSection === 'tools' && <ToolsSection chatbot={chatbot} activeTab={activeToolsTab as 'mcp-servers'} />}
    </div>
  );
}

export default ChatbotDetailPage;
