'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Message, TypingUser, TypingData } from '@/types';

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export type { ConnectionState };

interface UseChatOptions {
  roomId: string;
  userId: string;
  username: string;
  onNewMessage?: (message: Message) => void;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

export function useChat({ roomId, userId, username, onNewMessage }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [pendingCount, setPendingCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);
  const messageQueueRef = useRef<string[]>([]);
  const isSendingRef = useRef(false);

  const fetchMessages = useCallback(async () => {
    if (!roomId) return;
    setIsLoading(true);
    setError(null);
    try {
      const msgs = await api.getMessages(roomId);
      setMessages(msgs.reverse());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  const connect = useCallback(() => {
    if (isUnmountedRef.current || !roomId) return;
    if (typeof window === 'undefined') return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws?room_id=${roomId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Chat WebSocket connected');
      setConnectionState('connected');
      reconnectAttemptsRef.current = 0;
      flushMessageQueue();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'chat-message': {
            const payload = typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;
            const newMessage: Message = {
              id: payload.id,
              room_id: payload.room_id,
              user_id: payload.user_id,
              username: payload.username,
              type: payload.type,
              content: payload.content,
              is_edited: payload.is_edited || false,
              is_deleted: payload.is_deleted || false,
              created_at: payload.created_at,
              updated_at: payload.updated_at,
            };
            if (newMessage.user_id !== userId) {
              setMessages((prev) => [...prev, newMessage]);
              onNewMessage?.(newMessage);
            }
            break;
          }
          case 'message-updated': {
            const payload = typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === payload.id
                  ? { ...msg, ...payload, is_edited: true }
                  : msg
              )
            );
            break;
          }
          case 'message-deleted': {
            const payload = typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === payload.id
                  ? { ...msg, is_deleted: true, content: '' }
                  : msg
              )
            );
            break;
          }
          case 'user-typing':
            if (data.user_id !== userId) {
              handleTyping(data);
            }
            break;
          case 'user-stopped-typing':
            setTypingUsers((prev) => prev.filter((u) => u.user_id !== data.user_id));
            break;
          case 'reaction-added':
          case 'reaction-removed':
            break;
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('Chat WebSocket error:', error);
      setError('WebSocket connection error');
    };

    ws.onclose = (event) => {
      console.log('Chat WebSocket disconnected', event.code, event.reason);
      setConnectionState('disconnected');
      
      if (!isUnmountedRef.current && !event.wasClean && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(
          INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current),
          MAX_RECONNECT_DELAY
        );
        console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1})`);
        setConnectionState('reconnecting');
        reconnectAttemptsRef.current++;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      }
    };

    wsRef.current = ws;
  }, [roomId, userId, onNewMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }
    setConnectionState('disconnected');
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !roomId) return;
    
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      messageQueueRef.current.push(content.trim());
      setPendingCount(messageQueueRef.current.length);
      return;
    }
    
    try {
      const message = await api.sendMessage(roomId, content.trim());
      setMessages((prev) => [...prev, message]);
      onNewMessage?.(message);
      stopTyping();
    } catch (err) {
      messageQueueRef.current.push(content.trim());
      setPendingCount(messageQueueRef.current.length);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  }, [roomId, onNewMessage]);

  const flushMessageQueue = useCallback(async () => {
    if (isSendingRef.current || messageQueueRef.current.length === 0) return;
    if (wsRef.current?.readyState !== WebSocket.OPEN || !roomId) return;
    
    isSendingRef.current = true;
    const queue = [...messageQueueRef.current];
    messageQueueRef.current = [];
    setPendingCount(0);
    
    for (const content of queue) {
      try {
        const message = await api.sendMessage(roomId, content);
        setMessages((prev) => [...prev, message]);
        onNewMessage?.(message);
      } catch (err) {
        messageQueueRef.current.push(content);
        setPendingCount(messageQueueRef.current.length);
        setError(err instanceof Error ? err.message : 'Failed to send queued message');
        break;
      }
    }
    
    isSendingRef.current = false;
  }, [roomId, onNewMessage]);

  const updateMessage = useCallback(async (messageId: string, content: string) => {
    try {
      const updated = await api.updateMessage(messageId, content);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? updated : msg))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update message');
    }
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await api.deleteMessage(messageId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, is_deleted: true, content: '' } : msg
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
    }
  }, []);

  const sendTyping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing', room_id: roomId }));
    }
  }, [roomId]);

  const stopTyping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stop-typing', room_id: roomId }));
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    setTypingUsers((prev) => prev.filter((u) => u.user_id !== userId));
  }, [roomId, userId]);

  const handleTyping = useCallback((data: TypingData) => {
    const typingUser: TypingUser = {
      user_id: data.user_id,
      username: data.username || 'Someone',
    };
    
    setTypingUsers((prev) => {
      if (prev.some((u) => u.user_id === typingUser.user_id)) {
        return prev;
      }
      return [...prev, typingUser];
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setTypingUsers((prev) => prev.filter((u) => u.user_id !== data.user_id));
    }, 3000);
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!roomId) return;

    isUnmountedRef.current = false;
    reconnectAttemptsRef.current = 0;
    setConnectionState('connecting');
    connect();

    return () => {
      isUnmountedRef.current = true;
      disconnect();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [roomId, connect, disconnect]);

  return {
    messages,
    isLoading,
    error,
    typingUsers,
    connectionState,
    pendingCount,
    sendMessage,
    updateMessage,
    deleteMessage,
    sendTyping,
    stopTyping,
    fetchMessages,
    reconnect: connect,
  };
}
