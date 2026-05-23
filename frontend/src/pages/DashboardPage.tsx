import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useChatbots, useDeleteChatbot, useOrgAnalytics, useOrgChatbotMetrics } from '../hooks/useChatbots';
import { useOrgUsage } from '../hooks/useOrganization';
import ChatbotCard from '../components/ChatbotCard';
import MetricCard from '../components/MetricCard';
import ConfirmModal from '../components/ConfirmModal';
import OrganizationCard from '../components/OrganizationCard';
import NeedsAttentionCard from '../components/NeedsAttentionCard';
import RecentConversationsCard from '../components/RecentConversationsCard';
import { useOrgStore } from '../stores/orgStore';
import { useAuth } from '../hooks/useAuth';
import { formatCompactNumber, trendFromSeries } from '../lib/format';
import type { OrgAnalytics, DailyDataPoint } from '../types';

/** Turn the org analytics series into the four headline metric tiles. */
function buildMetrics(a: OrgAnalytics) {
  const counts = (s: DailyDataPoint[]) => s.map((p) => p.count);
  const sum = (s: DailyDataPoint[]) => s.reduce((acc, p) => acc + p.count, 0);

  const convTotal = sum(a.conversations_per_day);
  const resTotal = sum(a.resolved_per_day);

  return [
    {
      label: 'Messages',
      value: formatCompactNumber(sum(a.messages_per_day)),
      series: counts(a.messages_per_day),
      trend: trendFromSeries(counts(a.messages_per_day)),
    },
    {
      label: 'Conversations',
      value: formatCompactNumber(convTotal),
      series: counts(a.conversations_per_day),
      trend: trendFromSeries(counts(a.conversations_per_day)),
    },
    {
      label: 'Resolved',
      value: formatCompactNumber(resTotal),
      series: counts(a.resolved_per_day),
      trend: trendFromSeries(counts(a.resolved_per_day)),
    },
    {
      label: 'Visitors',
      value: formatCompactNumber(sum(a.unique_visitors_per_day)),
      series: counts(a.unique_visitors_per_day),
      trend: trendFromSeries(counts(a.unique_visitors_per_day)),
    },
  ];
}

function DashboardPage() {
  const { user } = useAuth();
  const { data: chatbots, isLoading, error } = useChatbots();
  const deleteMutation = useDeleteChatbot();
  const activeOrg = useOrgStore((state) => state.activeOrganization);
  const { data: analytics, isLoading: analyticsLoading } = useOrgAnalytics(activeOrg?.id);
  const { data: chatbotMetrics } = useOrgChatbotMetrics(activeOrg?.id);
  const { data: usage } = useOrgUsage(activeOrg?.id ?? 0);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const firstName = user?.first_name || user?.email?.split('@')[0] || '';
  const hasAgents = !!chatbots && chatbots.length > 0;
  const metrics = analytics ? buildMetrics(analytics) : [];
  const atAgentLimit =
    !!usage && usage.max_agents !== null && usage.agents_count >= usage.max_agents;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="heading-xl">{firstName ? `Hi, ${firstName}` : 'Home'}</h1>
          <p className="text-[16px] text-label-tertiary mt-1">
            Here's what's happening with your AI agents today.
          </p>
        </div>
        {atAgentLimit ? (
          <button
            type="button"
            disabled
            title={`You've reached your plan's agent limit (${usage?.max_agents}). Manage your organization to add more.`}
            className="bg-accent/40 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-[13px] font-semibold cursor-not-allowed"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
            New Agent
          </button>
        ) : (
          <Link
            to="/agents/new"
            className="bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-[13px] font-semibold transition-all shadow-sm active:scale-[0.97]"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
            New Agent
          </Link>
        )}
      </div>

      {/* Metrics strip */}
      {analyticsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white hairline-border p-5 rounded-xl animate-pulse">
              <div className="h-2.5 w-16 bg-black/[0.06] rounded mb-3" />
              <div className="h-7 w-14 bg-black/[0.06] rounded mb-3" />
              <div className="h-10 bg-black/[0.03] rounded" />
            </div>
          ))}
        </div>
      ) : (
        analytics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {metrics.map((m) => (
              <MetricCard key={m.label} {...m} />
            ))}
          </div>
        )
      )}

      {/* Main content: agents + side panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {/* Agents */}
        <div className="xl:col-span-2 2xl:col-span-3 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <h3 className="heading-md">AI Agents</h3>
            {hasAgents && (
              <span className="text-[13px] font-medium text-label-quaternary">{chatbots.length}</span>
            )}
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-24">
              <div className="w-5 h-5 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="bg-white hairline-border rounded-xl p-6 text-center">
              <p className="text-[14px] text-red-500">Failed to load agents. Please try refreshing.</p>
            </div>
          )}

          {!isLoading && !error && !hasAgents && (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white hairline-border rounded-xl">
              <div className="w-14 h-14 rounded-2xl bg-accent-light flex items-center justify-center mb-5 text-accent">
                <span className="material-symbols-outlined" style={{ fontSize: 28 }}>smart_toy</span>
              </div>
              <h2 className="heading-md mb-1">Create your first agent</h2>
              <p className="text-[13px] text-label-tertiary mb-6 max-w-[280px]">
                Point it at your website and it'll answer questions for your visitors.
              </p>
              <Link to="/agents/new" className="btn-accent px-5 py-2.5 text-[13px] font-semibold rounded-xl">
                Get Started
              </Link>
            </div>
          )}

          {!isLoading && !error && (chatbots ?? []).map((chatbot) => (
            <ChatbotCard
              key={chatbot.id}
              chatbot={chatbot}
              metrics={chatbotMetrics?.metrics?.[chatbot.id]}
              onDelete={() => setDeleteTarget({ id: chatbot.public_id, name: chatbot.name })}
            />
          ))}
        </div>

        {/* Side panel */}
        <aside className="flex flex-col gap-6">
          {activeOrg && <OrganizationCard orgId={activeOrg.id} orgName={activeOrg.name} />}
          <NeedsAttentionCard chatbots={chatbots ?? []} />
          {activeOrg && <RecentConversationsCard orgId={activeOrg.id} />}
        </aside>
      </div>

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete agent"
        description={`This will permanently delete "${deleteTarget?.name}" and all its data including conversations, messages, and crawled pages. This can't be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default DashboardPage;
