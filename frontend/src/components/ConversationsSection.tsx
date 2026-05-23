import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  useConversations,
  useConversation,
  useSendAdminMessage,
  useSwitchMode,
  useMarkAsRead,
} from '../hooks/useConversations';
import type { ConversationSession } from '../types';
import Markdown from './Markdown';

// ============================================================
// ConversationsSection – split-pane inbox for live chat
// Left panel: session list (with filters) | Right panel: thread
// On mobile: show one panel at a time with back navigation.
// Near-real-time via polling (see useConversations).
// ============================================================

type Filter = 'all' | 'unread' | 'human';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'human', label: 'Handed off' },
];

/** Relative time label: "2m ago", "1h ago", "Yesterday", "Mar 5". */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Day-divider label: "Today", "Yesterday", or "Mon, Oct 12". */
function formatDayLabel(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatClock(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function VisitorAvatar({ size = 12 }: { size?: number }) {
  return (
    <div
      className="rounded-lg bg-surface-tertiary flex items-center justify-center text-label-tertiary shrink-0"
      style={{ width: size * 4, height: size * 4 }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: size * 1.8 }}>person</span>
    </div>
  );
}

function ConversationsSection() {
  const { id } = useParams<{ id: string }>();
  const chatbotId = id!;

  const { data: conversations, isLoading: listLoading, refetch, isRefetching } = useConversations(chatbotId);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const { data: conversation, isLoading: detailLoading } = useConversation(selectedSessionId);
  const sendMessage = useSendAdminMessage();
  const switchMode = useSwitchMode();
  const markAsRead = useMarkAsRead();

  const [filter, setFilter] = useState<Filter>('all');
  const [replyText, setReplyText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const filtered = (conversations ?? [])
    // Hide sessions that never got a message
    .filter((s) => s.message_count > 0)
    .filter((s) =>
      filter === 'all' ? true : filter === 'unread' ? s.is_unread : s.mode === 'person',
    );

  function handleSelectSession(session: ConversationSession) {
    setSelectedSessionId(session.id);
    if (session.is_unread) markAsRead.mutate(session.id);
  }

  function sendReply() {
    if (!replyText.trim() || !selectedSessionId || conversation?.mode !== 'person') return;
    sendMessage.mutate(
      { sessionId: selectedSessionId, content: replyText.trim() },
      { onSuccess: () => setReplyText('') },
    );
  }

  function handleToggleMode(mode: 'ai' | 'person') {
    if (!selectedSessionId || conversation?.mode === mode) return;
    switchMode.mutate({ sessionId: selectedSessionId, mode });
  }

  const isPerson = conversation?.mode === 'person';

  return (
    <div className="flex h-full overflow-hidden">
      {/* ---- Left pane: session list ---- */}
      <div
        className={`w-full md:w-[360px] lg:w-[400px] shrink-0 border-r border-black/[0.06] flex flex-col bg-white ${
          selectedSessionId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="px-5 pt-5 pb-3 space-y-4 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="heading-md">Conversations</h2>
            <button
              onClick={() => refetch()}
              title="Refresh"
              className="text-accent hover:bg-accent/10 p-1.5 rounded-lg transition-colors"
            >
              <span className={`material-symbols-outlined ${isRefetching ? 'animate-spin' : ''}`} style={{ fontSize: 20 }}>
                refresh
              </span>
            </button>
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors ${
                  filter === f.key
                    ? 'bg-accent text-white shadow-sm'
                    : 'bg-surface-secondary text-label-secondary hover:bg-surface-tertiary border border-black/[0.04]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {listLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <span className="material-symbols-outlined text-label-quaternary mb-2" style={{ fontSize: 32 }}>forum</span>
              <p className="text-[13px] text-label-tertiary">
                {filter === 'all' ? 'No conversations yet' : 'Nothing matches this filter'}
              </p>
              {filter === 'all' && (
                <p className="text-[12px] text-label-quaternary mt-1">
                  Conversations appear here when visitors start chatting.
                </p>
              )}
            </div>
          ) : (
            filtered.map((session) => {
              const active = selectedSessionId === session.id;
              return (
                <button
                  key={session.id}
                  onClick={() => handleSelectSession(session)}
                  className={`w-full text-left px-5 py-4 flex items-start gap-3 border-l-4 transition-colors ${
                    active
                      ? 'border-accent bg-accent/5'
                      : 'border-transparent hover:bg-surface-secondary/60'
                  }`}
                >
                  <VisitorAvatar size={11} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-[15px] font-bold text-label-primary truncate">Visitor</span>
                      <span className="text-[11px] text-label-quaternary shrink-0">
                        {formatRelativeTime(session.last_message_at || session.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight shrink-0 ${
                          session.mode === 'person' ? 'bg-accent/10 text-accent' : 'bg-surface-secondary text-label-tertiary'
                        }`}
                      >
                        {session.mode === 'person' ? 'Human' : 'AI'}
                      </span>
                      <p
                        className={`text-[13px] truncate ${
                          session.is_unread ? 'text-label-primary font-medium' : 'text-label-tertiary'
                        }`}
                      >
                        {session.last_message || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                  {session.is_unread && <span className="w-2.5 h-2.5 rounded-full bg-accent shrink-0 mt-1.5" />}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ---- Right pane: thread ---- */}
      <div
        className={`flex-1 flex flex-col bg-surface-primary min-w-0 ${
          !selectedSessionId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {!selectedSessionId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <span className="material-symbols-outlined text-label-quaternary mb-2" style={{ fontSize: 40 }}>chat</span>
              <p className="text-[14px] text-label-secondary font-medium">Select a conversation</p>
              <p className="text-[12px] text-label-quaternary mt-1">Choose a session from the list to see messages.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="h-16 flex items-center justify-between px-4 md:px-6 bg-white border-b border-black/[0.06] shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setSelectedSessionId(null)}
                  className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-secondary transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
                </button>
                <VisitorAvatar size={10} />
                <div className="min-w-0">
                  <h3 className="font-display text-[16px] font-bold text-label-primary leading-tight">Visitor</h3>
                  <p className="text-[12px] text-label-tertiary flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isPerson ? 'bg-sage-500' : 'bg-accent'}`} />
                    {isPerson ? 'A teammate is replying' : 'AI is handling replies'}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-label-quaternary hidden sm:block shrink-0">
                #{selectedSessionId.slice(0, 8)}
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-5 bg-surface-secondary/20">
              {detailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-5 h-5 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                </div>
              ) : conversation?.messages && conversation.messages.length > 0 ? (
                conversation.messages.map((msg, i) => {
                  const isVisitor = msg.role === 'user';
                  const isAdmin = msg.role === 'admin';
                  const prev = conversation.messages[i - 1];
                  const showDay =
                    !prev || formatDayLabel(prev.created_at) !== formatDayLabel(msg.created_at);

                  return (
                    <div key={msg.id} className="space-y-5">
                      {showDay && (
                        <div className="flex justify-center">
                          <span className="px-4 py-1 bg-white text-label-tertiary rounded-full text-[11px] font-bold uppercase tracking-widest border border-black/[0.06]">
                            {formatDayLabel(msg.created_at)}
                          </span>
                        </div>
                      )}

                      {isVisitor ? (
                        /* Incoming (visitor) — left */
                        <div className="flex gap-3 max-w-3xl">
                          <VisitorAvatar size={8} />
                          <div className="space-y-1 min-w-0">
                            <div className="bg-white border border-black/[0.06] rounded-2xl rounded-tl-none p-3.5 shadow-sm">
                              <p className="text-[14px] leading-relaxed text-label-primary whitespace-pre-wrap break-words">
                                {msg.content}
                              </p>
                            </div>
                            <span className="text-[10px] text-label-quaternary ml-1 font-medium">{formatClock(msg.created_at)}</span>
                          </div>
                        </div>
                      ) : (
                        /* Outgoing (AI or human teammate) — right */
                        <div className="flex gap-3 max-w-3xl ml-auto flex-row-reverse">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                              isAdmin ? 'bg-sage-500 text-white' : 'bg-accent text-white'
                            }`}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                              {isAdmin ? 'support_agent' : 'smart_toy'}
                            </span>
                          </div>
                          <div className="space-y-1.5 text-right min-w-0">
                            <div
                              className={`rounded-2xl rounded-tr-none p-3.5 shadow-sm text-left text-label-primary ${
                                isAdmin
                                  ? 'bg-sage-50 border border-sage-100'
                                  : 'bg-accent/5 border border-accent/20'
                              }`}
                            >
                              {isAdmin ? (
                                <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                                  {msg.content}
                                </p>
                              ) : (
                                /* AI responses render Markdown */
                                <Markdown>{msg.content}</Markdown>
                              )}
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${
                                  isAdmin ? 'bg-sage-100 text-sage-600' : 'bg-accent/10 text-accent'
                                }`}
                              >
                                {isAdmin ? 'You' : 'Zephlo AI'}
                              </span>
                              <span className="text-[10px] text-label-quaternary font-medium">{formatClock(msg.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center py-12">
                  <p className="text-[13px] text-label-tertiary">No messages in this conversation.</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <div className="p-4 md:p-6 pt-0 bg-surface-primary shrink-0">
              <div className="bg-white border border-black/[0.08] rounded-xl shadow-card focus-within:ring-2 focus-within:ring-accent/20 transition-all overflow-hidden">
                {/* Mode switcher */}
                <div className="flex items-center justify-between p-3 border-b border-black/[0.06] bg-surface-secondary/40">
                  <div className="flex bg-surface-secondary rounded-lg p-1 border border-black/[0.04]">
                    <button
                      onClick={() => handleToggleMode('ai')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                        !isPerson ? 'bg-white shadow-sm text-accent' : 'text-label-tertiary hover:text-label-secondary'
                      }`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>smart_toy</span>
                      AI Mode
                    </button>
                    <button
                      onClick={() => handleToggleMode('person')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                        isPerson ? 'bg-white shadow-sm text-sage-600' : 'text-label-tertiary hover:text-label-secondary'
                      }`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>support_agent</span>
                      Reply as Human
                    </button>
                  </div>
                </div>

                {/* Text input */}
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                  disabled={!isPerson}
                  rows={3}
                  placeholder={isPerson ? "Type a reply…" : 'Switch to “Reply as Human” to jump in'}
                  className="w-full border-none focus:ring-0 p-4 text-[14px] bg-transparent resize-none placeholder:text-label-quaternary disabled:opacity-60"
                />

                {/* Send row */}
                <div className="flex items-center justify-between p-3 border-t border-black/[0.06]">
                  <span className="text-[11px] text-label-quaternary px-1 font-medium uppercase tracking-wider">
                    {isPerson ? 'Press ⌘+Enter to send' : 'AI is answering automatically'}
                  </span>
                  <button
                    onClick={sendReply}
                    disabled={!isPerson || !replyText.trim() || sendMessage.isPending}
                    className="w-10 h-10 flex items-center justify-center bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {sendMessage.isPending ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>send</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ConversationsSection;
