import { useParams, Link } from 'react-router-dom';
import { useChatbot } from '../hooks/useChatbots';
import ChatWidget from '../components/ChatWidget';

// ============================================================
// ChatPreviewPage
// Full chat experience with Apple-style back navigation.
// Clean, focused layout that lets the chat widget shine.
// ============================================================

function ChatPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const chatbotId = Number(id);
  const { data: chatbot, isLoading } = useChatbot(chatbotId);

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

  // Not found
  if (!chatbot) {
    return (
      <div className="card p-6 text-center max-w-lg mx-auto">
        <p className="text-[14px] text-red-500">Agent not found.</p>
      </div>
    );
  }

  // Not ready
  if (chatbot.status !== 'ready') {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <Link
          to={`/chatbots/${chatbot.id}`}
          className="inline-flex items-center gap-1.5 text-[13px] text-label-tertiary hover:text-label-primary font-medium transition-colors duration-200 mb-6"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </Link>
        <div className="card p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-amber-500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="heading-sm font-display mb-1">Not ready yet</p>
          <p className="text-[13px] text-label-tertiary">
            Please crawl the website first before starting a chat.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-5">
        <Link
          to={`/chatbots/${chatbot.id}`}
          className="inline-flex items-center gap-1.5 text-[13px] text-label-tertiary hover:text-label-primary font-medium transition-colors duration-200"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {chatbot.name}
        </Link>
        <h1 className="heading-lg font-display mt-2">
          Chat Preview
        </h1>
      </div>

      {/* Chat widget */}
      <ChatWidget chatbotId={chatbotId} />
    </div>
  );
}

export default ChatPreviewPage;
