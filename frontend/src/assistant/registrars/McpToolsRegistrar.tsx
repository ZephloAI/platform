import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ZephloInstance } from 'zephlo';
import { navigateProp } from 'zephlo';
import * as chatbotApi from '../../api/chatbots';
import { useUpdateWidgetSettings } from '../../hooks/useChatbots';
import { describeError, err, ok } from '../util';
import type { MCPServer, WidgetSettings } from '../../types';

// MCP server tools.
// MCP servers are stored on the chatbot record as `mcp_servers` and updated
// via the same WidgetSettings PUT the UI uses — so adding / toggling a
// server here behaves identically to using the Tools section UI.

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

function McpToolsRegistrar({ instance }: Props) {
  const navigate = useNavigate();
  const update = useUpdateWidgetSettings();

  useEffect(() => {
    instance.registerTool({
      name: 'list_mcp_servers',
      description: 'List the MCP (Model Context Protocol) servers connected to an agent.',
      inputSchema: {
        type: 'object',
        properties: { agent_id: { type: 'string' } },
        required: ['agent_id'],
      },
      execute: async (params) => {
        try {
          const agent = await chatbotApi.getChatbot(params.agent_id as string);
          return ok(agent.mcp_servers || []);
        } catch (e) {
          return err('Failed to list MCP servers', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'add_mcp_server',
      description: 'Add a new MCP server to an agent. Transport must be "sse" or "streamable-http".',
      inputSchema: {
        type: 'object',
        properties: {
          agent_id: { type: 'string' },
          name: { type: 'string' },
          transport: { type: 'string', enum: ['sse', 'streamable-http'] },
          url: { type: 'string' },
          headers: { type: 'object', description: 'Optional headers (string-to-string map)' },
          enabled: { type: 'boolean', description: 'Defaults to true' },
          ...navigateProp,
        },
        required: ['agent_id', 'name', 'transport', 'url'],
      },
      execute: async (params) => {
        try {
          const agentId = params.agent_id as string;
          const agent = await chatbotApi.getChatbot(agentId);
          const settings = buildSettings(agent);
          const servers = [...(settings.mcp_servers || [])];
          servers.push({
            name: params.name as string,
            transport: params.transport as MCPServer['transport'],
            url: params.url as string,
            headers: (params.headers as Record<string, string>) || null,
            enabled: params.enabled !== undefined ? (params.enabled as boolean) : true,
          });
          settings.mcp_servers = servers;
          await update.mutateAsync({ chatbotId: agentId, settings });
          if (params.navigate) navigate(`/agents/${agentId}?section=tools`);
          return ok({ count: servers.length, added: params.name });
        } catch (e) {
          return err('Failed to add MCP server', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'update_mcp_server',
      description: 'Update fields on an existing MCP server (matched by name). Fields omitted are preserved.',
      inputSchema: {
        type: 'object',
        properties: {
          agent_id: { type: 'string' },
          name: { type: 'string', description: 'Name of the existing server to update' },
          new_name: { type: 'string' },
          transport: { type: 'string', enum: ['sse', 'streamable-http'] },
          url: { type: 'string' },
          headers: { type: 'object' },
          enabled: { type: 'boolean' },
          ...navigateProp,
        },
        required: ['agent_id', 'name'],
      },
      execute: async (params) => {
        try {
          const agentId = params.agent_id as string;
          const agent = await chatbotApi.getChatbot(agentId);
          const settings = buildSettings(agent);
          const servers = [...(settings.mcp_servers || [])];
          const idx = servers.findIndex((s) => s.name === (params.name as string));
          if (idx < 0) return err(`MCP server "${params.name}" not found.`);
          const target = servers[idx] as MCPServer;
          servers[idx] = {
            ...target,
            name: (params.new_name as string) ?? target.name,
            transport: (params.transport as MCPServer['transport']) ?? target.transport,
            url: (params.url as string) ?? target.url,
            headers: params.headers !== undefined ? (params.headers as Record<string, string>) : target.headers,
            enabled: params.enabled !== undefined ? (params.enabled as boolean) : target.enabled,
          };
          settings.mcp_servers = servers;
          await update.mutateAsync({ chatbotId: agentId, settings });
          if (params.navigate) navigate(`/agents/${agentId}?section=tools`);
          return ok({ updated: servers[idx].name });
        } catch (e) {
          return err('Failed to update MCP server', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'toggle_mcp_server',
      description: 'Enable or disable an MCP server by name without changing its config.',
      inputSchema: {
        type: 'object',
        properties: {
          agent_id: { type: 'string' },
          name: { type: 'string' },
          enabled: { type: 'boolean' },
          ...navigateProp,
        },
        required: ['agent_id', 'name', 'enabled'],
      },
      execute: async (params) => {
        try {
          const agentId = params.agent_id as string;
          const agent = await chatbotApi.getChatbot(agentId);
          const settings = buildSettings(agent);
          const servers = [...(settings.mcp_servers || [])];
          const idx = servers.findIndex((s) => s.name === (params.name as string));
          if (idx < 0) return err(`MCP server "${params.name}" not found.`);
          const target = servers[idx] as MCPServer;
          servers[idx] = { ...target, enabled: params.enabled as boolean };
          settings.mcp_servers = servers;
          await update.mutateAsync({ chatbotId: agentId, settings });
          if (params.navigate) navigate(`/agents/${agentId}?section=tools`);
          return ok({ name: target.name, enabled: params.enabled as boolean });
        } catch (e) {
          return err('Failed to toggle MCP server', describeError(e));
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance]);

  return null;
}

export default McpToolsRegistrar;
