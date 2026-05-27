import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type {
  AdminAgent,
  AuditLogEntry,
  OrgAdminSummary,
  PlatformMetrics,
  TokenUsagePoint,
} from '../types';

// ============================================================
// React Query Hooks for the admin dashboard
// All routes are gated by is_platform_admin on the api side.
// ============================================================

const KEYS = {
  orgs: ['admin', 'organizations'] as const,
  org: (id: number) => ['admin', 'organizations', id] as const,
  audit: (id: number) => ['admin', 'organizations', id, 'audit'] as const,
  agents: (id: number) => ['admin', 'organizations', id, 'agents'] as const,
  metrics: ['admin', 'metrics'] as const,
  tokens: (days: number) => ['admin', 'metrics', 'tokens', days] as const,
};

export function useAdminOrganizations() {
  return useQuery({
    queryKey: KEYS.orgs,
    queryFn: async (): Promise<OrgAdminSummary[]> => {
      const response = await apiClient.get('/api/admin/organizations');
      return response.data;
    },
  });
}

export function useAdminOrganization(orgId: number | null) {
  return useQuery({
    queryKey: orgId ? KEYS.org(orgId) : ['admin', 'organizations', 'none'],
    queryFn: async (): Promise<OrgAdminSummary> => {
      const response = await apiClient.get(`/api/admin/organizations/${orgId}`);
      return response.data;
    },
    enabled: !!orgId,
  });
}

export function useOrgAuditLog(orgId: number | null) {
  return useQuery({
    queryKey: orgId ? KEYS.audit(orgId) : ['admin', 'organizations', 'none', 'audit'],
    queryFn: async (): Promise<AuditLogEntry[]> => {
      const response = await apiClient.get(
        `/api/admin/organizations/${orgId}/audit-log`
      );
      return response.data;
    },
    enabled: !!orgId,
  });
}

export function useAdminOrgAgents(orgId: number | null) {
  return useQuery({
    queryKey: orgId ? KEYS.agents(orgId) : ['admin', 'organizations', 'none', 'agents'],
    queryFn: async (): Promise<AdminAgent[]> => {
      const response = await apiClient.get(
        `/api/admin/organizations/${orgId}/agents`
      );
      return response.data;
    },
    enabled: !!orgId,
  });
}

export function useUpdateAgentModel(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      publicId,
      llm_model,
    }: {
      publicId: string;
      llm_model: string | null;
    }): Promise<AdminAgent> => {
      const response = await apiClient.put(
        `/api/admin/agents/${publicId}/model`,
        { llm_model }
      );
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.agents(orgId) });
    },
  });
}

export function usePlatformMetrics() {
  return useQuery({
    queryKey: KEYS.metrics,
    queryFn: async (): Promise<PlatformMetrics> => {
      const response = await apiClient.get('/api/admin/metrics');
      return response.data;
    },
  });
}

export function useTokenTimeseries(days: number = 30) {
  return useQuery({
    queryKey: KEYS.tokens(days),
    queryFn: async (): Promise<{ points: TokenUsagePoint[] }> => {
      const response = await apiClient.get(
        `/api/admin/metrics/tokens?days=${days}`
      );
      return response.data;
    },
  });
}

export interface UpdateLimitsPayload {
  plan?: string | null;
  max_users?: number | null;
  max_agents?: number | null;
  max_tokens_per_period?: number | null;
  token_period?: string | null;
  clear_max_users?: boolean;
  clear_max_agents?: boolean;
  clear_max_tokens?: boolean;
}

export function useUpdateLimits(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateLimitsPayload): Promise<OrgAdminSummary> => {
      const response = await apiClient.put(
        `/api/admin/organizations/${orgId}/limits`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.orgs });
      qc.invalidateQueries({ queryKey: KEYS.org(orgId) });
    },
  });
}

export function useSuspendOrg(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (suspended: boolean): Promise<OrgAdminSummary> => {
      const response = await apiClient.post(
        `/api/admin/organizations/${orgId}/suspend`,
        { suspended }
      );
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.orgs });
      qc.invalidateQueries({ queryKey: KEYS.org(orgId) });
      qc.invalidateQueries({ queryKey: KEYS.audit(orgId) });
    },
  });
}
