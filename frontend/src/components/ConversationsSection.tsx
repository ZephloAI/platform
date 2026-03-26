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

// ============================================================
// ConversationsSection – split-pane inbox for live chat
// Left panel: session list | Right panel: conversation detail
// On mobile: show one panel at a time with back navigation
// ============================================================

/**
 * Format a date string as a relative time label.
 * e.g. "2m ago", "1h ago", "Yesterday", "Mar 5"
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Truncate a string to a max length, appending "..." if needed.
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

function ConversationsSection() {
  const { id } = useParams<{ id: string }>();
  const chatbotId = id!;

  const { data: conversations, isLoading: listLoading } = useConversations(chatbotId);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const { data: conversation, isLoading: detailLoading } = useConversation(selectedSessionId);
  const sendMessage = useSendAdminMessage();
  const switchMode = useSwitchMode();
  const markAsRead = useMarkAsRead();

  const [replyText, setReplyText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation?.messages]);

  // Mark as read when selecting a session
  function handleSelectSession(session: ConversationSession) {
    setSelectedSessionId(session.id);
    if (session.is_unread) {
      markAsRead.mutate(session.id);
    }
  }

  // Go back to list (mobile)
  function handleBackToList() {
    setSelectedSessionId(null);
  }

  // Send a reply
  function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim() || !selectedSessionId) return;
    sendMessage.mutate(
      { sessionId: selectedSessionId, content: replyText.trim() },
      { onSuccess: () => setReplyText('') }
    );
  }

  // Toggle mode
  function handleToggleMode(mode: 'ai' | 'person') {
    if (!selectedSessionId || conversation?.mode === mode) return;
    switchMode.mutate({ sessionId: selectedSessionId, mode });
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ---- Left panel: Session list ---- */}
      <div className={`w-full md:w-[300px] shrink-0 border-r border-black/[0.06] flex flex-col bg-white ${selectedSessionId ? 'hidden md:flex' : 'flex'}`}>
        <div className="px-4 py-3 border-b border-black/[0.06] shrink-0">
          <h2 className="section-label">Conversations</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {listLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
            </div>
          ) : !conversations || conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-label-quaternary mb-3">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-[13px] text-label-tertiary text-center">No conversations yet</p>
              <p className="text-[12px] text-label-quaternary text-center mt-1">
                Conversations will appear here when users start chatting.
              </p>
            </div>
          ) : (
            <div className="py-1">
              {conversations.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSelectSession(session)}
                  className={`w-full text-left px-4 py-3 transition-all duration-200 border-b border-black/[0.03] ${
                    selectedSessionId === session.id
                      ? 'bg-accent-light'
                      : 'hover:bg-surface-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {/* Mode badge */}
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        session.mode === 'person'
                          ? 'bg-sage-100 text-sage-600'
                          : 'bg-surface-secondary text-label-tertiary'
                      }`}
                    >
                      {session.mode === 'person' ? 'Live' : 'AI'}
                    </span>

                    {/* Unread dot */}
                    {session.is_unread && (
                      <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                    )}

                    {/* Timestamp */}
                    <span className="text-[11px] text-label-quaternary ml-auto shrink-0">
                      {session.last_message_at
                        ? formatRelativeTime(session.last_message_at)
                        : formatRelativeTime(session.created_at)}
                    </span>
                  </div>

                  {/* Last message preview */}
                  <p className={`text-[12px] leading-relaxed ${session.is_unread ? 'text-label-primary font-medium' : 'text-label-secondary'}`}>
                    {session.last_message
                      ? truncate(session.last_message, 50)
                      : 'No messages yet'}
                  </p>

                  {/* Message count */}
                  <p className="text-[11px] text-label-quaternary mt-0.5">
                    {session.message_count} message{session.message_count !== 1 ? 's' : ''}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---- Right panel: Conversation detail ---- */}
      <div className={`flex-1 flex flex-col bg-surface-primary min-w-0 ${!selectedSessionId ? 'hidden md:flex' : 'flex'}`}>
        {!selectedSessionId ? (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-label-quaternary mx-auto mb-3">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-[14px] text-label-secondary font-medium">Select a conversation to view</p>
              <p className="text-[12px] text-label-quaternary mt-1">
                Choose a session from the list to see messages.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-4 md:px-6 py-3 border-b border-black/[0.06] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {/* Back button - mobile only */}
                <button
                  onClick={handleBackToList}
                  className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-secondary transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <span className="text-[13px] font-medium text-label-primary">
                  {selectedSessionId.slice(0, 8)}...
                </span>
                {conversation && (
                  <span className={`text-[11px] px-1.5 py-0.5 rounded ${
                    conversation.mode === 'person'
                      ? 'bg-sage-100 text-sage-600'
                      : 'bg-surface-secondary text-label-tertiary'
                  }`}>
                    {conversation.mode === 'person' ? 'Live Chat' : 'AI Mode'}
                  </span>
                )}
              </div>

              {/* Mode toggle */}
              <div className="flex items-center bg-surface-secondary rounded-xl p-0.5">
                <button
                  onClick={() => handleToggleMode('ai')}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 ${
                    conversation?.mode === 'ai'
                      ? 'bg-white text-label-primary shadow-sm'
                      : 'text-label-tertiary hover:text-label-secondary'
                  }`}
                >
                  AI
                </button>
                <button
                  onClick={() => handleToggleMode('person')}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 ${
                    conversation?.mode === 'person'
                      ? 'bg-white text-sage-600 shadow-sm'
                      : 'text-label-tertiary hover:text-label-secondary'
                  }`}
                >
                  Live
                </button>
              </div>
            </div>

            {/* Messages area */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
              {detailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-5 h-5 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                </div>
              ) : conversation?.messages && conversation.messages.length > 0 ? (
                conversation.messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  const isAdmin = msg.role === 'admin';

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] md:max-w-[70%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                        {/* Admin label */}
                        {isAdmin && (
                          <span className="text-[11px] text-sage-600 font-medium mb-1 ml-1">You</span>
                        )}

                        {/* Message bubble */}
                        <div
                          className={`px-3.5 py-2.5 text-[13px] leading-relaxed ${
                            isUser
                              ? 'bg-ink text-white rounded-2xl rounded-br-md'
                              : isAdmin
                              ? 'bg-sage-50 text-sage-600 border border-sage-100 rounded-2xl rounded-bl-md'
                              : 'bg-white border border-black/[0.06] shadow-card rounded-2xl rounded-bl-md text-label-primary'
                          }`}
                        >
                          {msg.content}
                        </div>

                        {/* Timestamp */}
                        <span className={`text-[10px] text-label-quaternary mt-1 ${isUser ? 'mr-1 text-right' : 'ml-1'}`}>
                          {formatRelativeTime(msg.created_at)}
                        </span>
                      </div>
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

            {/* Reply input (only in person mode) */}
            {conversation?.mode === 'person' && (
              <form
                onSubmit={handleSendReply}
                className="px-4 md:px-6 py-3 border-t border-black/[0.06] flex items-center gap-3 shrink-0"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type a reply..."
                  className="input-field flex-1"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || sendMessage.isPending}
                  className="btn-accent px-4 py-2.5 shrink-0"
                >
                  {sendMessage.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Send'
                  )}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ConversationsSection;
