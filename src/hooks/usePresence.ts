'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Presence } from '@/types';

const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

export type PresenceConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

interface UsePresenceOptions {
  roomId: string;
  userId: string;
  isConnected?: boolean;
}

export function usePresence({ roomId, userId, isConnected }: UsePresenceOptions) {
  const [presences, setPresences] = useState<Presence[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<PresenceConnectionState>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);
  const roomIdRef = useRef(roomId);

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  const fetchPresence = useCallback(async () => {
    if (!roomIdRef.current) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getRoomPresence(roomIdRef.current);
      setPresences(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch presence');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updatePresence = useCallback(async (status: Presence['status']) => {
    try {
      await api.updatePresence(status, roomIdRef.current || undefined);
    } catch (err) {
      console.error('Failed to update presence:', err);
    }
  }, []);

  const connect = useCallback(() => {
    if (isUnmountedRef.current || !roomIdRef.current) return;
    if (typeof window === 'undefined') return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws?room_id=${roomIdRef.current}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnectionState('connected');
      reconnectAttemptsRef.current = 0;
      updatePresence('online');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'presence-update') {
          fetchPresence();
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('Presence WebSocket error:', error);
      setError('WebSocket connection error');
    };

    ws.onclose = (event) => {
      setConnectionState('disconnected');
      updatePresence('offline');

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
    setConnectionState('connecting');
  }, [updatePresence, fetchPresence]);

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

  useEffect(() => {
    fetchPresence();
  }, [fetchPresence]);

  useEffect(() => {
    if (!roomId) return;

    isUnmountedRef.current = false;
    reconnectAttemptsRef.current = 0;
    setConnectionState('connecting');
    connect();

    return () => {
      isUnmountedRef.current = true;
      disconnect();
    };
  }, [roomId, connect, disconnect]);

  useEffect(() => {
    if (isConnected !== undefined) {
      updatePresence(isConnected ? 'online' : 'away');
    }
  }, [isConnected, updatePresence]);

  return {
    presences,
    isLoading,
    error,
    connectionState,
    updatePresence,
    fetchPresence,
    reconnect: connect,
  };
}
