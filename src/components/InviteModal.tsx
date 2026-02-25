import { useState } from 'react';
import { Invite } from '@/types';

interface InviteModalProps {
  invites: Invite[];
  newInviteCode: string;
  maxUses: number;
  expiresIn: number;
  onClose: () => void;
  onCreateInvite: (maxUses: number, expiresIn: number) => void;
  onRevokeInvite: (inviteId: string) => void;
  onCopyCode: (code: string) => void;
  onMaxUsesChange: (value: number) => void;
  onExpiresInChange: (value: number) => void;
}

export function InviteModal({
  invites,
  newInviteCode,
  maxUses,
  expiresIn,
  onClose,
  onCreateInvite,
  onRevokeInvite,
  onCopyCode,
  onMaxUsesChange,
  onExpiresInChange,
}: InviteModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg w-[500px] max-h-[80vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-white mb-4">Invite Users</h3>
        
        <form onSubmit={(e) => { e.preventDefault(); onCreateInvite(maxUses, expiresIn); }} className="mb-6">
          <div className="flex gap-2 mb-2">
            <input
              type="number"
              placeholder="Max uses (0 = unlimited)"
              value={maxUses || ''}
              onChange={(e) => onMaxUsesChange(Number(e.target.value))}
              className="flex-1 px-3 py-2 bg-gray-700 text-white rounded"
            />
            <input
              type="number"
              placeholder="Expires in seconds (0 = never)"
              value={expiresIn || ''}
              onChange={(e) => onExpiresInChange(Number(e.target.value))}
              className="flex-1 px-3 py-2 bg-gray-700 text-white rounded"
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">
            Create Invite
          </button>
        </form>

        {newInviteCode && (
          <div className="mb-4 p-3 bg-green-900/30 border border-green-500 rounded">
            <p className="text-green-400 text-sm mb-2">New invite created:</p>
            <div className="flex items-center gap-2">
              <code className="text-white flex-1">{newInviteCode}</code>
              <button onClick={() => onCopyCode(newInviteCode)} className="text-blue-400 hover:text-blue-300 text-sm">
                Copy
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-gray-300 font-medium">Active Invites</h4>
          {invites.length === 0 ? (
            <p className="text-gray-500 text-sm">No active invites</p>
          ) : (
            invites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                <div>
                  <code className="text-white text-sm">{invite.code}</code>
                  <span className="text-gray-400 text-xs ml-2">
                    {invite.uses}/{invite.max_uses === 0 ? '∞' : invite.max_uses} uses
                  </span>
                </div>
                <button
                  onClick={() => onRevokeInvite(invite.id)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Revoke
                </button>
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
