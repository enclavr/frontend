'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

export default function AccountPage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-header">Enclavr</div>
        
        <div className="sidebar-content">
          <div className="sidebar-nav-item" onClick={() => router.push('/rooms')}>Rooms</div>
          <div className="sidebar-nav-item" onClick={() => router.push('/dm')}>Direct Messages</div>
          <div className="sidebar-nav-item">Settings</div>
        </div>

        <div className="sidebar-footer">
          <div 
            className="user-account"
            onClick={() => router.push('/account')}
            style={{ background: '#1a4a7a' }}
          >
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#4a90d9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
              {user.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{user.username}</div>
              <div style={{ fontSize: 11, color: '#888' }}>View Account</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            style={{ marginTop: 10, width: '100%', padding: '8px', background: 'transparent', border: '1px solid #0f3460', borderRadius: 6, color: '#888', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="main-header">Account Settings</div>
        
        <div className="main-body">
          <div className="account-page">
            <button className="back-button" onClick={() => router.push('/rooms')}>
              ← Back to Rooms
            </button>

            <div className="account-header">Your Account</div>

            <div className="account-field">
              <div className="account-label">Username</div>
              <div className="account-value">{user.username}</div>
            </div>

            <div className="account-field">
              <div className="account-label">Email</div>
              <div className="account-value">{user.email}</div>
            </div>

            <div className="account-field">
              <div className="account-label">Display Name</div>
              <div className="account-value">{user.display_name || 'Not set'}</div>
            </div>

            <div className="account-field">
              <div className="account-label">Account Type</div>
              <div className="account-value">{user.is_admin ? 'Administrator' : 'User'}</div>
            </div>

            <div className="account-field">
              <div className="account-label">User ID</div>
              <div className="account-value" style={{ fontSize: 12, wordBreak: 'break-all' }}>{user.id}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
