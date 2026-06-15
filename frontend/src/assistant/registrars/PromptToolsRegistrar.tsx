import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ZephloInstance } from 'zephlo';
import { navigateProp } from 'zephlo';
import * as chatbotApi from '../../api/chatbots';
import { useUpdateWidgetSettings } from '../../hooks/useChatbots';
import { describeError, err, ok } from '../util';
import type { FollowUpPrompt, GreetingPrompt, QuickPrompt, WidgetSettings } from '../../types';

// Prompt-set tools — quick / follow-up / greeting.
// Prompts live inside WidgetSettings on the chatbot record, so every
// mutation here re-reads the agent, mutates the relevant array, and
// pushes the whole WidgetSettings through useUpdateWidgetSettings.
// This is identical to how the Config UI manages prompts.

interface Props {
  instance: ZephloInstance;
}

function buildSettings(agent: Awaited<ReturnType<typeof chatbotApi.getChatbot>>): WidgetSettings {
  return {
    widget_icon: agent.widget_icon,
    widget_welcome: agent.widget_welcome,
    widget_position: agent.widget_position,
    quick_prompts: agent.quick_prompts || null,
    follow_up_prompts: agent.follow_up_prompts || null,
    greeting_prompts: agent.greeting_prompts || null,
    greeting_prompt_duration: agent.greeting_prompt_duration ?? null,
    widget_logo_url: agent.widget_logo_url ?? null,
    widget_width: agent.widget_width ?? null,
    widget_height: agent.widget_height ?? null,
    widget_font_family: agent.widget_font_family ?? null,
    widget_font_size: agent.widget_font_size ?? null,
    voice_enabled: !!agent.voice_enabled,
    webmcp_enabled: !!agent.webmcp_enabled,
    mcp_servers: agent.mcp_servers || null,
    person_mode_enabled: !!agent.person_mode_enabled,
    navigation_enabled: !!agent.navigation_enabled,
  };
}

function PromptToolsRegistrar({ instance }: Props) {
  const navigate = useNavigate();
  const update = useUpdateWidgetSettings();

  useEffect(() => {
    // -------- Quick prompts --------
    instance.registerTool({
      name: 'list_quick_prompts',
      description: 'List the quick-prompt buttons shown in the widget for an agent.',
      inputSchema: {
        type: 'object',
        properties: { agent_id: { type: 'string' } },
        required: ['agent_id'],
      },
      execute: async (params) => {
        try {
          const agent = await chatbotApi.getChatbot(params.agent_id as string);
          return ok(agent.quick_prompts || []);
        } catch (e) {
          return err('Failed to list quick prompts', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'set_quick_prompts',
      description: 'Replace the entire list of quick-prompt buttons for an agent. Each prompt has a title and optionally a link or a prompt string.',
      inputSchema: {
        type: 'object',
        properties: {
          agent_id: { type: 'string' },
          prompts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                link: { type: 'string' },
                prompt: { type: 'string' },
              },
              required: ['title'],
            },
          },
          ...navigateProp,
        },
        required: ['agent_id', 'prompts'],
      },
      execute: async (params) => {
        try {
          const agentId = params.agent_id as string;
          const agent = await chatbotApi.getChatbot(agentId);
          const settings = buildSettings(agent);
          settings.quick_prompts = params.prompts as QuickPrompt[];
          await update.mutateAsync({ chatbotId: agentId, settings });
          if (params.navigate) navigate(`/agents/${agentId}?section=config&configTab=quick-prompts`);
          return ok({ count: settings.quick_prompts.length });
        } catch (e) {
          return err('Failed to set quick prompts', describeError(e));
        }
      },
    });

    // -------- Follow-up prompts --------
    instance.registerTool({
      name: 'list_follow_up_prompts',
      description: 'List the follow-up prompts the agent can suggest after a response.',
      inputSchema: {
        type: 'object',
        properties: { agent_id: { type: 'string' } },
        required: ['agent_id'],
      },
      execute: async (params) => {
        try {
          const agent = await chatbotApi.getChatbot(params.agent_id as string);
          return ok(agent.follow_up_prompts || []);
        } catch (e) {
          return err('Failed to list follow-up prompts', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'set_follow_up_prompts',
      description: 'Replace the follow-up prompts list for an agent.',
      inputSchema: {
        type: 'object',
        properties: {
          agent_id: { type: 'string' },
          prompts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                link: { type: 'string' },
                prompt: { type: 'string' },
              },
              required: ['title'],
            },
          },
          ...navigateProp,
        },
        required: ['agent_id', 'prompts'],
      },
      execute: async (params) => {
        try {
          const agentId = params.agent_id as string;
          const agent = await chatbotApi.getChatbot(agentId);
          const settings = buildSettings(agent);
          settings.follow_up_prompts = params.prompts as FollowUpPrompt[];
          await update.mutateAsync({ chatbotId: agentId, settings });
          if (params.navigate) navigate(`/agents/${agentId}?section=config&configTab=follow-up-prompts`);
          return ok({ count: settings.follow_up_prompts.length });
        } catch (e) {
          return err('Failed to set follow-up prompts', describeError(e));
        }
      },
    });

    // -------- Greeting prompts --------
    instance.registerTool({
      name: 'list_greeting_prompts',
      description: 'List the greeting bubbles shown before a chat opens.',
      inputSchema: {
        type: 'object',
        properties: { agent_id: { type: 'string' } },
        required: ['agent_id'],
      },
      execute: async (params) => {
        try {
          const agent = await chatbotApi.getChatbot(params.agent_id as string);
          return ok({
            prompts: agent.greeting_prompts || [],
            duration_seconds: agent.greeting_prompt_duration ?? null,
          });
        } catch (e) {
          return err('Failed to list greeting prompts', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'set_greeting_prompts',
      description: 'Replace the greeting bubbles. Optionally set how long (seconds) they remain on screen.',
      inputSchema: {
        type: 'object',
        properties: {
          agent_id: { type: 'string' },
          prompts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                prompt: { type: 'string' },
              },
              required: ['title', 'prompt'],
            },
          },
          duration_seconds: { type: 'number' },
          ...navigateProp,
        },
        required: ['agent_id', 'prompts'],
      },
      execute: async (params) => {
        try {
          const agentId = params.agent_id as string;
          const agent = await chatbotApi.getChatbot(agentId);
          const settings = buildSettings(agent);
          settings.greeting_prompts = params.prompts as GreetingPrompt[];
          if (params.duration_seconds !== undefined) {
            settings.greeting_prompt_duration = params.duration_seconds as number;
          }
          await update.mutateAsync({ chatbotId: agentId, settings });
          if (params.navigate) navigate(`/agents/${agentId}?section=config&configTab=greeting-prompts`);
          return ok({ count: settings.greeting_prompts.length, duration: settings.greeting_prompt_duration });
        } catch (e) {
          return err('Failed to set greeting prompts', describeError(e));
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance]);

  return null;
}

export default PromptToolsRegistrar;
