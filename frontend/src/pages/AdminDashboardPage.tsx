import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useAdminOrganization,
  useAdminOrganizations,
  useOrgAuditLog,
  usePlatformMetrics,
  useSuspendOrg,
  useTokenTimeseries,
  useUpdateLimits,
} from '../hooks/useAdmin';
import { useAuth } from '../hooks/useAuth';
import type { OrgAdminSummary } from '../types';

// ============================================================
// Admin Dashboard — platform-admin only surface.
// Route is gated by AdminRoute; this page assumes access is already verified.
// Three-pane layout: platform metrics, org list, per-org detail.
// ============================================================

function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const { data: metrics } = usePlatformMetrics();
  const { data: orgs = [], isLoading } = useAdminOrganizations();
  const { data: timeseries } = useTokenTimeseries(30);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return orgs;
    const q = search.trim().toLowerCase();
    return orgs.filter(
      (o) => o.name.toLowerCase().includes(q) || o.slug.toLowerCase().includes(q)
    );
  }, [orgs, search]);

  return (
    <div className="min-h-screen bg-surface-primary">
      <header className="h-14 border-b border-black/[0.06] flex items-center justify-between px-4 md:px-8 bg-white/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="text-[12px] text-label-tertiary hover:text-label-primary transition-colors"
          >
            ← Back to dashboard
          </Link>
          <h1 className="heading-md font-display text-label-primary">
            Platform Admin
          </h1>
          <span className="text-[10px] font-semibold uppercase tracking-wide bg-accent-light text-accent px-2 py-0.5 rounded-full">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-label-tertiary">{user?.email}</span>
          <button
            onClick={logout}
            className="text-[12px] text-red-500 hover:text-red-600 font-medium transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="w-full max-w-[1600px] mx-auto px-4 md:px-8 py-6 space-y-6 animate-fade-in lg:w-[90%]">
        {/* Metrics strip */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MetricCard label="Active orgs" value={metrics?.active_orgs ?? 0} />
          <MetricCard label="Suspended" value={metrics?.suspended_orgs ?? 0} />
          <MetricCard label="Users" value={metrics?.total_users ?? 0} />
          <MetricCard label="Agents" value={metrics?.total_agents ?? 0} />
          <MetricCard
            label="Tokens (30d)"
            value={formatTokens(metrics?.tokens_last_30_days ?? 0)}
          />
        </section>

        {/* Tokens over time */}
        {timeseries && timeseries.points.length > 0 && (
          <section className="card p-5">
            <p className="text-[12px] uppercase tracking-wide text-label-quaternary mb-3">
              Tokens per day (last 30 days)
            </p>
            <Sparkline points={timeseries.points.map((p) => p.total_tokens)} />
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Org list */}
          <section className="lg:col-span-2 space-y-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search organizations..."
              className="input-field w-full"
            />
            {isLoading ? (
              <p className="text-[13px] text-label-tertiary py-4 text-center">
                Loading...
              </p>
            ) : filtered.length === 0 ? (
              <p className="text-[13px] text-label-quaternary py-4 text-center">
                No organizations match.
              </p>
            ) : (
              <div className="space-y-1.5">
                {filtered.map((org) => (
                  <OrgRow
                    key={org.id}
                    org={org}
                    selected={org.id === selectedId}
                    onSelect={() => setSelectedId(org.id)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Detail */}
          <section className="lg:col-span-3">
            {selectedId ? (
              <OrgDetail orgId={selectedId} />
            ) : (
              <div className="card p-8 text-center">
                <p className="text-[14px] text-label-tertiary">
                  Select an organization to see details, edit limits, or view
                  the audit log.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

// ------------------------------------------------------------------

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card p-4">
      <p className="text-[11px] uppercase tracking-wide text-label-quaternary">
        {label}
      </p>
      <p className="text-[20px] font-semibold font-display text-label-primary mt-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length === 0) return null;
  const max = Math.max(...points, 1);
  const height = 60;
  const width = 600;
  const stepX = width / Math.max(points.length - 1, 1);
  const path = points
    .map((p, i) => {
      const x = i * stepX;
      const y = height - (p / max) * height;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-16"
      preserveAspectRatio="none"
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-accent"
      />
    </svg>
  );
}

function OrgRow({
  org,
  selected,
  onSelect,
}: {
  org: OrgAdminSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  const overLimit =
    (org.max_users != null && org.users_count >= org.max_users) ||
    (org.max_agents != null && org.agents_count >= org.max_agents) ||
    (org.max_tokens_per_period != null &&
      org.tokens_used_in_period >= org.max_tokens_per_period);

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left card p-3 transition-all duration-200 ${
        selected ? 'ring-2 ring-accent' : 'hover:shadow-card-hover'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-label-primary truncate">
            {org.name}
          </p>
          <p className="text-[11px] text-label-quaternary truncate">
            {org.slug}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {org.is_suspended && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">
              Suspended
            </span>
          )}
          {overLimit && !org.is_suspended && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">
              At limit
            </span>
          )}
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-surface-secondary text-label-secondary capitalize">
            {org.plan}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2 text-[11px] text-label-tertiary">
        <span>{org.users_count} users</span>
        <span>·</span>
        <span>{org.agents_count} agents</span>
        <span>·</span>
        <span>{formatTokens(org.tokens_used_in_period)} tokens</span>
      </div>
    </button>
  );
}

// ------------------------------------------------------------------

function OrgDetail({ orgId }: { orgId: number }) {
  const { data: org } = useAdminOrganization(orgId);
  const { data: audit = [] } = useOrgAuditLog(orgId);
  const updateLimits = useUpdateLimits(orgId);
  const suspend = useSuspendOrg(orgId);

  const [maxUsers, setMaxUsers] = useState<string>('');
  const [maxAgents, setMaxAgents] = useState<string>('');
  const [maxTokens, setMaxTokens] = useState<string>('');
  const [plan, setPlan] = useState<string>('');

  // Re-hydrate form fields when switching orgs or after a save.
  useEffect(() => {
    if (!org) return;
    setMaxUsers(org.max_users == null ? '' : String(org.max_users));
    setMaxAgents(org.max_agents == null ? '' : String(org.max_agents));
    setMaxTokens(
      org.max_tokens_per_period == null ? '' : String(org.max_tokens_per_period)
    );
    setPlan(org.plan);
  }, [org?.id, org?.plan, org?.max_users, org?.max_agents, org?.max_tokens_per_period]);

  if (!org) {
    return (
      <div className="card p-8 text-center">
        <p className="text-[14px] text-label-tertiary">Loading organization...</p>
      </div>
    );
  }

  const handleSave = () => {
    updateLimits.mutate({
      plan: plan || undefined,
      max_users: maxUsers === '' ? undefined : Number(maxUsers),
      max_agents: maxAgents === '' ? undefined : Number(maxAgents),
      max_tokens_per_period: maxTokens === '' ? undefined : Number(maxTokens),
      clear_max_users: maxUsers === '' && org.max_users != null,
      clear_max_agents: maxAgents === '' && org.max_agents != null,
      clear_max_tokens: maxTokens === '' && org.max_tokens_per_period != null,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card p-5 flex items-start justify-between">
        <div>
          <p className="text-[18px] font-semibold font-display text-label-primary">
            {org.name}
          </p>
          <p className="text-[12px] text-label-tertiary">{org.slug}</p>
          <p className="text-[11px] text-label-quaternary mt-1">
            Created {new Date(org.created_at).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={() => suspend.mutate(!org.is_suspended)}
          disabled={suspend.isPending}
          className={`text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors ${
            org.is_suspended
              ? 'bg-sage-50 text-sage-700 hover:bg-sage-100'
              : 'bg-red-50 text-red-600 hover:bg-red-100'
          } disabled:opacity-50`}
        >
          {org.is_suspended ? 'Reactivate' : 'Suspend'}
        </button>
      </div>

      {/* Usage snapshot */}
      <div className="grid grid-cols-3 gap-3">
        <UsageChip label="Users" used={org.users_count} limit={org.max_users} />
        <UsageChip label="Agents" used={org.agents_count} limit={org.max_agents} />
        <UsageChip
          label="Tokens"
          used={org.tokens_used_in_period}
          limit={org.max_tokens_per_period}
          format={formatTokens}
        />
      </div>

      {/* Edit limits */}
      <div className="card p-5 space-y-3">
        <p className="text-[13px] font-semibold text-label-primary">Limits</p>
        <p className="text-[11px] text-label-quaternary -mt-1">
          Leave blank for unlimited.
        </p>
        <LimitField label="Plan">
          <input
            type="text"
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            placeholder="free / starter / pro"
            className="input-field w-full"
          />
        </LimitField>
        <LimitField label="Max users">
          <input
            type="number"
            min={0}
            value={maxUsers}
            onChange={(e) => setMaxUsers(e.target.value)}
            placeholder="unlimited"
            className="input-field w-full"
          />
        </LimitField>
        <LimitField label="Max Agents">
          <input
            type="number"
            min={0}
            value={maxAgents}
            onChange={(e) => setMaxAgents(e.target.value)}
            placeholder="unlimited"
            className="input-field w-full"
          />
        </LimitField>
        <LimitField label={`Max tokens / ${org.token_period}`}>
          <input
            type="number"
            min={0}
            value={maxTokens}
            onChange={(e) => setMaxTokens(e.target.value)}
            placeholder="unlimited"
            className="input-field w-full"
          />
        </LimitField>
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={updateLimits.isPending}
            className="btn-accent px-4 py-2 text-[13px] disabled:opacity-40"
          >
            {updateLimits.isPending ? 'Saving...' : 'Save limits'}
          </button>
        </div>
      </div>

      {/* Audit log */}
      <div className="card p-5">
        <p className="text-[13px] font-semibold text-label-primary mb-3">
          Audit log
        </p>
        {audit.length === 0 ? (
          <p className="text-[12px] text-label-quaternary py-4 text-center">
            No activity yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {audit.map((entry) => (
              <li key={entry.id} className="text-[12px] flex gap-2">
                <span className="text-label-quaternary shrink-0 tabular-nums">
                  {new Date(entry.created_at).toLocaleString()}
                </span>
                <span className="font-mono text-label-secondary">
                  {entry.action}
                </span>
                {entry.extra?.email != null && (
                  <span className="text-label-tertiary truncate">
                    {String(entry.extra.email)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function LimitField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3">
      <span className="text-[12px] text-label-tertiary w-36 shrink-0">
        {label}
      </span>
      <div className="flex-1">{children}</div>
    </label>
  );
}

function UsageChip({
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
  return (
    <div className="card p-3">
      <p className="text-[11px] uppercase tracking-wide text-label-quaternary">
        {label}
      </p>
      <p className="text-[16px] font-semibold text-label-primary mt-0.5">
        {format(used)}
        <span className="text-[12px] text-label-tertiary font-normal ml-1">
          / {limit == null ? '∞' : format(limit)}
        </span>
      </p>
    </div>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default AdminDashboardPage;
