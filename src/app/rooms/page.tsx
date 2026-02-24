'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, useRoomStore } from '@/lib/store';

export default function RoomsPage() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { rooms, fetchRooms, joinRoom, currentRoom, setCurrentRoom } = useRoomStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchRooms();
  }, [isAuthenticated, router, fetchRooms]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    await useRoomStore.getState().createRoom(newRoomName, newRoomDesc);
    setShowCreateModal(false);
    setNewRoomName('');
    setNewRoomDesc('');
  };

  const handleJoinRoom = async (roomId: string) => {
    try {
      await joinRoom(roomId, joinPassword || undefined);
      setSelectedRoom(null);
      setJoinPassword('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to join room');
    }
  };

  const handleLeaveRoom = async () => {
    if (currentRoom) {
      await useRoomStore.getState().leaveRoom(currentRoom.id);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">Enclavr</h1>
          <div className="flex items-center gap-4">
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
          <h2 className="text-2xl font-bold text-white">Voice Rooms</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Create Room
          </button>
        </div>

        {currentRoom && (
          <div className="bg-green-900/30 border border-green-500 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Currently in: {currentRoom.name}
                </h3>
                <p className="text-gray-400">{currentRoom.user_count} users</p>
              </div>
              <button
                onClick={handleLeaveRoom}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                Leave Room
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-gray-800 border border-gray-700 p-4 rounded-lg"
            >
              <h3 className="text-lg font-semibold text-white">{room.name}</h3>
              {room.description && (
                <p className="text-gray-400 text-sm mt-1">{room.description}</p>
              )}
              <div className="mt-3 flex justify-between items-center">
                <span className="text-gray-400 text-sm">
                  {room.user_count}/{room.max_users} users
                  {room.is_private && ' • Private'}
                </span>
                {currentRoom?.id !== room.id && (
                  <button
                    onClick={() => setSelectedRoom(room.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Join
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {rooms.length === 0 && (
          <p className="text-gray-400 text-center mt-8">
            No rooms available. Create one to get started!
          </p>
        )}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold text-white mb-4">Create Room</h3>
            <form onSubmit={handleCreateRoom}>
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-bold mb-2">
                  Room Name
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-bold mb-2">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold text-white mb-4">Join Room</h3>
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-bold mb-2">
                Password (if required)
              </label>
              <input
                type="password"
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedRoom(null)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleJoinRoom(selectedRoom)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
