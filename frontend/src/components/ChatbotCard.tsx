import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Chatbot } from '../types';

interface ChatbotCardProps {
  chatbot: Chatbot;
  onDelete: (id: number) => void;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500',
  inactive: 'bg-gray-400',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
};

function ChatbotCard({ chatbot, onDelete }: ChatbotCardProps) {
  const pagesIndexed = chatbot.crawl_jobs?.reduce((sum, j) => sum + j.pages_crawled, 0) || 0;
  const displayStatus = chatbot.is_active === false ? 'inactive' : 'active';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-black/[0.015] transition-colors group">
      {/* Icon */}
      <Link
        to={`/chatbots/${chatbot.id}`}
        className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/10 to-blue-50 flex items-center justify-center shrink-0"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-accent" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </Link>

      {/* Info - entire area is clickable */}
      <Link to={`/chatbots/${chatbot.id}`} className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-label-primary group-hover:text-accent transition-colors">
          {chatbot.name}
        </p>
        <p className="text-[12px] text-label-tertiary truncate mt-0.5">
          {chatbot.website_url || 'No website added'} {pagesIndexed > 0 && `· ${pagesIndexed} pages`}
        </p>
      </Link>

      {/* Status */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[displayStatus]}`} />
        <span className="text-[12px] text-label-secondary font-medium">
          {STATUS_LABELS[displayStatus]}
        </span>
      </div>

      {/* More menu */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-7 h-7 rounded-md hover:bg-black/[0.04] flex items-center justify-center transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-label-quaternary">
            <circle cx="12" cy="5" r="1.5" fill="currentColor" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            <circle cx="12" cy="19" r="1.5" fill="currentColor" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-black/[0.08] rounded-lg shadow-lg overflow-hidden z-10 animate-fade-in">
            <Link
              to={`/chatbots/${chatbot.id}`}
              className="block w-full text-left px-3 py-2 text-[13px] text-label-secondary hover:bg-black/[0.03] hover:text-label-primary transition-colors"
            >
              Open
            </Link>
            {chatbot.is_active !== false && (
              <Link
                to={`/chatbots/${chatbot.id}/chat`}
                className="block w-full text-left px-3 py-2 text-[13px] text-label-secondary hover:bg-black/[0.03] hover:text-label-primary transition-colors"
              >
                Chat
              </Link>
            )}
            <div className="border-t border-black/[0.06]" />
            <button
              onClick={() => {
                setMenuOpen(false);
                onDelete(chatbot.id);
              }}
              className="block w-full text-left px-3 py-2 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatbotCard;
