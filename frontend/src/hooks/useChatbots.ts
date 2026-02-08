import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { Chatbot, CrawlJob, ChatMessage } from '../types';

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
 * Create a new chatbot. Invalidates the chatbot list on success.
 */
export function useCreateChatbot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; website_url: string }): Promise<Chatbot> => {
      const response = await apiClient.post('/api/chatbots', data);
      return response.data;
    },
    onSuccess: () => {
      // Refresh the chatbot list after creating a new one
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
 * Start a crawl job for a chatbot. Invalidates the chatbot detail on success.
 */
export function useStartCrawl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chatbotId: number): Promise<CrawlJob> => {
      const response = await apiClient.post(`/api/chatbots/${chatbotId}/crawl`);
      return response.data;
    },
    onSuccess: (_data, chatbotId) => {
      // Refresh the chatbot detail so the new crawl job appears
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
 * Send a chat message and get an AI response.
 * This is a mutation since each message is a new POST request.
 */
export function useChat() {
  return useMutation({
    mutationFn: async (data: {
      chatbot_id: number;
      message: string;
    }): Promise<{ response: string; sources: { url: string; title: string }[] }> => {
      const res = await apiClient.post('/api/chat', data);
      return res.data;
    },
  });
}

/**
 * Type helper for chat messages used in the ChatWidget
 */
export type { ChatMessage };
