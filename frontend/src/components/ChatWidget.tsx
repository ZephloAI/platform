import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '../hooks/useChatbots';
import type { ChatMessage } from '../types';

// ============================================================
// ChatWidget Component
// Premium iMessage-style chat interface.
// Glass container, smooth message animations, elegant input.
// Persists session_id and messages so conversation carries across reloads.
// ============================================================

interface ChatWidgetProps {
  chatbotId: number;
}

function ChatWidget({ chatbotId }: ChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(`chat_messages_${chatbotId}`);
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(() => {
    return localStorage.getItem(`chat_session_${chatbotId}`);
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatMutation = useChat();

  // Smooth scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chat_messages_${chatbotId}`, JSON.stringify(messages));
    }
  }, [messages, chatbotId]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    localStorage.removeItem(`chat_session_${chatbotId}`);
    localStorage.removeItem(`chat_messages_${chatbotId}`);
  }, [chatbotId]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || chatMutation.isPending) return;

    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    chatMutation.mutate(
      { chatbot_id: chatbotId, message: trimmed, session_id: sessionId },
      {
        onSuccess: (data) => {
          if (data.session_id) {
            setSessionId(data.session_id);
            localStorage.setItem(`chat_session_${chatbotId}`, data.session_id);
          }

          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: data.response,
            sources: data.sources,
          };
          setMessages((prev) => [...prev, assistantMessage]);
        },
        onError: () => {
          const errorMessage: ChatMessage = {
            role: 'assistant',
            content: 'Something went wrong. Please try again.',
          };
          setMessages((prev) => [...prev, errorMessage]);
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[640px] glass-card overflow-hidden">
      {/* Header with new chat button */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-black/[0.06]">
        <p className="text-[13px] font-medium text-label-secondary">Test your chatbot</p>
        <button
          onClick={handleNewChat}
          title="New conversation"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-label-tertiary hover:text-label-primary hover:bg-surface-secondary transition-all duration-200 active:scale-90"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-accent" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-[15px] font-medium text-label-primary mb-1">Start a conversation</p>
            <p className="text-[13px] text-label-tertiary">
              Ask anything about the website content.
            </p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                msg.role === 'user'
                  ? 'bg-accent text-white rounded-br-md'
                  : 'bg-surface-secondary text-label-primary rounded-bl-md'
              }`}
            >
              <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>

              {/* Sources - pill style */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-black/[0.06]">
                  <p className="text-[10px] font-semibold text-label-tertiary uppercase tracking-wider mb-2">
                    Sources
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sources.map((source, i) => (
                      <a
                        key={i}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/80 border border-black/[0.06] rounded-full text-[11px] font-medium text-label-secondary hover:text-accent hover:border-accent/20 hover:bg-accent/[0.04] transition-all duration-200 max-w-[180px] truncate"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-50">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        {source.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {chatMutation.isPending && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-surface-secondary rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-label-quaternary rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-label-quaternary rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-label-quaternary rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-black/[0.06] p-4 bg-white/50">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            className="flex-1 bg-surface-secondary/80 border border-black/[0.04] rounded-full px-5 py-2.5 text-[14px] text-label-primary placeholder:text-label-quaternary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 focus:bg-white transition-all duration-250 ease-apple"
            disabled={chatMutation.isPending}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || chatMutation.isPending}
            className="w-9 h-9 rounded-full bg-accent flex items-center justify-center transition-all duration-250 ease-apple hover:bg-accent-hover active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatWidget;
