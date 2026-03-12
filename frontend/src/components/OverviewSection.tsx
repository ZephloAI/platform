import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { Chatbot } from '../types';
import apiClient from '../api/client';
import { useOrgStore } from '../stores/orgStore';

// ============================================================
// OverviewSection
// Status card, metrics, embed code with tabs, and API key mgmt.
// ============================================================

const STATUS_BADGES: Record<string, string> = {
  active: 'badge badge-ready',
  inactive: 'badge badge-error',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
};

type EmbedTab = 'script' | 'npm' | 'legacy';

interface OverviewSectionProps {
  chatbot: Chatbot;
}

function OverviewSection({ chatbot }: OverviewSectionProps) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [embedTab, setEmbedTab] = useState<EmbedTab>('script');
  const activeOrg = useOrgStore((state) => state.activeOrganization);

  const origin = window.location.origin;

  // Toggle active state
  const handleToggleActive = async () => {
    try {
      await apiClient.put(`/api/chatbots/${chatbot.id}`, {
        is_active: !chatbot.is_active,
      });
      queryClient.invalidateQueries({ queryKey: ['chatbots', chatbot.id] });
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
    } catch {
      // silently ignore
    }
  };

  // Embed code snippets
  const scriptTagCode = `<script src="${origin}/widget/flunkie.js"></script>
<script>
  Flunkie.initialize({
    key: "YOUR_API_KEY",
    chatbotId: ${chatbot.id}
  });
</script>`;

  const npmCode = `npm install flunkie

import Flunkie from "flunkie";

Flunkie.initialize({
  key: "YOUR_API_KEY",
  chatbotId: ${chatbot.id}
});`;

  const legacyCode = `<script
  src="${origin}/widget/chatbot-widget.js"
  data-chatbot-id="${chatbot.id}"
></script>`;

  const embedCodeMap: Record<EmbedTab, string> = {
    script: scriptTagCode,
    npm: npmCode,
    legacy: legacyCode,
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCodeMap[embedTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Status Card */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-[18px] font-semibold text-label-primary tracking-tight">
              Status
            </h2>
            <p className="text-[12px] text-label-quaternary mt-0.5">
              Created{' '}
              {new Date(chatbot.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <span className={STATUS_BADGES[chatbot.is_active ? 'active' : 'inactive'] || 'badge'}>
            {STATUS_LABELS[chatbot.is_active ? 'active' : 'inactive']}
          </span>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-black/[0.04]">
          <div>
            <p className="text-[13px] font-medium text-label-primary">
              {chatbot.is_active ? 'Active' : 'Inactive'}
            </p>
            <p className="text-[11px] text-label-quaternary">
              {chatbot.is_active ? 'Widget is accepting conversations' : 'Widget is hidden from visitors'}
            </p>
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
          <div className="pt-2 border-t border-black/[0.04]">
            <Link to={`/chatbots/${chatbot.id}/chat`} className="btn-primary">
              Open Chat
            </Link>
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="glass-card p-6">
        <h2 className="text-[13px] font-medium text-label-tertiary uppercase tracking-wider mb-4">
          Metrics
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-[22px] font-semibold text-label-primary tracking-tight">
              {chatbot.crawl_jobs?.reduce((sum, j) => sum + j.pages_crawled, 0) || 0}
            </p>
            <p className="text-[11px] text-label-tertiary uppercase tracking-wider mt-0.5">
              Pages Indexed
            </p>
          </div>
          <div className="text-center">
            <p className="text-[22px] font-semibold text-label-primary tracking-tight">
              {chatbot.crawl_jobs?.length || 0}
            </p>
            <p className="text-[11px] text-label-tertiary uppercase tracking-wider mt-0.5">
              Crawl Jobs
            </p>
          </div>
          <div className="text-center">
            <p className="text-[22px] font-semibold text-label-primary tracking-tight">
              —
            </p>
            <p className="text-[11px] text-label-tertiary uppercase tracking-wider mt-0.5">
              Conversations
            </p>
          </div>
        </div>
      </div>

      {/* Embed Code with Tabs */}
      <div className="glass-card p-6">
        <h2 className="text-[13px] font-medium text-label-tertiary uppercase tracking-wider mb-3">
          Embed Code
        </h2>
        <p className="text-[13px] text-label-secondary mb-4">
          Add the Flunkie widget to your website using one of the methods below.
        </p>

        {/* Tab Buttons */}
        <div className="flex gap-1 mb-4 p-1 bg-black/[0.03] rounded-lg w-fit">
          {([
            { key: 'script' as EmbedTab, label: 'Script Tag' },
            { key: 'npm' as EmbedTab, label: 'npm' },
            { key: 'legacy' as EmbedTab, label: 'Legacy' },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setEmbedTab(tab.key)}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-all duration-200 ${
                embedTab === tab.key
                  ? 'bg-white text-label-primary shadow-sm'
                  : 'text-label-tertiary hover:text-label-secondary'
              }`}
            >
              {tab.label}
              {tab.key === 'legacy' && (
                <span className="ml-1 text-[10px] text-label-quaternary">(no auth)</span>
              )}
            </button>
          ))}
        </div>

        <div className="relative">
          <pre className="bg-gray-900 text-green-400 text-[12px] rounded-xl p-4 overflow-x-auto font-mono leading-relaxed">
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
      <div className="glass-card p-6">
        <div className="flex items-center gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-label-tertiary shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p className="text-[13px] text-label-secondary">
            API Keys are now managed at the organization level.{' '}
            {activeOrg && (
              <Link
                to={`/organizations/${activeOrg.id}/settings`}
                className="text-accent hover:text-accent/80 font-medium transition-colors"
              >
                Manage API Keys
              </Link>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default OverviewSection;
