import { Link } from 'react-router-dom';
import { useChatbots, useDeleteChatbot } from '../hooks/useChatbots';
import ChatbotCard from '../components/ChatbotCard';

// ============================================================
// DashboardPage
// Apple-style dashboard with generous whitespace, clean grid,
// and beautiful empty state. Cards use glass effect.
// ============================================================

function DashboardPage() {
  const { data: chatbots, isLoading, error } = useChatbots();
  const deleteMutation = useDeleteChatbot();

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this chatbot?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title">Chatbots</h1>
          <p className="text-[14px] text-label-tertiary mt-1">
            Manage your website chatbots
          </p>
        </div>
        <Link to="/chatbots/new" className="btn-primary">
          Create New
        </Link>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
            <p className="text-[13px] text-label-tertiary">Loading...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="glass-card p-6 text-center">
          <p className="text-[14px] text-red-500">
            Failed to load chatbots. Please try refreshing.
          </p>
        </div>
      )}

      {/* Empty state */}
      {chatbots && chatbots.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-accent/[0.06] flex items-center justify-center mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-accent" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h2 className="text-[17px] font-semibold text-label-primary mb-1">
            No chatbots yet
          </h2>
          <p className="text-[14px] text-label-tertiary mb-6 max-w-xs">
            Create your first chatbot to start answering questions about your website.
          </p>
          <Link to="/chatbots/new" className="btn-primary">
            Create Your First Chatbot
          </Link>
        </div>
      )}

      {/* Chatbot grid */}
      {chatbots && chatbots.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {chatbots.map((chatbot) => (
            <ChatbotCard key={chatbot.id} chatbot={chatbot} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
