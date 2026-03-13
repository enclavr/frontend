'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { authApi, SessionInfo } from '@/lib/api/auth';

type TabType = 'profile' | 'security' | 'sessions';

export default function AccountPage() {
  const { user, isAuthenticated, logout, login: storeLogin } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showSetup2FA, setShowSetup2FA] = useState(false);
  const [setupData, setSetupData] = useState<{ secret: string; qr_code_url: string; recovery_codes: string[] } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'security') {
      load2FAStatus();
    }
  }, [isAuthenticated, activeTab]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'sessions') {
      loadSessions();
    }
  }, [isAuthenticated, activeTab]);

  const load2FAStatus = async () => {
    try {
      const status = await authApi.get2FAStatus();
      setTwoFactorEnabled(status.enabled);
    } catch (err) {
      console.error('Failed to load 2FA status:', err);
    }
  };

  const loadSessions = async () => {
    try {
      const data = await authApi.getSessions();
      setSessions(data.sessions);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleSetup2FA = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await authApi.setup2FA();
      setSetupData(data);
      setShowSetup2FA(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    setLoading(true);
    setError('');
    try {
      await authApi.enable2FA(verificationCode);
      setTwoFactorEnabled(true);
      setShowSetup2FA(false);
      setSetupData(null);
      setVerificationCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!currentPassword) {
      setError('Password required to disable 2FA');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authApi.disable2FA(currentPassword);
      setTwoFactorEnabled(false);
      setCurrentPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await authApi.revokeSession(sessionId);
      loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke session');
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!confirm('Are you sure you want to revoke all sessions? You will be logged out.')) {
      return;
    }
    try {
      await authApi.revokeAllSessions();
      logout();
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke sessions');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setPasswordMessage('Please enter both current and new password');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    setPasswordMessage('');
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPasswordMessage('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordMessage(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleRotateToken = async () => {
    try {
      const tokens = await authApi.rotateToken();
      const token = useAuthStore.getState().token;
      if (token && user) {
        await storeLogin('', '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rotate token');
    }
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

            <div className="tabs">
              <button 
                className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                Profile
              </button>
              <button 
                className={`tab ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                Security
              </button>
              <button 
                className={`tab ${activeTab === 'sessions' ? 'active' : ''}`}
                onClick={() => setActiveTab('sessions')}
              >
                Sessions
              </button>
            </div>

            {activeTab === 'profile' && (
              <div className="tab-content">
                <div className="account-header">Your Profile</div>

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
            )}

            {activeTab === 'security' && (
              <div className="tab-content">
                <div className="account-header">Security Settings</div>

                {error && (
                  <div className="error-message">{error}</div>
                )}

                <div className="security-section">
                  <h3>Two-Factor Authentication</h3>
                  <p className="description">
                    Add an extra layer of security to your account by requiring a verification code in addition to your password.
                  </p>
                  
                  {twoFactorEnabled ? (
                    <div className="two-factor-enabled">
                      <span className="status-badge enabled">2FA Enabled</span>
                      <button 
                        className="btn btn-danger"
                        onClick={handleDisable2FA}
                        disabled={loading}
                      >
                        Disable 2FA
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="btn btn-primary"
                      onClick={handleSetup2FA}
                      disabled={loading}
                    >
                      Enable 2FA
                    </button>
                  )}
                </div>

                {showSetup2FA && setupData && (
                  <div className="modal-overlay">
                    <div className="modal">
                      <h3>Setup Two-Factor Authentication</h3>
                      <p>Scan this QR code with your authenticator app:</p>
                      <img src={setupData.qr_code_url} alt="2FA QR Code" className="qr-code" />
                      
                      <p className="secret-text">
                        Or enter this secret manually: <code>{setupData.secret}</code>
                      </p>
                      
                      <div className="form-group">
                        <label>Verification Code</label>
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                        />
                      </div>
                      
                      <div className="modal-actions">
                        <button 
                          className="btn btn-secondary"
                          onClick={() => {
                            setShowSetup2FA(false);
                            setSetupData(null);
                          }}
                        >
                          Cancel
                        </button>
                        <button 
                          className="btn btn-primary"
                          onClick={handleEnable2FA}
                          disabled={loading}
                        >
                          Enable
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="security-section">
                  <h3>Password</h3>
                  <p className="description">Change your account password.</p>
                  
                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 8 characters)"
                    />
                  </div>
                  
                  {passwordMessage && (
                    <div className={passwordMessage.includes('success') ? 'success-message' : 'error-message'}>
                      {passwordMessage}
                    </div>
                  )}
                  
                  <button 
                    className="btn btn-primary"
                    onClick={handleChangePassword}
                    disabled={loading}
                  >
                    Change Password
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="tab-content">
                <div className="account-header">Active Sessions</div>
                
                <p className="description">Manage your active sessions across devices.</p>

                <div className="sessions-header">
                  <span>{sessions.length} active session(s)</span>
                  <button 
                    className="btn btn-secondary"
                    onClick={handleRotateToken}
                  >
                    Rotate Token
                  </button>
                </div>

                <div className="sessions-list">
                  {sessions.map((session) => (
                    <div key={session.id} className="session-item">
                      <div className="session-info">
                        <div className="session-device">
                          {session.current ? (
                            <span className="current-badge">Current</span>
                          ) : null}
                          <span className="user-agent">{session.user_agent || 'Unknown Device'}</span>
                        </div>
                        <div className="session-meta">
                          <span>IP: {session.ip_address || 'Unknown'}</span>
                          <span>Expires: {new Date(session.expires_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {!session.current && (
                        <button 
                          className="btn btn-small btn-danger"
                          onClick={() => handleRevokeSession(session.id)}
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="danger-zone">
                  <h3>Danger Zone</h3>
                  <p className="description">Revoke all sessions will log you out from all devices.</p>
                  <button 
                    className="btn btn-danger"
                    onClick={handleRevokeAllSessions}
                  >
                    Revoke All Sessions
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .tabs {
          display: flex;
          gap: 8px;
          margin: 20px 0;
        }
        .tab {
          padding: 10px 20px;
          background: transparent;
          border: 1px solid #333;
          border-radius: 6px;
          color: #888;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tab:hover {
          background: #1a1a2e;
        }
        .tab.active {
          background: #0f3460;
          border-color: #0f3460;
          color: white;
        }
        .tab-content {
          padding: 20px 0;
        }
        .security-section {
          background: #1a1a2e;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .security-section h3 {
          margin: 0 0 10px 0;
          color: white;
        }
        .description {
          color: #888;
          margin-bottom: 15px;
        }
        .form-group {
          margin-bottom: 15px;
        }
        .form-group label {
          display: block;
          color: #aaa;
          margin-bottom: 5px;
          font-size: 14px;
        }
        .form-group input {
          width: 100%;
          padding: 10px;
          background: #0f3460;
          border: 1px solid #333;
          border-radius: 6px;
          color: white;
        }
        .btn {
          padding: 10px 20px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-primary {
          background: #0f3460;
          color: white;
        }
        .btn-primary:hover:not(:disabled) {
          background: #1a4a7a;
        }
        .btn-secondary {
          background: #333;
          color: white;
        }
        .btn-danger {
          background: #dc3545;
          color: white;
        }
        .btn-danger:hover:not(:disabled) {
          background: #c82333;
        }
        .btn-small {
          padding: 5px 10px;
          font-size: 12px;
        }
        .two-factor-enabled {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .status-badge {
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .status-badge.enabled {
          background: #28a745;
          color: white;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal {
          background: #1a1a2e;
          padding: 30px;
          border-radius: 12px;
          max-width: 400px;
          width: 90%;
        }
        .modal h3 {
          margin: 0 0 20px 0;
          color: white;
        }
        .modal p {
          color: #888;
          margin-bottom: 15px;
        }
        .qr-code {
          display: block;
          margin: 0 auto 20px;
          max-width: 200px;
        }
        .secret-text {
          background: #0f3460;
          padding: 10px;
          border-radius: 6px;
          text-align: center;
        }
        .secret-text code {
          color: #4a90d9;
          word-break: break-all;
        }
        .modal-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
        }
        .sessions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          color: #888;
        }
        .sessions-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 30px;
        }
        .session-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #1a1a2e;
          padding: 15px;
          border-radius: 8px;
        }
        .session-info {
          flex: 1;
        }
        .session-device {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 5px;
        }
        .session-device .user-agent {
          color: white;
        }
        .current-badge {
          background: #28a745;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
        }
        .session-meta {
          display: flex;
          gap: 20px;
          font-size: 12px;
          color: #666;
        }
        .danger-zone {
          border: 1px solid #dc3545;
          padding: 20px;
          border-radius: 8px;
          margin-top: 30px;
        }
        .danger-zone h3 {
          color: #dc3545;
          margin: 0 0 10px 0;
        }
        .error-message {
          background: rgba(220, 53, 69, 0.1);
          border: 1px solid #dc3545;
          color: #dc3545;
          padding: 10px;
          border-radius: 6px;
          margin-bottom: 20px;
        }
        .success-message {
          background: rgba(40, 167, 69, 0.1);
          border: 1px solid #28a745;
          color: #28a745;
          padding: 10px;
          border-radius: 6px;
          margin-bottom: 20px;
        }
      `}</style>
    </div>
  );
}
