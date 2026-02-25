import { ServerSettings } from '@/types';

interface SettingsModalProps {
  serverSettings: ServerSettings | null;
  onClose: () => void;
  onUpdateSettings: (settings: Partial<ServerSettings>) => void;
}

export function SettingsModal({ serverSettings, onClose, onUpdateSettings }: SettingsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg w-[500px]">
        <h3 className="text-xl font-bold text-white mb-4">Server Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Server Name</label>
            <input
              type="text"
              value={serverSettings?.server_name || ''}
              onChange={(e) => onUpdateSettings({ server_name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">Max Rooms Per User</label>
            <input
              type="number"
              value={serverSettings?.max_rooms_per_user || 0}
              onChange={(e) => onUpdateSettings({ max_rooms_per_user: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">Max Members Per Room</label>
            <input
              type="number"
              value={serverSettings?.max_members_per_room || 0}
              onChange={(e) => onUpdateSettings({ max_members_per_room: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={serverSettings?.allow_registration ?? true}
              onChange={(e) => onUpdateSettings({ allow_registration: e.target.checked })}
            />
            <span className="text-gray-300">Allow Registration</span>
          </div>
        </div>
        <button onClick={onClose} className="mt-6 w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded">Close</button>
      </div>
    </div>
  );
}
