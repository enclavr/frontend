import { useState } from 'react';

interface JoinRoomModalProps {
  roomId: string;
  onClose: () => void;
  onJoin: (password: string) => void;
}

export function JoinRoomModal({ roomId, onClose, onJoin }: JoinRoomModalProps) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onJoin(password);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg w-96">
        <h3 className="text-xl font-bold text-white mb-4">Join Room</h3>
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-bold mb-2">
            Password (if required)
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
}
