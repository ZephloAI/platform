import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useChatbot, useChatbots } from '../hooks/useChatbots';
import { useConversations } from '../hooks/useConversations';
import { useOrgStore } from '../stores/orgStore';

type Section = 'general' | 'knowledge' | 'config' | 'tools' | 'conversations';
type ConfigTab = 'appearance' | 'quick-prompts' | 'follow-up-prompts' | 'greeting-prompts';
type ToolsTab = 'mcp-servers';

const NAV_ITEMS: { key: Section; label: string; icon: string }[] = [
  { key: 'general', label: 'General', icon: 'dashboard' },
  { key: 'conversations', label: 'Conversations', icon: 'chat_bubble' },
  { key: 'knowledge', label: 'Knowledge', icon: 'book' },
  { key: 'config', label: 'Config', icon: 'tune' },
  { key: 'tools', label: 'Tools', icon: 'construction' },
];

function ChatbotLayout() {
  const { user, logout } = useAuth();
  const activeOrg = useOrgStore((state) => state.activeOrganization);
  const { id } = useParams<{ id: string }>();
  const chatbotId = id!;
  const { data: chatbot } = useChatbot(chatbotId);
  const { data: chatbots } = useChatbots();
  const { data: conversations } = useConversations(chatbotId);
  const unreadCount = conversations?.filter(c => c.is_unread).length || 0;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeSection = (searchParams.get('section') as Section) || 'general';
  const activeConfigTab = (searchParams.get('configTab') as ConfigTab) || 'appearance';
  const activeToolsTab = (searchParams.get('toolsTab') as ToolsTab) || 'mcp-servers';

  const setActiveSection = (section: Section) => {
    const params: Record<string, string> = { section };
    if (section === 'config') params.configTab = 'appearance';
    if (section === 'tools') params.toolsTab = 'mcp-servers';
    setSearchParams(params);
    setSidebarOpen(false);
  };

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
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

  const otherChatbots = chatbots?.filter((c) => c.public_id !== chatbotId) || [];

  const navLinkClass = (active: boolean) =>
    `w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 ease-smooth ${
      active
        ? 'bg-accent-light text-accent'
        : 'text-label-secondary hover:bg-surface-secondary hover:text-label-primary'
    }`;

  const sidebarExpandedWidth = 'w-[260px] md:w-[220px]';
  const sidebarCollapsedWidth = 'w-[60px]';

  return (
    <div className="h-screen bg-surface-primary flex overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 ${collapsed ? sidebarCollapsedWidth : sidebarExpandedWidth} bg-white border-r border-black/[0.04] flex flex-col transform transition-all duration-300 ease-smooth md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Brand */}
        <div className={`${collapsed ? 'px-2 pt-4 pb-2' : 'px-4 pt-4 pb-2'}`}>
          <Link
            to="/dashboard"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2 px-2'} py-1`}
          >
            <img src="/logo.svg" alt="Zephlo" className="w-7 h-7 shrink-0" />
            {!collapsed && (
              <span className="text-[16px] font-display font-bold text-label-primary tracking-tight">
                Zephlo
              </span>
            )}
          </Link>
        </div>

        {/* Section navigation */}
        <nav className={`flex-1 ${collapsed ? 'px-1.5' : 'px-3'} space-y-0.5 overflow-y-auto`}>
          <div className="border-t border-black/[0.04] mb-2" />
          {NAV_ITEMS.map((item) => (
            <div key={item.key}>
              <button
                onClick={() => setActiveSection(item.key)}
                className={navLinkClass(activeSection === item.key)}
                title={collapsed ? item.label : undefined}
              >
                <span
                  className={`material-symbols-outlined shrink-0 ${activeSection === item.key ? 'text-accent' : 'text-label-tertiary'}`}
                  style={{ fontSize: 20 }}
                >
                  {item.icon}
                </span>
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.key === 'conversations' && unreadCount > 0 && (
                      <span className="bg-accent text-white text-[10px] font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </>
                )}
                {collapsed && item.key === 'conversations' && unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-accent w-2 h-2 rounded-full" />
                )}
              </button>
            </div>
          ))}
        </nav>

        {/* Bottom section: agent picker + collapse toggle */}
        <div className={`border-t border-black/[0.04] ${collapsed ? 'px-1.5 py-3' : 'px-3 py-3'} space-y-1`}>
          {/* Agent picker */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => { if (collapsed) { setCollapsed(false); setTimeout(() => setDropdownOpen(true), 200); } else { setDropdownOpen(!dropdownOpen); } }}
              className={`flex items-center ${collapsed ? 'justify-center w-full' : 'gap-2.5 w-full px-2'} py-1.5 rounded-lg hover:bg-surface-secondary transition-colors ease-smooth`}
              title={collapsed ? (chatbot?.name || 'Switch agent') : undefined}
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-blue-800 flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
                {chatbot?.name?.charAt(0).toUpperCase() || 'C'}
              </div>
              {!collapsed && (
                <>
                  <span className="text-[14px] font-display font-semibold text-label-primary truncate flex-1 text-left">
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
                    <polyline points="6 15 12 9 18 15" />
                  </svg>
                </>
              )}
            </button>

            {dropdownOpen && !collapsed && (
              <div className="absolute bottom-full left-0 right-0 mb-1 dropdown-glass rounded-xl animate-scale-in z-50">
                {otherChatbots.length > 0 && (
                  <div className="py-1">
                    <p className="px-3 py-1.5 text-[11px] font-semibold text-label-quaternary uppercase tracking-wider">
                      Switch agent
                    </p>
                    {otherChatbots.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setDropdownOpen(false);
                          setSidebarOpen(false);
                          navigate(`/agents/${c.public_id}`);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-label-secondary hover:bg-surface-secondary hover:text-label-primary transition-colors ease-smooth text-left"
                      >
                        <div className="w-5 h-5 rounded bg-accent-light flex items-center justify-center text-[10px] font-semibold text-accent shrink-0">
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
                    onClick={() => { setDropdownOpen(false); setSidebarOpen(false); }}
                    className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-label-secondary hover:bg-surface-secondary hover:text-label-primary transition-colors ease-smooth"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                    All Agents
                  </Link>
                  <Link
                    to="/agents/new"
                    onClick={() => { setDropdownOpen(false); setSidebarOpen(false); }}
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

          {/* Collapse toggle - desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`hidden md:flex items-center ${collapsed ? 'justify-center w-full' : 'gap-3 w-full px-2'} py-2 rounded-lg text-[14px] font-medium text-label-tertiary hover:text-label-primary hover:bg-surface-secondary transition-all duration-200 ease-smooth`}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`shrink-0 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <path d="M15 9l-3 3 3 3" />
            </svg>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 min-w-0 flex flex-col bg-surface-primary">
        {/* Top navbar */}
        <header className="h-14 border-b border-black/[0.04] flex items-center justify-between px-4 md:px-8 shrink-0 bg-white/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {/* Hamburger button - mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-secondary transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <span className="text-[14px] text-label-tertiary font-medium capitalize">
              {activeSection}
            </span>
          </div>
          <div className="relative" ref={accountRef}>
            <button
              onClick={() => setAccountOpen(!accountOpen)}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-blue-800 flex items-center justify-center text-white text-[11px] font-semibold cursor-pointer hover:opacity-90 transition-opacity ease-smooth"
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
            <div className="w-full max-w-[1600px] mx-auto px-4 py-6 md:px-10 md:py-8 lg:w-[90%]">
              <Outlet context={{ activeSection, activeConfigTab, activeToolsTab }} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default ChatbotLayout;
