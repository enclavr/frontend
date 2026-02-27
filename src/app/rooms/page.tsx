'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useRoomStore } from '@/lib/store';
import { VoiceChat } from '@/components/VoiceChat';
import { Chat } from '@/components/Chat';
import { PresenceList } from '@/components/PresenceList';
import { RoomCard } from '@/components/RoomCard';
import { CategoryCard } from '@/components/CategoryCard';
import { CreateRoomModal } from '@/components/CreateRoomModal';
import { JoinRoomModal } from '@/components/JoinRoomModal';
import { InviteModal } from '@/components/InviteModal';
import { CategoryModal } from '@/components/CategoryModal';
import { SearchModal } from '@/components/SearchModal';
import { MembersModal } from '@/components/MembersModal';
import { WebhookModal } from '@/components/WebhookModal';
import { SettingsModal } from '@/components/SettingsModal';
import { JoinByCodeModal } from '@/components/JoinByCodeModal';
import type { ServerSettings, Invite, Category, RoomMember, Role, SearchResult } from '@/types';

export default function RoomsPage() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { rooms, fetchRooms, joinRoom, currentRoom } = useRoomStore();
  const router = useRouter();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showJoinByCodeModal, setShowJoinByCodeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const [invites, setInvites] = useState<Invite[]>([]);
  const [newInviteCode, setNewInviteCode] = useState('');
  const [inviteMaxUses, setInviteMaxUses] = useState(0);
  const [inviteExpiresIn, setInviteExpiresIn] = useState(0);

  const [categories, setCategories] = useState<Category[]>([]);
  const [serverSettings, setServerSettings] = useState<ServerSettings | null>(null);
  const [roomMembers, setRoomMembers] = useState<RoomMember[]>([]);
  const [userRole, setUserRole] = useState<string>('member');
  const [roles, setRoles] = useState<Role[]>([]);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [joinPassword, setJoinPassword] = useState('');
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchRooms();
    fetchCategories();
    if (user?.is_admin) fetchServerSettings();
  }, [isAuthenticated, router, fetchRooms, user]);

  const fetchServerSettings = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/settings', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setServerSettings(await res.json());
    } catch (err) { console.error('Failed to fetch settings:', err); }
  }, []);

  const updateServerSettings = useCallback(async (settings: Partial<ServerSettings>) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setServerSettings(await res.json());
        alert('Settings updated successfully');
      }
    } catch (err) { console.error('Failed to update settings:', err); }
  }, []);

  const fetchCategories = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/categories', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCategories(await res.json());
    } catch (err) { console.error('Failed to fetch categories:', err); }
  }, []);

  const fetchRoles = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/roles', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setRoles(await res.json());
    } catch (err) { console.error('Failed to fetch roles:', err); }
  }, []);

  const fetchRoomMembers = useCallback(async (roomId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/role/members?room_id=${roomId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setRoomMembers(await res.json());
    } catch (err) { console.error('Failed to fetch members:', err); }
  }, []);

  const fetchUserRole = useCallback(async (roomId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/role/user?room_id=${roomId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setUserRole((await res.json()).name);
    } catch (err) { console.error('Failed to fetch user role:', err); }
  }, []);

  const handleUpdateMemberRole = useCallback(async (targetUserId: string, newRole: string) => {
    if (!currentRoom) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/role/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ room_id: currentRoom.id, user_id: targetUserId, role: newRole }),
      });
      if (res.ok) fetchRoomMembers(currentRoom.id);
    } catch (err) { console.error('Failed to update role:', err); }
  }, [currentRoom, fetchRoomMembers]);

  const handleKickUser = useCallback(async (targetUserId: string) => {
    if (!currentRoom) return;
    if (!confirm('Are you sure you want to kick this user?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/role/kick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ room_id: currentRoom.id, user_id: targetUserId }),
      });
      if (res.ok) fetchRoomMembers(currentRoom.id);
    } catch (err) { console.error('Failed to kick user:', err); }
  }, [currentRoom, fetchRoomMembers]);

  const handleSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/messages/search?q=${encodeURIComponent(query)}&limit=50`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setSearchResults(await res.json());
    } catch (err) { console.error('Failed to search:', err); }
    finally { setIsSearching(false); }
  }, []);

  const handleCreateCategory = useCallback(async (name: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/category/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        fetchCategories();
        setShowCategoryModal(false);
      }
    } catch (err) { console.error('Failed to create category:', err); }
  }, [fetchCategories]);

  const handleUpdateCategory = useCallback(async (category: Category) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/category/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: category.id, name: category.name }),
      });
      if (res.ok) {
        fetchCategories();
        setEditingCategory(null);
      }
    } catch (err) { console.error('Failed to update category:', err); }
  }, [fetchCategories]);

  const handleDeleteCategory = useCallback(async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/category/delete?id=${categoryId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) fetchCategories();
    } catch (err) { console.error('Failed to delete category:', err); }
  }, [fetchCategories]);

  const fetchInvites = useCallback(async (roomId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/invites?room_id=${roomId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setInvites(await res.json());
    } catch (err) { console.error('Failed to fetch invites:', err); }
  }, []);

  const handleCreateInvite = useCallback(async (maxUses: number, expiresIn: number) => {
    if (!currentRoom) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/invite/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ room_id: currentRoom.id, max_uses: maxUses, expires_in: expiresIn }),
      });
      if (res.ok) {
        const invite = await res.json();
        setNewInviteCode(invite.code);
        fetchInvites(currentRoom.id);
        setInviteMaxUses(0);
        setInviteExpiresIn(0);
      }
    } catch (err) { console.error('Failed to create invite:', err); }
  }, [currentRoom, fetchInvites]);

  const handleRevokeInvite = useCallback(async (inviteId: string) => {
    if (!confirm('Are you sure you want to revoke this invite?')) return;
    if (!currentRoom) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/invite/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ invite_id: inviteId }),
      });
      if (res.ok) fetchInvites(currentRoom.id);
    } catch (err) { console.error('Failed to revoke invite:', err); }
  }, [currentRoom, fetchInvites]);

  const handleJoinByCodeSubmit = useCallback(async (code: string) => {
    if (!code.trim()) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/invite/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: code.trim() }),
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
    } catch (err) { console.error('Failed to join by invite:', err); alert('Failed to join room'); }
  }, [fetchRooms]);

  const handleCreateRoom = useCallback(async (name: string, description: string, categoryId: string) => {
    await useRoomStore.getState().createRoom(name, description, categoryId || undefined);
    setShowCreateModal(false);
  }, []);

  const handleJoinRoom = useCallback(async (password: string) => {
    try {
      await joinRoom(selectedRoom!, password || undefined);
      setSelectedRoom(null);
      setJoinPassword('');
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to join room'); }
  }, [selectedRoom, joinRoom]);

  const handleLeaveRoom = useCallback(async () => {
    if (currentRoom) await useRoomStore.getState().leaveRoom(currentRoom.id);
  }, [currentRoom]);

  const openMembersModal = useCallback(() => {
    if (!currentRoom) return;
    fetchRoles();
    fetchRoomMembers(currentRoom.id);
    fetchUserRole(currentRoom.id);
    setShowMembersModal(true);
  }, [currentRoom, fetchRoles, fetchRoomMembers, fetchUserRole]);

  const openWebhookModal = useCallback(() => {
    if (!currentRoom) return;
    setShowWebhookModal(true);
  }, [currentRoom]);

  const openInviteModal = useCallback(() => {
    if (!currentRoom) return;
    setShowInviteModal(true);
    fetchInvites(currentRoom.id);
  }, [currentRoom, fetchInvites]);

  const copyInviteCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    alert('Copied!');
  }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">Enclavr</h1>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowSearchModal(true)} className="text-blue-400 hover:text-blue-300">Search</button>
            <button onClick={() => router.push('/dm')} className="text-blue-400 hover:text-blue-300">Messages</button>
            {user.is_admin && (
              <button onClick={() => setShowSettingsModal(true)} className="text-yellow-400 hover:text-yellow-300">Settings</button>
            )}
            <span className="text-gray-300">{user.username}</span>
            <button onClick={() => { logout(); router.push('/login'); }} className="text-red-400 hover:text-red-300">Logout</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Voice Rooms</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowJoinByCodeModal(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Join via Invite</button>
            <button onClick={() => setShowCategoryModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded">Manage Categories</button>
            <button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Create Room</button>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <CategoryCard key={cat.id} category={cat} rooms={rooms.filter((r) => r.category_id === cat.id)} onEdit={setEditingCategory} onDelete={handleDeleteCategory} />
              ))}
            </div>
          </div>
        )}

        {currentRoom && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="bg-green-900/30 border border-green-500 p-4 rounded-lg mb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Currently in: {currentRoom.name}</h3>
                        <p className="text-gray-400">{currentRoom.user_count} users</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={openMembersModal} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded">Members</button>
                        <button onClick={openWebhookModal} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded">Webhooks</button>
                        <button onClick={openInviteModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Invite</button>
                        <button onClick={handleLeaveRoom} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">Leave Room</button>
                      </div>
                    </div>
                  </div>
                  <div className="h-80">
                    <VoiceChat roomId={currentRoom.id} userId={user?.id || ''} username={user?.username || ''} onConnectionChange={setIsVoiceConnected} />
                  </div>
                </div>
                <div className="h-[36rem]">
                  <Chat roomId={currentRoom.id} userId={user?.id || ''} username={user?.username || ''} />
                </div>
              </div>
            </div>
            <div>
              <PresenceList roomId={currentRoom.id} userId={user?.id || ''} isVoiceConnected={isVoiceConnected} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} currentRoomId={currentRoom?.id} onJoin={handleJoinRoom} onSelectRoom={setSelectedRoom} />
          ))}
        </div>

        {rooms.length === 0 && <p className="text-gray-400 text-center mt-8">No rooms available. Create one to get started!</p>}
      </main>

      {showCreateModal && <CreateRoomModal categories={categories} onClose={() => setShowCreateModal(false)} onSubmit={handleCreateRoom} />}
      {selectedRoom && <JoinRoomModal roomId={selectedRoom} onClose={() => setSelectedRoom(null)} onJoin={handleJoinRoom} />}
      {showJoinByCodeModal && <JoinByCodeModal onClose={() => setShowJoinByCodeModal(false)} onSubmit={handleJoinByCodeSubmit} value={inviteCodeInput} onChange={setInviteCodeInput} />}
      {showCategoryModal && <CategoryModal categories={categories} editingCategory={editingCategory} onClose={() => { setShowCategoryModal(false); setEditingCategory(null); }} onCreateCategory={handleCreateCategory} onUpdateCategory={handleUpdateCategory} onDeleteCategory={handleDeleteCategory} onEditChange={setEditingCategory} />}
      {showInviteModal && currentRoom && <InviteModal invites={invites} newInviteCode={newInviteCode} maxUses={inviteMaxUses} expiresIn={inviteExpiresIn} onClose={() => { setShowInviteModal(false); setNewInviteCode(''); }} onCreateInvite={handleCreateInvite} onRevokeInvite={handleRevokeInvite} onCopyCode={copyInviteCode} onMaxUsesChange={setInviteMaxUses} onExpiresInChange={setInviteExpiresIn} />}
      {showSearchModal && <SearchModal searchResults={searchResults} isSearching={isSearching} onClose={() => { setShowSearchModal(false); setSearchResults([]); }} onSearch={handleSearch} />}
      {showMembersModal && <MembersModal members={roomMembers} roles={roles} userRole={userRole} onClose={() => setShowMembersModal(false)} onUpdateRole={handleUpdateMemberRole} onKickUser={handleKickUser} />}
      {showWebhookModal && currentRoom && <WebhookModal roomId={currentRoom.id} onClose={() => setShowWebhookModal(false)} />}
      {showSettingsModal && user.is_admin && <SettingsModal serverSettings={serverSettings} onClose={() => setShowSettingsModal(false)} onUpdateSettings={updateServerSettings} />}
    </div>
  );
}
