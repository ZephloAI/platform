import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateChatbot } from '../hooks/useChatbots';

// ============================================================
// CreateChatbotPage
// Apple-style creation form with glass card, clean layout,
// and focused single-column design.
// ============================================================

function CreateChatbotPage() {
  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const createMutation = useCreateChatbot();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !websiteUrl.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    createMutation.mutate(
      { name: name.trim(), website_url: websiteUrl.trim() },
      {
        onSuccess: (chatbot) => {
          navigate(`/chatbots/${chatbot.id}`);
        },
        onError: () => {
          setError('Failed to create chatbot. Please try again.');
        },
      }
    );
  };

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="section-title">New Chatbot</h1>
        <p className="text-[14px] text-label-tertiary mt-1">
          Connect a website and we will build your AI assistant.
        </p>
      </div>

      {/* Form card */}
      <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
        {/* Error */}
        {error && (
          <div className="bg-red-500/[0.06] text-red-600 text-[13px] rounded-xl p-3.5 border border-red-500/10">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label htmlFor="name" className="input-label">Name</label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="My Website Bot"
          />
        </div>

        {/* Website URL */}
        <div>
          <label htmlFor="websiteUrl" className="input-label">Website URL</label>
          <input
            id="websiteUrl"
            type="url"
            required
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className="input-field"
            placeholder="https://example.com"
          />
          <p className="mt-2 text-[12px] text-label-quaternary">
            We will crawl this website to build the chatbot&apos;s knowledge base.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-primary"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Chatbot'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateChatbotPage;
