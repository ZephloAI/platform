import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { Chatbot } from '../types';
import apiClient from '../api/client';
import { useOrgStore } from '../stores/orgStore';

interface ChatbotMetrics {
  total_conversations: number;
  total_messages: number;
  resolved_requests: number;
}

type EmbedTab = 'fab' | 'chat' | 'npm' | 'legacy';

interface OverviewSectionProps {
  chatbot: Chatbot;
}

function OverviewSection({ chatbot }: OverviewSectionProps) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [embedTab, setEmbedTab] = useState<EmbedTab>('fab');
  const activeOrg = useOrgStore((state) => state.activeOrganization);
  const [metrics, setMetrics] = useState<ChatbotMetrics | null>(null);

  useEffect(() => {
    apiClient
      .get(`/api/agents/${chatbot.public_id}/metrics`)
      .then((res) => setMetrics(res.data))
      .catch(() => {});
  }, [chatbot.public_id]);

  const origin = window.location.origin;

  const handleToggleActive = async () => {
    try {
      await apiClient.put(`/api/agents/${chatbot.public_id}`, {
        is_active: !chatbot.is_active,
      });
      queryClient.invalidateQueries({ queryKey: ['chatbots', chatbot.public_id] });
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
    } catch {
      // silently ignore
    }
  };

  const initScript = `<script src="${origin}/widget/zephlo.js"></script>
<script>
  Zephlo.initialize({
    key: "YOUR_API_KEY",
    chatbotId: "${chatbot.public_id}"
  });
</script>`;

  const fabCode = `${initScript}

<!-- Floating chat button (bottom-right corner) -->
<zephlo-fab></zephlo-fab>`;

  const chatCode = `${initScript}

<!-- Inline chat view — place it in any section of your page -->
<zephlo-chat width="400" height="600"></zephlo-chat>`;

  const npmCode = `npm install zephlo

import Zephlo from "zephlo";

Zephlo.initialize({
  key: "YOUR_API_KEY",
  chatbotId: "${chatbot.public_id}"
});

// Then render one (or both) in your JSX:
// <zephlo-fab />
// <zephlo-chat width="400" height="600" />`;

  const legacyCode = `<script
  src="${origin}/widget/chatbot-widget.js"
  data-chatbot-id="${chatbot.public_id}"
></script>`;

  const embedCodeMap: Record<EmbedTab, string> = {
    fab: fabCode,
    chat: chatCode,
    npm: npmCode,
    legacy: legacyCode,
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCodeMap[embedTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pagesIndexed = chatbot.crawl_jobs?.reduce((sum, j) => sum + j.pages_crawled, 0) || 0;
  const crawlJobs = chatbot.crawl_jobs?.length || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Status + Toggle */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full ${chatbot.is_active ? 'bg-sage-500' : 'bg-black/[0.12]'}`} />
            <div>
              <p className="text-[14px] font-display font-semibold text-label-primary">
                {chatbot.is_active ? 'Active' : 'Inactive'}
              </p>
              <p className="text-[12px] text-label-tertiary">
                {chatbot.is_active ? 'Widget is accepting conversations' : 'Widget is hidden from visitors'}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleActive}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
              chatbot.is_active ? 'bg-accent' : 'bg-black/[0.12]'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                chatbot.is_active ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        {chatbot.is_active && (
          <div className="pt-4 mt-4 border-t border-black/[0.04]">
            <Link
              to={`/agents/${chatbot.public_id}/chat`}
              className="inline-flex items-center gap-2 text-[13px] font-medium text-accent hover:text-accent/80 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Open Chat Preview
            </Link>
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Pages Indexed', value: pagesIndexed, color: '#1275CA' },
          { label: 'Crawl Jobs', value: crawlJobs, color: '#1A1A2E' },
          { label: 'Conversations', value: metrics?.total_conversations ?? '—', color: '#6B8F71' },
          { label: 'Resolved', value: metrics?.resolved_requests ?? '—', color: '#D4A853' },
        ].map((item, i) => (
          <div
            key={item.label}
            className="card !p-4 animate-fade-in"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <p className="text-[11px] font-medium text-label-tertiary uppercase tracking-wider mb-1">
              {item.label}
            </p>
            <p className="text-[22px] font-display font-bold" style={{ color: item.color }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Created date */}
      <p className="text-[12px] text-label-quaternary">
        Created{' '}
        {new Date(chatbot.created_at).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>

      {/* Embed Code */}
      <div className="card p-5">
        <h2 className="text-[14px] font-display font-semibold text-label-primary mb-1">
          Embed Code
        </h2>
        <p className="text-[12px] text-label-tertiary mb-4">
          Add the Zephlo widget to your website.
        </p>

        <div className="flex gap-1 mb-4 p-1 bg-surface-secondary rounded-xl w-fit">
          {([
            { key: 'fab' as EmbedTab, label: 'Floating Button' },
            { key: 'chat' as EmbedTab, label: 'Inline Chat' },
            { key: 'npm' as EmbedTab, label: 'npm' },
            { key: 'legacy' as EmbedTab, label: 'Legacy' },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setEmbedTab(tab.key)}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-lg transition-all duration-200 ${
                embedTab === tab.key
                  ? 'bg-white text-label-primary shadow-sm'
                  : 'text-label-tertiary hover:text-label-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <pre className="bg-ink text-emerald-400 text-[12px] rounded-xl p-4 overflow-x-auto font-mono leading-relaxed">
            {embedCodeMap[embedTab]}
          </pre>
          <button
            onClick={handleCopyEmbed}
            className="absolute top-3 right-3 px-3 py-1.5 text-[11px] font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* API Keys Info */}
      {activeOrg && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-secondary/60">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-label-tertiary shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p className="text-[13px] text-label-secondary">
            API Keys are managed at the organization level.{' '}
            <Link
              to={`/organizations/${activeOrg.id}/settings`}
              className="text-accent hover:text-accent/80 font-medium transition-colors"
            >
              Manage API Keys
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

export default OverviewSection;
