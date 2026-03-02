import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Webhook, WebhookLog } from '@/types';

interface WebhookModalProps {
  roomId: string;
  onClose: () => void;
}

export function WebhookModal({ roomId, onClose }: WebhookModalProps) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [selectedWebhookForLogs, setSelectedWebhookForLogs] = useState<string | null>(null);

  const fetchWebhooks = useCallback(async () => {
    try {
      const webhooks = await api.getWebhooks(roomId);
      setWebhooks(webhooks);
    } catch (err) { console.error('Failed to fetch webhooks:', err); }
  }, [roomId]);

  const handleCreateWebhook = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookUrl || newWebhookEvents.length === 0) return;
    try {
      await api.createWebhook(roomId, newWebhookUrl, newWebhookEvents);
      fetchWebhooks();
      setNewWebhookUrl('');
      setNewWebhookEvents([]);
    } catch (err) { console.error('Failed to create webhook:', err); }
  }, [roomId, newWebhookUrl, newWebhookEvents, fetchWebhooks]);

  const handleDeleteWebhook = useCallback(async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    try {
      await api.deleteWebhook(webhookId);
      fetchWebhooks();
    } catch (err) { console.error('Failed to delete webhook:', err); }
  }, [fetchWebhooks]);

  const handleToggleWebhook = useCallback(async (webhookId: string) => {
    try {
      await api.toggleWebhook(webhookId);
      fetchWebhooks();
    } catch (err) { console.error('Failed to toggle webhook:', err); }
  }, [fetchWebhooks]);

  const fetchWebhookLogs = useCallback(async (webhookId: string) => {
    try {
      const logs = await api.getWebhookLogs(webhookId, 20);
      setWebhookLogs(logs);
    } catch (err) { console.error('Failed to fetch webhook logs:', err); }
  }, []);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
        <div className="bg-gray-800 p-6 rounded-lg w-[600px] max-h-[80vh] overflow-y-auto">
          <h3 className="text-xl font-bold text-white mb-4">Webhooks</h3>
          <form onSubmit={handleCreateWebhook} className="mb-6">
            <input
              type="url"
              placeholder="Webhook URL"
              value={newWebhookUrl}
              onChange={(e) => setNewWebhookUrl(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded mb-2"
            />
            <div className="flex gap-2 mb-2">
              {['message_created', 'member_joined', 'member_left'].map((event) => (
                <label key={event} className="flex items-center text-gray-300 text-sm">
                  <input
                    type="checkbox"
                    checked={newWebhookEvents.includes(event)}
                    onChange={(e) => setNewWebhookEvents(e.target.checked ? [...newWebhookEvents, event] : newWebhookEvents.filter((e) => e !== event))}
                    className="mr-1"
                  />
                  {event}
                </label>
              ))}
            </div>
            <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded">Create Webhook</button>
          </form>
          <div className="space-y-2">
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                <div>
                  <span className="text-white">{webhook.url}</span>
                  <span className="text-gray-400 text-xs ml-2">{webhook.events?.join(', ')}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setSelectedWebhookForLogs(webhook.id); fetchWebhookLogs(webhook.id); }} className="text-blue-400 hover:text-blue-300 text-sm">Logs</button>
                  <button onClick={() => handleToggleWebhook(webhook.id)} className="text-yellow-400 hover:text-yellow-300 text-sm">{webhook.is_active ? 'Disable' : 'Enable'}</button>
                  <button onClick={() => handleDeleteWebhook(webhook.id)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={onClose} className="mt-6 w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded">Close</button>
        </div>
      </div>

      {selectedWebhookForLogs && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-[600px] max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">Webhook Logs</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {webhookLogs.length === 0 ? (
                <p className="text-gray-500 text-sm">No logs available yet.</p>
              ) : (
                webhookLogs.map((log) => (
                  <div key={log.id} className={`p-3 rounded border ${log.success ? 'border-green-600 bg-green-900/20' : 'border-red-600 bg-red-900/20'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${log.success ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className="text-white font-medium text-sm">{log.event}</span>
                      </div>
                      <span className="text-gray-400 text-xs">{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-gray-400 text-xs">Status: {log.status_code > 0 ? log.status_code : 'Failed'}</div>
                  </div>
                ))
              )}
            </div>
            <button onClick={() => { setSelectedWebhookForLogs(null); setWebhookLogs([]); }} className="mt-6 w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded">Close</button>
          </div>
        </div>
      )}
    </>
  );
}
