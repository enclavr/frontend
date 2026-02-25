'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useRoomStore } from '@/lib/store';
import { VoiceChat } from '@/components/VoiceChat';
import { Chat } from '@/components/Chat';
import { PresenceList } from '@/components/PresenceList';
import type { ServerSettings, Invite, Category, RoomMember, Role, Webhook, WebhookLog, SearchResult } from '@/types';

export default function RoomsPage() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { rooms, fetchRooms, joinRoom, currentRoom, setCurrentRoom } = useRoomStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showJoinByCodeModal, setShowJoinByCodeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [selectedWebhookForLogs, setSelectedWebhookForLogs] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [invites, setInvites] = useState<Invite[]>([]);
  const [newInviteCode, setNewInviteCode] = useState('');
  const [inviteMaxUses, setInviteMaxUses] = useState(0);
  const [inviteExpiresIn, setInviteExpiresIn] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [serverSettings, setServerSettings] = useState<ServerSettings | null>(null);
  const [roomMembers, setRoomMembers] = useState<RoomMember[]>([]);
  const [userRole, setUserRole] = useState<string>('member');
  const [roles, setRoles] = useState<Role[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomCategory, setNewRoomCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [joinPassword, setJoinPassword] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchRooms();
    fetchCategories();
    if (user?.is_admin) {
      fetchServerSettings();
    }
  }, [isAuthenticated, router, fetchRooms, user]);

  const fetchServerSettings = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setServerSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const updateServerSettings = async (settings: Partial<ServerSettings>) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/settings/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const data = await res.json();
        setServerSettings(data);
        alert('Settings updated successfully');
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
  };

  const fetchCategories = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchRoles = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/roles', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };

  const fetchRoomMembers = async (roomId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/role/members?room_id=${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRoomMembers(data);
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    }
  };

  const fetchUserRole = async (roomId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/role/user?room_id=${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUserRole(data.name);
      }
    } catch (err) {
      console.error('Failed to fetch user role:', err);
    }
  };

  const handleUpdateMemberRole = async (targetUserId: string, newRole: string) => {
    if (!currentRoom) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/role/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ room_id: currentRoom.id, user_id: targetUserId, role: newRole }),
      });
      if (res.ok) {
        fetchRoomMembers(currentRoom.id);
      }
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  const handleKickUser = async (targetUserId: string) => {
    if (!currentRoom) return;
    if (!confirm('Are you sure you want to kick this user?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/role/kick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ room_id: currentRoom.id, user_id: targetUserId }),
      });
      if (res.ok) {
        fetchRoomMembers(currentRoom.id);
      }
    } catch (err) {
      console.error('Failed to kick user:', err);
    }
  };

  const fetchWebhooks = async (roomId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/webhook/room/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data);
      }
    } catch (err) {
      console.error('Failed to fetch webhooks:', err);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom || !newWebhookUrl || newWebhookEvents.length === 0) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/webhook/create/${currentRoom.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: newWebhookUrl, events: newWebhookEvents }),
      });
      if (res.ok) {
        fetchWebhooks(currentRoom.id);
        setNewWebhookUrl('');
        setNewWebhookEvents([]);
      }
    } catch (err) {
      console.error('Failed to create webhook:', err);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!currentRoom) return;
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/webhook/${webhookId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchWebhooks(currentRoom.id);
      }
    } catch (err) {
      console.error('Failed to delete webhook:', err);
    }
  };

  const handleToggleWebhook = async (webhookId: string) => {
    if (!currentRoom) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/webhook/toggle/${webhookId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchWebhooks(currentRoom.id);
      }
    } catch (err) {
      console.error('Failed to toggle webhook:', err);
    }
  };

  const fetchWebhookLogs = async (webhookId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/webhook/logs/${webhookId}?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWebhookLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch webhook logs:', err);
    }
  };

  const handleViewWebhookLogs = (webhookId: string) => {
    setSelectedWebhookForLogs(webhookId);
    fetchWebhookLogs(webhookId);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/messages/search?q=${encodeURIComponent(searchQuery)}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error('Failed to search:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/category/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newCategoryName }),
      });
      if (res.ok) {
        fetchCategories();
        setNewCategoryName('');
        setShowCategoryModal(false);
      }
    } catch (err) {
      console.error('Failed to create category:', err);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/category/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: editingCategory.id, name: editingCategory.name }),
      });
      if (res.ok) {
        fetchCategories();
        setEditingCategory(null);
      }
    } catch (err) {
      console.error('Failed to update category:', err);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/category/delete?id=${categoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchCategories();
      }
    } catch (err) {
      console.error('Failed to delete category:', err);
    }
  };

  const fetchInvites = async (roomId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/invites?room_id=${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInvites(data);
      }
    } catch (err) {
      console.error('Failed to fetch invites:', err);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/invite/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          room_id: currentRoom.id,
          max_uses: inviteMaxUses || 0,
          expires_in: inviteExpiresIn || 0,
        }),
      });
      if (res.ok) {
        const invite = await res.json();
        setNewInviteCode(invite.code);
        fetchInvites(currentRoom.id);
        setInviteMaxUses(0);
        setInviteExpiresIn(0);
      }
    } catch (err) {
      console.error('Failed to create invite:', err);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm('Are you sure you want to revoke this invite?')) return;
    if (!currentRoom) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/invite/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ invite_id: inviteId }),
      });
      if (res.ok) {
        fetchInvites(currentRoom.id);
      }
    } catch (err) {
      console.error('Failed to revoke invite:', err);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('Invite code copied to clipboard!');
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/invite/use', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: inviteCodeInput.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Joined room: ${data.room_name}`);
        setShowJoinByCodeModal(false);
        setInviteCodeInput('');
        fetchRooms();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to join room');
      }
    } catch (err) {
      console.error('Failed to join by invite:', err);
      alert('Failed to join room');
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    await useRoomStore.getState().createRoom(newRoomName, newRoomDesc, newRoomCategory || undefined);
    setShowCreateModal(false);
    setNewRoomName('');
    setNewRoomDesc('');
    setNewRoomCategory('');
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
            <button
              onClick={() => setShowSearchModal(true)}
              className="text-blue-400 hover:text-blue-300"
            >
              Search
            </button>
            <button
              onClick={() => router.push('/dm')}
              className="text-blue-400 hover:text-blue-300"
            >
              Messages
            </button>
            {user.is_admin && (
              <button
                onClick={() => setShowSettingsModal(true)}
                className="text-yellow-400 hover:text-yellow-300"
              >
                Settings
              </button>
            )}
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
          <div className="flex gap-2">
            <button
              onClick={() => setShowJoinByCodeModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Join via Invite
            </button>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
            >
              Manage Categories
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Create Room
            </button>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const catRooms = rooms.filter((r) => r.category_id === cat.id);
                return (
                  <div key={cat.id} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-white">{cat.name}</h3>
                        <p className="text-gray-400 text-sm">{catRooms.length} rooms</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingCategory(cat)}
                          className="text-gray-400 hover:text-blue-300 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="text-gray-400 hover:text-red-300 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {currentRoom && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="bg-green-900/30 border border-green-500 p-4 rounded-lg mb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Currently in: {currentRoom.name}
                        </h3>
                        <p className="text-gray-400">{currentRoom.user_count} users</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            fetchRoles();
                            fetchRoomMembers(currentRoom.id);
                            fetchUserRole(currentRoom.id);
                            setShowMembersModal(true);
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                        >
                          Members
                        </button>
                        <button
                          onClick={() => {
                            fetchWebhooks(currentRoom.id);
                            setShowWebhookModal(true);
                          }}
                          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded"
                        >
                          Webhooks
                        </button>
                        <button
                          onClick={() => {
                            setShowInviteModal(true);
                            fetchInvites(currentRoom.id);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                        >
                          Invite
                        </button>
                        <button
                          onClick={handleLeaveRoom}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                        >
                          Leave Room
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-80">
                    <VoiceChat 
                      roomId={currentRoom.id} 
                      userId={user?.id || ''} 
                      username={user?.username || ''}
                      onConnectionChange={setIsVoiceConnected}
                    />
                  </div>
                </div>
                
                <div className="h-[36rem]">
                  <Chat 
                    roomId={currentRoom.id} 
                    userId={user?.id || ''} 
                    username={user?.username || ''}
                  />
                </div>
              </div>
            </div>
            
            <div>
              <PresenceList 
                roomId={currentRoom.id} 
                userId={user?.id || ''} 
                username={user?.username || ''}
                isVoiceConnected={isVoiceConnected}
              />
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
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-bold mb-2">
                  Category (optional)
                </label>
                <select
                  value={newRoomCategory}
                  onChange={(e) => setNewRoomCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded"
                >
                  <option value="">No Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
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

      {selectedWebhookForLogs && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg w-[600px] max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">Webhook Logs</h3>
            <p className="text-gray-400 text-sm mb-4">Recent delivery attempts for this webhook.</p>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {webhookLogs.length === 0 ? (
                <p className="text-gray-500 text-sm">No logs available yet. Logs are created when webhook events are triggered.</p>
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
                    <div className="text-gray-400 text-xs mb-2">
                      Status: {log.status_code > 0 ? log.status_code : 'Failed'}
                      {log.error_message && <span className="text-red-400 ml-2">{log.error_message}</span>}
                    </div>
                    {log.response_body && (
                      <details className="text-xs">
                        <summary className="text-gray-400 cursor-pointer hover:text-gray-300">Response Body</summary>
                        <pre className="mt-2 p-2 bg-gray-900 rounded text-gray-300 overflow-x-auto whitespace-pre-wrap">{log.response_body}</pre>
                      </details>
                    )}
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => {
                setSelectedWebhookForLogs(null);
                setWebhookLogs([]);
              }}
              className="mt-6 w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
