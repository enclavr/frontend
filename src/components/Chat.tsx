'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useChat } from '@/hooks/useChat';
import { api } from '@/lib/api';
import { FileList } from './FileList';
import { MessageItem } from './MessageItem';
import { ChatInput } from './ChatInput';
import type { Message, ReactionWithCount } from '@/types';

interface ChatProps {
  roomId: string;
  userId: string;
  username: string;
}

export function Chat({ roomId, userId, username }: ChatProps) {
  const { messages, isLoading, error, typingUsers, connectionState, sendMessage, updateMessage, deleteMessage, sendTyping, reconnect } = useChat({
    roomId,
    userId,
    username,
  });
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showPinned, setShowPinned] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [messageReactions, setMessageReactions] = useState<Record<string, ReactionWithCount[]>>({});
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const formatTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const formatEditTime = useCallback((dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `edited at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }, []);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => messagesContainerRef.current,
    estimateSize: () => 80,
    overscan: 10,
  });

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers, scrollToBottom]);

  useEffect(() => {
    const fetchPinnedMessages = async () => {
      if (!roomId) return;
      try {
        const pinned = await api.getPinnedMessages(roomId);
        setPinnedMessages(pinned);
      } catch (err) {
        console.error('Failed to fetch pinned messages:', err);
      }
    };
    fetchPinnedMessages();
  }, [roomId]);

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    sendTyping();
  }, [sendTyping]);

  const handleSubmit = useCallback((value: string) => {
    sendMessage(value);
  }, [sendMessage]);

  const handleEdit = useCallback((message: Message) => {
    setEditingId(message.id);
    setEditContent(message.content);
  }, []);

  const handleSaveEdit = useCallback((messageId: string) => {
    if (editContent.trim()) {
      updateMessage(messageId, editContent.trim());
    }
    setEditingId(null);
    setEditContent('');
  }, [editContent, updateMessage]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditContent('');
  }, []);

  const handleDelete = useCallback((messageId: string) => {
    if (confirm('Are you sure you want to delete this message?')) {
      deleteMessage(messageId);
    }
  }, [deleteMessage]);

  const handlePin = useCallback(async (message: Message) => {
    try {
      await api.pinMessage(message.id, roomId);
      setPinnedMessages(prev => [...prev, message]);
    } catch (err) {
      console.error('Failed to pin message:', err);
    }
  }, [roomId]);

  const handleAddReaction = useCallback((messageId: string, emoji: string) => {
    setMessageReactions(prev => {
      const existing = prev[messageId] || [];
      const existingReaction = existing.find(r => r.emoji === emoji);
      if (existingReaction) {
        return {
          ...prev,
          [messageId]: existing.map(r =>
            r.emoji === emoji ? { ...r, count: r.count + 1, has_reacted: true, users: [...r.users, userId] } : r
          ),
        };
      }
      return {
        ...prev,
        [messageId]: [...existing, { emoji, count: 1, has_reacted: true, users: [userId] }],
      };
    });
    setShowReactionPicker(null);
  }, [userId]);

  const handleRemoveReaction = useCallback((messageId: string, emoji: string) => {
    setMessageReactions(prev => {
      const existing = prev[messageId] || [];
      return {
        ...prev,
        [messageId]: existing.map(r =>
          r.emoji === emoji ? { ...r, count: Math.max(0, r.count - 1), has_reacted: false, users: r.users.filter(u => u !== userId) } : r
        ).filter(r => r.count > 0),
      };
    });
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-gray-400">Loading messages...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-900">
        <div className="text-red-400 mb-4">{error}</div>
        <button
          onClick={reconnect}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
        >
          Reconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Chat</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPinned(!showPinned)}
            className={`px-3 py-1 rounded text-sm ${showPinned ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            📌 Pinned ({pinnedMessages.length})
          </button>
        </div>
      </div>

      {showPinned && (
        <div className="border-b border-gray-700 p-4 bg-gray-800 max-h-48 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Pinned Messages</h3>
          {pinnedMessages.length === 0 ? (
            <p className="text-sm text-gray-500">No pinned messages</p>
          ) : (
            <div className="space-y-2">
              {pinnedMessages.map(msg => (
                <div key={msg.id} className="bg-gray-700 rounded p-2">
                  <p className="text-xs text-gray-400">{msg.username}</p>
                  <p className="text-sm text-white">{msg.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4"
        style={{ height: 'calc(100vh - 280px)' }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const message = messages[virtualRow.index];
            const isOwn = message.user_id === userId;
            return (
              <div
                key={message.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                data-index={virtualRow.index}
              >
                {editingId === message.id ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="flex-1 bg-gray-700 text-white rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(message.id)}
                      className="text-green-400 hover:text-green-300 text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="text-gray-400 hover:text-gray-300 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <MessageItem
                    message={message}
                    isOwn={isOwn}
                    onEdit={() => handleEdit(message)}
                    onDelete={() => handleDelete(message.id)}
                    onPin={() => handlePin(message)}
                    onAddReaction={(emoji) => handleAddReaction(message.id, emoji)}
                    onRemoveReaction={(emoji) => handleRemoveReaction(message.id, emoji)}
                    showReactionPicker={showReactionPicker === message.id}
                    setShowReactionPicker={(show) => {
                      setShowReactionPicker(show ? message.id : null);
                    }}
                    reactions={messageReactions[message.id] || []}
                    formatTime={formatTime}
                    formatEditTime={formatEditTime}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        value={inputValue}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        typingUsers={typingUsers}
        isConnected={connectionState === 'connected'}
        roomId={roomId}
      />

      <FileList roomId={roomId} />
    </div>
  );
}
