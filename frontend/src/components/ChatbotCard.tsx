import { Link } from 'react-router-dom';
import type { Chatbot } from '../types';

// ============================================================
// ChatbotCard Component
// Premium glass card with Apple-style depth and transitions.
// Subtle hover lift effect, pill-shaped status badges.
// ============================================================

interface ChatbotCardProps {
  chatbot: Chatbot;
  onDelete: (id: number) => void;
}

// Status badge CSS classes using our design system
const STATUS_BADGES: Record<Chatbot['status'], string> = {
  pending: 'badge badge-pending',
  crawling: 'badge badge-crawling',
  ready: 'badge badge-ready',
  error: 'badge badge-error',
};

// Friendly status labels
const STATUS_LABELS: Record<Chatbot['status'], string> = {
  pending: 'Pending',
  crawling: 'Crawling',
  ready: 'Ready',
  error: 'Error',
};

function ChatbotCard({ chatbot, onDelete }: ChatbotCardProps) {
  return (
    <div className="glass-card p-6 animate-fade-in group">
      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <Link
          to={`/chatbots/${chatbot.id}`}
          className="text-[17px] font-semibold text-label-primary tracking-tight group-hover:text-accent transition-colors duration-250"
        >
          {chatbot.name}
        </Link>
        <span className={STATUS_BADGES[chatbot.status]}>
          {chatbot.status === 'crawling' && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse-soft" />
          )}
          {STATUS_LABELS[chatbot.status]}
        </span>
      </div>

      {/* URL */}
      <p className="text-[13px] text-label-tertiary truncate mb-6">
        {chatbot.website_url}
      </p>

      {/* Separator */}
      <div className="divider mb-4" />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link
          to={`/chatbots/${chatbot.id}`}
          className="text-[13px] text-accent font-medium hover:text-accent-hover transition-colors duration-200"
        >
          View Details
        </Link>
        <button
          onClick={() => onDelete(chatbot.id)}
          className="text-[13px] text-label-quaternary font-medium hover:text-red-500 transition-colors duration-200"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export default ChatbotCard;
