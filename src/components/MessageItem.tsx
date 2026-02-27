'use client';

import { memo, useState } from 'react';
import type { Message, ReactionWithCount } from '@/types';
import ReactMarkdown from 'react-markdown';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
  showReactionPicker: boolean;
  setShowReactionPicker: (show: boolean) => void;
  reactions: ReactionWithCount[];
  formatTime: (dateString: string) => string;
  formatEditTime: (dateString?: string) => string;
}

const COMMON_EMOJIS = ['👍', '👎', '❤️', '😂', '😮', '😢', '🎉', '🔥'];

export const MessageItem = memo(function MessageItem({
  message,
  isOwn,
  onEdit,
  onDelete,
  onPin,
  onAddReaction,
  onRemoveReaction,
  showReactionPicker,
  setShowReactionPicker,
  reactions,
  formatTime,
  formatEditTime,
}: MessageItemProps) {
  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
      <div className="flex items-end gap-2 max-w-[80%]">
        {!isOwn && (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {message.username.charAt(0).toUpperCase()}
          </div>
        )}
        <div
          className={`px-3 py-2 rounded-lg ${
            isOwn
              ? 'bg-blue-600 text-white'
              : message.type === 'system'
              ? 'bg-yellow-600/50 text-yellow-200'
              : 'bg-gray-700 text-white'
          } ${message.is_deleted ? 'opacity-50' : ''}`}
        >
          {!isOwn && message.type !== 'system' && !message.is_deleted && (
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
                {isOwn && !message.is_deleted && (
                  <div className="flex gap-2">
                    <button
                      onClick={onPin}
                      className="text-xs text-gray-400 hover:text-yellow-300"
                      title="Pin message"
                    >
                      📌
                    </button>
                    <button
                      onClick={onEdit}
                      className="text-xs text-gray-400 hover:text-gray-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={onDelete}
                      className="text-xs text-gray-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                )}
                {!message.is_deleted && (
                  <div className="relative">
                    <button
                      onClick={() => setShowReactionPicker(!showReactionPicker)}
                      className="text-xs text-gray-400 hover:text-blue-300"
                      title="Add reaction"
                    >
                      😊
                    </button>
                    {showReactionPicker && (
                      <div className="absolute bottom-full mb-1 left-0 bg-gray-700 rounded-lg p-2 shadow-lg flex gap-1 z-10">
                        {COMMON_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => onAddReaction(emoji)}
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
              {reactions && reactions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {reactions.map((reaction) => (
                    <button
                      key={reaction.emoji}
                      onClick={() => reaction.has_reacted ? onRemoveReaction(reaction.emoji) : onAddReaction(reaction.emoji)}
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
      </div>
    </div>
  );
});
