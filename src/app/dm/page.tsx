'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Sidebar } from '@/components/Sidebar';

export default function DMPage() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const [conversations, setConversations] = useState<{id: string; username: string; lastMessage: string; time: string}[]>([
    { id: '1', username: 'alice', lastMessage: 'Hey, how are you?', time: '10:30 AM' },
    { id: '2', username: 'bob', lastMessage: 'See you later!', time: 'Yesterday' },
  ]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<{id: string; username: string; content: string; time: string}[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = useCallback(() => {
    logout();
    router.push('/login');
  }, [logout, router]);

  const handleSendMessage = useCallback(() => {
    if (!messageInput.trim() || !user || !selectedUser) return;
    
    const newMessage = {
      id: Date.now().toString(),
      username: user.username,
      content: messageInput,
      time: new Date().toLocaleTimeString(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMessageInput('');
  }, [messageInput, user, selectedUser]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  if (!user) return null;

  return (
    <div className="app-container">
      <Sidebar user={user} onLogout={handleLogout} />
      
      <div className="main-content">
        <div className="main-header">Direct Messages</div>
        
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <div style={{ width: 280, borderRight: '1px solid #0f3460', overflowY: 'auto' }}>
            <div style={{ padding: 16 }}>
              <div 
                className="sidebar-nav-item"
                onClick={() => setSelectedUser(null)}
                style={{ background: !selectedUser ? '#0f3460' : undefined }}
              >
                + New Message
              </div>
              
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className="sidebar-nav-item"
                  onClick={() => setSelectedUser(conv.id)}
                  style={{ background: selectedUser === conv.id ? '#0f3460' : undefined }}
                >
                  <div style={{ fontWeight: 600 }}>{conv.username}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{conv.lastMessage}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {selectedUser ? (
              <>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #0f3460', fontWeight: 600 }}>
                  {conversations.find(c => c.id === selectedUser)?.username}
                </div>
                
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
                  {messages.length === 0 && (
                    <p style={{ color: '#888', textAlign: 'center', padding: 40 }}>No messages yet</p>
                  )}
                </div>
                
                <div className="chat-input-container">
                  <div className="chat-input-wrapper">
                    <input
                      type="text"
                      className="chat-input"
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                    />
                    <button className="send-button" onClick={handleSendMessage}>
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                Select a conversation to start messaging
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
