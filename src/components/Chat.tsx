'use client';

import { useEffect, useRef, useState } from 'react';
import { useChat } from '@/hooks/useChat';
import type { Message, ReactionWithCount } from '@/types';
import ReactMarkdown from 'react-markdown';

interface ChatProps {
  roomId: string;
  userId: string;
  username: string;
}

const COMMON_EMOJIS = ['👍', '👎', '❤️', '😂', '😮', '😢', '🎉', '🔥'];

export function Chat({ roomId, userId, username }: ChatProps) {
  const { messages, isLoading, error, typingUsers, sendMessage, updateMessage, deleteMessage, sendTyping } = useChat({
    roomId,
    userId,
    username,
  });
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showPinned, setShowPinned] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<any[]>([]);
  const [messageReactions, setMessageReactions] = useState<Record<string, ReactionWithCount[]>>({});
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  useEffect(() => {
    const fetchPinnedMessages = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`/api/pinnedmessages?room_id=${roomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPinnedMessages(data);
        }
      } catch (err) {
        console.error('Failed to fetch pinned messages:', err);
      }
    };
    fetchPinnedMessages();
  }, [roomId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    sendTyping();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleEdit = (message: Message) => {
    setEditingId(message.id);
    setEditContent(message.content);
  };

  const handleSaveEdit = (messageId: string) => {
    if (editContent.trim()) {
      updateMessage(messageId, editContent.trim());
    }
    setEditingId(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleDelete = (messageId: string) => {
    if (confirm('Are you sure you want to delete this message?')) {
      deleteMessage(messageId);
    }
  };

  const handlePin = async (messageId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/pinnedmessage/pin?room_id=${roomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message_id: messageId }),
      });
      if (res.ok) {
        const pinned = await res.json();
        setPinnedMessages([pinned, ...pinnedMessages]);
      }
    } catch (err) {
      console.error('Failed to pin message:', err);
    }
  };

  const handleUnpin = async (pinId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/pinnedmessage/unpin?pin_id=${pinId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPinnedMessages(pinnedMessages.filter((pm) => pm.id !== pinId));
      }
    } catch (err) {
      console.error('Failed to unpin message:', err);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatEditTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `edited at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const fetchReactions = async (messageId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/reactions?message_id=${messageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: ReactionWithCount[] = await res.json();
        setMessageReactions((prev) => ({ ...prev, [messageId]: data }));
      }
    } catch (err) {
      console.error('Failed to fetch reactions:', err);
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/reaction/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message_id: messageId, emoji }),
      });
      if (res.ok) {
        await fetchReactions(messageId);
      }
    } catch (err) {
      console.error('Failed to add reaction:', err);
    }
    setShowReactionPicker(null);
  };

  const handleRemoveReaction = async (messageId: string, emoji: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/reaction/remove?message_id=${messageId}&emoji=${encodeURIComponent(emoji)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchReactions(messageId);
      }
    } catch (err) {
      console.error('Failed to remove reaction:', err);
    }
  };

  useEffect(() => {
    messages.forEach((msg) => {
      if (!messageReactions[msg.id]) {
        fetchReactions(msg.id);
      }
    });
  }, [messages]);

  const getTypingText = () => {
    if (typingUsers.length === 0) return '';
    if (typingUsers.length === 1) return `${typingUsers[0].username} is typing...`;
    if (typingUsers.length === 2) return `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`;
    return `${typingUsers.length} users are typing...`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg overflow-hidden">
      <div className="p-4 bg-gray-700 border-b border-gray-600 flex justify-between items-center">
        <h3 className="text-white font-semibold">Text Chat</h3>
        {pinnedMessages.length > 0 && (
          <button
            onClick={() => setShowPinned(!showPinned)}
            className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
          >
            📌 {pinnedMessages.length} pinned
          </button>
        )}
      </div>

      {showPinned && pinnedMessages.length > 0 && (
        <div className="p-3 bg-gray-900/50 border-b border-gray-600 max-h-32 overflow-y-auto">
          <p className="text-xs text-gray-400 mb-2">Pinned Messages</p>
          <div className="space-y-2">
            {pinnedMessages.map((pm) => (
              <div key={pm.id} className="flex items-start gap-2 text-sm">
                <span className="text-yellow-400">📌</span>
                <div className="flex-1">
                  <p className="text-gray-300 line-clamp-1">{pm.content}</p>
                  <p className="text-xs text-gray-500">by {pm.username}</p>
                </div>
                <button
                  onClick={() => handleUnpin(pm.id)}
                  className="text-xs text-gray-500 hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 p-4 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400">Loading messages...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-red-400">{error}</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400">No messages yet. Start the conversation!</div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${message.user_id === userId ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-end gap-2 max-w-[80%]">
                  {message.user_id !== userId && (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {message.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {editingId === message.id ? (
                    <div className="px-3 py-2 rounded-lg bg-gray-600">
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-gray-700 text-white px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleSaveEdit(message.id)}
                          className="text-xs text-green-400 hover:text-green-300"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-xs text-gray-400 hover:text-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`px-3 py-2 rounded-lg ${
                        message.user_id === userId
                          ? 'bg-blue-600 text-white'
                          : message.type === 'system'
                          ? 'bg-yellow-600/50 text-yellow-200'
                          : 'bg-gray-700 text-white'
                      } ${message.is_deleted ? 'opacity-50' : ''}`}
                    >
                      {message.user_id !== userId && message.type !== 'system' && !message.is_deleted && (
                        <p className="text-xs text-blue-300 mb-1">{message.username}</p>
                      )}
                      {message.is_deleted ? (
                        <p className="text-sm text-gray-500 italic">Message deleted</p>
                      ) : (
                        <>
                          <div className="text-sm prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-400">
                              {formatTime(message.created_at)}
                              {message.is_edited && ` (${formatEditTime(message.updated_at)})`}
                            </p>
                            {message.user_id === userId && !message.is_deleted && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handlePin(message.id)}
                                  className="text-xs text-gray-400 hover:text-yellow-300"
                                  title="Pin message"
                                >
                                  📌
                                </button>
                                <button
                                  onClick={() => handleEdit(message)}
                                  className="text-xs text-gray-400 hover:text-gray-300"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(message.id)}
                                  className="text-xs text-gray-400 hover:text-red-300"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                            {message.user_id !== userId && !message.is_deleted && (
                              <button
                                onClick={() => handlePin(message.id)}
                                className="text-xs text-gray-400 hover:text-yellow-300"
                                title="Pin message"
                              >
                                📌
                              </button>
                            )}
                            {!message.is_deleted && (
                              <div className="relative">
                                <button
                                  onClick={() => setShowReactionPicker(showReactionPicker === message.id ? null : message.id)}
                                  className="text-xs text-gray-400 hover:text-blue-300"
                                  title="Add reaction"
                                >
                                  😊
                                </button>
                                {showReactionPicker === message.id && (
                                  <div className="absolute bottom-full mb-1 left-0 bg-gray-700 rounded-lg p-2 shadow-lg flex gap-1 z-10">
                                    {COMMON_EMOJIS.map((emoji) => (
                                      <button
                                        key={emoji}
                                        onClick={() => handleAddReaction(message.id, emoji)}
                                        className="hover:bg-gray-600 p-1 rounded text-lg"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          {messageReactions[message.id] && messageReactions[message.id].length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {messageReactions[message.id].map((reaction) => (
                                <button
                                  key={reaction.emoji}
                                  onClick={() => reaction.has_reacted ? handleRemoveReaction(message.id, reaction.emoji) : handleAddReaction(message.id, reaction.emoji)}
                                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                                    reaction.has_reacted 
                                      ? 'bg-blue-600 text-white' 
                                      : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                                  }`}
                                  title={reaction.users.join(', ')}
                                >
                                  <span>{reaction.emoji}</span>
                                  <span>{reaction.count}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {typingUsers.length > 0 && (
              <div className="text-gray-400 text-sm px-2">
                {getTypingText()}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 bg-gray-700 border-t border-gray-600">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
