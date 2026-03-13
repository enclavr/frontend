 'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { chatApi } from '@/lib/api';
import type { Message, TypingUser, TypingData, ReadReceipt, ThreadReply, BlockedUser } from '@/types';

const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;
const HEARTBEAT_INTERVAL = 30000;
const MESSAGE_VALIDATION_MAX_LENGTH = 4000;

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface UseChatOptions {
  roomId: string;
  userId: string;
  username: string;
  onNewMessage?: (message: Message) => void;
  onMessageRead?: (messageId: string, userId: string) => void;
}

function validateMessageContent(content: string): string | null {
  if (!content || !content.trim()) {
    return 'Message cannot be empty';
  }
  if (content.length > MESSAGE_VALIDATION_MAX_LENGTH) {
    return `Message exceeds maximum length of ${MESSAGE_VALIDATION_MAX_LENGTH} characters`;
  }
  if (content.trim().length === 0) {
    return 'Message cannot be only whitespace';
  }
  return null;
}

export function useChat({ roomId, userId, username, onNewMessage, onMessageRead }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [pendingCount, setPendingCount] = useState(0);
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);
  const messageQueueRef = useRef<string[]>([]);
  const isSendingRef = useRef(false);
  const pendingMessagesRef = useRef<Map<string, Message>>(new Map());
  const lastMessageIdRef = useRef<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!roomId) return;
    setIsLoading(true);
    setError(null);
    try {
      const msgs = await chatApi.getMessages(roomId);
      setMessages(msgs.reverse());
      if (msgs.length > 0) {
        lastMessageIdRef.current = msgs[msgs.length - 1].id;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  const fetchBlockedUsers = useCallback(async () => {
    try {
      const blocked = await chatApi.getBlockedUsers();
      setBlockedUsers(blocked);
    } catch (err) {
      console.error('Failed to fetch blocked users:', err);
    }
  }, []);

  const sendHeartbeat = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'heartbeat', room_id: roomId }));
    }
  }, [roomId]);

  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }
    heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
  }, [sendHeartbeat]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (isUnmountedRef.current || !roomId) return;
    if (typeof window === 'undefined') return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/chatApi/ws?room_id=${roomId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnectionState('connected');
      reconnectAttemptsRef.current = 0;
      startHeartbeat();
      flushMessageQueue();
      sendReadReceipt(lastMessageIdRef.current);
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
              parent_id: payload.parent_id || null,
              thread_count: payload.thread_count || 0,
            };
            
            if (blockedUsers.some(b => b.blocked_userId === newMessage.user_id)) {
              return;
            }
            
            if (newMessage.user_id !== userId) {
              setMessages((prev) => [...prev, newMessage]);
              lastMessageIdRef.current = newMessage.id;
              onNewMessage?.(newMessage);
            } else {
              pendingMessagesRef.current.delete(newMessage.id);
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
            if (data.user_id !== userId && !blockedUsers.some(b => b.blocked_userId === data.user_id)) {
              handleTyping(data);
            }
            break;
          case 'user-stopped-typing':
            setTypingUsers((prev) => prev.filter((u) => u.user_id !== data.user_id));
            break;
          case 'reaction-added':
          case 'reaction-removed': {
            const payload = typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === payload.message_id
                  ? { ...msg, reactions: payload.reactions }
                  : msg
              )
            );
            break;
          }
          case 'message-read': {
            const payload = typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === payload.message_id
                  ? {
                      ...msg,
                      read_by: [...(msg.read_by || []), { userId: payload.userId, readAt: payload.readAt }]
                    }
                  : msg
              )
            );
            onMessageRead?.(payload.messageId, payload.userId);
            break;
          }
          case 'thread-reply': {
            const payload = typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === payload.parent_id
                  ? { ...msg, thread_count: (msg.thread_count || 0) + 1 }
                  : msg
              )
            );
            break;
          }
          case 'user-blocked':
          case 'user-unblocked':
            fetchBlockedUsers();
            break;
          case 'pong':
          case 'heartbeat-ack':
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
      setConnectionState('disconnected');
      stopHeartbeat();
      
      if (!isUnmountedRef.current && !event.wasClean && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(
          INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current),
          MAX_RECONNECT_DELAY
        );
        setConnectionState('reconnecting');
        reconnectAttemptsRef.current++;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      }
    };

    wsRef.current = ws;
  }, [roomId, userId, onNewMessage, onMessageRead, startHeartbeat, stopHeartbeat, blockedUsers, fetchBlockedUsers]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    stopHeartbeat();
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }
    setConnectionState('disconnected');
  }, [stopHeartbeat]);

  const sendMessage = useCallback(async (content: string, parentId?: string) => {
    const validationError = validateMessageContent(content);
    if (validationError) {
      setError(validationError);
      return null;
    }
    
    if (!roomId) return null;
    
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimisticMessage: Message = {
      id: tempId,
      room_id: roomId,
      user_id: userId,
      username,
      type: 'text',
      content: content.trim(),
      is_edited: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      parent_id: parentId || null,
    };
    
    setMessages((prev) => [...prev, optimisticMessage]);
    pendingMessagesRef.current.set(tempId, optimisticMessage);
    
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      messageQueueRef.current.push(JSON.stringify({ content: content.trim(), parentId }));
      setPendingCount(messageQueueRef.current.length);
      return optimisticMessage;
    }
    
    try {
      const message = await chatApi.sendMessage(roomId, content.trim(), 'text', parentId);
      setMessages((prev) => prev.map((msg) => msg.id === tempId ? message : msg));
      pendingMessagesRef.current.delete(tempId);
      onNewMessage?.(message);
      stopTyping();
      return message;
    } catch (err) {
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      pendingMessagesRef.current.delete(tempId);
      messageQueueRef.current.push(JSON.stringify({ content: content.trim(), parentId }));
      setPendingCount(messageQueueRef.current.length);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return null;
    }
  }, [roomId, userId, username, onNewMessage]);

  const flushMessageQueue = useCallback(async () => {
    if (isSendingRef.current || messageQueueRef.current.length === 0) return;
    if (wsRef.current?.readyState !== WebSocket.OPEN || !roomId) return;
    
    isSendingRef.current = true;
    const queue = [...messageQueueRef.current];
    messageQueueRef.current = [];
    setPendingCount(0);
    
    for (const item of queue) {
      try {
        const { content, parentId } = JSON.parse(item);
        const message = await chatApi.sendMessage(roomId, content, 'text', parentId);
        setMessages((prev) => [...prev, message]);
        onNewMessage?.(message);
      } catch (err) {
        messageQueueRef.current.push(item);
        setPendingCount(messageQueueRef.current.length);
        setError(err instanceof Error ? err.message : 'Failed to send queued message');
        break;
      }
    }
    
    isSendingRef.current = false;
  }, [roomId, onNewMessage]);

  const updateMessage = useCallback(async (messageId: string, content: string) => {
    const validationError = validateMessageContent(content);
    if (validationError) {
      setError(validationError);
      return null;
    }
    
    const originalMessage = messages.find(m => m.id === messageId);
    if (originalMessage) {
      setMessages((prev) =>
        prev.map((msg) => msg.id === messageId ? { ...msg, content, is_edited: true } : msg)
      );
    }
    
    try {
      const updated = await chatApi.updateMessage(messageId, content);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? updated : msg))
      );
      return updated;
    } catch (err) {
      if (originalMessage) {
        setMessages((prev) =>
          prev.map((msg) => msg.id === messageId ? originalMessage : msg)
        );
      }
      setError(err instanceof Error ? err.message : 'Failed to update message');
      return null;
    }
  }, [messages]);

  const deleteMessage = useCallback(async (messageId: string) => {
    const originalMessage = messages.find(m => m.id === messageId);
    if (originalMessage) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, is_deleted: true, content: '' } : msg
        )
      );
    }
    
    try {
      await chatApi.deleteMessage(messageId);
    } catch (err) {
      if (originalMessage) {
        setMessages((prev) =>
          prev.map((msg) => msg.id === messageId ? originalMessage : msg)
        );
      }
      setError(err instanceof Error ? err.message : 'Failed to delete message');
    }
  }, [messages]);

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

  const sendReadReceipt = useCallback(async (messageId: string | null) => {
    if (!messageId || !roomId) return;
    
    setLastReadMessageId(messageId);
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message-read',
        room_id: roomId,
        message_id: messageId,
      }));
    }
    
    try {
      await chatApi.markMessageAsRead(messageId, roomId);
    } catch (err) {
      console.error('Failed to send read receipt:', err);
    }
  }, [roomId]);

  const sendThreadReply = useCallback(async (parentId: string, content: string) => {
    return sendMessage(content, parentId);
  }, [sendMessage]);

  const blockUser = useCallback(async (blockedUserId: string) => {
    try {
      await chatApi.blockUser(blockedUserId);
      setBlockedUsers((prev) => [...prev, { blocked_userId: blockedUserId, blockedAt: new Date().toISOString() }]);
      setMessages((prev) => prev.filter((msg) => msg.user_id !== blockedUserId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to block user');
    }
  }, []);

  const unblockUser = useCallback(async (blockedUserId: string) => {
    try {
      await chatApi.unblockUser(blockedUserId);
      setBlockedUsers((prev) => prev.filter((u) => u.blocked_userId !== blockedUserId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unblock user');
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    fetchBlockedUsers();
  }, [fetchMessages, fetchBlockedUsers]);

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
    lastReadMessageId,
    blockedUsers,
    sendMessage,
    updateMessage,
    deleteMessage,
    sendTyping,
    stopTyping,
    sendReadReceipt,
    sendThreadReply,
    blockUser,
    unblockUser,
    fetchMessages,
    reconnect: connect,
  };
}
