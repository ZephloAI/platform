import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Chatbot } from '../types';

// ============================================================
// OverviewSection
// Status card, metrics placeholders, and embed code snippet.
// ============================================================

const STATUS_BADGES: Record<string, string> = {
  pending: 'badge badge-pending',
  crawling: 'badge badge-crawling',
  ready: 'badge badge-ready',
  error: 'badge badge-error',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  crawling: 'Crawling',
  ready: 'Ready',
  error: 'Error',
};

interface OverviewSectionProps {
  chatbot: Chatbot;
}

function OverviewSection({ chatbot }: OverviewSectionProps) {
  const [copied, setCopied] = useState(false);

  const embedCode = `<script\n  src="${window.location.origin}/widget/chatbot-widget.js"\n  data-chatbot-id="${chatbot.id}"\n></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
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
          <span className={STATUS_BADGES[chatbot.status] || 'badge'}>
            {chatbot.status === 'crawling' && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse-soft" />
            )}
            {STATUS_LABELS[chatbot.status] || chatbot.status}
          </span>
        </div>

        {chatbot.status === 'crawling' && (
          <div className="flex items-center gap-2.5 pt-2 border-t border-black/[0.04]">
            <div className="w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
            <span className="text-[13px] font-medium text-label-secondary">
              Crawling in progress...
            </span>
          </div>
        )}

        {chatbot.status === 'ready' && (
          <div className="pt-2 border-t border-black/[0.04]">
            <Link to={`/chatbots/${chatbot.id}/chat`} className="btn-primary">
              Open Chat
            </Link>
          </div>
        )}
      </div>

      {/* Metrics (placeholder) */}
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

      {/* Embed Code */}
      <div className="glass-card p-6">
        <h2 className="text-[13px] font-medium text-label-tertiary uppercase tracking-wider mb-3">
          Embed Code
        </h2>
        <p className="text-[13px] text-label-secondary mb-3">
          Add this script tag to your website to embed the chat widget.
        </p>
        <div className="relative">
          <pre className="bg-gray-900 text-green-400 text-[12px] rounded-xl p-4 overflow-x-auto font-mono leading-relaxed">
            {embedCode}
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 px-3 py-1.5 text-[11px] font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default OverviewSection;
