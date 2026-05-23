import { Link } from 'react-router-dom';
import { useOrgUsage } from '../hooks/useOrganization';
import { formatCompactNumber } from '../lib/format';

// ============================================================
// OrganizationCard – org identity, agent + token usage, and
// shortcuts into API keys and org management.
// Backed by the real /usage endpoint (useOrgUsage).
// ============================================================

interface OrganizationCardProps {
  orgId: number;
  orgName: string;
}

/** A labelled usage row with a progress bar. `limit === null` means unlimited. */
function UsageRow({
  label,
  used,
  limit,
  format = (n) => String(n),
}: {
  label: string;
  used: number;
  limit: number | null;
  format?: (n: number) => string;
}) {
  const isUnlimited = limit === null;
  const pct = isUnlimited || limit === 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[13px]">
        <span className="text-label-tertiary">{label}</span>
        <span className="font-medium text-label-primary tabular-nums">
          {format(used)} / {isUnlimited ? '∞' : format(limit)}
        </span>
      </div>
      <div className="w-full bg-surface-tertiary h-2 rounded-full overflow-hidden">
        <div
          className="bg-accent h-full rounded-full transition-all duration-500"
          style={{ width: `${isUnlimited ? 4 : pct}%` }}
        />
      </div>
    </div>
  );
}

function OrganizationCard({ orgId, orgName }: OrganizationCardProps) {
  const { data: usage, isLoading } = useOrgUsage(orgId);
  const suspended = usage?.is_suspended ?? false;

  return (
    <div className="bg-white hairline-border rounded-xl p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="min-w-0">
          <h4 className="text-[12px] font-semibold text-label-tertiary uppercase tracking-wider">
            Organization
          </h4>
          <p className="heading-md mt-1 truncate">{isLoading ? '—' : orgName}</p>
        </div>
        <span
          className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${
            suspended ? 'bg-red-500/10 text-red-500' : 'bg-accent/10 text-accent'
          }`}
        >
          {suspended ? 'SUSPENDED' : 'ACTIVE'}
        </span>
      </div>

      <div className="space-y-4 mb-5">
        <UsageRow label="Agents" used={usage?.agents_count ?? 0} limit={usage?.max_agents ?? null} />
        <UsageRow
          label="AI Tokens"
          used={usage?.tokens_used_in_period ?? 0}
          limit={usage?.max_tokens_per_period ?? null}
          format={formatCompactNumber}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Link
          to={`/organizations/${orgId}/settings?section=api-keys`}
          className="flex items-center justify-center gap-2 w-full border border-black/[0.1] text-label-secondary py-2 rounded-lg text-[13px] font-semibold hover:bg-surface-secondary transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>key</span>
          API Keys
        </Link>
        <Link
          to={`/organizations/${orgId}/settings`}
          className="flex items-center justify-center gap-2 w-full border border-black/[0.1] text-label-secondary py-2 rounded-lg text-[13px] font-semibold hover:bg-surface-secondary transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>settings</span>
          Manage Organization
        </Link>
      </div>
    </div>
  );
}

export default OrganizationCard;
