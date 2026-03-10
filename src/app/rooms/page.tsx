'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useRoomStore } from '@/lib/store';
import { Sidebar } from '@/components/Sidebar';

export default function RoomsPage() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { rooms, fetchRooms, joinRoom, currentRoom } = useRoomStore();
  const router = useRouter();

  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<{id: string; username: string; content: string; time: string}[]>([
    { id: '1', username: 'System', content: 'Welcome to Enclavr!', time: new Date().toLocaleTimeString() },
    { id: '2', username: 'admin', content: 'Hello everyone!', time: new Date().toLocaleTimeString() },
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchRooms();
  }, [isAuthenticated, router, fetchRooms]);

  const handleSendMessage = useCallback(() => {
    if (!messageInput.trim() || !user) return;
    
    const newMessage = {
      id: Date.now().toString(),
      username: user.username,
      content: messageInput,
      time: new Date().toLocaleTimeString(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMessageInput('');
  }, [messageInput, user]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleLogout = useCallback(() => {
    logout();
    router.push('/login');
  }, [logout, router]);

  const handleJoinRoom = useCallback(async (roomId: string) => {
    try {
      await joinRoom(roomId);
    } catch (err) {
      console.error('Failed to join room:', err);
    }
  }, [joinRoom]);

  if (!user) return null;

  return (
    <div className="app-container">
      <Sidebar user={user} onLogout={handleLogout} />
      
      <div className="main-content">
        <div className="main-header">
          {currentRoom ? `Room: ${currentRoom.name}` : 'Select a Room'}
        </div>
        
        <div className="main-body">
          {!currentRoom ? (
            <div>
              <h2 style={{ marginBottom: 20 }}>Available Rooms</h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {rooms.map((room) => (
                  <div 
                    key={room.id}
                    style={{ 
                      padding: 16, 
                      background: '#16213e', 
                      borderRadius: 8,
                      cursor: 'pointer',
                      border: '1px solid #0f3460'
                    }}
                    onClick={() => handleJoinRoom(room.id)}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{room.name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>
                      {room.user_count} users • {room.is_private ? 'Private' : 'Public'}
                    </div>
                  </div>
                ))}
                {rooms.length === 0 && (
                  <p style={{ color: '#888' }}>No rooms available. Create one to get started!</p>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="chat-messages">
                {messages.map((msg) => (
                  <div key={msg.id} className="message">
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#4a90d9', marginBottom: 2 }}>
                      {msg.username}
                      <span style={{ fontWeight: 400, color: '#666', marginLeft: 8, fontSize: 11 }}>{msg.time}</span>
                    </div>
                    <div>{msg.content}</div>
                  </div>
                ))}
              </div>
              
              <div className="chat-input-container">
                <div className="chat-input-wrapper">
                  <input
                    type="text"
                    className="chat-input"
                    placeholder={`Message #${currentRoom.name}`}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <button className="send-button" onClick={handleSendMessage}>
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
