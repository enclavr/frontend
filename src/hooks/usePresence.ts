'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Presence } from '@/types';

interface UsePresenceOptions {
  roomId: string;
  userId: string;
  username: string;
  isConnected?: boolean;
}

export function usePresence({ roomId, userId, username, isConnected }: UsePresenceOptions) {
  const [presences, setPresences] = useState<Presence[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchPresence = useCallback(async () => {
    if (!roomId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getRoomPresence(roomId);
      setPresences(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch presence');
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  const updatePresence = useCallback(async (status: Presence['status']) => {
    try {
      await api.updatePresence(status, roomId || undefined);
    } catch (err) {
      console.error('Failed to update presence:', err);
    }
  }, [roomId]);

  useEffect(() => {
    fetchPresence();
  }, [fetchPresence]);

  useEffect(() => {
    if (!roomId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws?room_id=${roomId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
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
    };

    ws.onclose = () => {
      updatePresence('offline');
    };

    wsRef.current = ws;

    return () => {
      updatePresence('offline');
      ws.close();
    };
  }, [roomId, updatePresence, fetchPresence]);

  useEffect(() => {
    if (isConnected !== undefined) {
      updatePresence(isConnected ? 'online' : 'away');
    }
  }, [isConnected, updatePresence]);

  return {
    presences,
    isLoading,
    error,
    updatePresence,
    fetchPresence,
  };
}
