'use client';

import { useRouter } from 'next/navigation';
import type { User } from '@/types';

interface SidebarProps {
  user: User | null;
  onLogout: () => void;
}

export function Sidebar({ user, onLogout }: SidebarProps) {
  const router = useRouter();

  return (
    <div className="sidebar">
      <div className="sidebar-header">Enclavr</div>
      
      <div className="sidebar-content">
        <div className="sidebar-nav-item">Rooms</div>
        <div className="sidebar-nav-item">Direct Messages</div>
        <div className="sidebar-nav-item">Settings</div>
      </div>

      <div className="sidebar-footer">
        <div 
          className="user-account"
          onClick={() => router.push('/account')}
        >
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#4a90d9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{user?.username || 'User'}</div>
            <div style={{ fontSize: 11, color: '#888' }}>View Account</div>
          </div>
        </div>
        <button 
          onClick={onLogout}
          style={{ marginTop: 10, width: '100%', padding: '8px', background: 'transparent', border: '1px solid #0f3460', borderRadius: 6, color: '#888', cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
