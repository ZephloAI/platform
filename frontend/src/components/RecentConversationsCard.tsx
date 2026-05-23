import { Link } from 'react-router-dom';
import { useOrgRecentConversations } from '../hooks/useChatbots';
import { formatRelativeTime } from '../lib/format';

// ============================================================
// RecentConversationsCard – the latest chats across all agents,
// backed by GET /api/organizations/{id}/recent-conversations.
// ============================================================

interface RecentConversationsCardProps {
  orgId: number;
}

function RecentConversationsCard({ orgId }: RecentConversationsCardProps) {
  const { data: conversations, isLoading } = useOrgRecentConversations(orgId);

  return (
    <div className="bg-white hairline-border rounded-xl p-6">
      <h4 className="text-[12px] font-semibold text-label-tertiary uppercase tracking-wider mb-4">
        Recent Conversations
      </h4>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-black/[0.06] shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 bg-black/[0.06] rounded" />
                <div className="h-2.5 w-40 bg-black/[0.03] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : !conversations || conversations.length === 0 ? (
        <div className="flex items-center gap-3 py-1">
          <span className="material-symbols-outlined text-label-quaternary" style={{ fontSize: 22 }}>
            forum
          </span>
          <p className="text-[13px] text-label-tertiary">No conversations yet.</p>
        </div>
      ) : (
        <div className="flex flex-col -mx-2">
          {conversations.map((c) => (
            <Link
              key={c.id}
              to={`/agents/${c.chatbot_public_id}`}
              className="flex items-start gap-2.5 px-2 py-2.5 rounded-lg hover:bg-surface-secondary transition-colors"
            >
              <span
                className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                  c.is_unread ? 'bg-accent' : 'bg-label-quaternary/30'
                }`}
                title={c.is_unread ? 'Unread' : undefined}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold text-label-primary truncate">{c.chatbot_name}</p>
                  {c.last_message_at && (
                    <span className="text-[11px] text-label-quaternary shrink-0">
                      {formatRelativeTime(c.last_message_at)}
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-label-tertiary truncate">
                  {c.last_message || 'No messages yet'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default RecentConversationsCard;
