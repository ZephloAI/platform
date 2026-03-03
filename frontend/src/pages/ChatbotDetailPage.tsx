import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useChatbot } from '../hooks/useChatbots';
import OverviewSection from '../components/OverviewSection';
import KnowledgeSection from '../components/KnowledgeSection';
import ConfigSection from '../components/ConfigSection';
import ToolsSection from '../components/ToolsSection';

// ============================================================
// ChatbotDetailPage
// Sidebar navigation with three sections:
//   - Overview: status, metrics, embed code
//   - Knowledge: website/pages tabs, crawl history
//   - Config: widget customization
// ============================================================

type Section = 'overview' | 'knowledge' | 'config' | 'tools';
type ConfigTab = 'appearance' | 'quick-prompts' | 'follow-up-prompts' | 'greeting-prompts';
type ToolsTab = 'mcp-servers';

const NAV_ITEMS: { key: Section; label: string; icon: JSX.Element }[] = [
  {
    key: 'overview',
    label: 'Overview',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    key: 'knowledge',
    label: 'Knowledge',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    key: 'config',
    label: 'Config',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
  {
    key: 'tools',
    label: 'Tools',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
];

const CONFIG_SUB_ITEMS: { key: ConfigTab; label: string }[] = [
  { key: 'appearance', label: 'Appearance' },
  { key: 'quick-prompts', label: 'Quick Prompts' },
  { key: 'follow-up-prompts', label: 'Follow-Up Prompts' },
  { key: 'greeting-prompts', label: 'Greeting Prompts' },
];

const TOOLS_SUB_ITEMS: { key: ToolsTab; label: string }[] = [
  { key: 'mcp-servers', label: 'MCP Servers' },
];

const STATUS_BADGES: Record<string, string> = {
  pending: 'badge badge-pending',
  crawling: 'badge badge-crawling',
  ready: 'badge badge-ready',
  error: 'badge badge-error',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  crawling: 'Crawling',
  ready: 'Ready',
  error: 'Error',
};

function ChatbotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const chatbotId = Number(id);
  const { data: chatbot, isLoading, error } = useChatbot(chatbotId);
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [activeConfigTab, setActiveConfigTab] = useState<ConfigTab>('appearance');
  const [activeToolsTab, setActiveToolsTab] = useState<ToolsTab>('mcp-servers');

  // Loading
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

  // Error
  if (error || !chatbot) {
    return (
      <div className="glass-card p-6 text-center max-w-lg mx-auto">
        <p className="text-[14px] text-red-500">Failed to load chatbot details.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Top bar: back + chatbot name + status */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface-secondary/60 hover:bg-surface-secondary text-label-tertiary hover:text-label-primary transition-all duration-200"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-[22px] font-semibold text-label-primary tracking-tight">
            {chatbot.name}
          </h1>
          <span className={STATUS_BADGES[chatbot.status] || 'badge'}>
            {chatbot.status === 'crawling' && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse-soft" />
            )}
            {STATUS_LABELS[chatbot.status] || chatbot.status}
          </span>
        </div>
      </div>

      {/* Sidebar + Content */}
      <div className="flex gap-6">
        {/* Sidebar */}
        <nav className="w-[200px] shrink-0">
          <div className="sticky top-6 space-y-1">
            {NAV_ITEMS.map((item) => (
              <div key={item.key}>
                <button
                  onClick={() => {
                    setActiveSection(item.key);
                    if (item.key === 'config') setActiveConfigTab('appearance');
                    if (item.key === 'tools') setActiveToolsTab('mcp-servers');
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                    activeSection === item.key
                      ? 'bg-accent/[0.08] text-accent'
                      : 'text-label-secondary hover:bg-surface-secondary/60 hover:text-label-primary'
                  }`}
                >
                  <span className={activeSection === item.key ? 'text-accent' : 'text-label-tertiary'}>
                    {item.icon}
                  </span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {(item.key === 'config' || item.key === 'tools') && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-transform duration-200 ${activeSection === item.key ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  )}
                </button>
                {/* Config sub-items */}
                {item.key === 'config' && activeSection === 'config' && (
                  <div className="ml-7 mt-1 space-y-0.5">
                    {CONFIG_SUB_ITEMS.map((sub) => (
                      <button
                        key={sub.key}
                        onClick={() => setActiveConfigTab(sub.key)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-200 ${
                          activeConfigTab === sub.key
                            ? 'bg-accent/[0.06] text-accent'
                            : 'text-label-tertiary hover:bg-surface-secondary/60 hover:text-label-secondary'
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
                {/* Tools sub-items */}
                {item.key === 'tools' && activeSection === 'tools' && (
                  <div className="ml-7 mt-1 space-y-0.5">
                    {TOOLS_SUB_ITEMS.map((sub) => (
                      <button
                        key={sub.key}
                        onClick={() => setActiveToolsTab(sub.key)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-200 ${
                          activeToolsTab === sub.key
                            ? 'bg-accent/[0.06] text-accent'
                            : 'text-label-tertiary hover:bg-surface-secondary/60 hover:text-label-secondary'
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeSection === 'overview' && <OverviewSection chatbot={chatbot} />}
          {activeSection === 'knowledge' && <KnowledgeSection chatbot={chatbot} />}
          {activeSection === 'config' && <ConfigSection chatbot={chatbot} activeTab={activeConfigTab} />}
          {activeSection === 'tools' && <ToolsSection chatbot={chatbot} activeTab={activeToolsTab} />}
        </div>
      </div>
    </div>
  );
}

export default ChatbotDetailPage;
