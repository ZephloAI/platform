import { Link } from 'react-router-dom';
import type { Chatbot } from '../types';

// ============================================================
// NeedsAttentionCard – surfaces agents that require action:
// suspended, failed setup, or not yet configured. Derived entirely
// from the already-loaded agents list (no extra request).
// ============================================================

interface NeedsAttentionCardProps {
  chatbots: Chatbot[];
}

interface AttentionItem {
  chatbot: Chatbot;
  reason: string;
  icon: string; // Material Symbols name
  tone: 'red' | 'amber';
}

function findIssues(chatbots: Chatbot[]): AttentionItem[] {
  const items: AttentionItem[] = [];
  for (const chatbot of chatbots) {
    if (!chatbot.is_active) {
      items.push({ chatbot, reason: 'Suspended', icon: 'block', tone: 'red' });
    } else if (chatbot.status === 'error') {
      items.push({ chatbot, reason: 'Setup failed', icon: 'error', tone: 'red' });
    } else if (chatbot.status === 'pending') {
      items.push({ chatbot, reason: 'Awaiting setup', icon: 'pending', tone: 'amber' });
    }
  }
  return items;
}

function NeedsAttentionCard({ chatbots }: NeedsAttentionCardProps) {
  const issues = findIssues(chatbots);

  return (
    <div className="bg-white hairline-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[12px] font-semibold text-label-tertiary uppercase tracking-wider">
          Needs Attention
        </h4>
        {issues.length > 0 && (
          <span className="text-[12px] font-semibold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full tabular-nums">
            {issues.length}
          </span>
        )}
      </div>

      {issues.length === 0 ? (
        <div className="flex items-center gap-3 py-1">
          <span className="material-symbols-outlined text-sage-500" style={{ fontSize: 22 }}>
            check_circle
          </span>
          <div>
            <p className="text-[14px] font-medium text-label-primary">All agents healthy</p>
            <p className="text-[12px] text-label-tertiary">Nothing needs your attention.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5 -mx-2">
          {issues.map(({ chatbot, reason, icon, tone }) => (
            <Link
              key={chatbot.id}
              to={`/agents/${chatbot.public_id}`}
              className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-secondary transition-colors group"
            >
              <span
                className={`material-symbols-outlined ${tone === 'red' ? 'text-red-500' : 'text-amber-500'}`}
                style={{ fontSize: 20 }}
              >
                {icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-label-primary truncate">{chatbot.name}</p>
                <p className={`text-[12px] ${tone === 'red' ? 'text-red-500' : 'text-amber-600'}`}>{reason}</p>
              </div>
              <span
                className="material-symbols-outlined text-label-quaternary group-hover:text-accent group-hover:translate-x-0.5 transition-all"
                style={{ fontSize: 18 }}
              >
                chevron_right
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default NeedsAttentionCard;
