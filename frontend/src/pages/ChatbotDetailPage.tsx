import { useParams, Link } from 'react-router-dom';
import { useChatbot, useStartCrawl } from '../hooks/useChatbots';
import CrawlStatus from '../components/CrawlStatus';

// ============================================================
// ChatbotDetailPage
// Apple-style detail view with glass cards, clean hierarchy,
// and prominent actions. Stats are presented with emphasis.
// ============================================================

// Status badge mapping using our design system
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

function ChatbotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const chatbotId = Number(id);
  const { data: chatbot, isLoading, error } = useChatbot(chatbotId);
  const startCrawlMutation = useStartCrawl();

  const handleStartCrawl = () => {
    startCrawlMutation.mutate(chatbotId);
  };

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
          <p className="text-[13px] text-label-tertiary">Loading...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error || !chatbot) {
    return (
      <div className="glass-card p-6 text-center max-w-lg mx-auto">
        <p className="text-[14px] text-red-500">Failed to load chatbot details.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Back navigation */}
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-[13px] text-label-tertiary hover:text-label-primary font-medium transition-colors duration-200 mb-6"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Dashboard
      </Link>

      {/* Main info card */}
      <div className="glass-card p-8 mb-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[24px] font-semibold text-label-primary tracking-tight mb-1">
              {chatbot.name}
            </h1>
            <a
              href={chatbot.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px] text-accent hover:text-accent-hover transition-colors"
            >
              {chatbot.website_url}
            </a>
          </div>
          <span className={STATUS_BADGES[chatbot.status] || 'badge'}>
            {chatbot.status === 'crawling' && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse-soft" />
            )}
            {STATUS_LABELS[chatbot.status] || chatbot.status}
          </span>
        </div>

        {/* Meta */}
        <p className="text-[12px] text-label-quaternary uppercase tracking-wider">
          Created {new Date(chatbot.created_at).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>

        {/* Separator */}
        <div className="divider my-6" />

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleStartCrawl}
            disabled={startCrawlMutation.isPending || chatbot.status === 'crawling'}
            className="btn-primary"
          >
            {startCrawlMutation.isPending
              ? 'Starting...'
              : chatbot.status === 'crawling'
                ? 'Crawling in Progress'
                : 'Start Crawl'}
          </button>

          {chatbot.status === 'ready' && (
            <Link to={`/chatbots/${chatbot.id}/chat`} className="btn-secondary">
              Open Chat
            </Link>
          )}
        </div>
      </div>

      {/* Crawl jobs section */}
      <div>
        <h2 className="text-[13px] font-medium text-label-tertiary uppercase tracking-wider mb-4">
          Crawl History
        </h2>

        {(!chatbot.crawl_jobs || chatbot.crawl_jobs.length === 0) && (
          <div className="glass-card p-8 text-center">
            <p className="text-[14px] text-label-tertiary">
              No crawl jobs yet. Start a crawl to index your website.
            </p>
          </div>
        )}

        {chatbot.crawl_jobs && chatbot.crawl_jobs.length > 0 && (
          <div className="space-y-3">
            {chatbot.crawl_jobs.map((job) => (
              <CrawlStatus key={job.id} crawlJob={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatbotDetailPage;
