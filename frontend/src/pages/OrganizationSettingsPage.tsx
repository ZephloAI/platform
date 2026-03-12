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
} from '../hooks/useOrganization';
import { useOrgStore } from '../stores/orgStore';
import type { ApiKeyCreated } from '../types';

// ============================================================
// Organization Settings Page
// Full-page sidebar layout matching ChatbotLayout.
// Sidebar sections: Users (Members, Invitations), API Keys
// ============================================================

type Section = 'members' | 'invitations' | 'api-keys';

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
  const setActiveSection = (section: Section) => setSearchParams({ section });

  const [accountOpen, setAccountOpen] = useState(false);
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
        ? 'bg-black/[0.06] text-label-primary'
        : 'text-label-secondary hover:bg-black/[0.03] hover:text-label-primary'
    }`;

  const sectionTitle: Record<Section, string> = {
    members: 'Members',
    invitations: 'Invitations',
    'api-keys': 'API Keys',
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 border-r border-black/[0.06] flex flex-col h-screen sticky top-0">
        {/* Org name header */}
        <div className="px-4 pt-5 pb-3">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-purple-800 flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
              {orgName.charAt(0).toUpperCase()}
            </div>
            <span className="text-[13px] font-semibold text-label-primary truncate flex-1 text-left">
              {orgName}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {/* Home link */}
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-label-secondary hover:bg-black/[0.03] hover:text-label-primary transition-all duration-200 mb-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Home
          </Link>

          <div className="border-t border-black/[0.06] my-2" />

          {/* Users section */}
          <p className="px-3 py-1.5 text-[10px] font-semibold text-label-quaternary uppercase tracking-wider">
            Users
          </p>
          <button
            onClick={() => setActiveSection('members')}
            className={navLinkClass(activeSection === 'members')}
          >
            <span className={activeSection === 'members' ? 'text-label-primary' : 'text-label-tertiary'}>
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
            <span className={activeSection === 'invitations' ? 'text-label-primary' : 'text-label-tertiary'}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </span>
            <span className="flex-1 text-left">Invitations</span>
          </button>

          <div className="border-t border-black/[0.06] my-2" />

          {/* API Keys section */}
          <p className="px-3 py-1.5 text-[10px] font-semibold text-label-quaternary uppercase tracking-wider">
            Developer
          </p>
          <button
            onClick={() => setActiveSection('api-keys')}
            className={navLinkClass(activeSection === 'api-keys')}
          >
            <span className={activeSection === 'api-keys' ? 'text-label-primary' : 'text-label-tertiary'}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </span>
            <span className="flex-1 text-left">API Keys</span>
          </button>
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-4 border-t border-black/[0.06] pt-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-label-tertiary hover:bg-black/[0.03] hover:text-label-primary transition-all duration-200 w-full"
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
        <header className="h-14 border-b border-black/[0.06] flex items-center justify-between px-8 shrink-0 bg-white sticky top-0 z-40">
          <h1 className="text-[17px] font-semibold text-label-primary tracking-tight">
            {sectionTitle[activeSection]}
          </h1>
          <div className="relative" ref={accountRef}>
            <button
              onClick={() => setAccountOpen(!accountOpen)}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-blue-800 flex items-center justify-center text-white text-[11px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
            >
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </button>
            {accountOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-black/[0.08] rounded-lg shadow-lg overflow-hidden animate-fade-in z-50">
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
                    className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-label-secondary hover:bg-black/[0.03] hover:text-label-primary transition-colors"
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
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-8">
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
            className="flex items-center justify-between p-4 rounded-xl border border-black/[0.06] bg-white transition-all duration-200 hover:border-black/[0.1]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-[14px] font-semibold text-label-secondary shrink-0">
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

            <div className="flex items-center gap-3 shrink-0 ml-3">
              {canManage && member.role !== 'creator' && member.user_id !== currentUserId ? (
                <select
                  value={member.role}
                  onChange={(e) =>
                    updateRole.mutate({ userId: member.user_id, role: e.target.value })
                  }
                  className="text-[12px] font-medium px-2 py-1 rounded-lg border border-black/[0.06] bg-white text-label-secondary focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
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
                  className="text-[12px] text-red-500 hover:text-red-700 font-medium transition-colors"
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
        <div className="flex gap-2">
          <input
            type="text"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Key name (e.g. Production)"
            className="flex-1 px-3 py-2 text-[13px] bg-black/[0.03] border border-black/[0.06] rounded-lg text-label-primary placeholder:text-label-quaternary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
          />
          <button
            onClick={handleCreate}
            disabled={!keyName.trim() || createKey.isPending}
            className="btn-primary px-4 py-2 text-[13px] disabled:opacity-40 disabled:cursor-not-allowed"
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
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                key.is_active
                  ? 'bg-white border-black/[0.06]'
                  : 'bg-black/[0.01] border-black/[0.03] opacity-50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <code className="text-[12px] font-mono text-label-secondary bg-black/[0.04] px-2 py-0.5 rounded shrink-0">
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
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    key.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                  }`}
                >
                  {key.is_active ? 'Active' : 'Revoked'}
                </span>
                {key.is_active && canManage && (
                  <button
                    onClick={() => revokeKey.mutate(key.id)}
                    className="text-[12px] text-red-500 hover:text-red-700 font-medium transition-colors"
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
          <div className="bg-white border border-black/[0.08] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h3 className="text-[16px] font-semibold text-label-primary">
                API Key Created
              </h3>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-[12px] font-medium text-amber-800">
                This key will only be shown once. Copy it now and store it securely.
              </p>
            </div>

            <div className="relative mb-4">
              <pre className="bg-gray-900 text-green-400 text-[13px] rounded-lg p-3 font-mono break-all whitespace-pre-wrap">
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
                className="btn-primary px-4 py-2 text-[13px]"
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
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            placeholder="Email address"
            className="flex-1 px-3 py-2 text-[13px] bg-black/[0.03] border border-black/[0.06] rounded-lg text-label-primary placeholder:text-label-quaternary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-3 py-2 text-[13px] bg-black/[0.03] border border-black/[0.06] rounded-lg text-label-primary focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
          >
            <option value="admin">Admin</option>
            <option value="member">Member</option>
          </select>
          <button
            onClick={handleInvite}
            disabled={!email.trim() || inviteUser.isPending}
            className="btn-primary px-4 py-2 text-[13px] disabled:opacity-40 disabled:cursor-not-allowed"
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
              className="flex items-center justify-between p-4 rounded-xl border border-black/[0.06] bg-white transition-all duration-200"
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
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    inv.status === 'pending'
                      ? 'bg-yellow-50 text-yellow-700'
                      : inv.status === 'accepted'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                </span>
                {inv.status === 'pending' && canManage && (
                  <button
                    onClick={() => cancelInvitation.mutate(inv.id)}
                    className="text-[12px] text-red-500 hover:text-red-700 font-medium transition-colors"
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
