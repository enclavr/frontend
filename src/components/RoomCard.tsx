import { Room } from '@/types';

interface RoomCardProps {
  room: Room;
  currentRoomId?: string;
  onJoin: (roomId: string) => void;
  onSelectRoom: (roomId: string) => void;
}

export function RoomCard({ room, currentRoomId, onJoin, onSelectRoom }: RoomCardProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-white">{room.name}</h3>
      {room.description && (
        <p className="text-gray-400 text-sm mt-1">{room.description}</p>
      )}
      <div className="mt-3 flex justify-between items-center">
        <span className="text-gray-400 text-sm">
          {room.user_count}/{room.max_users} users
          {room.is_private && ' • Private'}
        </span>
        {currentRoomId !== room.id && (
          <button
            onClick={() => onSelectRoom(room.id)}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
          >
            Join
          </button>
        )}
      </div>
    </div>
  );
}
