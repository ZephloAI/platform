import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateChatbot } from '../hooks/useChatbots';

function CreateChatbotPage() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const createMutation = useCreateChatbot();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter a name for your agent.');
      return;
    }

    createMutation.mutate(
      { name: name.trim() },
      {
        onSuccess: (chatbot) => {
          navigate(`/chatbots/${chatbot.id}`);
        },
        onError: () => {
          setError('Failed to create agent. Please try again.');
        },
      }
    );
  };

  return (
    <div className="max-w-lg animate-fade-in">
      <h1 className="text-[22px] font-semibold text-label-primary tracking-tight mb-1">
        New Agent
      </h1>
      <p className="text-[14px] text-label-tertiary mb-8">
        Give your agent a name, then add pages to build its knowledge base.
      </p>

      <form onSubmit={handleSubmit} className="border border-black/[0.08] rounded-xl p-6 space-y-5">
        {error && (
          <div className="bg-red-50 text-red-600 text-[13px] rounded-lg p-3 border border-red-100">
            {error}
          </div>
        )}

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

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-primary"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Agent'}
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
