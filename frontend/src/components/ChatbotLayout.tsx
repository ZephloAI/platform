import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useChatbot, useChatbots } from '../hooks/useChatbots';
import { useConversations } from '../hooks/useConversations';
import { useOrgStore } from '../stores/orgStore';

type Section = 'overview' | 'details' | 'knowledge' | 'config' | 'tools' | 'conversations';
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
    key: 'conversations',
    label: 'Conversations',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    key: 'details',
    label: 'Details',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
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

function ChatbotLayout() {
  const { user, logout } = useAuth();
  const activeOrg = useOrgStore((state) => state.activeOrganization);
  const { id } = useParams<{ id: string }>();
  const chatbotId = Number(id);
  const { data: chatbot } = useChatbot(chatbotId);
  const { data: chatbots } = useChatbots();
  const { data: conversations } = useConversations(chatbotId);
  const unreadCount = conversations?.filter(c => c.is_unread).length || 0;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeSection = (searchParams.get('section') as Section) || 'overview';
  const activeConfigTab = (searchParams.get('configTab') as ConfigTab) || 'appearance';
  const activeToolsTab = (searchParams.get('toolsTab') as ToolsTab) || 'mcp-servers';

  const setActiveSection = (section: Section) => {
    const params: Record<string, string> = { section };
    if (section === 'config') params.configTab = 'appearance';
    if (section === 'tools') params.toolsTab = 'mcp-servers';
    setSearchParams(params);
  };

  const setActiveConfigTab = (tab: ConfigTab) => {
    setSearchParams({ section: 'config', configTab: tab });
  };

  const setActiveToolsTab = (tab: ToolsTab) => {
    setSearchParams({ section: 'tools', toolsTab: tab });
  };

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const otherChatbots = chatbots?.filter((c) => c.id !== chatbotId) || [];

  const navLinkClass = (active: boolean) =>
    `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ease-smooth ${
      active
        ? 'bg-accent-light text-accent'
        : 'text-label-secondary hover:bg-surface-secondary hover:text-label-primary'
    }`;

  return (
    <div className="h-screen bg-surface-primary flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 bg-white border-r border-black/[0.04] flex flex-col h-screen sticky top-0">
        {/* Chatbot switcher */}
        <div className="px-4 pt-5 pb-3" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg hover:bg-surface-secondary transition-colors ease-smooth"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-amber-700 flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
              {chatbot?.name?.charAt(0).toUpperCase() || 'C'}
            </div>
            <span className="text-[13px] font-display font-semibold text-label-primary truncate flex-1 text-left">
              {chatbot?.name || 'Loading...'}
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`text-label-quaternary shrink-0 transition-transform duration-200 ease-smooth ${dropdownOpen ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="mt-1 dropdown-glass rounded-xl animate-scale-in z-50 relative">
              {otherChatbots.length > 0 && (
                <div className="py-1">
                  <p className="px-3 py-1.5 text-[10px] font-semibold text-label-quaternary uppercase tracking-wider">
                    Switch agent
                  </p>
                  {otherChatbots.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate(`/chatbots/${c.id}`);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-label-secondary hover:bg-surface-secondary hover:text-label-primary transition-colors ease-smooth text-left"
                    >
                      <div className="w-5 h-5 rounded bg-accent-light flex items-center justify-center text-[9px] font-semibold text-accent shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="border-t border-black/[0.04] py-1">
                <Link
                  to="/dashboard"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-label-secondary hover:bg-surface-secondary hover:text-label-primary transition-colors ease-smooth"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  All Agents
                </Link>
                <Link
                  to="/chatbots/new"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-accent font-medium hover:bg-accent-light transition-colors ease-smooth"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Create New
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Section navigation */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-label-tertiary hover:text-label-primary hover:bg-surface-secondary transition-all duration-200 ease-smooth mb-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Home
          </Link>
          <div className="border-t border-black/[0.04] my-2" />
          {NAV_ITEMS.map((item) => (
            <div key={item.key}>
              <button
                onClick={() => setActiveSection(item.key)}
                className={navLinkClass(activeSection === item.key)}
              >
                <span className={activeSection === item.key ? 'text-accent' : 'text-label-tertiary'}>
                  {item.icon}
                </span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.key === 'conversations' && unreadCount > 0 && (
                  <span className="bg-accent text-white text-[10px] font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
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
                    className={`transition-transform duration-200 ease-smooth ${activeSection === item.key ? 'rotate-180 text-accent' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                )}
              </button>
              {item.key === 'config' && activeSection === 'config' && (
                <div className="ml-7 mt-1 space-y-0.5">
                  {CONFIG_SUB_ITEMS.map((sub) => (
                    <button
                      key={sub.key}
                      onClick={() => setActiveConfigTab(sub.key)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-200 ease-smooth ${
                        activeConfigTab === sub.key
                          ? 'bg-accent-light text-accent'
                          : 'text-label-tertiary hover:bg-surface-secondary hover:text-label-secondary'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
              {item.key === 'tools' && activeSection === 'tools' && (
                <div className="ml-7 mt-1 space-y-0.5">
                  {TOOLS_SUB_ITEMS.map((sub) => (
                    <button
                      key={sub.key}
                      onClick={() => setActiveToolsTab(sub.key)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-200 ease-smooth ${
                        activeToolsTab === sub.key
                          ? 'bg-accent-light text-accent'
                          : 'text-label-tertiary hover:bg-surface-secondary hover:text-label-secondary'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-4 border-t border-black/[0.04] pt-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-label-tertiary hover:text-label-primary hover:bg-surface-secondary transition-all duration-200 ease-smooth w-full"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Help
          </Link>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 min-w-0 flex flex-col bg-surface-primary">
        {/* Top navbar */}
        <header className="h-14 border-b border-black/[0.04] flex items-center justify-between px-8 shrink-0 bg-white/80 backdrop-blur-xl sticky top-0 z-40">
          <h1 className="heading-md font-display text-label-primary capitalize">
            {activeSection}
          </h1>
          <div className="relative" ref={accountRef}>
            <button
              onClick={() => setAccountOpen(!accountOpen)}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-amber-700 flex items-center justify-center text-white text-[11px] font-semibold cursor-pointer hover:opacity-90 transition-opacity ease-smooth"
            >
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </button>
            {accountOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 dropdown-glass rounded-xl animate-scale-in z-50">
                <div className="px-4 py-3 border-b border-black/[0.04]">
                  <p className="text-[13px] font-display font-semibold text-label-primary truncate">
                    {user?.first_name && user?.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user?.email?.split('@')[0]}
                  </p>
                  <p className="text-[12px] text-label-tertiary truncate mt-0.5">{user?.email}</p>
                  {activeOrg && (
                    <p className="text-[11px] text-label-quaternary truncate mt-1">{activeOrg.name}</p>
                  )}
                </div>
                <div className="py-1">
                  <Link
                    to="/dashboard"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-label-secondary hover:bg-surface-secondary hover:text-label-primary transition-colors ease-smooth"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    Home
                  </Link>
                  {activeOrg && (
                    <Link
                      to={`/organizations/${activeOrg.id}/settings`}
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-label-secondary hover:bg-surface-secondary hover:text-label-primary transition-colors ease-smooth"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      Organization
                    </Link>
                  )}
                </div>
                <div className="border-t border-black/[0.04] py-1">
                  <button
                    onClick={() => { setAccountOpen(false); logout(); }}
                    className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-red-500 hover:bg-red-50 transition-colors ease-smooth w-full text-left"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Centered content */}
        <main className={`flex-1 ${activeSection === 'conversations' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {activeSection === 'conversations' ? (
            <div className="h-full">
              <Outlet context={{ activeSection, activeConfigTab, activeToolsTab }} />
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-8 py-8">
              <Outlet context={{ activeSection, activeConfigTab, activeToolsTab }} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default ChatbotLayout;
