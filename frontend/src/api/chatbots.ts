/**
 * Chatbot API service — single source of truth for all chatbot operations.
 *
 * Both React Query hooks (useChatbots.ts) and DashboardAssistant tools
 * call these functions so the logic lives in one place.
 */

import apiClient from './client';
import { useOrgStore } from '../stores/orgStore';
import type { Chatbot, ChatbotMetricsMap, ChatbotMiniAnalytics, CrawlJob, DiscoveredUrl, OrgAnalytics, WidgetSettings } from '../types';

// --- Helpers ---

function getActiveOrgId(): number | undefined {
  return useOrgStore.getState().activeOrganization?.id;
}

// --- Chatbot CRUD ---

export async function listChatbots(): Promise<Chatbot[]> {
  const orgId = getActiveOrgId();
  const params = orgId ? { organization_id: orgId } : {};
  const response = await apiClient.get('/api/chatbots', { params });
  return response.data;
}

export async function getChatbot(chatbotId: number): Promise<Chatbot> {
  const response = await apiClient.get(`/api/chatbots/${chatbotId}`);
  return response.data;
}

export async function createChatbot(data: { name: string }): Promise<Chatbot> {
  const orgId = getActiveOrgId();
  const body = orgId ? { ...data, organization_id: orgId } : data;
  const response = await apiClient.post('/api/chatbots', body);
  return response.data;
}

export async function updateChatbot(
  chatbotId: number,
  data: { name: string; description: string | null; instructions: string | null },
): Promise<Chatbot> {
  const response = await apiClient.put(`/api/chatbots/${chatbotId}`, data);
  return response.data;
}

export async function deleteChatbot(chatbotId: number): Promise<void> {
  await apiClient.delete(`/api/chatbots/${chatbotId}`);
}

// --- Knowledge / Crawling ---

export async function discoverUrls(
  chatbotId: number,
  websiteUrl: string,
): Promise<{ urls: DiscoveredUrl[] }> {
  const response = await apiClient.post(`/api/chatbots/${chatbotId}/discover`, {
    website_url: websiteUrl,
  });
  return response.data;
}

export async function startCrawl(
  chatbotId: number,
  selectedUrls: string[],
): Promise<CrawlJob> {
  const response = await apiClient.post(`/api/chatbots/${chatbotId}/crawl`, {
    selected_urls: selectedUrls,
  });
  return response.data;
}

export async function getCrawlJob(jobId: number): Promise<CrawlJob> {
  const response = await apiClient.get(`/api/crawl-jobs/${jobId}`);
  return response.data;
}

// --- Widget Settings ---

export async function updateWidgetSettings(
  chatbotId: number,
  settings: WidgetSettings,
): Promise<WidgetSettings> {
  const response = await apiClient.put(
    `/api/chatbots/${chatbotId}/widget-settings`,
    settings,
  );
  return response.data;
}

export async function uploadLogo(
  chatbotId: number,
  file: File,
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post(`/api/chatbots/${chatbotId}/logo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

// --- Analytics ---

export async function getOrgAnalytics(orgId: number, days = 30): Promise<OrgAnalytics> {
  const response = await apiClient.get(`/api/organizations/${orgId}/analytics`, {
    params: { days },
  });
  return response.data;
}

export async function getOrgChatbotAnalytics(orgId: number): Promise<Record<number, ChatbotMiniAnalytics>> {
  const response = await apiClient.get(`/api/organizations/${orgId}/chatbot-analytics`);
  return response.data;
}

export async function getOrgChatbotMetrics(orgId: number): Promise<ChatbotMetricsMap> {
  const response = await apiClient.get(`/api/organizations/${orgId}/chatbot-metrics`);
  return response.data;
}

// --- API Keys ---

export interface ChatbotApiKey {
  id: number;
  name: string;
  key_prefix: string;
  is_active: boolean;
  created_at: string;
}

export interface ChatbotApiKeyCreated extends ChatbotApiKey {
  key: string;
}

export async function listApiKeys(chatbotId: number): Promise<ChatbotApiKey[]> {
  const response = await apiClient.get(`/api/chatbots/${chatbotId}/api-keys`);
  return response.data;
}

export async function createApiKey(
  chatbotId: number,
  name: string,
): Promise<ChatbotApiKeyCreated> {
  const response = await apiClient.post(`/api/chatbots/${chatbotId}/api-keys`, { name });
  return response.data;
}

export async function revokeApiKey(
  chatbotId: number,
  keyId: number,
): Promise<void> {
  await apiClient.delete(`/api/chatbots/${chatbotId}/api-keys/${keyId}`);
}
