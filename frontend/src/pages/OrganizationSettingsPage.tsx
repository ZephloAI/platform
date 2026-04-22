import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  useOrgMembers,
  useOrgApiKeys,
  useInvitations,
  useInviteUser,
  useCancelInvitation,
  useRemoveMember,
  useUpdateMemberRole,
  useCreateOrgApiKey,
  useRevokeOrgApiKey,
  useOrgUsage,
} from '../hooks/useOrganization';
import { useOrgStore } from '../stores/orgStore';
import type { ApiKeyCreated, UsageSnapshot } from '../types';

// ============================================================
// Organization Settings Page
// Full-page sidebar layout matching ChatbotLayout.
// Sidebar sections: Users (Members, Invitations), API Keys
// ============================================================

type Section = 'members' | 'invitations' | 'api-keys' | 'usage';

const ROLE_BADGES: Record<string, string> = {
  creator: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  member: 'bg-gray-100 text-gray-700',
};

function OrganizationSettingsPage() {
  const { orgId: orgIdParam } = useParams<{ orgId: string }>();
  const orgId = Number(orgIdParam);
  const { user, logout } = useAuth();
  const activeOrg = useOrgStore((state) => state.activeOrganization);
  const [searchParams, setSearchParams] = useSearchParams();

  const activeSection = (searchParams.get('section') as Section) || 'members';
  const setActiveSection = (section: Section) => {
    setSearchParams({ section });
    setSidebarOpen(false);
  };

  const [accountOpen, setAccountOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Data queries
  const { data: members = [], isLoading: membersLoading } = useOrgMembers(orgId);
  const { data: apiKeys = [], isLoading: keysLoading } = useOrgApiKeys(orgId);
  const { data: invitations = [], isLoading: invitationsLoading } = useInvitations(orgId);

  // Current user's role in this org
  const myRole = activeOrg?.role || 'member';
  const canManage = myRole === 'creator' || myRole === 'admin';

  const orgName = activeOrg?.name || 'Organization';

  const navLinkClass = (active: boolean) =>
    `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
      active
        ? 'bg-accent-light text-accent'
        : 'text-label-secondary hover:bg-surface-secondary hover:text-label-primary'
    }`;

  const sectionTitle: Record<Section, string> = {
    members: 'Members',
    invitations: 'Invitations',
    'api-keys': 'API Keys',
    usage: 'Usage & Billing',
  };

  return (
    <div className="min-h-screen bg-surface-primary flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] md:w-[220px] border-r border-black/[0.06] flex flex-col bg-white transform transition-transform duration-300 md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Org name header */}
        <div className="px-4 pt-5 pb-3">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-blue-800 flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
              {orgName.charAt(0).toUpperCase()}
            </div>
            <span className="text-[13px] font-semibold font-display text-label-primary truncate flex-1 text-left">
              {orgName}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {/* Home link */}
          <Link
            to="/dashboard"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-label-secondary hover:bg-surface-secondary hover:text-label-primary transition-all duration-200 mb-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Home
          </Link>

          <div className="border-t border-black/[0.06] my-2" />

          {/* Users section */}
          <p className="section-label px-3 py-1.5">
            Users
          </p>
          <button
            onClick={() => setActiveSection('members')}
            className={navLinkClass(activeSection === 'members')}
          >
            <span className={activeSection === 'members' ? 'text-accent' : 'text-label-tertiary'}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <span className="flex-1 text-left">Members</span>
          </button>
          <button
            onClick={() => setActiveSection('invitations')}
            className={navLinkClass(activeSection === 'invitations')}
          >
            <span className={activeSection === 'invitations' ? 'text-accent' : 'text-label-tertiary'}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </span>
            <span className="flex-1 text-left">Invitations</span>
          </button>

          <div className="border-t border-black/[0.06] my-2" />

          {/* API Keys section */}
          <p className="section-label px-3 py-1.5">
            Developer
          </p>
          <button
            onClick={() => setActiveSection('api-keys')}
            className={navLinkClass(activeSection === 'api-keys')}
          >
            <span className={activeSection === 'api-keys' ? 'text-accent' : 'text-label-tertiary'}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </span>
            <span className="flex-1 text-left">API Keys</span>
          </button>

          <div className="border-t border-black/[0.06] my-2" />

          {/* Usage section */}
          <p className="section-label px-3 py-1.5">
            Billing
          </p>
          <button
            onClick={() => setActiveSection('usage')}
            className={navLinkClass(activeSection === 'usage')}
          >
            <span className={activeSection === 'usage' ? 'text-accent' : 'text-label-tertiary'}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="M7 14l4-4 4 4 5-5" />
              </svg>
            </span>
            <span className="flex-1 text-left">Usage</span>
          </button>
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-4 border-t border-black/[0.06] pt-3">
          <Link
            to="/dashboard"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-label-tertiary hover:bg-surface-secondary hover:text-label-primary transition-all duration-200 w-full"
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
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top navbar */}
        <header className="h-14 border-b border-black/[0.06] flex items-center justify-between px-4 md:px-8 shrink-0 bg-white/80 backdrop-blur-xl sticky top-0 z-40">
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
            <h1 className="heading-md font-display text-label-primary">
              {sectionTitle[activeSection]}
            </h1>
          </div>
          <div className="relative" ref={accountRef}>
            <button
              onClick={() => setAccountOpen(!accountOpen)}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-blue-800 flex items-center justify-center text-white text-[11px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
            >
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </button>
            {accountOpen && (
              <div className="dropdown-glass absolute right-0 top-full mt-2 w-56 rounded-xl animate-scale-in z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-black/[0.06]">
                  <p className="text-[13px] font-semibold text-label-primary truncate">
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
                    className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-label-secondary hover:bg-surface-secondary hover:text-label-primary transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    Home
                  </Link>
                </div>
                <div className="border-t border-black/[0.06] py-1">
                  <button
                    onClick={() => { setAccountOpen(false); logout(); }}
                    className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-red-500 hover:bg-red-50 transition-colors w-full text-left"
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

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-surface-primary">
          <div className="max-w-3xl mx-auto px-4 py-6 md:px-8 md:py-8 animate-fade-in">
            {activeSection === 'members' && (
              <MembersTab
                orgId={orgId}
                members={members}
                loading={membersLoading}
                canManage={canManage}
                currentUserId={user?.id}
              />
            )}
            {activeSection === 'api-keys' && (
              <ApiKeysTab
                orgId={orgId}
                apiKeys={apiKeys}
                loading={keysLoading}
                canManage={canManage}
              />
            )}
            {activeSection === 'invitations' && (
              <InvitationsTab
                orgId={orgId}
                invitations={invitations}
                loading={invitationsLoading}
                canManage={canManage}
              />
            )}
            {activeSection === 'usage' && <UsageTab orgId={orgId} />}
          </div>
        </main>
      </div>
    </div>
  );
}

// ============================================================
// Members Tab
// ============================================================

function MembersTab({
  orgId,
  members,
  loading,
  canManage,
  currentUserId,
}: {
  orgId: number;
  members: { id: number; user_id: number; email: string; role: string; joined_at: string }[];
  loading: boolean;
  canManage: boolean;
  currentUserId?: number;
}) {
  const removeMember = useRemoveMember(orgId);
  const updateRole = useUpdateMemberRole(orgId);

  if (loading) {
    return <LoadingSpinner label="Loading members..." />;
  }

  return (
    <div className="space-y-3">
      {members.length === 0 ? (
        <EmptyState message="No members found." />
      ) : (
        members.map((member) => (
          <div
            key={member.id}
            className="card flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 transition-all duration-200 hover:shadow-card-hover"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-surface-secondary flex items-center justify-center text-[14px] font-semibold text-label-secondary shrink-0">
                {member.email.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-label-primary truncate">
                  {member.email}
                </p>
                <p className="text-[12px] text-label-quaternary">
                  Joined {formatDate(member.joined_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 ml-12 sm:ml-3">
              {canManage && member.role !== 'creator' && member.user_id !== currentUserId ? (
                <select
                  value={member.role}
                  onChange={(e) =>
                    updateRole.mutate({ userId: member.user_id, role: e.target.value })
                  }
                  className="input-field text-[12px] font-medium px-2 py-1 rounded-lg"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                </select>
              ) : (
                <span
                  className={`text-[12px] font-medium px-2.5 py-1 rounded-full ${
                    ROLE_BADGES[member.role] || ROLE_BADGES.member
                  }`}
                >
                  {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                </span>
              )}

              {canManage && member.role !== 'creator' && member.user_id !== currentUserId && (
                <button
                  onClick={() => removeMember.mutate(member.user_id)}
                  className="text-[12px] text-red-500 hover:text-red-600 font-medium transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ============================================================
// API Keys Tab
// ============================================================

function ApiKeysTab({
  orgId,
  apiKeys,
  loading,
  canManage,
}: {
  orgId: number;
  apiKeys: { id: number; key_prefix: string; name: string; is_active: boolean; created_at: string; last_used_at: string | null }[];
  loading: boolean;
  canManage: boolean;
}) {
  const [keyName, setKeyName] = useState('');
  const [newKey, setNewKey] = useState<ApiKeyCreated | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);

  const createKey = useCreateOrgApiKey(orgId);
  const revokeKey = useRevokeOrgApiKey(orgId);

  const handleCreate = () => {
    if (!keyName.trim()) return;
    createKey.mutate(
      { name: keyName.trim() },
      {
        onSuccess: (data) => {
          setNewKey(data);
          setKeyName('');
        },
      }
    );
  };

  const handleCopyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey.key);
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading API keys..." />;
  }

  return (
    <div className="space-y-5">
      {/* Create Key Form */}
      {canManage && (
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Key name (e.g. Production)"
            className="input-field flex-1"
          />
          <button
            onClick={handleCreate}
            disabled={!keyName.trim() || createKey.isPending}
            className="btn-accent px-4 py-2 text-[13px] w-full sm:w-auto disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {createKey.isPending ? 'Creating...' : 'Create Key'}
          </button>
        </div>
      )}

      {/* Keys List */}
      {apiKeys.length === 0 ? (
        <EmptyState message="No API keys yet. Create one to authenticate SDK requests." />
      ) : (
        <div className="space-y-2">
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className={`card flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3 transition-all ${
                key.is_active
                  ? 'hover:shadow-card-hover'
                  : 'opacity-50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <code className="text-[12px] font-mono text-label-secondary bg-surface-secondary px-2 py-0.5 rounded shrink-0">
                  {key.key_prefix}....
                </code>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-label-primary truncate">
                    {key.name}
                  </p>
                  <p className="text-[11px] text-label-quaternary">
                    Created {formatDate(key.created_at)}
                    {key.last_used_at && ` · Last used ${formatDate(key.last_used_at)}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-0 sm:ml-3">
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    key.is_active ? 'bg-sage-50 text-sage-600' : 'bg-red-50 text-red-600'
                  }`}
                >
                  {key.is_active ? 'Active' : 'Revoked'}
                </span>
                {key.is_active && canManage && (
                  <button
                    onClick={() => revokeKey.mutate(key.id)}
                    className="text-[12px] text-red-500 hover:text-red-600 font-medium transition-colors"
                  >
                    Revoke
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Key Modal */}
      {newKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-card-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h3 className="text-[16px] font-semibold font-display text-label-primary">
                API Key Created
              </h3>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-[12px] font-medium text-amber-800">
                This key will only be shown once. Copy it now and store it securely.
              </p>
            </div>

            <div className="relative mb-4">
              <pre className="bg-ink text-emerald-400 text-[13px] rounded-lg p-3 font-mono break-all whitespace-pre-wrap">
                {newKey.key}
              </pre>
              <button
                onClick={handleCopyKey}
                className="absolute top-2 right-2 px-3 py-1 text-[11px] font-medium bg-white/10 hover:bg-white/20 text-white rounded-md transition-all duration-200"
              >
                {keyCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[12px] text-label-quaternary">
                Name: {newKey.name}
              </p>
              <button
                onClick={() => setNewKey(null)}
                className="btn-accent px-4 py-2 text-[13px]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Invitations Tab
// ============================================================

function InvitationsTab({
  orgId,
  invitations,
  loading,
  canManage,
}: {
  orgId: number;
  invitations: { id: number; email: string; role: string; status: string; created_at: string; expires_at: string }[];
  loading: boolean;
  canManage: boolean;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');

  const inviteUser = useInviteUser(orgId);
  const cancelInvitation = useCancelInvitation(orgId);

  const handleInvite = () => {
    if (!email.trim()) return;
    inviteUser.mutate(
      { email: email.trim(), role },
      {
        onSuccess: () => {
          setEmail('');
          setRole('member');
        },
      }
    );
  };

  if (loading) {
    return <LoadingSpinner label="Loading invitations..." />;
  }

  return (
    <div className="space-y-5">
      {/* Invite Form */}
      {canManage && (
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            placeholder="Email address"
            className="input-field flex-1"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="input-field w-full sm:w-auto"
          >
            <option value="admin">Admin</option>
            <option value="member">Member</option>
          </select>
          <button
            onClick={handleInvite}
            disabled={!email.trim() || inviteUser.isPending}
            className="btn-accent px-4 py-2 text-[13px] w-full sm:w-auto disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {inviteUser.isPending ? 'Inviting...' : 'Invite'}
          </button>
        </div>
      )}

      {/* Invitations List */}
      {invitations.length === 0 ? (
        <EmptyState message="No pending invitations." />
      ) : (
        <div className="space-y-2">
          {invitations.map((inv) => (
            <div
              key={inv.id}
              className="card flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 transition-all duration-200 hover:shadow-card-hover"
            >
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-label-primary truncate">
                  {inv.email}
                </p>
                <p className="text-[12px] text-label-quaternary">
                  <span className={`font-medium ${ROLE_BADGES[inv.role] || ROLE_BADGES.member} px-1.5 py-0.5 rounded-full`}>
                    {inv.role.charAt(0).toUpperCase() + inv.role.slice(1)}
                  </span>
                  <span className="ml-2">
                    Expires {formatDate(inv.expires_at)}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    inv.status === 'pending'
                      ? 'bg-amber-50 text-amber-700'
                      : inv.status === 'accepted'
                      ? 'bg-sage-50 text-sage-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                </span>
                {inv.status === 'pending' && canManage && (
                  <button
                    onClick={() => cancelInvitation.mutate(inv.id)}
                    className="text-[12px] text-red-500 hover:text-red-600 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Usage Tab
// ============================================================

function UsageTab({ orgId }: { orgId: number }) {
  const { data: usage, isLoading } = useOrgUsage(orgId);

  if (isLoading || !usage) {
    return <LoadingSpinner label="Loading usage..." />;
  }

  return (
    <div className="space-y-5">
      {usage.is_suspended && (
        <div className="card p-4 border border-red-200 bg-red-50">
          <p className="text-[13px] font-medium text-red-700">
            This organization is suspended. Chat is disabled. Contact support to
            reactivate.
          </p>
        </div>
      )}

      <div className="card p-5 flex items-center justify-between">
        <div>
          <p className="text-[12px] uppercase tracking-wide text-label-quaternary">Plan</p>
          <p className="text-[18px] font-semibold font-display text-label-primary mt-1 capitalize">
            {usage.plan}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[12px] text-label-quaternary">Resets</p>
          <p className="text-[13px] font-medium text-label-secondary">
            {nextResetLabel(usage)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <UsageMeter
          label="Users"
          used={usage.users_count}
          limit={usage.max_users}
        />
        <UsageMeter
          label="Agents"
          used={usage.agents_count}
          limit={usage.max_agents}
        />
        <UsageMeter
          label={`Tokens (${usage.token_period})`}
          used={usage.tokens_used_in_period}
          limit={usage.max_tokens_per_period}
          format={formatTokens}
        />
      </div>
    </div>
  );
}

function UsageMeter({
  label,
  used,
  limit,
  format = (n: number) => n.toLocaleString(),
}: {
  label: string;
  used: number;
  limit: number | null;
  format?: (n: number) => string;
}) {
  const pct = limit && limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const isOver = limit != null && used >= limit;
  const isWarning = limit != null && pct >= 80 && !isOver;
  const barColor = isOver
    ? 'bg-red-500'
    : isWarning
    ? 'bg-amber-500'
    : 'bg-accent';

  return (
    <div className="card p-4">
      <p className="text-[12px] uppercase tracking-wide text-label-quaternary">
        {label}
      </p>
      <p className="text-[18px] font-semibold font-display text-label-primary mt-1">
        {format(used)}
        <span className="text-[13px] font-normal text-label-tertiary ml-1">
          / {limit == null ? '∞' : format(limit)}
        </span>
      </p>
      {limit != null && (
        <div className="mt-3 h-1.5 bg-surface-secondary rounded-full overflow-hidden">
          <div
            className={`${barColor} h-full transition-all duration-300`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {isOver && (
        <p className="text-[11px] text-red-600 mt-2 font-medium">Limit reached</p>
      )}
    </div>
  );
}

function nextResetLabel(usage: UsageSnapshot): string {
  if (!usage.token_period_start) return '—';
  const start = new Date(usage.token_period_start);
  const lengthDays = usage.token_period === 'weekly' ? 7 : usage.token_period === 'daily' ? 1 : 30;
  const next = new Date(start.getTime() + lengthDays * 24 * 60 * 60 * 1000);
  return next.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}


// ============================================================
// Shared Components
// ============================================================

function LoadingSpinner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-8 justify-center">
      <div className="w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
      <span className="text-[13px] text-label-tertiary">{label}</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-[13px] text-label-quaternary py-8 text-center">{message}</p>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default OrganizationSettingsPage;
