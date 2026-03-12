import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { ConversationSession, ConversationDetail } from '../types';

// ============================================================
// React Query Hooks for Conversation Operations
// Each hook wraps an API call with caching and invalidation.
// ============================================================

// --- Query Keys ---
const QUERY_KEYS = {
  conversations: (chatbotId: number) => ['conversations', chatbotId] as const,
  conversation: (sessionId: string) => ['conversation', sessionId] as const,
};

/**
 * Fetch conversations for a chatbot. Polls every 5 seconds.
 */
export function useConversations(chatbotId: number) {
  return useQuery({
    queryKey: QUERY_KEYS.conversations(chatbotId),
    queryFn: async (): Promise<ConversationSession[]> => {
      const response = await apiClient.get(`/api/chatbots/${chatbotId}/conversations`);
      return response.data;
    },
    refetchInterval: 5000,
    enabled: !!chatbotId,
  });
}

/**
 * Fetch full conversation detail with messages.
 */
export function useConversation(sessionId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.conversation(sessionId!),
    queryFn: async (): Promise<ConversationDetail> => {
      const response = await apiClient.get(`/api/conversations/${sessionId}`);
      return response.data;
    },
    enabled: !!sessionId,
    refetchInterval: 3000,
  });
}

/**
 * Send a message as admin.
 */
export function useSendAdminMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, content }: { sessionId: string; content: string }) => {
      const response = await apiClient.post(`/api/conversations/${sessionId}/messages`, { content });
      return response.data;
    },
    onSuccess: (_data, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversation(sessionId) });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/**
 * Switch conversation mode (ai/person).
 */
export function useSwitchMode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, mode }: { sessionId: string; mode: 'ai' | 'person' }) => {
      const response = await apiClient.put(`/api/conversations/${sessionId}/mode`, { mode });
      return response.data;
    },
    onSuccess: (_data, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversation(sessionId) });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/**
 * Mark conversation as read.
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiClient.put(`/api/conversations/${sessionId}/read`);
      return response.data;
    },
    onSuccess: (_data, _sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
