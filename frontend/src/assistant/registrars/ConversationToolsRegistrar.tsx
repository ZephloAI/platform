import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ZephloInstance } from 'zephlo';
import { navigateProp } from 'zephlo';
import apiClient from '../../api/client';
import {
  useMarkAsRead,
  useSendAdminMessage,
  useSwitchMode,
} from '../../hooks/useConversations';
import { describeError, err, ok } from '../util';
import type { ConversationDetail, ConversationSession } from '../../types';

// Conversation tools: list, get, mark read, switch ai↔person, admin reply.
// All mutations delegate to the matching hooks so cache invalidation
// matches the Conversations UI exactly.

interface Props {
  instance: ZephloInstance;
}

function ConversationToolsRegistrar({ instance }: Props) {
  const navigate = useNavigate();
  const markRead = useMarkAsRead();
  const switchMode = useSwitchMode();
  const sendMessage = useSendAdminMessage();

  useEffect(() => {
    instance.registerTool({
      name: 'list_conversations',
      description: 'List the conversations for an agent (most recent first). Each entry includes session id, last message, unread flag and mode.',
      inputSchema: {
        type: 'object',
        properties: {
          agent_id: { type: 'string' },
          only_unread: { type: 'boolean' },
          ...navigateProp,
        },
        required: ['agent_id'],
      },
      execute: async (params) => {
        try {
          const response = await apiClient.get<ConversationSession[]>(
            `/api/agents/${params.agent_id}/conversations`,
          );
          let sessions = response.data;
          if (params.only_unread) sessions = sessions.filter((s) => s.is_unread);
          if (params.navigate) navigate(`/agents/${params.agent_id}?section=conversations`);
          return ok({ count: sessions.length, sessions });
        } catch (e) {
          return err('Failed to list conversations', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'get_conversation',
      description: 'Get the full message history for a single conversation by session id.',
      inputSchema: {
        type: 'object',
        properties: {
          session_id: { type: 'string' },
          ...navigateProp,
        },
        required: ['session_id'],
      },
      execute: async (params) => {
        try {
          const response = await apiClient.get<ConversationDetail>(
            `/api/conversations/${params.session_id}`,
          );
          if (params.navigate) {
            // Best effort: agent_id isn't in the param shape, so just open the
            // conversations section on the agent if it's in the detail.
            const agentId = (response.data as unknown as { chatbot_public_id?: string }).chatbot_public_id;
            if (agentId) navigate(`/agents/${agentId}?section=conversations&session=${params.session_id}`);
          }
          return ok(response.data);
        } catch (e) {
          return err('Failed to load conversation', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'mark_conversation_read',
      description: 'Mark a conversation as read.',
      inputSchema: {
        type: 'object',
        properties: { session_id: { type: 'string' } },
        required: ['session_id'],
      },
      execute: async (params) => {
        try {
          await markRead.mutateAsync(params.session_id as string);
          return ok({ session_id: params.session_id, read: true });
        } catch (e) {
          return err('Failed to mark as read', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'switch_conversation_mode',
      description: 'Hand a conversation back and forth between the AI and a human agent. mode must be "ai" or "person".',
      inputSchema: {
        type: 'object',
        properties: {
          session_id: { type: 'string' },
          mode: { type: 'string', enum: ['ai', 'person'] },
        },
        required: ['session_id', 'mode'],
      },
      execute: async (params) => {
        try {
          await switchMode.mutateAsync({
            sessionId: params.session_id as string,
            mode: params.mode as 'ai' | 'person',
          });
          return ok({ session_id: params.session_id, mode: params.mode });
        } catch (e) {
          return err('Failed to switch mode', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'send_admin_message',
      description: 'Send a message from the admin (human) side of a live conversation.',
      inputSchema: {
        type: 'object',
        properties: {
          session_id: { type: 'string' },
          content: { type: 'string' },
        },
        required: ['session_id', 'content'],
      },
      execute: async (params) => {
        try {
          await sendMessage.mutateAsync({
            sessionId: params.session_id as string,
            content: params.content as string,
          });
          return ok({ session_id: params.session_id, sent: true });
        } catch (e) {
          return err('Failed to send admin message', describeError(e));
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance]);

  return null;
}

export default ConversationToolsRegistrar;
