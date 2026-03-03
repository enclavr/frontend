import { describe, it, expect, vi, beforeEach } from 'vitest';

declare global {
  interface RTCPeerConnectionTrackEvent {
    streams: MediaStream[];
  }
}

vi.stubGlobal('MediaStream', class MockMediaStream {
  id = 'mock-stream';
});

describe('Peer Module', () => {
  const mockPcInstance = {
    close: vi.fn(),
    createOffer: vi.fn(),
    createAnswer: vi.fn(),
    setLocalDescription: vi.fn(),
    setRemoteDescription: vi.fn(),
    addIceCandidate: vi.fn(),
    onicecandidate: null as ((event: RTCPeerConnectionIceEvent) => void) | null,
    ontrack: null as ((event: { streams: MediaStream[] }) => void) | null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPcInstance.onicecandidate = null;
    mockPcInstance.ontrack = null;
  });

  it('should set up icecandidate handler', async () => {
    const { setupPeerConnectionHandlers } = await import('@/lib/webrtc/peer');
    
    const onIceCandidate = vi.fn();
    const mockEvent = {
      candidate: {
        toJSON: () => ({ candidate: 'test', sdpMid: '0' }),
      },
    } as unknown as RTCPeerConnectionIceEvent;
    
    setupPeerConnectionHandlers(mockPcInstance as unknown as RTCPeerConnection, 'peer-1', onIceCandidate, vi.fn());
    
    mockPcInstance.onicecandidate?.(mockEvent);
    
    expect(onIceCandidate).toHaveBeenCalled();
  });

  it('should not call onIceCandidate when no candidate', async () => {
    const { setupPeerConnectionHandlers } = await import('@/lib/webrtc/peer');
    
    const onIceCandidate = vi.fn();
    const mockEvent = {
      candidate: null,
    } as unknown as RTCPeerConnectionIceEvent;
    
    setupPeerConnectionHandlers(mockPcInstance as unknown as RTCPeerConnection, 'peer-1', onIceCandidate, vi.fn());
    
    mockPcInstance.onicecandidate?.(mockEvent);
    
    expect(onIceCandidate).not.toHaveBeenCalled();
  });

  it('should set up track handler', async () => {
    const { setupPeerConnectionHandlers } = await import('@/lib/webrtc/peer');
    
    const onTrack = vi.fn();
    const mockStream = { id: 'test-stream' };
    const mockEvent = {
      streams: [mockStream],
    } as unknown as RTCPeerConnectionTrackEvent;
    
    setupPeerConnectionHandlers(mockPcInstance as unknown as RTCPeerConnection, 'peer-1', vi.fn(), onTrack);
    
    mockPcInstance.ontrack?.(mockEvent);
    
    expect(onTrack).toHaveBeenCalledWith(mockStream);
  });

  it('should not call onTrack when no stream', async () => {
    const { setupPeerConnectionHandlers } = await import('@/lib/webrtc/peer');
    
    const onTrack = vi.fn();
    const mockEvent = {
      streams: [],
    } as unknown as RTCPeerConnectionTrackEvent;
    
    setupPeerConnectionHandlers(mockPcInstance as unknown as RTCPeerConnection, 'peer-1', vi.fn(), onTrack);
    
    mockPcInstance.ontrack?.(mockEvent);
    
    expect(onTrack).not.toHaveBeenCalled();
  });

  it('should call close on peer connection', async () => {
    const { closePeerConnection } = await import('@/lib/webrtc/peer');
    
    closePeerConnection(mockPcInstance as unknown as RTCPeerConnection);
    
    expect(mockPcInstance.close).toHaveBeenCalled();
  });
});
