import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { Chatbot } from '../types';
import type { Trend } from '../lib/format';
import { trendFromSeries } from '../lib/format';
import { useOrgChatbotAnalytics } from '../hooks/useChatbots';
import apiClient from '../api/client';
import { useOrgStore } from '../stores/orgStore';

interface ChatbotMetrics {
  total_conversations: number;
  total_messages: number;
  resolved_requests: number;
}

type EmbedTab = 'script' | 'inline' | 'npm';

interface OverviewSectionProps {
  chatbot: Chatbot;
}

/** A small delta badge reusing the dashboard trend styles. */
function TrendBadge({ trend }: { trend?: Trend }) {
  if (!trend) return null;
  const cls =
    trend.direction === 'up' ? 'trend-up' : trend.direction === 'down' ? 'trend-down' : 'trend-flat';
  const icon = trend.direction === 'down' ? 'trending_down' : 'trending_up';
  const sign = trend.pct > 0 ? '+' : '';
  return (
    <span className={`trend-badge ${cls} gap-0.5`}>
      {sign}
      {trend.pct}%
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{icon}</span>
    </span>
  );
}

function OverviewSection({ chatbot }: OverviewSectionProps) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [embedTab, setEmbedTab] = useState<EmbedTab>('script');
  const activeOrg = useOrgStore((state) => state.activeOrganization);
  const [metrics, setMetrics] = useState<ChatbotMetrics | null>(null);

  // Per-agent daily series → real trend badges (shared cache, refetched elsewhere).
  const { data: analyticsMap } = useOrgChatbotAnalytics(activeOrg?.id);
  const mini = analyticsMap?.[chatbot.id];
  const convTrend = mini ? trendFromSeries(mini.conversations.map((d) => d.count)) : undefined;
  const msgTrend = mini ? trendFromSeries(mini.messages.map((d) => d.count)) : undefined;
  const resTrend = mini ? trendFromSeries(mini.resolved.map((d) => d.count)) : undefined;

  useEffect(() => {
    apiClient
      .get(`/api/agents/${chatbot.public_id}/metrics`)
      .then((res) => setMetrics(res.data))
      .catch(() => {});
  }, [chatbot.public_id]);

  const handleToggleActive = async () => {
    try {
      await apiClient.put(`/api/agents/${chatbot.public_id}`, { is_active: !chatbot.is_active });
      queryClient.invalidateQueries({ queryKey: ['chatbots', chatbot.public_id] });
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
    } catch {
      // silently ignore
    }
  };

  const hasMetrics = metrics !== null;
  const conv = metrics?.total_conversations ?? 0;
  const msgs = metrics?.total_messages ?? 0;
  const resolved = metrics?.resolved_requests ?? 0;
  const avgMsgs = conv > 0 ? Math.round(msgs / conv) : 0;
  const pagesIndexed = chatbot.crawl_jobs?.reduce((sum, j) => sum + j.pages_crawled, 0) || 0;

  const initScript = `<script src="https://unpkg.com/zephlo"></script>
<script>
  Zephlo.initialize({
    key: "YOUR_API_KEY",
    chatbotId: "${chatbot.public_id}"
  });
</script>`;

  const embedCodeMap: Record<EmbedTab, string> = {
    script: `${initScript}

<!-- Floating chat button (bottom-right corner) -->
<zephlo-fab></zephlo-fab>`,
    inline: `${initScript}

<!-- Embed inline in any container -->
<zephlo-chat width="400" height="600"></zephlo-chat>`,
    npm: `npm install zephlo

import Zephlo from "zephlo";

Zephlo.initialize({
  key: "YOUR_API_KEY",
  chatbotId: "${chatbot.public_id}"
});

// Then render in your JSX:
// <zephlo-fab />
// <zephlo-chat width="400" height="600" />`,
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCodeMap[embedTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs: { key: EmbedTab; label: string; icon: string }[] = [
    { key: 'script', label: 'Script Tag', icon: 'code' },
    { key: 'inline', label: 'Inline Element', icon: 'widgets' },
    { key: 'npm', label: 'NPM / React', icon: 'terminal' },
  ];

  const tiles = [
    {
      label: 'Total Conversations',
      icon: 'forum',
      iconBg: 'bg-accent/10',
      iconText: 'text-accent',
      value: hasMetrics ? conv.toLocaleString() : '—',
      trend: convTrend,
      caption: 'All-time total',
    },
    {
      label: 'Messages Processed',
      icon: 'chat_bubble',
      iconBg: 'bg-sage-50',
      iconText: 'text-sage-600',
      value: hasMetrics ? msgs.toLocaleString() : '—',
      trend: msgTrend,
      caption: hasMetrics ? `~${avgMsgs} msgs / conversation` : '',
    },
    {
      label: 'Resolved Requests',
      icon: 'verified',
      iconBg: 'bg-amber-50',
      iconText: 'text-amber-600',
      value: hasMetrics ? resolved.toLocaleString() : '—',
      trend: resTrend,
      caption: 'All-time total',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero: agent identity + status toggle */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white hairline-border p-6 md:p-8 rounded-3xl blue-glow-card">
        <div className="flex items-center gap-5 min-w-0">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-accent/5 rounded-2xl flex items-center justify-center text-accent shrink-0 overflow-hidden">
            {chatbot.widget_logo_url ? (
              <img src={chatbot.widget_logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined fill" style={{ fontSize: 38 }}>smart_toy</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="heading-xl truncate">
                {chatbot.name}
              </h2>
              {chatbot.is_active ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sage-50 text-sage-600 text-[12px] font-semibold rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-sage-500" />
                  Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/[0.05] text-label-tertiary text-[12px] font-semibold rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-label-quaternary" />
                  Inactive
                </span>
              )}
            </div>
            <p className="text-[16px] text-label-tertiary mt-1.5 line-clamp-2">
              {chatbot.description || 'No description yet — add one in Details.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-surface-secondary/70 p-4 rounded-2xl shrink-0">
          <div className="flex flex-col items-end">
            <span className="text-[12px] text-label-tertiary mb-1">Agent Status</span>
            <span className={`text-[13px] font-bold ${chatbot.is_active ? 'text-accent' : 'text-label-tertiary'}`}>
              {chatbot.is_active ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
          <button
            onClick={handleToggleActive}
            aria-label="Toggle agent active"
            className={`relative w-12 h-7 rounded-full transition-colors duration-200 shrink-0 ${
              chatbot.is_active ? 'bg-accent' : 'bg-black/[0.15]'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                chatbot.is_active ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>

      {/* KPI tiles */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiles.map((tile) => (
          <div key={tile.label} className="bg-white hairline-border p-6 rounded-2xl blue-glow-card">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${tile.iconBg} ${tile.iconText}`}>
                <span className="material-symbols-outlined">{tile.icon}</span>
              </div>
              <TrendBadge trend={tile.trend} />
            </div>
            <h4 className="text-[13px] font-medium text-label-tertiary">{tile.label}</h4>
            <p className="metric-value mt-1">
              {tile.value}
            </p>
            <p className="mt-3 text-[12px] text-label-quaternary">{tile.caption}</p>
          </div>
        ))}
      </section>

      {/* Integration & Deployment */}
      <section className="bg-white hairline-border rounded-3xl overflow-hidden blue-glow-card">
        <div className="p-6 md:p-8 border-b border-black/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="heading-md">Integration &amp; Deployment</h3>
            <p className="text-[14px] text-label-tertiary mt-0.5">
              Deploy your agent to your website in seconds.
            </p>
          </div>
          <a
            href={`/agents/${chatbot.public_id}/chat`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-surface-secondary text-accent px-5 py-2.5 rounded-xl text-[13px] font-semibold flex items-center gap-2 hover:bg-surface-tertiary transition-colors shrink-0"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>open_in_new</span>
            Preview in new tab
          </a>
        </div>

        <div className="p-6 md:p-8">
          {/* Tabs */}
          <div className="flex items-center gap-6 border-b border-black/[0.06] mb-6 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setEmbedTab(tab.key)}
                className={`pb-3 text-[13px] font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
                  embedTab === tab.key
                    ? 'border-accent text-accent'
                    : 'border-transparent text-label-tertiary hover:text-label-primary'
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Code block */}
          <div className="relative group">
            <pre className="bg-[#1e1e1e] text-blue-100 p-6 rounded-2xl overflow-x-auto font-mono text-[13px] leading-relaxed border border-white/5">
              {embedCodeMap[embedTab]}
            </pre>
            <button
              onClick={handleCopyEmbed}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg flex items-center gap-1.5 text-[12px] font-medium transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>content_copy</span>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Readiness checklist (real signals) */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChecklistItem
              ok={pagesIndexed > 0}
              title="Knowledge indexed"
              okText={`${pagesIndexed.toLocaleString()} pages crawled`}
              pendingText="No pages indexed yet — add knowledge"
            />
            <ChecklistItem
              ok={chatbot.is_active}
              title="Agent active"
              okText="Accepting conversations"
              pendingText="Currently hidden from visitors"
            />
          </div>

          {activeOrg && (
            <p className="mt-6 text-[13px] text-label-tertiary">
              Replace <code className="bg-surface-tertiary px-1.5 py-0.5 rounded text-[12px]">YOUR_API_KEY</code> with a key from{' '}
              <Link
                to={`/organizations/${activeOrg.id}/settings?section=api-keys`}
                className="text-accent hover:underline font-medium"
              >
                API Keys
              </Link>
              .
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

/** One row in the deployment readiness checklist. */
function ChecklistItem({
  ok,
  title,
  okText,
  pendingText,
}: {
  ok: boolean;
  title: string;
  okText: string;
  pendingText: string;
}) {
  return (
    <div className="flex items-start gap-4 p-4 bg-surface-secondary/60 rounded-xl">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          ok ? 'bg-sage-100 text-sage-600' : 'bg-amber-50 text-amber-600'
        }`}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{ok ? 'check' : 'pending'}</span>
      </div>
      <div>
        <p className="text-[14px] font-semibold text-label-primary">{title}</p>
        <p className="text-[13px] text-label-tertiary">{ok ? okText : pendingText}</p>
      </div>
    </div>
  );
}

export default OverviewSection;
