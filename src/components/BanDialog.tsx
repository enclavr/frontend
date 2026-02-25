'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { CreateBanRequest } from '@/types';

interface BanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  roomId: string;
  roomName: string;
  onBanSubmitted?: () => void;
}

export function BanDialog({
  isOpen,
  onClose,
  userId,
  username,
  roomId,
  roomName,
  onBanSubmitted,
}: BanDialogProps) {
  const [reason, setReason] = useState('');
  const [permanent, setPermanent] = useState(true);
  const [duration, setDuration] = useState('60'); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const banData: CreateBanRequest = {
        user_id: userId,
        room_id: roomId,
        reason,
      };

      if (!permanent) {
        const durationMinutes = parseInt(duration);
        if (durationMinutes > 0) {
          const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
          banData.expires_at = expiresAt;
        }
      }

      await api.createBan(banData);
      onBanSubmitted?.();
      onClose();
      setReason('');
      setPermanent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ban user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">Ban User</h2>
        <p className="text-gray-300 mb-4">
          Ban <span className="font-semibold text-white">{username}</span> from{' '}
          <span className="font-semibold text-white">{roomName}</span>
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Reason (optional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-gray-700 text-white rounded px-3 py-2"
              placeholder="Reason for ban..."
            />
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2 text-gray-300">
              <input
                type="checkbox"
                checked={permanent}
                onChange={(e) => setPermanent(e.target.checked)}
                className="rounded bg-gray-700"
              />
              Permanent ban
            </label>
          </div>

          {!permanent && (
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Duration (minutes)</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-gray-700 text-white rounded px-3 py-2"
              >
                <option value="5">5 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="1440">24 hours</option>
                <option value="10080">7 days</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-50"
            >
              {isSubmitting ? 'Banning...' : 'Ban User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
