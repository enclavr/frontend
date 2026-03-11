'use client';

import { useState, useEffect, useRef } from 'react';
import { chatApi } from '@/lib/api/chat';
import type { SearchResult } from '@/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMessage?: (messageId: string, roomId: string) => void;
}

export function SearchModal({ isOpen, onClose, onSelectMessage }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsLoading(true);
        setError('');
        try {
          const searchResults = await chatApi.searchMessages(query, 50);
          setResults(searchResults);
        } catch (err) {
          setError('Failed to search messages');
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    if (onSelectMessage && result.id && result.room_id) {
      onSelectMessage(result.id, result.room_id);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-20" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-lg w-[600px] max-h-[70vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search messages..."
              className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-lg"
            />
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(70vh-80px)]">
          {isLoading && (
            <div className="p-4 text-center text-gray-400">
              <svg className="animate-spin h-5 w-5 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Searching...
            </div>
          )}

          {error && (
            <div className="p-4 text-center text-red-400">
              {error}
            </div>
          )}

          {!isLoading && !error && query.trim().length >= 2 && results.length === 0 && (
            <div className="p-4 text-center text-gray-400">
              No messages found
            </div>
          )}

          {!isLoading && query.trim().length < 2 && results.length === 0 && (
            <div className="p-4 text-center text-gray-400">
              Type at least 2 characters to search
            </div>
          )}

          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              className="w-full p-4 hover:bg-gray-700/50 text-left transition-colors border-b border-gray-700/50"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm flex-shrink-0">
                  {(result.username || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white">{result.username || 'Unknown'}</span>
                    {result.room_name && (
                      <span className="text-xs text-gray-500">in #{result.room_name}</span>
                    )}
                  </div>
                  <p className="text-gray-300 text-sm truncate">
                    {result.content}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(result.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
