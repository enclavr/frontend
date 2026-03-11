import { UserProfile } from '@/types';

interface UserProfileModalProps {
  profile: UserProfile | null;
  onClose: () => void;
  onMessage?: () => void;
  onKick?: () => void;
  onBan?: () => void;
}

export function UserProfileModal({ profile, onClose, onMessage, onKick, onBan }: UserProfileModalProps) {
  if (!profile) return null;

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string): string => {
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-lg w-[400px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-24 relative">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-white/80 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="relative -mt-12 mb-4">
            <div className="w-24 h-24 rounded-full border-4 border-gray-800 overflow-hidden bg-gray-700">
              {profile.user.avatar_url ? (
                <img
                  src={profile.user.avatar_url}
                  alt={profile.user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl text-gray-400">
                  {profile.user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-gray-800 ${getStatusColor(profile.status)}`} />
          </div>

          <div className="mb-4">
            <h2 className="text-2xl font-bold text-white">{profile.user.display_name || profile.user.username}</h2>
            <p className="text-gray-400">@{profile.user.username}</p>
          </div>

          {profile.roles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {profile.roles.map((role) => (
                <span
                  key={role.name}
                  className="px-2 py-1 text-xs rounded bg-indigo-600 text-white"
                >
                  {role.name}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-700/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white">{profile.rooms_count}</div>
              <div className="text-xs text-gray-400">Rooms</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white">{profile.messages_count}</div>
              <div className="text-xs text-gray-400">Messages</div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Status</span>
              <span className="text-white capitalize">{profile.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Joined</span>
              <span className="text-white">{formatDate(profile.joined_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Last Seen</span>
              <span className="text-white">{formatDate(profile.last_seen)}</span>
            </div>
          </div>

          {profile.user.is_admin && (
            <div className="mt-4 p-2 bg-red-500/20 rounded text-red-400 text-sm text-center">
              Administrator
            </div>
          )}

          <div className="flex gap-2 mt-6">
            {onMessage && (
              <button
                onClick={onMessage}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition-colors"
              >
                Message
              </button>
            )}
            {onKick && (
              <button
                onClick={onKick}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
              >
                Kick
              </button>
            )}
            {onBan && (
              <button
                onClick={onBan}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors"
              >
                Ban
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
