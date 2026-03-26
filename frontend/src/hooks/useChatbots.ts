import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrgStore } from '../stores/orgStore';
import type { Chatbot, ChatbotMetricsMap, ChatbotMiniAnalytics, CrawlJob, ChatMessage, OrgAnalytics, WidgetSettings } from '../types';
import * as chatbotApi from '../api/chatbots';

// ============================================================
// React Query Hooks for Chatbot Operations
// Each hook wraps a chatbot API call with caching and invalidation.
// ============================================================

// --- Query Keys ---
// Centralized keys make cache invalidation predictable
const QUERY_KEYS = {
  chatbots: (orgId?: number) => ['chatbots', orgId] as const,
  chatbot: (id: string) => ['chatbots', id] as const,
  crawlJob: (id: number) => ['crawlJobs', id] as const,
};

/**
 * Fetch the list of all chatbots for the current user's active organization.
 */
export function useChatbots() {
  const activeOrg = useOrgStore((state) => state.activeOrganization);
  const orgId = activeOrg?.id;

  return useQuery({
    queryKey: QUERY_KEYS.chatbots(orgId),
    queryFn: (): Promise<Chatbot[]> => chatbotApi.listChatbots(),
    enabled: !!localStorage.getItem('token'),
  });
}

/**
 * Fetch a single chatbot by public_id, including its crawl jobs.
 */
export function useChatbot(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.chatbot(id),
    queryFn: (): Promise<Chatbot> => chatbotApi.getChatbot(id),
    // Re-fetch every 5 seconds so crawl progress updates automatically
    refetchInterval: 5000,
  });
}

/**
 * Create a new chatbot. Only requires a name.
 * Invalidates the chatbot list on success.
 */
export function useCreateChatbot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string }): Promise<Chatbot> => chatbotApi.createChatbot(data),
    onSuccess: () => {
      const orgId = useOrgStore.getState().activeOrganization?.id;
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chatbots(orgId) });
    },
  });
}

/**
 * Update a chatbot's name, description, and instructions.
 * Invalidates the chatbot detail and list on success.
 */
export function useUpdateChatbot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chatbotId,
      data,
    }: {
      chatbotId: string;
      data: { name: string; description: string | null; instructions: string | null; auto_recrawl_enabled?: boolean; recrawl_interval_hours?: number };
    }): Promise<Chatbot> => chatbotApi.updateChatbot(chatbotId, data),
    onSuccess: (_data, { chatbotId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chatbot(chatbotId) });
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
    },
  });
}

/**
 * Delete a chatbot. Invalidates the chatbot list on success.
 */
export function useDeleteChatbot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string): Promise<void> => chatbotApi.deleteChatbot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
    },
  });
}

/**
 * Discover all URLs on a website. Accepts chatbotId and the website URL to spider.
 */
export function useDiscoverUrls() {
  return useMutation({
    mutationFn: ({
      chatbotId,
      websiteUrl,
    }: {
      chatbotId: string;
      websiteUrl: string;
    }) => chatbotApi.discoverUrls(chatbotId, websiteUrl),
  });
}

/**
 * Start a crawl job for a chatbot. Accepts optional selected URLs.
 * Invalidates the chatbot detail on success.
 */
export function useStartCrawl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chatbotId,
      selectedUrls,
    }: {
      chatbotId: string;
      selectedUrls: string[];
    }): Promise<CrawlJob> => chatbotApi.startCrawl(chatbotId, selectedUrls),
    onSuccess: (_data, { chatbotId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chatbot(chatbotId) });
    },
  });
}

/**
 * Re-crawl a chatbot using its previously stored URLs.
 * Invalidates the chatbot detail on success.
 */
export function useRecrawl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chatbotId: string): Promise<CrawlJob> =>
      chatbotApi.recrawl(chatbotId),
    onSuccess: (_data, chatbotId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chatbot(chatbotId) });
    },
  });
}

/**
 * Upload a PDF document to a chatbot's knowledge base.
 * Invalidates the chatbot detail on success.
 */
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatbotId, file }: { chatbotId: string; file: File }) =>
      chatbotApi.uploadDocument(chatbotId, file),
    onSuccess: (_data, { chatbotId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chatbot(chatbotId) });
    },
  });
}

/**
 * Delete a document from a chatbot's knowledge base.
 * Invalidates the chatbot detail on success.
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatbotId, documentId }: { chatbotId: string; documentId: number }) =>
      chatbotApi.deleteDocument(chatbotId, documentId),
    onSuccess: (_data, { chatbotId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chatbot(chatbotId) });
    },
  });
}

/**
 * Upload a logo image for a chatbot widget.
 * Invalidates the chatbot detail on success.
 */
export function useUploadLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatbotId, file }: { chatbotId: string; file: File }) =>
      chatbotApi.uploadLogo(chatbotId, file),
    onSuccess: (_data, { chatbotId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chatbot(chatbotId) });
    },
  });
}

/**
 * Update widget customization settings for a chatbot.
 * Invalidates the chatbot detail on success.
 */
export function useUpdateWidgetSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chatbotId,
      settings,
    }: {
      chatbotId: string;
      settings: WidgetSettings;
    }): Promise<WidgetSettings> => chatbotApi.updateWidgetSettings(chatbotId, settings),
    onSuccess: (_data, { chatbotId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chatbot(chatbotId) });
    },
  });
}

/**
 * Fetch the status of a single crawl job.
 */
export function useCrawlJob(id: number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.crawlJob(id!),
    queryFn: (): Promise<CrawlJob> => chatbotApi.getCrawlJob(id!),
    enabled: id !== null,
    refetchInterval: 3000,
  });
}

/**
 * Fetch per-chatbot daily analytics for sparklines.
 */
export function useOrgChatbotAnalytics(orgId: number | undefined) {
  return useQuery({
    queryKey: ['orgChatbotAnalytics', orgId] as const,
    queryFn: (): Promise<Record<number, ChatbotMiniAnalytics>> => chatbotApi.getOrgChatbotAnalytics(orgId!),
    enabled: !!orgId,
    refetchInterval: 15_000,
  });
}

/**
 * Fetch per-chatbot metrics for all chatbots in the active organization.
 */
export function useOrgChatbotMetrics(orgId: number | undefined) {
  return useQuery({
    queryKey: ['orgChatbotMetrics', orgId] as const,
    queryFn: (): Promise<ChatbotMetricsMap> => chatbotApi.getOrgChatbotMetrics(orgId!),
    enabled: !!orgId,
    refetchInterval: 15_000,
  });
}

/**
 * Fetch daily time-series analytics for the active organization.
 */
export function useOrgAnalytics(orgId: number | undefined, days = 30) {
  return useQuery({
    queryKey: ['orgAnalytics', orgId, days] as const,
    queryFn: (): Promise<OrgAnalytics> => chatbotApi.getOrgAnalytics(orgId!, days),
    enabled: !!orgId,
    refetchInterval: 15_000,
  });
}

/**
 * Type helper for chat messages used in the ChatWidget
 */
export type { ChatMessage };
