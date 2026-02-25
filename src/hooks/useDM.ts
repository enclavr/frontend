'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type { DirectMessage, Conversation } from '@/types';

interface UseDMOptions {
  userId: string;
  otherUserId?: string;
}

export function useDM({ userId, otherUserId }: UseDMOptions) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.getConversations();
      setConversations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (otherUserId: string) => {
    try {
      setIsLoading(true);
      const data = await api.getDMMessages(otherUserId);
      setMessages(data.reverse());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (receiverId: string, content: string) => {
    try {
      const newMessage = await api.sendDM(receiverId, content);
      setMessages(prev => [...prev, newMessage]);
      fetchConversations();
      return newMessage;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    }
  }, [fetchConversations]);

  const updateMessage = useCallback(async (messageId: string, content: string) => {
    try {
      const updated = await api.updateDM(messageId, content);
      setMessages(prev => prev.map(m => m.id === messageId ? updated : m));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update message');
      throw err;
    }
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await api.deleteDM(messageId);
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, is_deleted: true, content: '[deleted]' } : m
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
      throw err;
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchConversations();
    }
  }, [userId, fetchConversations]);

  useEffect(() => {
    if (otherUserId) {
      fetchMessages(otherUserId);
    }
  }, [otherUserId, fetchMessages]);

  return {
    conversations,
    messages,
    isLoading,
    error,
    sendMessage,
    updateMessage,
    deleteMessage,
    fetchConversations,
    fetchMessages,
  };
}
