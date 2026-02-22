import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { Chatbot, CrawlJob, ChatMessage, DiscoveredUrl, WidgetSettings } from '../types';

// ============================================================
// React Query Hooks for Chatbot Operations
// Each hook wraps an API call with caching and invalidation.
// ============================================================

// --- Query Keys ---
// Centralized keys make cache invalidation predictable
const QUERY_KEYS = {
  chatbots: ['chatbots'] as const,
  chatbot: (id: number) => ['chatbots', id] as const,
  crawlJob: (id: number) => ['crawlJobs', id] as const,
};

/**
 * Fetch the list of all chatbots for the current user.
 */
export function useChatbots() {
  return useQuery({
    queryKey: QUERY_KEYS.chatbots,
    queryFn: async (): Promise<Chatbot[]> => {
      const response = await apiClient.get('/api/chatbots');
      return response.data;
    },
    // Only fetch when the user has a token (prevents 401 on mount race conditions)
    enabled: !!localStorage.getItem('token'),
  });
}

/**
 * Fetch a single chatbot by ID, including its crawl jobs.
 */
export function useChatbot(id: number) {
  return useQuery({
    queryKey: QUERY_KEYS.chatbot(id),
    queryFn: async (): Promise<Chatbot> => {
      const response = await apiClient.get(`/api/chatbots/${id}`);
      return response.data;
    },
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
    mutationFn: async (data: { name: string }): Promise<Chatbot> => {
      const response = await apiClient.post('/api/chatbots', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chatbots });
    },
  });
}

/**
 * Delete a chatbot. Invalidates the chatbot list on success.
 */
export function useDeleteChatbot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await apiClient.delete(`/api/chatbots/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chatbots });
    },
  });
}

/**
 * Discover all URLs on a website. Accepts chatbotId and the website URL to spider.
 */
export function useDiscoverUrls() {
  return useMutation({
    mutationFn: async ({
      chatbotId,
      websiteUrl,
    }: {
      chatbotId: number;
      websiteUrl: string;
    }): Promise<{ urls: DiscoveredUrl[] }> => {
      const response = await apiClient.post(`/api/chatbots/${chatbotId}/discover`, {
        website_url: websiteUrl,
      });
      return response.data;
    },
  });
}

/**
 * Start a crawl job for a chatbot. Accepts optional selected URLs.
 * Invalidates the chatbot detail on success.
 */
export function useStartCrawl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      chatbotId,
      selectedUrls,
    }: {
      chatbotId: number;
      selectedUrls: string[];
    }): Promise<CrawlJob> => {
      const response = await apiClient.post(`/api/chatbots/${chatbotId}/crawl`, {
        selected_urls: selectedUrls,
      });
      return response.data;
    },
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
    mutationFn: async ({ chatbotId, file }: { chatbotId: number; file: File }): Promise<{ url: string }> => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post(`/api/chatbots/${chatbotId}/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
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
    mutationFn: async ({
      chatbotId,
      settings,
    }: {
      chatbotId: number;
      settings: WidgetSettings;
    }): Promise<WidgetSettings> => {
      const response = await apiClient.put(
        `/api/chatbots/${chatbotId}/widget-settings`,
        settings,
      );
      return response.data;
    },
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
    queryFn: async (): Promise<CrawlJob> => {
      const response = await apiClient.get(`/api/crawl-jobs/${id}`);
      return response.data;
    },
    enabled: id !== null,
    refetchInterval: 3000,
  });
}

/**
 * Type helper for chat messages used in the ChatWidget
 */
export type { ChatMessage };
