import apiClient from './client';
import type { Lead } from '../types';

export async function getLeads(agentId: string): Promise<Lead[]> {
  const response = await apiClient.get(`/api/agents/${agentId}/leads`);
  return response.data;
}
