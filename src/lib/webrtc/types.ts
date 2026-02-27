export interface PeerConnection {
  peerId: string;
  userId: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

export interface VoiceUser {
  userId: string;
  username: string;
  isMuted: boolean;
  isSpeaking: boolean;
  isScreenSharing: boolean;
}

export interface UseWebRTCOptions {
  roomId: string;
  userId: string;
  username: string;
  onUserJoined?: (user: VoiceUser) => void;
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
