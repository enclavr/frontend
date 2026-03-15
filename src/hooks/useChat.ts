 'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { chatApi } from '@/lib/api';
import type { Message, TypingUser, TypingData, ReadReceipt, ThreadReply, BlockedUser } from '@/types';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface UseChatOptions {
  roomId: string;
  userId: string;
  username: string;
  onNewMessage?: (message: Message) => void;
  onMessageRead?: (messageId: string, userId: string) => void;
}

const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 60000;
const HEARTBEAT_INTERVAL = 30000;
const MESSAGE_VALIDATION_MAX_LENGTH = 4000;
const RECONNECT_JITTER_FACTOR = 0.3;
const MAX_MESSAGE_SIZE = 512 * 1024;
const CONNECTION_TIMEOUT = 10000;
const MAX_QUEUED_MESSAGES = 50;
const BACKOFF_BASE = 2;
const MAX_BACKOFF_DELAY = 30000;
const MIN_RECONNECT_INTERVAL = 500;
const MESSAGE_QUEUE_KEY = 'enclavr_message_queue';
const MAX_PERSISTED_MESSAGES = 100;

interface WebSocketMessage {
  type: string;
  room_id?: string;
  user_id?: string;
  username?: string;
  payload?: unknown;
  timestamp?: string;
}

function isValidWebSocketMessage(data: unknown): data is WebSocketMessage {
  if (!data || typeof data !== 'object') return false;
  const msg = data as Record<string, unknown>;
  if (typeof msg.type !== 'string') return false;
  if (msg.type.length > 50) return false;
  return true;
}

function sanitizePayload(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') return payload;
  const obj = payload as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = value.split('').filter(c => {
        const code = c.charCodeAt(0);
        return code >= 32 && code !== 127;
      }).join('').slice(0, 10000);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function generateJitter(delay: number, factor: number): number {
  const jitter = delay * factor * Math.random();
  return Math.floor(delay + jitter);
}

function persistMessageQueue(roomId: string, messages: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `${MESSAGE_QUEUE_KEY}_${roomId}`;
    localStorage.setItem(key, JSON.stringify(messages.slice(0, MAX_PERSISTED_MESSAGES)));
  } catch (err) {
    console.error('Failed to persist message queue:', err);
  }
}

function loadPersistedMessages(roomId: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = `${MESSAGE_QUEUE_KEY}_${roomId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error('Failed to load persisted messages:', err);
    return [];
  }
}

function clearPersistedMessages(roomId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `${MESSAGE_QUEUE_KEY}_${roomId}`;
    localStorage.removeItem(key);
  } catch (err) {
    console.error('Failed to clear persisted messages:', err);
  }
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
  if (content.includes('\x00')) {
    return 'Message contains invalid characters';
  }
  return null;
}

function sanitizeMessageContent(content: string): string {
  return content.split('').filter(c => {
    const code = c.charCodeAt(0);
    return code >= 32 && code !== 127;
  }).join('').replace(/[\u202E\u202D]/g, '').slice(0, MESSAGE_VALIDATION_MAX_LENGTH);
}

function detectSpamPattern(content: string): boolean {
  const spamPatterns = [
    /(.)\1{10,}/,
    /http[s]?:\/\/\S+\s+http[s]?:\/\/\S+/i,
    /(.{1,3})\1{5,}/i,
  ];
  return spamPatterns.some(pattern => pattern.test(content));
}

function validateMessageStructure(data: unknown): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid message structure' };
  }
  
  const msg = data as Record<string, unknown>;
  
  if (msg.type === 'chat-message' || msg.type === 'message-updated') {
    const payload = msg.payload;
    if (!payload || typeof payload !== 'object') {
      return { valid: false, error: 'Invalid message payload' };
    }
  }
  
  return { valid: true };
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
  const [connectionLatency, setConnectionLatency] = useState<number | null>(null);
  
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
  const lastHeartbeatRef = useRef<number>(0);
  const blockedUsersRef = useRef<BlockedUser[]>([]);
  const reconnectStateRef = useRef<{
    isReconnecting: boolean;
    lastDisconnectTime: number;
    consecutiveFailures: number;
    lastAttemptTime: number;
    exponentialBackoff: number;
  }>({
    isReconnecting: false,
    lastDisconnectTime: 0,
    consecutiveFailures: 0,
    lastAttemptTime: 0,
    exponentialBackoff: INITIAL_RECONNECT_DELAY,
  });
  const connectionStartTimeRef = useRef<number>(0);
  const messageSequenceRef = useRef<number>(0);

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
      blockedUsersRef.current = blocked;
    } catch (err) {
      console.error('Failed to fetch blocked users:', err);
    }
  }, []);

  const sendHeartbeat = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      lastHeartbeatRef.current = Date.now();
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

    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/chatApi/ws?room_id=${roomId}`;
    const ws = new WebSocket(wsUrl);
    const currentReconnectState = reconnectStateRef.current;
    const isReconnectAttempt = currentReconnectState.lastDisconnectTime > 0;

    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      setConnectionState('connected');
      reconnectAttemptsRef.current = 0;
      connectionStartTimeRef.current = Date.now();
      reconnectStateRef.current = {
        isReconnecting: false,
        lastDisconnectTime: 0,
        consecutiveFailures: 0,
        lastAttemptTime: 0,
        exponentialBackoff: INITIAL_RECONNECT_DELAY,
      };
      startHeartbeat();
      flushMessageQueue();
      sendReadReceipt(lastMessageIdRef.current);
      
      if (isReconnectAttempt) {
        wsRef.current?.send(JSON.stringify({ type: 'client-reconnect', room_id: roomId }));
        const persisted = loadPersistedMessages(roomId);
        if (persisted.length > 0) {
          messageQueueRef.current = persisted;
          setPendingCount(persisted.length);
        }
      }
    };

    ws.onmessage = (event) => {
      messageSequenceRef.current += 1;
      const sequenceNum = messageSequenceRef.current;
      
      if (event.data instanceof ArrayBuffer) {
        return;
      }
      
      if (event.data.length > MAX_MESSAGE_SIZE) {
        console.warn('WebSocket message exceeds maximum size, dropping');
        return;
      }
      
      try {
        const data = JSON.parse(event.data);
        
        if (!isValidWebSocketMessage(data)) {
          console.warn('Invalid WebSocket message format, dropping');
          return;
        }
        
        const currentBlockedUsers = blockedUsersRef.current;
        
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
            
            if (currentBlockedUsers.some(b => b.blocked_userId === newMessage.user_id)) {
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
            const messageId = payload.id || payload.message_id;
            const content = payload.content;
            
            if (messageId && content !== undefined) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === messageId
                    ? { ...msg, content, is_edited: true, updated_at: payload.updated_at }
                    : msg
                )
              );
            }
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
            if (data.user_id && data.user_id !== userId && !currentBlockedUsers.some(b => b.blocked_userId === data.user_id)) {
              handleTyping({ user_id: data.user_id, username: data.username });
            }
            break;
          case 'user-stopped-typing':
            if (data.user_id) {
              setTypingUsers((prev) => prev.filter((u) => u.user_id !== data.user_id));
            }
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
            const messageId = payload.message_id || payload.id;
            const readUserId = payload.user_id || payload.userId;
            const readAt = payload.read_at || payload.readAt || new Date().toISOString();
            
            if (readUserId === userId) {
              setLastReadMessageId(messageId);
            }
            
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === messageId
                  ? {
                      ...msg,
                      read_by: [...(msg.read_by || []), { userId: readUserId, readAt, delivered: true }]
                    }
                  : msg
              )
            );
            onMessageRead?.(messageId, readUserId);
            break;
          }
          case 'message-delivered': {
            const payload = typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;
            const messageId = payload.message_id || payload.id;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === messageId
                  ? { ...msg, delivered: true }
                  : msg
              )
            );
            break;
          }
          case 'thread-reply': {
            const payload = typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;
            const parentId = payload.parent_id || payload.parentId;
            
            if (parentId) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === parentId
                    ? { ...msg, thread_count: (msg.thread_count || 0) + 1 }
                    : msg
                )
              );
            }
            break;
          }
          case 'thread-created': {
            const payload = typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;
            const parentId = payload.parent_id || payload.parentId;
            
            if (parentId) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === parentId
                    ? { ...msg, thread_count: (msg.thread_count || 0) + 1 }
                    : msg
                )
              );
            }
            break;
          }
          case 'thread-message': {
            const payload = typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;
            const parentId = payload.parent_id || payload.parentId;
            
            if (parentId) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === parentId
                    ? { ...msg, thread_count: (msg.thread_count || 0) + 1 }
                    : msg
                )
              );
            }
            break;
          }
          case 'thread-message-updated': {
            const payload = typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;
            break;
          }
          case 'thread-message-deleted': {
            const payload = typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;
            break;
          }
          case 'user-blocked': {
            const payload = typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;
            const blockedUserId = payload.blocked_user_id || payload.targetUserId || payload.blockedUserId;
            
            if (blockedUserId) {
              setBlockedUsers((prev) => [...prev, { blocked_userId: blockedUserId, blockedAt: new Date().toISOString() }]);
              blockedUsersRef.current = [...blockedUsersRef.current, { blocked_userId: blockedUserId, blockedAt: new Date().toISOString() }];
              setMessages((prev) => prev.filter((msg) => msg.user_id !== blockedUserId));
            } else {
              fetchBlockedUsers();
            }
            break;
          }
          case 'user-unblocked': {
            const payload = typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;
            const unblockedUserId = payload.unblocked_user_id || payload.targetUserId || payload.unblockedUserId;
            
            if (unblockedUserId) {
              setBlockedUsers((prev) => prev.filter((u) => u.blocked_userId !== unblockedUserId));
              blockedUsersRef.current = blockedUsersRef.current.filter((u) => u.blocked_userId !== unblockedUserId);
            } else {
              fetchBlockedUsers();
            }
            break;
          }
          case 'pong':
          case 'heartbeat-ack': {
            const latency = Date.now() - lastHeartbeatRef.current;
            if (latency > 0 && latency < 60000) {
              setConnectionLatency(latency);
              reconnectStateRef.current.consecutiveFailures = 0;
            }
            break;
          }
          case 'connection-health': {
            const payload = typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;
            if (payload?.latency_ms) {
              setConnectionLatency(payload.latency_ms);
            }
            break;
          }
          case 'online-users-list':
          case 'room-state':
          case 'room-users-detailed':
          case 'typing-users-list':
            break;
          case 'user-joined':
          case 'user-left':
          case 'user-online':
          case 'user-away':
            break;
          case 'user-speaking':
          case 'user-stopped-speaking':
          case 'user-screen-share-start':
          case 'user-screen-share-stop':
          case 'user-muted':
          case 'user-unmuted':
          case 'user-deafened':
          case 'user-undeafened':
            break;
          case 'room-notifications':
          case 'room-notifications-updated':
            break;
          case 'error': {
            const payload = typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;
            if (payload?.message) {
              setError(payload.message);
            }
            break;
          }
          case 'reconnect-ack': {
            setConnectionState('connected');
            reconnectAttemptsRef.current = 0;
            console.log('Reconnection acknowledged by server');
            break;
          }
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('Chat WebSocket error:', error);
      setError('WebSocket connection error');
      reconnectStateRef.current.consecutiveFailures += 1;
    };

    ws.onclose = (event) => {
      const now = Date.now();
      setConnectionState('disconnected');
      stopHeartbeat();
      reconnectStateRef.current.lastDisconnectTime = now;
      
      if (!isUnmountedRef.current && !event.wasClean) {
        const currentBackoff = Math.min(
          reconnectStateRef.current.exponentialBackoff * BACKOFF_BASE,
          MAX_BACKOFF_DELAY
        );
        
        const delay = Math.max(
          generateJitter(currentBackoff, RECONNECT_JITTER_FACTOR),
          MIN_RECONNECT_INTERVAL
        );
        
        const timeSinceLastReconnect = now - reconnectStateRef.current.lastAttemptTime;
        const shouldReconnect = reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS && 
                               timeSinceLastReconnect > MIN_RECONNECT_INTERVAL;
        
        if (shouldReconnect) {
          setConnectionState('reconnecting');
          reconnectAttemptsRef.current++;
          reconnectStateRef.current.lastAttemptTime = now;
          reconnectStateRef.current.exponentialBackoff = currentBackoff;
          reconnectStateRef.current.consecutiveFailures += 1;
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          setError('Connection failed after multiple attempts. Please refresh the page.');
        }
      } else {
        reconnectAttemptsRef.current = 0;
        reconnectStateRef.current.exponentialBackoff = INITIAL_RECONNECT_DELAY;
      }
    };

    wsRef.current = ws;
  }, [roomId, userId, onNewMessage, onMessageRead, startHeartbeat, stopHeartbeat, fetchBlockedUsers]);

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
    
    if (detectSpamPattern(content)) {
      setError('Message flagged as potential spam');
      return null;
    }
    
    if (messageQueueRef.current.length >= MAX_QUEUED_MESSAGES) {
      setError('Message queue full. Please try again later.');
      return null;
    }
    
    if (!roomId) return null;
    
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const sanitizedContent = sanitizeMessageContent(content.trim());
    const optimisticMessage: Message = {
      id: tempId,
      room_id: roomId,
      user_id: userId,
      username,
      type: 'text',
      content: sanitizedContent,
      is_edited: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      parent_id: parentId || null,
      delivered: false,
    };
    
    setMessages((prev) => [...prev, optimisticMessage]);
    pendingMessagesRef.current.set(tempId, optimisticMessage);
    
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      messageQueueRef.current.push(JSON.stringify({ content: sanitizedContent, parentId }));
      setPendingCount(messageQueueRef.current.length);
      persistMessageQueue(roomId, messageQueueRef.current);
      return optimisticMessage;
    }
    
    try {
      const message = await chatApi.sendMessage(roomId, sanitizedContent, 'text', parentId);
      setMessages((prev) => prev.map((msg) => msg.id === tempId ? { ...message, delivered: true } : msg));
      pendingMessagesRef.current.delete(tempId);
      onNewMessage?.(message);
      stopTyping();
      return message;
    } catch (err) {
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      pendingMessagesRef.current.delete(tempId);
      messageQueueRef.current.push(JSON.stringify({ content: sanitizedContent, parentId }));
      setPendingCount(messageQueueRef.current.length);
      persistMessageQueue(roomId, messageQueueRef.current);
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
    clearPersistedMessages(roomId);
    
    for (const item of queue) {
      try {
        const { content, parentId } = JSON.parse(item);
        const sanitizedContent = sanitizeMessageContent(content);
        if (!sanitizedContent) continue;
        
        const message = await chatApi.sendMessage(roomId, sanitizedContent, 'text', parentId);
        setMessages((prev) => [...prev, { ...message, delivered: true }]);
        onNewMessage?.(message);
      } catch (err) {
        messageQueueRef.current.push(item);
        setPendingCount(messageQueueRef.current.length);
        persistMessageQueue(roomId, messageQueueRef.current);
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

  const blockUser = useCallback(async (blockedUserId: string, reason?: string) => {
    try {
      await chatApi.blockUser(blockedUserId, reason);
      setBlockedUsers((prev) => [...prev, { blocked_userId: blockedUserId, blockedAt: new Date().toISOString(), reason }]);
      blockedUsersRef.current = [...blockedUsersRef.current, { blocked_userId: blockedUserId, blockedAt: new Date().toISOString(), reason }];
      setMessages((prev) => prev.filter((msg) => msg.user_id !== blockedUserId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to block user');
    }
  }, []);

  const unblockUser = useCallback(async (blockedUserId: string) => {
    try {
      await chatApi.unblockUser(blockedUserId);
      setBlockedUsers((prev) => prev.filter((u) => u.blocked_userId !== blockedUserId));
      blockedUsersRef.current = blockedUsersRef.current.filter((u) => u.blocked_userId !== blockedUserId);
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
    connectionLatency,
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
