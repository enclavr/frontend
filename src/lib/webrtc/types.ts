import type { VoiceUser as VoiceUserType } from '@/types';

export interface PeerConnection {
  peerId: string;
  userId: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

export interface UseWebRTCOptions {
  roomId: string;
  userId: string;
  username: string;
  onUserJoined?: (user: VoiceUserType) => void;
  onUserLeft?: (userId: string) => void;
  onUserMuted?: (userId: string, isMuted: boolean) => void;
}

export interface WebRTCMessage {
  type: string;
  userId?: string;
  username?: string;
  targetUserId?: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}
