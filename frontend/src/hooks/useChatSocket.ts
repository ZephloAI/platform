import { useState, useRef, useEffect, useCallback } from 'react';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

interface ChatResponse {
  response: string;
  sources: { url: string; title: string }[];
  session_id: string | null;
  follow_up_prompts?: { title: string; link?: string; prompt?: string }[];
}

/**
 * React hook for chatting over a session-authenticated WebSocket.
 * On first sendMessage():
 *   1. POST /api/session with chatbot_id -> { session_id }
 *   2. Connect WS to ws(s)://host/ws/chat?session_id=<uuid>&chatbot_id=<id>
 *   3. Send the message
 * Exposes connectionStatus and resetSession for "New Chat".
 */
export function useChatSocket(chatbotId: number) {
  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const pendingRef = useRef<{
    resolve: (value: ChatResponse) => void;
    reject: (reason: Error) => void;
  } | null>(null);

  const createSession = useCallback(async (): Promise<string> => {
    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatbot_id: chatbotId }),
    });
    if (!res.ok) throw new Error('Failed to create session');
    const data = await res.json();
    return data.session_id;
  }, [chatbotId]);

  const buildWsUrl = useCallback((sessionId: string): string => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}/ws/chat?session_id=${sessionId}&chatbot_id=${chatbotId}`;
  }, [chatbotId]);

  const connect = useCallback(async (): Promise<WebSocket> => {
    // Reuse existing open connection
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return wsRef.current;
    }

    // Create a session if we don't have one
    if (!sessionIdRef.current) {
      sessionIdRef.current = await createSession();
    }

    setConnectionStatus('connecting');

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(buildWsUrl(sessionIdRef.current!));
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        resolve(ws);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.error) {
            pendingRef.current?.reject(new Error(data.error));
          } else {
            pendingRef.current?.resolve(data as ChatResponse);
          }
        } catch {
          pendingRef.current?.reject(new Error('Invalid response from server'));
        }
        pendingRef.current = null;
        setIsPending(false);
      };

      ws.onerror = () => {
        setConnectionStatus('disconnected');
        pendingRef.current?.reject(new Error('WebSocket connection error'));
        pendingRef.current = null;
        setIsPending(false);
        reject(new Error('WebSocket connection error'));
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        if (pendingRef.current) {
          pendingRef.current.reject(new Error('Connection closed'));
          pendingRef.current = null;
          setIsPending(false);
        }
        wsRef.current = null;
      };
    });
  }, [createSession, buildWsUrl]);

  const sendMessage = useCallback(
    async (
      _chatbotId: number,
      message: string,
      _sessionId: string | null,
    ): Promise<ChatResponse> => {
      setIsPending(true);

      const ws = await connect();

      return new Promise<ChatResponse>((resolve, reject) => {
        pendingRef.current = { resolve, reject };
        ws.send(JSON.stringify({ message }));
      });
    },
    [connect],
  );

  const resetSession = useCallback(() => {
    // Close existing WS
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    // Clear session so next sendMessage creates a fresh one
    sessionIdRef.current = null;
    setConnectionStatus('disconnected');
  }, []);

  // Close WS on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return { sendMessage, isPending, connectionStatus, resetSession };
}
