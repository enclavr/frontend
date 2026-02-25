import { useState } from 'react';
import { SearchResult } from '@/types';

interface SearchModalProps {
  searchResults: SearchResult[];
  isSearching: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
}

export function SearchModal({ searchResults, isSearching, onClose, onSearch }: SearchModalProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg w-[600px] max-h-[80vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-white mb-4">Search Messages</h3>

        <form onSubmit={handleSubmit} className="mb-4">
          <input
            type="text"
            placeholder="Search messages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded"
            autoFocus
          />
        </form>

        {isSearching && <p className="text-gray-400 text-center">Searching...</p>}

        <div className="space-y-2">
          {searchResults.map((result) => (
            <div key={result.id} className="p-3 bg-gray-700 rounded">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-blue-400 font-medium">{result.username}</span>
                <span className="text-gray-500 text-xs">
                  {result.room_name && `#${result.room_name}`}
                </span>
              </div>
              <p className="text-white text-sm">{result.content}</p>
            </div>
          ))}
        </div>

        {searchResults.length === 0 && !isSearching && query && (
          <p className="text-gray-500 text-center">No results found</p>
        )}

        <button onClick={onClose} className="mt-6 w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded">
          Close
        </button>
      </div>
    </div>
  );
}
