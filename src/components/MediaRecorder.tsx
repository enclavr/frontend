'use client';

import { useState, useRef, useEffect } from 'react';

type RecordingType = 'audio' | 'video';

interface MediaRecorderHook {
  status: 'idle' | 'recording' | 'paused' | 'stopped';
  mediaBlob: Blob | null;
  mediaBlobUrl: string | null;
  duration: number;
  startRecording: (type: RecordingType) => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  downloadRecording: () => void;
  reset: () => void;
}

export function useMediaRecorder(): MediaRecorderHook {
  const [status, setStatus] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [mediaBlobUrl, setMediaBlobUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (mediaBlobUrl) {
        URL.revokeObjectURL(mediaBlobUrl);
      }
    };
  }, [mediaBlobUrl]);

  const startRecording = async (type: RecordingType) => {
    try {
      const constraints: MediaStreamConstraints = type === 'video' 
        ? { video: true, audio: true }
        : { audio: true };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      chunksRef.current = [];

      let mimeType = type === 'video' ? 'video/webm;codecs=vp9,opus' : 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = type === 'video' ? 'video/webm' : 'audio/webm';
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { 
          type: type === 'video' ? 'video/webm' : 'audio/webm' 
        });
        setMediaBlob(blob);
        setMediaBlobUrl(URL.createObjectURL(blob));
        setStatus('stopped');
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start(1000);
      setStatus('recording');
      
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setStatus('paused');
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setStatus('recording');
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    }
  };

  const downloadRecording = () => {
    if (mediaBlob && mediaBlobUrl) {
      const a = document.createElement('a');
      a.href = mediaBlobUrl;
      a.download = `recording-${new Date().toISOString()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const reset = () => {
    if (mediaBlobUrl) {
      URL.revokeObjectURL(mediaBlobUrl);
    }
    setStatus('idle');
    setMediaBlob(null);
    setMediaBlobUrl(null);
    setDuration(0);
    chunksRef.current = [];
  };

  return {
    status,
    mediaBlob,
    mediaBlobUrl,
    duration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    downloadRecording,
    reset,
  };
}

interface RecorderControlsProps {
  status: 'idle' | 'recording' | 'paused' | 'stopped';
  duration: number;
  onStartAudio: () => void;
  onStartVideo: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onDownload: () => void;
  onReset: () => void;
}

export function RecorderControls({
  status,
  duration,
  onStartAudio,
  onStartVideo,
  onStop,
  onPause,
  onResume,
  onDownload,
  onReset,
}: RecorderControlsProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isRecording = status === 'recording';
  const isPaused = status === 'paused';

  return (
    <div className="flex flex-col items-center gap-2 p-3 bg-gray-800 rounded-lg">
      {isRecording && (
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
          <span className="text-white font-mono">{formatDuration(duration)}</span>
          {isPaused && <span className="text-yellow-400 text-sm">(paused)</span>}
        </div>
      )}

      <div className="flex gap-2">
        {!isRecording && !isPaused && status !== 'stopped' && (
          <>
            <button
              onClick={onStartAudio}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
              title="Record audio"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
              Audio
            </button>
            <button
              onClick={onStartVideo}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
              title="Record video"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
              </svg>
              Video
            </button>
          </>
        )}

        {isRecording && (
          <>
            <button
              onClick={onPause}
              className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded"
              title="Pause"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            </button>
            <button
              onClick={onStop}
              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded"
              title="Stop"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z"/>
              </svg>
            </button>
          </>
        )}

        {isPaused && (
          <>
            <button
              onClick={onResume}
              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded"
              title="Resume"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
            <button
              onClick={onStop}
              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded"
              title="Stop"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z"/>
              </svg>
            </button>
          </>
        )}

        {status === 'stopped' && (
          <>
            <button
              onClick={onDownload}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
              title="Download"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
              Download
            </button>
            <button
              onClick={onReset}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
              title="New recording"
            >
              New
            </button>
          </>
        )}
      </div>
    </div>
  );
}
