'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
export type { VoiceUser } from '@/types';
import type { VoiceUser as VoiceUserType } from '@/types';
import {
  DEFAULT_ICE_SERVERS,
  fetchICEServers,
  createPeerConnection,
  setupPeerConnectionHandlers,
  createOffer,
  createAnswer,
  setRemoteDescription,
  addIceCandidate,
  closePeerConnection,
} from '@/lib/webrtc';
import type { UseWebRTCOptions, PeerConnection } from '@/lib/webrtc/types';

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
  const [voiceUsers, setVoiceUsers] = useState<VoiceUserType[]>([]);
  const [iceServers, setIceServers] = useState<RTCIceServer[]>(DEFAULT_ICE_SERVERS);

  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const toggleScreenShareRef = useRef<(() => Promise<void>) | null>(null);
  const peersRef = useRef<Map<string, PeerConnection>>(new Map());

  useEffect(() => {
    peersRef.current = peers;
  }, [peers]);

  useEffect(() => {
    fetchICEServers().then(setIceServers);
  }, []);

  const createPeerConnectionWithHandlers = useCallback(
    (targetUserId: string, initiator: boolean): PeerConnection => {
      const peer = createPeerConnection(targetUserId, userId, iceServers);

      setupPeerConnectionHandlers(
        peer.connection,
        targetUserId,
        (candidate) => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: 'voice-ice-candidate',
                targetUserId,
                candidate,
              })
            );
          }
        },
        (stream) => {
          setPeers((prev) => {
            const existing = prev.get(targetUserId);
            if (existing) {
              existing.stream = stream;
            }
            return new Map(prev);
          });
        }
      );

      return peer;
    },
    [iceServers, userId]
  );

  const handleOffer = useCallback(
    async (fromUserId: string, offer: RTCSessionDescriptionInit): Promise<void> => {
      const peer = peersRef.current.get(fromUserId);
      if (!peer) return;

      await setRemoteDescription(peer.connection, offer);
      const answer = await createAnswer(peer.connection);

      wsRef.current?.send(
        JSON.stringify({
          type: 'voice-answer',
          targetUserId: fromUserId,
          answer,
        })
      );
    },
    []
  );

  const handleAnswer = useCallback(
    async (fromUserId: string, answer: RTCSessionDescriptionInit): Promise<void> => {
      const peer = peersRef.current.get(fromUserId);
      if (!peer) return;

      await setRemoteDescription(peer.connection, answer);
    },
    []
  );

  const handleIceCandidate = useCallback(
    async (fromUserId: string, candidate: RTCIceCandidateInit): Promise<void> => {
      const peer = peersRef.current.get(fromUserId);
      if (!peer) return;

      await addIceCandidate(peer.connection, candidate);
    },
    []
  );

  const connect = useCallback(async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      setLocalStream(stream);

      const wsProtocol =
        typeof window !== 'undefined' && window.location.protocol === 'https:'
          ? 'wss:'
          : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/api/voice?room_id=${roomId}&user_id=${userId}&username=${encodeURIComponent(username)}`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = async () => {
        setIsConnected(true);

        peersRef.current.forEach(async (peer) => {
          const offer = await createOffer(peer.connection);
          ws.send(
            JSON.stringify({
              type: 'voice-offer',
              targetUserId: peer.userId,
              offer,
            })
          );
        });
      };

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'voice-offer': {
            const newPeer = createPeerConnectionWithHandlers(data.userId, false);
            await setRemoteDescription(newPeer.connection, data.offer);
            const answer = await createAnswer(newPeer.connection);

            setPeers((prev) => {
              prev.set(data.userId, newPeer);
              peersRef.current = new Map(prev);
              return new Map(prev);
            });

            ws.send(
              JSON.stringify({
                type: 'voice-answer',
                targetUserId: data.userId,
                answer,
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
          }
          case 'voice-answer':
            await handleAnswer(data.userId, data.answer);
            break;
          case 'voice-ice-candidate':
            await handleIceCandidate(data.userId, data.candidate);
            break;
          case 'user-joined': {
            const newPeer = createPeerConnectionWithHandlers(data.userId, true);
            const offer = await createOffer(newPeer.connection);

            setPeers((prev) => {
              prev.set(data.userId, newPeer);
              peersRef.current = new Map(prev);
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
          }
          case 'user-left': {
            const peer = peersRef.current.get(data.userId);
            if (peer) {
              closePeerConnection(peer.connection);
              peersRef.current.delete(data.userId);
              setPeers(new Map(peersRef.current));
            }
            setVoiceUsers((prev) => prev.filter((u) => u.userId !== data.userId));
            onUserLeft?.(data.userId);
            break;
          }
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
  }, [roomId, userId, username, createPeerConnectionWithHandlers, onUserJoined, onUserLeft, onUserMuted]);

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

    peersRef.current.forEach((peer) => closePeerConnection(peer.connection));
    peersRef.current = new Map();
    setPeers(new Map());
    setVoiceUsers([]);
    setIsScreenSharing(false);

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

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

        peersRef.current.forEach((peer) => {
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
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing && screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
      setScreenStream(null);
      setIsScreenSharing(false);

      peersRef.current.forEach((peer) => {
        const senders = peer.connection.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === 'video');
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
          toggleScreenShareRef.current?.();
        };

        screenStreamRef.current = stream;
        setScreenStream(stream);
        setIsScreenSharing(true);

        peersRef.current.forEach((peer) => {
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
  }, [isScreenSharing]);

  useEffect(() => {
    toggleScreenShareRef.current = toggleScreenShare;
  }, [toggleScreenShare]);

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
