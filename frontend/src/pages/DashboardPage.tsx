import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useChatbots, useDeleteChatbot, useOrgAnalytics, useOrgChatbotAnalytics } from '../hooks/useChatbots';
import ChatbotCard from '../components/ChatbotCard';
import AnalyticsChart from '../components/AnalyticsChart';
import ConfirmModal from '../components/ConfirmModal';
import { useOrgStore } from '../stores/orgStore';
import { useAuth } from '../hooks/useAuth';

function DashboardPage() {
  const { user } = useAuth();
  const { data: chatbots, isLoading, error } = useChatbots();
  const deleteMutation = useDeleteChatbot();
  const activeOrg = useOrgStore((state) => state.activeOrganization);
  const { data: analytics, isLoading: analyticsLoading } = useOrgAnalytics(activeOrg?.id);
  const { data: chatbotAnalytics } = useOrgChatbotAnalytics(activeOrg?.id);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const firstName = user?.first_name || user?.email?.split('@')[0] || '';
  const hasAgents = chatbots && chatbots.length > 0;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6 md:mb-8">
        <h1 className="heading-xl">
          {firstName ? `Hi, ${firstName}` : 'Home'}
        </h1>
        {hasAgents && (
          <Link
            to="/agents/new"
            className="btn-accent inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold rounded-xl"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Agent
          </Link>
        )}
      </div>

      {/* Compact charts row */}
      {hasAgents && (
        <div className="mb-8">
          {analyticsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="metric-card !p-4 animate-pulse">
                  <div className="h-2.5 w-14 bg-black/[0.06] rounded mb-2" />
                  <div className="h-6 w-10 bg-black/[0.06] rounded mb-2" />
                  <div className="h-16 bg-black/[0.03] rounded" />
                </div>
              ))}
            </div>
          ) : analytics ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <AnalyticsChart
                data={analytics.messages_per_day}
                title="Messages"
                color="#1275CA"
              />
              <AnalyticsChart
                data={analytics.conversations_per_day}
                title="Conversations"
                color="#1A1A2E"
                delay="60ms"
              />
              <AnalyticsChart
                data={analytics.resolved_per_day}
                title="Resolved"
                color="#6B8F71"
                delay="120ms"
              />
              <AnalyticsChart
                data={analytics.unique_visitors_per_day}
                title="Visitors"
                color="#D4A853"
                delay="180ms"
              />
            </div>
          ) : null}
        </div>
      )}

      {/* Agents */}
      <div>
        {hasAgents && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="heading-md">Agents</h2>
              <span className="text-[12px] font-medium text-label-quaternary">{chatbots.length}</span>
            </div>

            {/* Column headers - hidden on mobile */}
            <div className="hidden md:flex items-center gap-4 px-5 pb-2">
              <div className="w-9 shrink-0" />
              <div className="w-40 shrink-0" />
              <div className="flex-1 flex items-center justify-center gap-8">
                <div className="w-[106px] text-center">
                  <p className="text-[10px] font-semibold text-label-quaternary uppercase tracking-wider">Messages</p>
                </div>
                <div className="w-[106px] text-center">
                  <p className="text-[10px] font-semibold text-label-quaternary uppercase tracking-wider">Conversations</p>
                </div>
                <div className="w-[106px] text-center">
                  <p className="text-[10px] font-semibold text-label-quaternary uppercase tracking-wider">Resolutions</p>
                </div>
              </div>
              <div className="w-[92px] shrink-0" />
            </div>

            <div className="card rounded-2xl overflow-hidden divide-y divide-black/[0.04]">
              {chatbots.map((chatbot) => (
                <ChatbotCard
                  key={chatbot.id}
                  chatbot={chatbot}
                  analytics={chatbotAnalytics?.[chatbot.id]}
                  onDelete={() => setDeleteTarget({ id: chatbot.public_id, name: chatbot.name })}
                />
              ))}
            </div>
          </>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-5 h-5 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="card rounded-2xl p-6 text-center">
            <p className="text-[14px] text-red-500">
              Failed to load agents. Please try refreshing.
            </p>
          </div>
        )}

        {chatbots && chatbots.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-accent-light flex items-center justify-center mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-accent" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 className="text-[16px] font-display font-semibold text-label-primary mb-1">
              Create your first agent
            </h2>
            <p className="text-[13px] text-label-tertiary mb-6 max-w-[280px]">
              Point it at your website and it'll answer questions for your visitors.
            </p>
            <Link
              to="/agents/new"
              className="btn-accent px-5 py-2.5 text-[13px] font-semibold rounded-xl"
            >
              Get Started
            </Link>
          </div>
        )}
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
