'use client';

import { useEffect, useRef, useState } from 'react';
import { useWebRTC, VoiceUser } from '@/hooks/useWebRTC';
import { useMediaRecorder, RecorderControls } from './MediaRecorder';

interface VoiceChatProps {
  roomId: string;
  userId: string;
  username: string;
  onConnectionChange?: (connected: boolean) => void;
}

export function VoiceChat({ roomId, userId, username, onConnectionChange }: VoiceChatProps) {
  const {
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
  } = useWebRTC({
    roomId,
    userId,
    username,
  });

  const {
    status: recordingStatus,
    duration: recordingDuration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    downloadRecording,
    reset: resetRecording,
  } = useMediaRecorder();

  const [showRecorder, setShowRecorder] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && (localStream || screenStream)) {
      localVideoRef.current.srcObject = screenStream || localStream;
    }
  }, [localStream, screenStream, isVideoEnabled, isScreenSharing]);

  useEffect(() => {
    onConnectionChange?.(isConnected);
  }, [isConnected, onConnectionChange]);

  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    peers.forEach((peer) => {
      if (peer.stream) {
        let audio = audioRefs.current.get(peer.peerId);
        if (!audio) {
          audio = document.createElement('audio');
          audio.autoplay = true;
          audioRefs.current.set(peer.peerId, audio);
        }
        audio.srcObject = peer.stream;
      }
    });
  }, [peers]);

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Connecting to voice...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg overflow-hidden">
      <div className="p-4 bg-gray-700 border-b border-gray-600">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Voice Chat</h3>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-sm text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              {voiceUsers.length} connected
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2">
          {voiceUsers.map((user) => (
            <VoiceUserItem key={user.userId} user={user} isCurrentUser={user.userId === userId} />
          ))}
        </div>
      </div>

      <div className="p-4 bg-gray-700 border-t border-gray-600">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleScreenShare}
            className={`p-3 rounded-full transition-colors ${
              isScreenSharing
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-600 hover:bg-gray-500 text-white'
            }`}
            title={isScreenSharing ? 'Stop screen share' : 'Share screen'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => setShowRecorder(!showRecorder)}
            className={`p-3 rounded-full transition-colors ${
              showRecorder
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-600 hover:bg-gray-500 text-white'
            }`}
            title={showRecorder ? 'Hide recorder' : 'Show recorder'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              <circle cx="12" cy="10" r="3" fill="currentColor" />
            </svg>
          </button>
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-colors ${
              isVideoEnabled
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-600 hover:bg-gray-500 text-white'
            }`}
            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoEnabled ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
              </svg>
            )}
          </button>
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full transition-colors ${
              isMuted
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-600 hover:bg-gray-500 text-white'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>
          <button
            onClick={disconnect}
            className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
            title="Leave voice"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>
        </div>
      </div>

      {(isVideoEnabled || isScreenSharing) && localStream && (
        <div className="p-2 bg-gray-800 border-t border-gray-700">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-32 h-24 object-cover rounded-lg mx-auto"
          />
          {isScreenSharing && (
            <p className="text-center text-xs text-green-400 mt-1">Sharing screen</p>
          )}
        </div>
      )}

      {showRecorder && (
        <div className="p-2 bg-gray-800 border-t border-gray-700">
          <RecorderControls
            status={recordingStatus}
            duration={recordingDuration}
            onStartAudio={() => startRecording('audio')}
            onStartVideo={() => startRecording('video')}
            onStop={stopRecording}
            onPause={pauseRecording}
            onResume={resumeRecording}
            onDownload={downloadRecording}
            onReset={resetRecording}
          />
        </div>
      )}
    </div>
  );
}

function VoiceUserItem({ user, isCurrentUser }: { user: VoiceUser; isCurrentUser: boolean }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-700/50">
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
          {user.username.charAt(0).toUpperCase()}
        </div>
        {user.isMuted && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          </div>
        )}
        {user.isScreenSharing && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1">
        <p className="text-white text-sm font-medium">
          {user.username}
          {isCurrentUser && <span className="text-gray-400 ml-1">(you)</span>}
        </p>
        <p className="text-gray-400 text-xs">
          {user.isScreenSharing ? 'Sharing screen' : user.isMuted ? 'Muted' : 'Speaking'}
        </p>
      </div>
    </div>
  );
}
