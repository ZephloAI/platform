import { Link } from 'react-router-dom';
import type { Chatbot } from '../types';
import { formatCompactNumber, formatRelativeTime } from '../lib/format';

interface ChatbotMetrics {
  total_conversations: number;
  total_messages: number;
  resolved_requests: number;
}

interface ChatbotCardProps {
  chatbot: Chatbot;
  metrics?: ChatbotMetrics;
  onDelete: () => void;
}

type StatusKey = 'active' | 'crawling' | 'suspended' | 'not-ready';

interface StatusInfo {
  key: StatusKey;
  label: string;
  detail: string;
}

/** Map an agent's raw state to a pill + a human-readable detail line. */
function resolveStatus(chatbot: Chatbot): StatusInfo {
  if (!chatbot.is_active) {
    return { key: 'suspended', label: 'Suspended', detail: 'Deactivated' };
  }
  if (chatbot.status === 'crawling') {
    const pages = chatbot.crawl_jobs?.find((j) => j.status === 'in_progress')?.pages_crawled;
    return {
      key: 'crawling',
      label: 'Crawling',
      detail: pages ? `Indexed ${formatCompactNumber(pages)} pages…` : 'Crawling website…',
    };
  }
  if (chatbot.status === 'ready' || chatbot.status === 'active') {
    const when = chatbot.last_crawled_at || chatbot.created_at;
    return { key: 'active', label: 'Active', detail: `Updated ${formatRelativeTime(when)}` };
  }
  if (chatbot.status === 'error') {
    return { key: 'not-ready', label: 'Not Ready', detail: 'Needs attention' };
  }
  return { key: 'not-ready', label: 'Not Ready', detail: 'Awaiting setup' };
}

function ChatbotCard({ chatbot, metrics, onDelete }: ChatbotCardProps) {
  const status = resolveStatus(chatbot);

  const messages = metrics?.total_messages ?? 0;
  const resRate =
    metrics && metrics.total_conversations > 0
      ? Math.min(100, Math.round((metrics.resolved_requests / metrics.total_conversations) * 100))
      : 0;

  return (
    <div className="relative group">
      <Link
        to={`/agents/${chatbot.public_id}`}
        className={`flex items-center justify-between gap-4 bg-white hairline-border rounded-xl p-5 hover:bg-surface-secondary/60 hover:shadow-sm transition-all ${
          status.key === 'suspended' ? 'opacity-80' : ''
        }`}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-full bg-surface-tertiary flex items-center justify-center text-3xl shrink-0">
            🤖
          </div>
          <div className="min-w-0">
            <h4 className="heading-md truncate">{chatbot.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className={`status-pill status-pill-${status.key}`}>{status.label}</span>
              <span className="text-label-quaternary">•</span>
              <p className="text-[13px] text-label-tertiary truncate">{status.detail}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-right shrink-0">
          <div className="hidden md:block">
            <p className="text-[11px] font-semibold text-label-quaternary uppercase tracking-wider">
              Activity
            </p>
            <p className="text-[13px] font-medium text-label-secondary tabular-nums">
              {formatCompactNumber(messages)} msgs • {resRate}% res
            </p>
          </div>
          <span className="material-symbols-outlined text-label-tertiary group-hover:translate-x-1 transition-transform">
            chevron_right
          </span>
        </div>
      </Link>

      {/* Delete — revealed on hover, sits above the link */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete();
        }}
        title="Delete agent"
        className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center
                   bg-white/90 text-label-quaternary opacity-0 group-hover:opacity-100
                   hover:bg-red-50 hover:text-red-500 transition-all"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          delete
        </span>
      </button>
    </div>
  );
}

export default ChatbotCard;
