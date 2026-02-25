'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { Ban } from '@/types';

interface BanListProps {
  roomId: string;
  roomName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function BanList({ roomId, roomName, isOpen, onClose }: BanListProps) {
  const [bans, setBans] = useState<Ban[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && roomId) {
      fetchBans();
    }
  }, [isOpen, roomId]);

  const fetchBans = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.getBans(roomId);
      setBans(response.bans);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnban = async (banId: string) => {
    if (!confirm('Are you sure you want to unban this user?')) return;
    
    try {
      await api.deleteBan(banId);
      fetchBans();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to unban user');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Banned Users</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
        
        <p className="text-gray-300 mb-4">Room: <span className="font-semibold text-white">{roomName}</span></p>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="text-gray-400 text-center py-4">Loading...</div>
          ) : bans.length === 0 ? (
            <div className="text-gray-400 text-center py-4">No banned users</div>
          ) : (
            <div className="space-y-3">
              {bans.map((ban) => (
                <div key={ban.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {ban.user.avatar_url ? (
                          <img src={ban.user.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                        ) : (
                          ban.user.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="text-white font-semibold">
                          {ban.user.display_name || ban.user.username}
                        </div>
                        <div className="text-gray-400 text-sm">@{ban.user.username}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnban(ban.id)}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
                    >
                      Unban
                    </button>
                  </div>
                  {ban.reason && (
                    <div className="mt-2 text-gray-300 text-sm">
                      <span className="text-gray-400">Reason:</span> {ban.reason}
                    </div>
                  )}
                  <div className="mt-2 text-gray-400 text-xs">
                    Banned: {new Date(ban.created_at).toLocaleDateString()}
                    {ban.expires_at && (
                      <> • Expires: {new Date(ban.expires_at).toLocaleDateString()}</>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
