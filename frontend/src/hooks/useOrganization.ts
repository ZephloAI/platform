import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { Organization, OrganizationMember, ApiKey, ApiKeyCreated, Invitation, UsageSnapshot } from '../types';

// ============================================================
// React Query Hooks for Organization Operations
// ============================================================

const QUERY_KEYS = {
  organizations: ['organizations'] as const,
  orgMembers: (orgId: number) => ['organizations', orgId, 'members'] as const,
  orgApiKeys: (orgId: number) => ['organizations', orgId, 'api-keys'] as const,
  orgInvitations: (orgId: number) => ['organizations', orgId, 'invitations'] as const,
  orgUsage: (orgId: number) => ['organizations', orgId, 'usage'] as const,
};

export function useOrgUsage(orgId: number) {
  return useQuery({
    queryKey: QUERY_KEYS.orgUsage(orgId),
    queryFn: async (): Promise<UsageSnapshot> => {
      const response = await apiClient.get(`/api/organizations/${orgId}/usage`);
      return response.data;
    },
    enabled: !!orgId,
  });
}

// --- Queries ---

export function useOrganizations() {
  return useQuery({
    queryKey: QUERY_KEYS.organizations,
    queryFn: async (): Promise<Organization[]> => {
      const response = await apiClient.get('/api/organizations');
      return response.data;
    },
    enabled: !!localStorage.getItem('token'),
  });
}

export function useOrgMembers(orgId: number) {
  return useQuery({
    queryKey: QUERY_KEYS.orgMembers(orgId),
    queryFn: async (): Promise<OrganizationMember[]> => {
      const response = await apiClient.get(`/api/organizations/${orgId}/members`);
      return response.data;
    },
    enabled: !!orgId,
  });
}

export function useOrgApiKeys(orgId: number) {
  return useQuery({
    queryKey: QUERY_KEYS.orgApiKeys(orgId),
    queryFn: async (): Promise<ApiKey[]> => {
      const response = await apiClient.get(`/api/organizations/${orgId}/api-keys`);
      return response.data;
    },
    enabled: !!orgId,
  });
}

export function useInvitations(orgId: number) {
  return useQuery({
    queryKey: QUERY_KEYS.orgInvitations(orgId),
    queryFn: async (): Promise<Invitation[]> => {
      const response = await apiClient.get(`/api/organizations/${orgId}/invitations`);
      return response.data;
    },
    enabled: !!orgId,
  });
}

// --- Mutations ---

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string }): Promise<Organization> => {
      const response = await apiClient.post('/api/organizations', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.organizations });
    },
  });
}

export function useInviteUser(orgId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { email: string; role: string }): Promise<Invitation> => {
      const response = await apiClient.post(`/api/organizations/${orgId}/invitations`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgInvitations(orgId) });
    },
  });
}

export function useCancelInvitation(orgId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: number): Promise<void> => {
      await apiClient.delete(`/api/organizations/${orgId}/invitations/${invitationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgInvitations(orgId) });
    },
  });
}

export function useAcceptInvitation() {
  return useMutation({
    mutationFn: async (token: string): Promise<void> => {
      await apiClient.post('/api/invitations/accept', { token });
    },
  });
}

export function useRemoveMember(orgId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number): Promise<void> => {
      await apiClient.delete(`/api/organizations/${orgId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgMembers(orgId) });
    },
  });
}

export function useUpdateMemberRole(orgId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }): Promise<void> => {
      await apiClient.put(`/api/organizations/${orgId}/members/${userId}`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgMembers(orgId) });
    },
  });
}

export function useCreateOrgApiKey(orgId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string }): Promise<ApiKeyCreated> => {
      const response = await apiClient.post(`/api/organizations/${orgId}/api-keys`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgApiKeys(orgId) });
    },
  });
}

export function useRevokeOrgApiKey(orgId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyId: number): Promise<void> => {
      await apiClient.delete(`/api/organizations/${orgId}/api-keys/${keyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgApiKeys(orgId) });
    },
  });
}
