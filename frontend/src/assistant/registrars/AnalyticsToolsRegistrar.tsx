import { useEffect } from 'react';
import type { ZephloInstance } from 'zephlo';
import * as chatbotApi from '../../api/chatbots';
import apiClient from '../../api/client';
import { useOrgStore } from '../../stores/orgStore';
import { describeError, err, ok } from '../util';

// Read-only analytics tools.
// These call the API client directly (no mutations involved) and resolve
// the org id from the active organization store so the LLM can omit it.

interface Props {
  instance: ZephloInstance;
}

function AnalyticsToolsRegistrar({ instance }: Props) {
  useEffect(() => {
    const resolveOrgId = (override?: number) => {
      return override ?? useOrgStore.getState().activeOrganization?.id;
    };

    instance.registerTool({
      name: 'get_org_metrics',
      description: 'Aggregate metrics for the active organization (or a specified org_id): total conversations, messages, resolved.',
      inputSchema: {
        type: 'object',
        properties: { org_id: { type: 'number' } },
      },
      execute: async (params) => {
        try {
          const orgId = resolveOrgId(params.org_id as number);
          if (!orgId) return err('No active organization.');
          const metrics = await chatbotApi.getOrgChatbotMetrics(orgId);
          return ok(metrics);
        } catch (e) {
          return err('Failed to get org metrics', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'get_org_analytics',
      description: 'Daily time-series (messages, conversations, resolved, unique visitors) for the active organization.',
      inputSchema: {
        type: 'object',
        properties: {
          org_id: { type: 'number' },
          days: { type: 'number', description: 'How many days back to include. Default 30.' },
        },
      },
      execute: async (params) => {
        try {
          const orgId = resolveOrgId(params.org_id as number);
          if (!orgId) return err('No active organization.');
          const days = (params.days as number) ?? 30;
          const analytics = await chatbotApi.getOrgAnalytics(orgId, days);
          return ok(analytics);
        } catch (e) {
          return err('Failed to get org analytics', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'get_agent_metrics',
      description: 'Per-agent metrics for every agent in the active organization (or a specified org_id).',
      inputSchema: {
        type: 'object',
        properties: { org_id: { type: 'number' } },
      },
      execute: async (params) => {
        try {
          const orgId = resolveOrgId(params.org_id as number);
          if (!orgId) return err('No active organization.');
          const analytics = await chatbotApi.getOrgChatbotAnalytics(orgId);
          return ok(analytics);
        } catch (e) {
          return err('Failed to get agent metrics', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'get_recent_conversations',
      description: 'Most recent conversations across all agents in the org. Useful for a live activity glance.',
      inputSchema: {
        type: 'object',
        properties: {
          org_id: { type: 'number' },
          limit: { type: 'number', description: 'Default 3.' },
        },
      },
      execute: async (params) => {
        try {
          const orgId = resolveOrgId(params.org_id as number);
          if (!orgId) return err('No active organization.');
          const limit = (params.limit as number) ?? 3;
          const recent = await chatbotApi.getOrgRecentConversations(orgId, limit);
          return ok(recent);
        } catch (e) {
          return err('Failed to get recent conversations', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'get_single_agent_metrics',
      description: 'Metrics for a single agent (total conversations, messages, resolved).',
      inputSchema: {
        type: 'object',
        properties: { agent_id: { type: 'string' } },
        required: ['agent_id'],
      },
      execute: async (params) => {
        try {
          const response = await apiClient.get(`/api/agents/${params.agent_id}/metrics`);
          return ok(response.data);
        } catch (e) {
          return err('Failed to get agent metrics', describeError(e));
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance]);

  return null;
}

export default AnalyticsToolsRegistrar;
