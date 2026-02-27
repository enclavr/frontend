'use client';

import { useState, useCallback } from 'react';
import { FileUpload } from './FileUpload';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  typingUsers: Array<{ user_id: string; username: string }>;
  isConnected: boolean;
  roomId?: string;
}

export function ChatInput({ value, onChange, onSubmit, typingUsers, isConnected, roomId }: ChatInputProps) {
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && isConnected) {
      onSubmit(value);
      onChange('');
    }
  }, [value, onChange, onSubmit, isConnected]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  return (
    <div className="border-t border-gray-700 p-4 bg-gray-800">
      {typingUsers.length > 0 && (
        <div className="text-xs text-gray-400 mb-2">
          {typingUsers.map(u => u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsFileUploadOpen(!isFileUploadOpen)}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          title="Upload file"
        >
          📎
        </button>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isConnected ? "Type a message..." : "Connecting..."}
          disabled={!isConnected}
          className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!value.trim() || !isConnected}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 transition-colors"
        >
          Send
        </button>
      </form>
      {isFileUploadOpen && roomId && (
        <div className="mt-2">
          <FileUpload roomId={roomId} />
        </div>
      )}
    </div>
  );
}
