'use client';

import { usePresence } from '@/hooks/usePresence';

interface PresenceListProps {
  roomId: string;
  userId: string;
  isVoiceConnected?: boolean;
}

export function PresenceList({ roomId, userId, isVoiceConnected }: PresenceListProps) {
  const { presences, isLoading } = usePresence({
    roomId,
    userId,
    isConnected: isVoiceConnected,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      case 'busy':
        return 'Busy';
      default:
        return 'Offline';
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
      <div className="p-4 bg-gray-700 border-b border-gray-600">
        <h3 className="text-white font-semibold">Online Users ({presences.length})</h3>
      </div>
      <div className="p-4">
        {isLoading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : presences.length === 0 ? (
          <p className="text-gray-400 text-sm">No users online</p>
        ) : (
          <div className="space-y-2">
            {presences.map((presence) => (
              <div
                key={presence.user_id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                    {presence.username.charAt(0).toUpperCase()}
                  </div>
                  <div
                    className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(presence.status)} rounded-full border-2 border-gray-800`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {presence.username}
                    {presence.user_id === userId && <span className="text-gray-400 ml-1">(you)</span>}
                  </p>
                  <p className="text-gray-400 text-xs">{getStatusText(presence.status)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
