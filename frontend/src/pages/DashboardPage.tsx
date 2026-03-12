import { Link } from 'react-router-dom';
import { useChatbots, useDeleteChatbot } from '../hooks/useChatbots';
import ChatbotCard from '../components/ChatbotCard';

function DashboardPage() {
  const { data: chatbots, isLoading, error } = useChatbots();
  const deleteMutation = useDeleteChatbot();

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      deleteMutation.mutate(id);
    }
  };

  const totalChatbots = chatbots?.length || 0;
  const readyChatbots = chatbots?.filter((c) => c.status === 'ready').length || 0;
  const totalPages = chatbots?.reduce(
    (sum, c) => sum + (c.crawl_jobs?.reduce((s, j) => s + j.pages_crawled, 0) || 0),
    0
  ) || 0;

  return (
    <div className="animate-fade-in max-w-5xl">
      {/* Page title */}
      <h1 className="text-[22px] font-semibold text-label-primary tracking-tight mb-8">
        Home
      </h1>

      {/* Overview section */}
      {!isLoading && chatbots && chatbots.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[17px] font-semibold text-label-primary">Overview</h2>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-0 border border-black/[0.08] rounded-xl overflow-hidden">
            <div className="p-5 border-r border-black/[0.08]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] text-label-secondary">Total agents</p>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-label-quaternary">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <p className="text-[28px] font-semibold text-label-primary tracking-tight leading-none">
                {totalChatbots}
              </p>
            </div>
            <div className="p-5 border-r border-black/[0.08] border-t-2 border-t-accent">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] text-label-secondary">Active agents</p>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-label-quaternary">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <p className="text-[28px] font-semibold text-label-primary tracking-tight leading-none">
                {readyChatbots}
              </p>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] text-label-secondary">Pages indexed</p>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-label-quaternary">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <p className="text-[28px] font-semibold text-label-primary tracking-tight leading-none">
                {totalPages}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chatbots section */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[17px] font-semibold text-label-primary">Your Agents</h2>
          {chatbots && chatbots.length > 0 && (
            <Link
              to="/chatbots/new"
              className="text-[13px] text-accent font-medium hover:text-accent-hover transition-colors"
            >
              Create New
            </Link>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
              <p className="text-[13px] text-label-tertiary">Loading...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="border border-black/[0.08] rounded-xl p-6 text-center">
            <p className="text-[14px] text-red-500">
              Failed to load agents. Please try refreshing.
            </p>
          </div>
        )}

        {/* Empty state */}
        {chatbots && chatbots.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-black/[0.03] flex items-center justify-center mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-label-tertiary" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 className="text-[17px] font-semibold text-label-primary mb-1">
              No agents yet
            </h2>
            <p className="text-[14px] text-label-tertiary mb-6 max-w-xs">
              Create your first agent to start answering questions about your website.
            </p>
            <Link
              to="/chatbots/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-[13px] font-semibold rounded-lg hover:bg-accent-hover transition-all duration-200"
            >
              Create Your First Agent
            </Link>
          </div>
        )}

        {/* Chatbot list */}
        {chatbots && chatbots.length > 0 && (
          <div className="border border-black/[0.08] rounded-xl overflow-hidden divide-y divide-black/[0.06]">
            {chatbots.map((chatbot) => (
              <ChatbotCard key={chatbot.id} chatbot={chatbot} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
