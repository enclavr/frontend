import { RoomMember, Role } from '@/types';

interface MembersModalProps {
  members: RoomMember[];
  roles: Role[];
  userRole: string;
  onClose: () => void;
  onUpdateRole: (userId: string, role: string) => void;
  onKickUser: (userId: string) => void;
}

export function MembersModal({
  members,
  roles,
  userRole,
  onClose,
  onUpdateRole,
  onKickUser,
}: MembersModalProps) {
  const isAdmin = userRole === 'admin' || userRole === 'owner';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg w-[500px] max-h-[80vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-white mb-4">Room Members</h3>

        <div className="space-y-2">
          {members.length === 0 ? (
            <p className="text-gray-500 text-center">No members in this room</p>
          ) : (
            members.map((member) => (
              <div key={member.user_id} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                <div>
                  <span className="text-white">{member.username}</span>
                  <span className="text-gray-400 text-xs ml-2">({member.role})</span>
                </div>
                {isAdmin && member.role !== 'owner' && (
                  <div className="flex gap-2">
                    <select
                      value={member.role}
                      onChange={(e) => onUpdateRole(member.user_id, e.target.value)}
                      className="px-2 py-1 bg-gray-600 text-white text-sm rounded"
                    >
                      {roles.map((role) => (
                        <option key={role.name} value={role.name}>{role.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => onKickUser(member.user_id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Kick
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <button onClick={onClose} className="mt-6 w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded">
          Close
        </button>
      </div>
    </div>
  );
}
