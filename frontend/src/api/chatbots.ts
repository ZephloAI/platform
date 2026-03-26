/**
 * Chatbot API service — single source of truth for all chatbot operations.
 *
 * Both React Query hooks (useChatbots.ts) and DashboardAssistant tools
 * call these functions so the logic lives in one place.
 */

import apiClient from './client';
import { useOrgStore } from '../stores/orgStore';
import type { Chatbot, ChatbotMetricsMap, ChatbotMiniAnalytics, CrawlJob, DiscoveredUrl, Document, OrgAnalytics, WidgetSettings } from '../types';

// --- Helpers ---

function getActiveOrgId(): number | undefined {
  return useOrgStore.getState().activeOrganization?.id;
}

// --- Chatbot CRUD ---

export async function listChatbots(): Promise<Chatbot[]> {
  const orgId = getActiveOrgId();
  const params = orgId ? { organization_id: orgId } : {};
  const response = await apiClient.get('/api/agents', { params });
  return response.data;
}

export async function getChatbot(chatbotId: string): Promise<Chatbot> {
  const response = await apiClient.get(`/api/agents/${chatbotId}`);
  return response.data;
}

export async function createChatbot(data: { name: string }): Promise<Chatbot> {
  const orgId = getActiveOrgId();
  const body = orgId ? { ...data, organization_id: orgId } : data;
  const response = await apiClient.post('/api/agents', body);
  return response.data;
}

export async function updateChatbot(
  chatbotId: string,
  data: { name: string; description: string | null; instructions: string | null; auto_recrawl_enabled?: boolean; recrawl_interval_hours?: number },
): Promise<Chatbot> {
  const response = await apiClient.put(`/api/agents/${chatbotId}`, data);
  return response.data;
}

export async function deleteChatbot(chatbotId: string): Promise<void> {
  await apiClient.delete(`/api/agents/${chatbotId}`);
}

// --- Knowledge / Crawling ---

export async function discoverUrls(
  chatbotId: string,
  websiteUrl: string,
): Promise<{ urls: DiscoveredUrl[] }> {
  const response = await apiClient.post(`/api/agents/${chatbotId}/discover`, {
    website_url: websiteUrl,
  });
  return response.data;
}

export async function startCrawl(
  chatbotId: string,
  selectedUrls: string[],
): Promise<CrawlJob> {
  const response = await apiClient.post(`/api/agents/${chatbotId}/crawl`, {
    selected_urls: selectedUrls,
  });
  return response.data;
}

export async function recrawl(chatbotId: string): Promise<CrawlJob> {
  const response = await apiClient.post(`/api/agents/${chatbotId}/recrawl`);
  return response.data;
}

export async function getCrawlJob(jobId: number): Promise<CrawlJob> {
  const response = await apiClient.get(`/api/crawl-jobs/${jobId}`);
  return response.data;
}

// --- Documents ---

export async function uploadDocument(
  chatbotId: string,
  file: File,
): Promise<Document> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post(
    `/api/agents/${chatbotId}/documents`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return response.data;
}

export async function deleteDocument(
  chatbotId: string,
  documentId: number,
): Promise<void> {
  await apiClient.delete(`/api/agents/${chatbotId}/documents/${documentId}`);
}

// --- Widget Settings ---

export async function updateWidgetSettings(
  chatbotId: string,
  settings: WidgetSettings,
): Promise<WidgetSettings> {
  const response = await apiClient.put(
    `/api/agents/${chatbotId}/widget-settings`,
    settings,
  );
  return response.data;
}

export async function uploadLogo(
  chatbotId: string,
  file: File,
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post(`/api/agents/${chatbotId}/logo`, formData, {
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

export async function listApiKeys(chatbotId: string): Promise<ChatbotApiKey[]> {
  const response = await apiClient.get(`/api/agents/${chatbotId}/api-keys`);
  return response.data;
}

export async function createApiKey(
  chatbotId: string,
  name: string,
): Promise<ChatbotApiKeyCreated> {
  const response = await apiClient.post(`/api/agents/${chatbotId}/api-keys`, { name });
  return response.data;
}

export async function revokeApiKey(
  chatbotId: string,
  keyId: number,
): Promise<void> {
  await apiClient.delete(`/api/agents/${chatbotId}/api-keys/${keyId}`);
}
