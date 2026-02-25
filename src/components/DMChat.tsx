'use client';

import { useEffect, useRef, useState } from 'react';
import { useDM } from '@/hooks/useDM';
import type { DirectMessage } from '@/types';

interface DMChatProps {
  userId: string;
  otherUserId: string;
  otherUsername: string;
}

export function DMChat({ userId, otherUserId, otherUsername }: DMChatProps) {
  const { messages, isLoading, error, sendMessage, updateMessage, deleteMessage } = useDM({
    userId,
    otherUserId,
  });
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendMessage(otherUserId, inputValue);
      setInputValue('');
    }
  };

  const handleEdit = (message: DirectMessage) => {
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatEditTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `edited at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg overflow-hidden">
      <div className="p-4 bg-gray-700 border-b border-gray-600">
        <h3 className="text-white font-semibold">DM: {otherUsername}</h3>
      </div>

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
            <div className="text-gray-400">No messages yet. Say hi!</div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender_id === userId ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    msg.sender_id === userId
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-100'
                  } ${msg.is_deleted ? 'opacity-50 italic' : ''}`}
                >
                  {msg.is_deleted ? (
                    <span className="text-gray-400 italic">Message deleted</span>
                  ) : editingId === msg.id ? (
                    <div>
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="bg-gray-600 text-white px-2 py-1 rounded w-full"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleSaveEdit(msg.id)}
                          className="text-green-400 text-sm hover:underline"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-gray-400 text-sm hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">
                          {formatTime(msg.created_at)}
                          {msg.is_edited && formatEditTime(msg.updated_at)}
                        </span>
                        {msg.sender_id === userId && !msg.is_deleted && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(msg)}
                              className="text-xs text-gray-400 hover:text-gray-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(msg.id)}
                              className="text-xs text-gray-400 hover:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
