/**
 * Chatbot API service — single source of truth for all chatbot operations.
 *
 * Both React Query hooks (useChatbots.ts) and DashboardAssistant tools
 * call these functions so the logic lives in one place.
 */

import apiClient from './client';
import { useOrgStore } from '../stores/orgStore';
import type { AgentText, Chatbot, ChatbotMetricsMap, ChatbotMiniAnalytics, CrawlJob, DiscoveredUrl, Document, OrgAnalytics, RecentConversation, WidgetSettings } from '../types';

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

export async function replaceDocument(
  chatbotId: string,
  documentId: number,
  file: File,
): Promise<Document> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.put(
    `/api/agents/${chatbotId}/documents/${documentId}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return response.data;
}

// --- Raw Text Snippets ---

export async function createText(
  chatbotId: string,
  title: string,
  content: string,
): Promise<AgentText> {
  const response = await apiClient.post(`/api/agents/${chatbotId}/texts`, {
    title,
    content,
  });
  return response.data;
}

export async function updateText(
  chatbotId: string,
  textId: number,
  title: string,
  content: string,
): Promise<AgentText> {
  const response = await apiClient.put(
    `/api/agents/${chatbotId}/texts/${textId}`,
    { title, content },
  );
  return response.data;
}

export async function deleteText(
  chatbotId: string,
  textId: number,
): Promise<void> {
  await apiClient.delete(`/api/agents/${chatbotId}/texts/${textId}`);
}

// --- Preview API key ---

export interface PreviewKey {
  id: number;
  key: string;
  name: string;
}

export async function getPreviewKey(chatbotId: string): Promise<PreviewKey> {
  const response = await apiClient.get(`/api/agents/${chatbotId}/preview-key`);
  return response.data;
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

export async function getOrgRecentConversations(orgId: number, limit = 3): Promise<RecentConversation[]> {
  const response = await apiClient.get(`/api/organizations/${orgId}/recent-conversations`, {
    params: { limit },
  });
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
