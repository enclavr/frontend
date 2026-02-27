import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VoiceChat } from '@/components/VoiceChat';
import type { VoiceUser } from '@/hooks/useWebRTC';

vi.mock('@/hooks/useWebRTC', () => ({
  useWebRTC: vi.fn(() => ({
    localStream: null,
    screenStream: null,
    isConnected: true,
    isMuted: false,
    isVideoEnabled: false,
    isScreenSharing: false,
    peers: new Map(),
    voiceUsers: [],
    connect: vi.fn(),
    disconnect: vi.fn(),
    toggleMute: vi.fn(),
    toggleVideo: vi.fn(),
    toggleScreenShare: vi.fn(),
  })),
}));

vi.mock('./MediaRecorder', () => ({
  useMediaRecorder: vi.fn(() => ({
    status: 'idle',
    duration: 0,
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    pauseRecording: vi.fn(),
    resumeRecording: vi.fn(),
    downloadRecording: vi.fn(),
    reset: vi.fn(),
  })),
}));

import { useWebRTC } from '@/hooks/useWebRTC';

describe('VoiceChat Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render voice chat header', () => {
    render(
      <VoiceChat
        roomId="room-1"
        userId="user-1"
        username="testuser"
      />
    );

    expect(screen.getByText('Voice Chat')).toBeInTheDocument();
  });

  it('should display connection status', () => {
    render(
      <VoiceChat
        roomId="room-1"
        userId="user-1"
        username="testuser"
      />
    );

    expect(screen.getByText(/connected/i)).toBeInTheDocument();
  });

  it('should show mute button', () => {
    render(
      <VoiceChat
        roomId="room-1"
        userId="user-1"
        username="testuser"
      />
    );

    expect(screen.getByTitle('Mute')).toBeInTheDocument();
  });

  it('should show screen share button', () => {
    render(
      <VoiceChat
        roomId="room-1"
        userId="user-1"
        username="testuser"
      />
    );

    expect(screen.getByTitle('Share screen')).toBeInTheDocument();
  });

  it('should show disconnect button', () => {
    render(
      <VoiceChat
        roomId="room-1"
        userId="user-1"
        username="testuser"
      />
    );

    expect(screen.getByTitle('Leave voice')).toBeInTheDocument();
  });

  it('should call onConnectionChange when connection state changes', () => {
    const onConnectionChange = vi.fn();
    
    render(
      <VoiceChat
        roomId="room-1"
        userId="user-1"
        username="testuser"
        onConnectionChange={onConnectionChange}
      />
    );

    expect(onConnectionChange).toHaveBeenCalledWith(true);
  });
});

describe('VoiceChat User Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display voice users', () => {
    const mockVoiceUsers: VoiceUser[] = [
      { userId: 'user-1', username: 'Alice', isMuted: false, isSpeaking: true, isScreenSharing: false },
      { userId: 'user-2', username: 'Bob', isMuted: true, isSpeaking: false, isScreenSharing: false },
    ];

    vi.mocked(useWebRTC).mockReturnValue({
      localStream: null,
      screenStream: null,
      isConnected: true,
      isMuted: false,
      isVideoEnabled: false,
      isScreenSharing: false,
      peers: new Map(),
      voiceUsers: mockVoiceUsers,
      connect: vi.fn(),
      disconnect: vi.fn(),
      toggleMute: vi.fn(),
      toggleVideo: vi.fn(),
      toggleScreenShare: vi.fn(),
    });

    render(
      <VoiceChat
        roomId="room-1"
        userId="user-1"
        username="Alice"
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('should show "(you)" for current user', () => {
    const mockVoiceUsers: VoiceUser[] = [
      { userId: 'user-1', username: 'testuser', isMuted: false, isSpeaking: true, isScreenSharing: false },
    ];

    vi.mocked(useWebRTC).mockReturnValue({
      localStream: null,
      screenStream: null,
      isConnected: true,
      isMuted: false,
      isVideoEnabled: false,
      isScreenSharing: false,
      peers: new Map(),
      voiceUsers: mockVoiceUsers,
      connect: vi.fn(),
      disconnect: vi.fn(),
      toggleMute: vi.fn(),
      toggleVideo: vi.fn(),
      toggleScreenShare: vi.fn(),
    });

    render(
      <VoiceChat
        roomId="room-1"
        userId="user-1"
        username="testuser"
      />
    );

    expect(screen.getByText(/\(you\)/i)).toBeInTheDocument();
  });
});

describe('VoiceChat Button Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUseWebRTC = () => {
    const toggleMute = vi.fn();
    const toggleScreenShare = vi.fn();
    const toggleVideo = vi.fn();
    const disconnect = vi.fn();

    vi.mocked(useWebRTC).mockReturnValue({
      localStream: null,
      screenStream: null,
      isConnected: true,
      isMuted: false,
      isVideoEnabled: false,
      isScreenSharing: false,
      peers: new Map(),
      voiceUsers: [],
      connect: vi.fn(),
      disconnect,
      toggleMute,
      toggleVideo,
      toggleScreenShare,
    });

    return { toggleMute, toggleScreenShare, toggleVideo, disconnect };
  };

  it('should call toggleMute when mute button clicked', async () => {
    const user = userEvent.setup();
    const { toggleMute } = mockUseWebRTC();

    render(
      <VoiceChat
        roomId="room-1"
        userId="user-1"
        username="testuser"
      />
    );

    await user.click(screen.getByTitle('Mute'));
    expect(toggleMute).toHaveBeenCalled();
  });

  it('should call toggleScreenShare when screen share button clicked', async () => {
    const user = userEvent.setup();
    const { toggleScreenShare } = mockUseWebRTC();

    render(
      <VoiceChat
        roomId="room-1"
        userId="user-1"
        username="testuser"
      />
    );

    await user.click(screen.getByTitle('Share screen'));
    expect(toggleScreenShare).toHaveBeenCalled();
  });

  it('should call disconnect when leave button clicked', async () => {
    const user = userEvent.setup();
    const { disconnect } = mockUseWebRTC();

    render(
      <VoiceChat
        roomId="room-1"
        userId="user-1"
        username="testuser"
      />
    );

    await user.click(screen.getByTitle('Leave voice'));
    expect(disconnect).toHaveBeenCalled();
  });
});

describe('VoiceChat Muted State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show unmute button when muted', () => {
    vi.mocked(useWebRTC).mockReturnValue({
      localStream: null,
      screenStream: null,
      isConnected: true,
      isMuted: true,
      isVideoEnabled: false,
      isScreenSharing: false,
      peers: new Map(),
      voiceUsers: [],
      connect: vi.fn(),
      disconnect: vi.fn(),
      toggleMute: vi.fn(),
      toggleVideo: vi.fn(),
      toggleScreenShare: vi.fn(),
    });

    render(
      <VoiceChat
        roomId="room-1"
        userId="user-1"
        username="testuser"
      />
    );

    expect(screen.getByTitle('Unmute')).toBeInTheDocument();
  });
});

describe('VoiceChat Screen Sharing State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show stop screen share button when sharing', () => {
    vi.mocked(useWebRTC).mockReturnValue({
      localStream: null,
      screenStream: null,
      isConnected: true,
      isMuted: false,
      isVideoEnabled: false,
      isScreenSharing: true,
      peers: new Map(),
      voiceUsers: [],
      connect: vi.fn(),
      disconnect: vi.fn(),
      toggleMute: vi.fn(),
      toggleVideo: vi.fn(),
      toggleScreenShare: vi.fn(),
    });

    render(
      <VoiceChat
        roomId="room-1"
        userId="user-1"
        username="testuser"
      />
    );

    expect(screen.getByTitle('Stop screen share')).toBeInTheDocument();
  });
});

describe('VoiceChat Video State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show turn off camera button when video enabled', () => {
    vi.mocked(useWebRTC).mockReturnValue({
      localStream: null,
      screenStream: null,
      isConnected: true,
      isMuted: false,
      isVideoEnabled: true,
      isScreenSharing: false,
      peers: new Map(),
      voiceUsers: [],
      connect: vi.fn(),
      disconnect: vi.fn(),
      toggleMute: vi.fn(),
      toggleVideo: vi.fn(),
      toggleScreenShare: vi.fn(),
    });

    render(
      <VoiceChat
        roomId="room-1"
        userId="user-1"
        username="testuser"
      />
    );

    expect(screen.getByTitle('Turn off camera')).toBeInTheDocument();
  });
});
