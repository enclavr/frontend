'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  inputDeviceId: string;
  outputDeviceId: string;
  inputVolume: number;
  outputVolume: number;
  noiseSuppression: boolean;
  echoCancellation: boolean;
  onlineStatus: 'online' | 'appear_offline' | 'away';
  readReceipts: boolean;
  typingIndicators: boolean;
}

const defaultPreferences: UserPreferences = {
  theme: 'dark',
  fontSize: 'medium',
  compactMode: false,
  inputDeviceId: 'default',
  outputDeviceId: 'default',
  inputVolume: 100,
  outputVolume: 100,
  noiseSuppression: true,
  echoCancellation: true,
  onlineStatus: 'online',
  readReceipts: true,
  typingIndicators: true,
};

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeTab, setActiveTab] = useState<'audio' | 'appearance' | 'privacy'>('audio');

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    const loadPreferences = async () => {
      try {
        const saved = localStorage.getItem(`user_preferences_${user.id}`);
        if (saved) {
          setPreferences({ ...defaultPreferences, ...JSON.parse(saved) });
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const loadAudioDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(d => d.kind === 'audioinput');
        const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
        setAudioDevices([...audioInputs, ...audioOutputs]);
      } catch (error) {
        console.error('Failed to enumerate devices:', error);
      }
    };

    loadPreferences();
    loadAudioDevices();
  }, [isAuthenticated, user, router]);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      localStorage.setItem(`user_preferences_${user.id}`, JSON.stringify(preferences));
      setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setSaveMessage({ type: 'success', text: 'Microphone is working!' });
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to access microphone' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleTestSpeaker = async () => {
    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 440;
      gainNode.gain.value = preferences.outputVolume / 100;
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 500);
      setSaveMessage({ type: 'success', text: 'Speaker test played!' });
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to test speaker' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const inputDevices = audioDevices.filter(d => d.kind === 'audioinput');
  const outputDevices = audioDevices.filter(d => d.kind === 'audiooutput');

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/rooms')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <div className="flex gap-6">
          <div className="w-48 shrink-0">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('audio')}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'audio' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                Audio
              </button>
              <button
                onClick={() => setActiveTab('appearance')}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'appearance' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                Appearance
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'privacy' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                Privacy
              </button>
            </nav>
          </div>

          <div className="flex-1 bg-gray-800 rounded-xl p-6">
            {activeTab === 'audio' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Audio Settings</h2>
                
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Input Device (Microphone)</label>
                  <select
                    value={preferences.inputDeviceId}
                    onChange={(e) => setPreferences({ ...preferences, inputDeviceId: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg"
                  >
                    <option value="default">Default Microphone</option>
                    {inputDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2">Output Device (Speaker)</label>
                  <select
                    value={preferences.outputDeviceId}
                    onChange={(e) => setPreferences({ ...preferences, outputDeviceId: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg"
                  >
                    <option value="default">Default Speaker</option>
                    {outputDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Speaker ${device.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2">
                    Input Volume: {preferences.inputVolume}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={preferences.inputVolume}
                    onChange={(e) => setPreferences({ ...preferences, inputVolume: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2">
                    Output Volume: {preferences.outputVolume}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={preferences.outputVolume}
                    onChange={(e) => setPreferences({ ...preferences, outputVolume: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="noiseSuppression"
                    checked={preferences.noiseSuppression}
                    onChange={(e) => setPreferences({ ...preferences, noiseSuppression: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="noiseSuppression" className="text-gray-300">Noise Suppression</label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="echoCancellation"
                    checked={preferences.echoCancellation}
                    onChange={(e) => setPreferences({ ...preferences, echoCancellation: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="echoCancellation" className="text-gray-300">Echo Cancellation</label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleTestMicrophone}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Test Microphone
                  </button>
                  <button
                    onClick={handleTestSpeaker}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Test Speaker
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Appearance Settings</h2>
                
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Theme</label>
                  <select
                    value={preferences.theme}
                    onChange={(e) => setPreferences({ ...preferences, theme: e.target.value as UserPreferences['theme'] })}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2">Font Size</label>
                  <select
                    value={preferences.fontSize}
                    onChange={(e) => setPreferences({ ...preferences, fontSize: e.target.value as UserPreferences['fontSize'] })}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="compactMode"
                    checked={preferences.compactMode}
                    onChange={(e) => setPreferences({ ...preferences, compactMode: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="compactMode" className="text-gray-300">Compact Mode</label>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Privacy Settings</h2>
                
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Online Status</label>
                  <select
                    value={preferences.onlineStatus}
                    onChange={(e) => setPreferences({ ...preferences, onlineStatus: e.target.value as UserPreferences['onlineStatus'] })}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg"
                  >
                    <option value="online">Online</option>
                    <option value="away">Away</option>
                    <option value="appear_offline">Appear Offline</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="readReceipts"
                    checked={preferences.readReceipts}
                    onChange={(e) => setPreferences({ ...preferences, readReceipts: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="readReceipts" className="text-gray-300">Read Receipts</label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="typingIndicators"
                    checked={preferences.typingIndicators}
                    onChange={(e) => setPreferences({ ...preferences, typingIndicators: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="typingIndicators" className="text-gray-300">Typing Indicators</label>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-700">
              {saveMessage && (
                <div className={`mb-4 p-3 rounded-lg ${
                  saveMessage.type === 'success' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                }`}>
                  {saveMessage.text}
                </div>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
