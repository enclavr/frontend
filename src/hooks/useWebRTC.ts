'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

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

interface ICEServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

interface ICEConfig {
  ice_servers: ICEServer[];
}

interface UseWebRTCOptions {
  roomId: string;
  userId: string;
  username: string;
  onUserJoined?: (user: VoiceUser) => void;
  onUserLeft?: (userId: string) => void;
  onUserMuted?: (userId: string, isMuted: boolean) => void;
}

const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

async function fetchICEServers(): Promise<RTCIceServer[]> {
  try {
    const apiUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.host}/api`
      : '/api';
    const response = await fetch(`${apiUrl}/voice/ice`);
    if (response.ok) {
      const config: ICEConfig = await response.json();
      return config.ice_servers.map((server) => ({
        urls: server.urls,
        username: server.username,
        credential: server.credential,
      }));
    }
  } catch (error) {
    console.warn('Failed to fetch ICE config, using defaults:', error);
  }
  return DEFAULT_ICE_SERVERS;
}

export function useWebRTC({
  roomId,
  userId,
  username,
  onUserJoined,
  onUserLeft,
  onUserMuted,
}: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [peers, setPeers] = useState<Map<string, PeerConnection>>(new Map());
  const [voiceUsers, setVoiceUsers] = useState<VoiceUser[]>([]);
  const [iceServers, setIceServers] = useState<RTCIceServer[]>(DEFAULT_ICE_SERVERS);

  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    fetchICEServers().then(setIceServers);
  }, []);

  const createPeerConnection = useCallback(
    (peerId: string, initiator: boolean): RTCPeerConnection => {
      const pc = new RTCPeerConnection({ iceServers });

      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'voice-ice-candidate',
              targetUserId: peerId,
              candidate: event.candidate,
            })
          );
        }
      };

      pc.ontrack = (event) => {
        setPeers((prev) => {
          const peer = prev.get(peerId);
          if (peer) {
            peer.stream = event.streams[0];
          } else {
            prev.set(peerId, {
              peerId,
              userId: peerId,
              connection: pc,
              stream: event.streams[0],
            });
          }
          return new Map(prev);
        });
      };

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      return pc;
    },
    [iceServers]
  );

  const handleOffer = useCallback(
    async (peerId: string, offer: RTCSessionDescriptionInit) => {
      const pc = createPeerConnection(peerId, false);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      wsRef.current?.send(
        JSON.stringify({
          type: 'voice-answer',
          targetUserId: peerId,
          answer,
        })
      );
    },
    [createPeerConnection]
  );

  const handleAnswer = useCallback(
    async (peerId: string, answer: RTCSessionDescriptionInit) => {
      const peer = peers.get(peerId);
      if (peer) {
        await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    },
    [peers]
  );

  const handleIceCandidate = useCallback(
    async (peerId: string, candidate: RTCIceCandidateInit) => {
      const peer = peers.get(peerId);
      if (peer) {
        await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    },
    [peers]
  );

  const connect = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/voice?room_id=${roomId}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'voice-offer':
            await handleOffer(data.userId, data.offer);
            break;
          case 'voice-answer':
            await handleAnswer(data.userId, data.answer);
            break;
          case 'voice-ice-candidate':
            await handleIceCandidate(data.userId, data.candidate);
            break;
          case 'user-joined':
            const newPeer = createPeerConnection(data.userId, true);
            const offer = await newPeer.createOffer();
            await newPeer.setLocalDescription(offer);

            setPeers((prev) => {
              prev.set(data.userId, {
                peerId: data.userId,
                userId: data.userId,
                connection: newPeer,
              });
              return new Map(prev);
            });

            ws.send(
              JSON.stringify({
                type: 'voice-offer',
                targetUserId: data.userId,
                offer,
              })
            );

            onUserJoined?.({
              userId: data.userId,
              username: data.username,
              isMuted: false,
              isSpeaking: false,
              isScreenSharing: false,
            });

            setVoiceUsers((prev) => [
              ...prev,
              {
                userId: data.userId,
                username: data.username,
                isMuted: false,
                isSpeaking: false,
                isScreenSharing: false,
              },
            ]);
            break;
          case 'user-left':
            const peer = peers.get(data.userId);
            if (peer) {
              peer.connection.close();
              peers.delete(data.userId);
              setPeers(new Map(peers));
            }
            setVoiceUsers((prev) => prev.filter((u) => u.userId !== data.userId));
            onUserLeft?.(data.userId);
            break;
          case 'voice-mute':
          case 'voice-unmute':
            setVoiceUsers((prev) =>
              prev.map((u) =>
                u.userId === data.userId
                  ? { ...u, isMuted: data.type === 'voice-mute' }
                  : u
              )
            );
            onUserMuted?.(data.userId, data.type === 'voice-mute');
            break;
          case 'screen-share-started':
            setVoiceUsers((prev) =>
              prev.map((u) =>
                u.userId === data.userId
                  ? { ...u, isScreenSharing: true }
                  : u
              )
            );
            break;
          case 'screen-share-stopped':
            setVoiceUsers((prev) =>
              prev.map((u) =>
                u.userId === data.userId
                  ? { ...u, isScreenSharing: false }
                  : u
              )
            );
            break;
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current = ws;

      setVoiceUsers((prev) => [
        ...prev,
        { userId, username, isMuted: false, isSpeaking: false, isScreenSharing: false },
      ]);
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
    }
  }, [roomId, userId, username, createPeerConnection, handleOffer, handleAnswer, handleIceCandidate, peers, onUserJoined, onUserLeft, onUserMuted]);

  const disconnect = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
      setScreenStream(null);
    }

    peers.forEach((peer) => peer.connection.close());
    setPeers(new Map());
    setVoiceUsers([]);
    setIsScreenSharing(false);

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, [peers]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);

        wsRef.current?.send(
          JSON.stringify({
            type: audioTrack.enabled ? 'voice-unmute' : 'voice-mute',
          })
        );
      }
    }
  }, []);

  const toggleVideo = useCallback(async () => {
    const currentStream = localStreamRef.current;
    if (currentStream) {
      const videoTrack = currentStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        
        wsRef.current?.send(
          JSON.stringify({
            type: videoTrack.enabled ? 'video-enable' : 'video-disable',
          })
        );
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        const videoTrack = stream.getVideoTracks()[0];
        videoTrack.enabled = true;
        
        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsVideoEnabled(true);

        peers.forEach((peer) => {
          peer.connection.addTrack(videoTrack, stream);
        });

        wsRef.current?.send(
          JSON.stringify({
            type: 'video-enable',
          })
        );
      } catch (error) {
        console.error('Failed to enable video:', error);
      }
    }
  }, [peers]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing && screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
      setScreenStream(null);
      setIsScreenSharing(false);

      peers.forEach((peer) => {
        const senders = peer.connection.getSenders();
        const videoSender = senders.find(s => s.track?.kind === 'video');
        if (videoSender) {
          const currentStream = localStreamRef.current;
          if (currentStream) {
            const videoTrack = currentStream.getVideoTracks()[0];
            if (videoTrack) {
              videoSender.replaceTrack(videoTrack);
            }
          }
        }
      });

      wsRef.current?.send(
        JSON.stringify({
          type: 'screen-share-stopped',
        })
      );
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });

        const screenTrack = stream.getVideoTracks()[0];
        screenTrack.onended = () => {
          toggleScreenShare();
        };

        screenStreamRef.current = stream;
        setScreenStream(stream);
        setIsScreenSharing(true);

        peers.forEach((peer) => {
          peer.connection.addTrack(screenTrack, stream);
        });

        wsRef.current?.send(
          JSON.stringify({
            type: 'screen-share-started',
          })
        );
      } catch (error) {
        console.error('Failed to start screen sharing:', error);
      }
    }
  }, [isScreenSharing, peers]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    localStream,
    screenStream,
    isConnected,
    isMuted,
    isVideoEnabled,
    isScreenSharing,
    peers,
    voiceUsers,
    connect,
    disconnect,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
  };
}
