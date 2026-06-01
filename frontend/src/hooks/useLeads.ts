import { useQuery } from '@tanstack/react-query';
import { getLeads } from '../api/leads';
import type { Lead } from '../types';

/** Fetch the leads captured for an agent. */
export function useAgentLeads(agentId: string | undefined) {
  return useQuery({
    queryKey: ['leads', agentId],
    queryFn: (): Promise<Lead[]> => getLeads(agentId!),
    enabled: !!agentId,
  });
}
