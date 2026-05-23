import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCreateChatbot } from '../hooks/useChatbots';
import { useOrgUsage } from '../hooks/useOrganization';
import { useOrgStore } from '../stores/orgStore';

function CreateChatbotPage() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const createMutation = useCreateChatbot();

  const activeOrg = useOrgStore((state) => state.activeOrganization);
  const { data: usage } = useOrgUsage(activeOrg?.id ?? 0);
  const atLimit =
    !!usage && usage.max_agents !== null && usage.agents_count >= usage.max_agents;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (atLimit) return;

    if (!name.trim()) {
      setError('Please enter a name for your agent.');
      return;
    }

    createMutation.mutate(
      { name: name.trim() },
      {
        onSuccess: (chatbot) => {
          navigate(`/agents/${chatbot.public_id}`);
        },
        onError: (err: any) => {
          // Surface the server's limit message (HTTP 402) when present
          const detail = err?.response?.data?.detail;
          setError(detail?.message || 'Failed to create agent. Please try again.');
        },
      }
    );
  };

  return (
    <div className="max-w-lg animate-fade-in">
      <h1 className="heading-lg font-display text-label-primary mb-1">
        New Agent
      </h1>
      <p className="text-[14px] text-label-secondary mb-8">
        Give your agent a name, then add pages to build its knowledge base.
      </p>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {atLimit && (
          <div className="bg-amber-50 text-amber-800 text-[13px] rounded-xl p-3 border border-amber-100">
            You've reached your plan's agent limit ({usage?.max_agents}).{' '}
            {activeOrg && (
              <Link
                to={`/organizations/${activeOrg.id}/settings?section=usage`}
                className="font-semibold underline"
              >
                Manage your organization
              </Link>
            )}{' '}
            to add more.
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 text-[13px] rounded-xl p-3 border border-red-100">
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
            disabled={createMutation.isPending || atLimit}
            className="btn-accent"
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
