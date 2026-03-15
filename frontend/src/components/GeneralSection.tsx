import { useState } from 'react';
import { useUpdateChatbot } from '../hooks/useChatbots';
import type { Chatbot } from '../types';

interface GeneralSectionProps {
  chatbot: Chatbot;
}

function GeneralSection({ chatbot }: GeneralSectionProps) {
  const [name, setName] = useState(chatbot.name);
  const [description, setDescription] = useState(chatbot.description || '');
  const [instructions, setInstructions] = useState(chatbot.instructions || '');
  const [saved, setSaved] = useState(false);

  const updateChatbot = useUpdateChatbot();

  const handleSave = async () => {
    setSaved(false);
    await updateChatbot.mutateAsync({
      chatbotId: chatbot.id,
      data: {
        name: name.trim(),
        description: description.trim() || null,
        instructions: instructions.trim() || null,
      },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Identity */}
      <div className="card p-6">
        <h3 className="heading-sm font-display text-label-primary mb-1">Identity</h3>
        <p className="text-[12px] text-label-tertiary mb-5">
          Basic information about your agent.
        </p>

        <div className="space-y-4">
          <div>
            <label className="input-label">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="My Agent"
            />
          </div>

          <div>
            <label className="input-label">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              placeholder="What does this agent do?"
            />
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="card p-6">
        <h3 className="heading-sm font-display text-label-primary mb-1">Instructions</h3>
        <p className="text-[12px] text-label-tertiary mb-5">
          Tell your agent how to behave, what tone to use, and any specific rules to follow.
        </p>

        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={8}
          className="input-field resize-y min-h-[160px]"
          placeholder="Custom instructions for how the AI should behave..."
        />
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={updateChatbot.isPending || !name.trim()}
          className="btn-accent px-5 py-2.5 text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updateChatbot.isPending ? 'Saving...' : 'Save Changes'}
        </button>

        {saved && (
          <span className="text-[12px] text-sage-600 font-medium animate-fade-in">
            Changes saved
          </span>
        )}

        {updateChatbot.isError && (
          <span className="text-[12px] text-red-500 font-medium">
            Failed to save. Please try again.
          </span>
        )}
      </div>
    </div>
  );
}

export default GeneralSection;
