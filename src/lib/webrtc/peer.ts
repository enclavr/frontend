import type { PeerConnection } from './types';

export function createPeerConnection(
  peerId: string,
  userId: string,
  iceServers: RTCIceServer[]
): PeerConnection {
  const pc = new RTCPeerConnection({ iceServers });

  return {
    peerId,
    userId,
    connection: pc,
  };
}

export function setupPeerConnectionHandlers(
  pc: RTCPeerConnection,
  peerId: string,
  onIceCandidate: (candidate: RTCIceCandidateInit) => void,
  onTrack: (stream: MediaStream) => void
): void {
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      onIceCandidate(event.candidate.toJSON());
    }
  };

  pc.ontrack = (event) => {
    if (event.streams[0]) {
      onTrack(event.streams[0]);
    }
  };
}

export async function createOffer(pc: RTCPeerConnection): Promise<RTCSessionDescriptionInit> {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  return offer;
}

export async function createAnswer(pc: RTCPeerConnection): Promise<RTCSessionDescriptionInit> {
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return answer;
}

export async function setRemoteDescription(
  pc: RTCPeerConnection,
  description: RTCSessionDescriptionInit
): Promise<void> {
  await pc.setRemoteDescription(new RTCSessionDescription(description));
}

export async function addIceCandidate(
  pc: RTCPeerConnection,
  candidate: RTCIceCandidateInit
): Promise<void> {
  await pc.addIceCandidate(new RTCIceCandidate(candidate));
}

export function closePeerConnection(pc: RTCPeerConnection): void {
  pc.close();
}
