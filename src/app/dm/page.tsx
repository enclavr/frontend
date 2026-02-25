'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { DMChat } from '@/components/DMChat';
import { api } from '@/lib/api';
import type { Conversation } from '@/types';

export default function DMPage() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showNewDM, setShowNewDM] = useState(false);
  const [newDMUsername, setNewDMUsername] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchConversations();
  }, [isAuthenticated, router]);

  const fetchConversations = async () => {
    try {
      const data = await api.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  };

  const handleStartDM = async () => {
    if (!newDMUsername.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/users/search?username=${encodeURIComponent(newDMUsername)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );
      if (response.ok) {
        const users = await response.json();
        setSearchResults(users);
      }
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUser(userId);
    setShowNewDM(false);
    setSearchResults([]);
    setNewDMUsername('');
  };

  if (!user) return null;

  const selectedConversation = conversations.find(c => c.user_id === selectedUser);

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">Enclavr</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/rooms')}
              className="text-blue-400 hover:text-blue-300"
            >
              Rooms
            </button>
            <span className="text-gray-300">{user.username}</span>
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="text-red-400 hover:text-red-300"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Direct Messages</h2>
          <button
            onClick={() => setShowNewDM(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            New DM
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">Conversations</h3>
              {conversations.length === 0 ? (
                <p className="text-gray-400 text-sm">No conversations yet</p>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.user_id}
                      onClick={() => setSelectedUser(conv.user_id)}
                      className={`w-full text-left p-3 rounded-lg ${
                        selectedUser === conv.user_id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-100 hover:bg-gray-600'
                      }`}
                    >
                      <div className="font-medium">{conv.display_name || conv.username}</div>
                      <div className="text-sm text-gray-400 truncate">{conv.last_message}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-3">
            {selectedUser ? (
              <DMChat
                userId={user.id}
                otherUserId={selectedUser}
                otherUsername={selectedConversation?.display_name || selectedConversation?.username || 'User'}
              />
            ) : (
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                <p className="text-gray-400">Select a conversation or start a new DM</p>
              </div>
            )}
          </div>
        </div>

        {showNewDM && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded-lg w-96">
              <h3 className="text-xl font-bold text-white mb-4">New Direct Message</h3>
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-bold mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={newDMUsername}
                  onChange={(e) => setNewDMUsername(e.target.value)}
                  placeholder="Enter username..."
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded"
                />
              </div>
              <button
                onClick={handleStartDM}
                disabled={isSearching || !newDMUsername.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded mb-4"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelectUser(result.id)}
                      className="w-full text-left p-3 bg-gray-700 text-white rounded hover:bg-gray-600"
                    >
                      {result.display_name || result.username}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => {
                  setShowNewDM(false);
                  setNewDMUsername('');
                  setSearchResults([]);
                }}
                className="w-full mt-4 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
