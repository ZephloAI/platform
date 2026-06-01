import { useUpdateChatbot } from '../hooks/useChatbots';
import { useAgentLeads } from '../hooks/useLeads';
import type { Chatbot, Lead } from '../types';

interface Props {
  chatbot: Chatbot;
}

// ============================================================
// Leads section — toggle for capture + the captured leads list.
// ============================================================

function LeadsSection({ chatbot }: Props) {
  const updateChatbot = useUpdateChatbot();
  const enabled = chatbot.lead_capture_enabled ?? false;

  const toggleCapture = () => {
    updateChatbot.mutate({
      chatbotId: chatbot.public_id,
      data: {
        // The mutation requires these — pass the current values through unchanged
        // so we only flip the lead-capture flag.
        name: chatbot.name,
        description: chatbot.description,
        instructions: chatbot.instructions,
        lead_capture_enabled: !enabled,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Enable card */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="heading-md font-display text-label-primary">
              Lead capture
            </p>
            <p className="text-[13px] text-label-secondary mt-1">
              When enabled, the agent can save a visitor's name, email, phone,
              company, and what they're looking for as the chat progresses.
              Captured leads appear below.
            </p>
          </div>
          <button
            onClick={toggleCapture}
            disabled={updateChatbot.isPending}
            aria-label={enabled ? 'Disable lead capture' : 'Enable lead capture'}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 disabled:opacity-50 ${
              enabled ? 'bg-accent' : 'bg-surface-tertiary'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Leads list card */}
      <LeadsTable chatbot={chatbot} />
    </div>
  );
}

// ------------------------------------------------------------------

function LeadsTable({ chatbot }: { chatbot: Chatbot }) {
  const { data: leads, isLoading } = useAgentLeads(chatbot.public_id);

  return (
    <div className="card p-5">
      <p className="heading-md font-display text-label-primary mb-4">
        Captured leads
      </p>

      {isLoading ? (
        <p className="text-[13px] text-label-tertiary py-6 text-center">
          Loading leads...
        </p>
      ) : !leads || leads.length === 0 ? (
        <p className="text-[13px] text-label-quaternary py-6 text-center">
          No leads yet — leads captured during chats will appear here.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-label-quaternary border-b border-black/[0.06]">
                <th className="py-2 pr-4 font-semibold">Name</th>
                <th className="py-2 pr-4 font-semibold">Email</th>
                <th className="py-2 pr-4 font-semibold">Phone</th>
                <th className="py-2 pr-4 font-semibold">Company</th>
                <th className="py-2 pr-4 font-semibold">Interest</th>
                <th className="py-2 pr-4 font-semibold">Status</th>
                <th className="py-2 font-semibold">Captured</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <LeadRow key={lead.id} lead={lead} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  const complete = Boolean(lead.name && lead.email);
  return (
    <tr className="border-b border-black/[0.04] last:border-b-0 align-top">
      <td className="py-3 pr-4 text-label-primary">{lead.name || '—'}</td>
      <td className="py-3 pr-4 text-label-secondary">{lead.email || '—'}</td>
      <td className="py-3 pr-4 text-label-secondary">{lead.phone || '—'}</td>
      <td className="py-3 pr-4 text-label-secondary">{lead.company || '—'}</td>
      <td className="py-3 pr-4 text-label-secondary max-w-xs">
        {lead.interest ? (
          <span className="line-clamp-3">{lead.interest}</span>
        ) : (
          '—'
        )}
      </td>
      <td className="py-3 pr-4">
        <span
          className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
            complete
              ? 'bg-sage-50 text-sage-700'
              : 'bg-amber-50 text-amber-700'
          }`}
        >
          {complete ? 'Complete' : 'Partial'}
        </span>
      </td>
      <td className="py-3 text-label-tertiary whitespace-nowrap tabular-nums">
        {new Date(lead.updated_at).toLocaleDateString()}
      </td>
    </tr>
  );
}

export default LeadsSection;
