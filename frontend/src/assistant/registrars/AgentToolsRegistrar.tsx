import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ZephloInstance } from 'zephlo';
import { navigateProp } from 'zephlo';
import * as chatbotApi from '../../api/chatbots';
import { useCreateChatbot, useUpdateChatbot } from '../../hooks/useChatbots';
import { describeError, err, ok } from '../util';

// Agent (chatbot) read + safe mutations.
// Mutations delegate to React Query hooks so the assistant's actions run the
// same cache-invalidation + side-effect path as the dashboard UI.
// Destructive actions (delete) are excluded — the assistant should navigate
// the user to the settings page and let them confirm there.

interface Props {
  instance: ZephloInstance;
}

function AgentToolsRegistrar({ instance }: Props) {
  const navigate = useNavigate();
  const create = useCreateChatbot();
  const update = useUpdateChatbot();

  useEffect(() => {
    instance.registerTool({
      name: 'list_agents',
      description: 'List every agent in the active organization. Returns id, name, status, and website URL.',
      inputSchema: { type: 'object', properties: { ...navigateProp } },
      execute: async (params) => {
        try {
          const agents = await chatbotApi.listChatbots();
          if (params.navigate) navigate('/dashboard');
          return ok(
            agents.map((a) => ({
              id: a.public_id,
              name: a.name,
              status: a.status,
              website_url: a.website_url,
            })),
          );
        } catch (e) {
          return err('Failed to list agents', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'get_agent',
      description: 'Get the full record for one agent, including widget settings, prompts, knowledge sources, and crawl jobs.',
      inputSchema: {
        type: 'object',
        properties: {
          agent_id: { type: 'string', description: 'The agent UUID' },
          ...navigateProp,
        },
        required: ['agent_id'],
      },
      execute: async (params) => {
        try {
          const agent = await chatbotApi.getChatbot(params.agent_id as string);
          if (params.navigate) navigate(`/agents/${params.agent_id}?section=general`);
          return ok(agent);
        } catch (e) {
          return err('Failed to load agent', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'create_agent',
      description: 'Create a new agent in the active organization. Only a name is required.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name for the new agent' },
          ...navigateProp,
        },
        required: ['name'],
      },
      execute: async (params) => {
        try {
          const agent = await create.mutateAsync({ name: params.name as string });
          if (params.navigate) navigate(`/agents/${agent.public_id}`);
          return ok({ id: agent.public_id, name: agent.name, status: agent.status });
        } catch (e) {
          return err('Failed to create agent', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'update_agent',
      description: 'Update an agent\'s core fields: name, description, custom instructions, auto-recrawl, lead capture.',
      inputSchema: {
        type: 'object',
        properties: {
          agent_id: { type: 'string', description: 'The agent UUID' },
          name: { type: 'string' },
          description: { type: 'string' },
          instructions: { type: 'string', description: 'Custom system instructions for the agent' },
          auto_recrawl_enabled: { type: 'boolean' },
          recrawl_interval_hours: { type: 'number' },
          lead_capture_enabled: { type: 'boolean' },
          ...navigateProp,
        },
        required: ['agent_id'],
      },
      execute: async (params) => {
        try {
          const agentId = params.agent_id as string;
          const current = await chatbotApi.getChatbot(agentId);
          const data = {
            name: (params.name as string) ?? current.name,
            description: params.description !== undefined ? (params.description as string) : current.description,
            instructions: params.instructions !== undefined ? (params.instructions as string) : current.instructions,
            auto_recrawl_enabled:
              params.auto_recrawl_enabled !== undefined
                ? (params.auto_recrawl_enabled as boolean)
                : current.auto_recrawl_enabled,
            recrawl_interval_hours:
              params.recrawl_interval_hours !== undefined
                ? (params.recrawl_interval_hours as number)
                : current.recrawl_interval_hours,
            lead_capture_enabled:
              params.lead_capture_enabled !== undefined
                ? (params.lead_capture_enabled as boolean)
                : current.lead_capture_enabled,
          };
          await update.mutateAsync({ chatbotId: agentId, data });
          if (params.navigate) navigate(`/agents/${agentId}?section=general&generalTab=details`);
          return ok({ id: agentId, updated: Object.keys(data) });
        } catch (e) {
          return err('Failed to update agent', describeError(e));
        }
      },
    });

    // The assistant never deletes — navigate the user to the settings page.
    instance.registerTool({
      name: 'open_agent_for_deletion',
      description: 'Take the user to an agent\'s General settings where they can delete it themselves. The assistant never deletes agents directly.',
      inputSchema: {
        type: 'object',
        properties: {
          agent_id: { type: 'string', description: 'The agent UUID' },
        },
        required: ['agent_id'],
      },
      execute: (params) => {
        const agentId = params.agent_id as string;
        navigate(`/agents/${agentId}?section=general&generalTab=details`);
        return ok({ navigated_to: `/agents/${agentId}?section=general&generalTab=details`, hint: 'The user can delete the agent from this page.' });
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance]);

  return null;
}

export default AgentToolsRegistrar;
