import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateChatbot } from '../hooks/useChatbots';

// ============================================================
// CreateChatbotPage
// Simplified creation form - only requires a name.
// Website URL and page selection happen on the detail page.
// ============================================================

function CreateChatbotPage() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const createMutation = useCreateChatbot();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter a name for your chatbot.');
      return;
    }

    createMutation.mutate(
      { name: name.trim() },
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
          Give your chatbot a name, then add pages to build its knowledge base.
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
          <p className="mt-2 text-[12px] text-label-quaternary">
            You can add your website URL or specific pages in the next step.
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
