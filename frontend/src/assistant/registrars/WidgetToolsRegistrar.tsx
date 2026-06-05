import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ZephloInstance } from 'zephlo';
import { navigateProp } from 'zephlo';
import * as chatbotApi from '../../api/chatbots';
import { useUpdateWidgetSettings } from '../../hooks/useChatbots';
import { describeError, err, ok } from '../util';
import type { WidgetSettings } from '../../types';

// Widget appearance + behaviour tools.
// All updates go through useUpdateWidgetSettings — the same mutation hook
// the config UI uses — so cache invalidation and preview re-renders work
// identically whether the user clicks a button or asks the assistant.

interface Props {
  instance: ZephloInstance;
}

const SETTING_KEYS: (keyof WidgetSettings)[] = [
  'widget_icon',
  'widget_welcome',
  'widget_position',
  'widget_logo_url',
  'widget_width',
  'widget_height',
  'widget_font_family',
  'widget_font_size',
  'voice_enabled',
  'webmcp_enabled',
  'person_mode_enabled',
  'navigation_enabled',
  'greeting_prompt_duration',
];

function pickSettings(agent: Awaited<ReturnType<typeof chatbotApi.getChatbot>>): WidgetSettings {
  // Build a complete WidgetSettings from the agent record so that partial
  // updates don't accidentally clear fields the user hasn't touched.
  const base: WidgetSettings = {
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
  return base;
}

function WidgetToolsRegistrar({ instance }: Props) {
  const navigate = useNavigate();
  const update = useUpdateWidgetSettings();

  useEffect(() => {
    instance.registerTool({
      name: 'get_widget_settings',
      description: 'Return the current widget appearance + behaviour settings for an agent (icon, colour, position, prompts, MCP, voice, person mode, etc.).',
      inputSchema: {
        type: 'object',
        properties: { agent_id: { type: 'string' } },
        required: ['agent_id'],
      },
      execute: async (params) => {
        try {
          const agent = await chatbotApi.getChatbot(params.agent_id as string);
          return ok(pickSettings(agent));
        } catch (e) {
          return err('Failed to load widget settings', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'update_widget_settings',
      description: 'Update one or more widget appearance / behaviour fields. Fields that are omitted are preserved.',
      inputSchema: {
        type: 'object',
        properties: {
          agent_id: { type: 'string' },
          widget_icon: { type: 'string' },
          widget_welcome: { type: 'string' },
          widget_position: { type: 'string', description: 'e.g. "bottom-right", "bottom-left"' },
          widget_width: { type: 'number' },
          widget_height: { type: 'number' },
          widget_font_family: { type: 'string' },
          widget_font_size: { type: 'number' },
          voice_enabled: { type: 'boolean' },
          webmcp_enabled: { type: 'boolean' },
          person_mode_enabled: { type: 'boolean' },
          navigation_enabled: { type: 'boolean' },
          greeting_prompt_duration: { type: 'number' },
          ...navigateProp,
        },
        required: ['agent_id'],
      },
      execute: async (params) => {
        try {
          const agentId = params.agent_id as string;
          const agent = await chatbotApi.getChatbot(agentId);
          const settings = pickSettings(agent);
          for (const key of SETTING_KEYS) {
            if (params[key as string] !== undefined) {
              (settings as unknown as Record<string, unknown>)[key as string] = params[key as string];
            }
          }
          await update.mutateAsync({ chatbotId: agentId, settings });
          if (params.navigate) navigate(`/agents/${agentId}?section=config&configTab=appearance`);
          return ok({ id: agentId, updated: Object.keys(params).filter((k) => k !== 'agent_id' && k !== 'navigate') });
        } catch (e) {
          return err('Failed to update widget settings', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'open_upload_logo',
      description: 'Take the user to the Config / Appearance page so they can upload a logo image themselves. The assistant cannot upload files directly.',
      inputSchema: {
        type: 'object',
        properties: { agent_id: { type: 'string' } },
        required: ['agent_id'],
      },
      execute: (params) => {
        const path = `/agents/${params.agent_id}?section=config&configTab=appearance`;
        navigate(path);
        return ok({ navigated_to: path });
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance]);

  return null;
}

export default WidgetToolsRegistrar;
