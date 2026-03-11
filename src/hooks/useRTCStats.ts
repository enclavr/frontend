import { useEffect, useRef, useState } from 'react';

export interface RTCStats {
  timestamp: number;
  bytesReceived: number;
  bytesSent: number;
  packetsLost: number;
  packetsReceived: number;
  packetsSent: number;
  roundTripTime: number;
  jitter: number;
  audioLevel: number;
  connectionState: RTCPeerConnectionState;
}

export interface UseRTCStatsOptions {
  peerConnection: RTCPeerConnection | null;
  interval?: number;
  enabled?: boolean;
}

export function useRTCStats({
  peerConnection,
  interval = 1000,
  enabled = true,
}: UseRTCStatsOptions): RTCStats | null {
  const [stats, setStats] = useState<RTCStats | null>(null);
  const previousStatsRef = useRef<{
    bytesReceived: number;
    bytesSent: number;
    timestamp: number;
  } | null>(null);
  const mountedRef = useRef(true);
  const peerConnectionRef = useRef(peerConnection);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    peerConnectionRef.current = peerConnection;
    enabledRef.current = enabled;
  }, [peerConnection, enabled]);

  useEffect(() => {
    mountedRef.current = true;

    if (!peerConnection || !enabled) {
      return;
    }

    const collectStats = async () => {
      if (!mountedRef.current || !peerConnectionRef.current || !enabledRef.current) {
        return;
      }

      try {
        const rtcStats = await peerConnectionRef.current.getStats();
        const currentStats: RTCStats = {
          timestamp: Date.now(),
          bytesReceived: 0,
          bytesSent: 0,
          packetsLost: 0,
          packetsReceived: 0,
          packetsSent: 0,
          roundTripTime: 0,
          jitter: 0,
          audioLevel: 0,
          connectionState: peerConnectionRef.current.connectionState,
        };

        rtcStats.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.kind === 'audio') {
            currentStats.bytesReceived += report.bytesReceived || 0;
            currentStats.packetsReceived += report.packetsReceived || 0;
            currentStats.packetsLost += report.packetsLost || 0;
            currentStats.jitter = report.jitter || 0;
          }

          if (report.type === 'outbound-rtp' && report.kind === 'audio') {
            currentStats.bytesSent += report.bytesSent || 0;
            currentStats.packetsSent += report.packetsSent || 0;
          }

          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            currentStats.roundTripTime = report.currentRoundTripTime || 0;
          }
        });

        if (previousStatsRef.current) {
          const timeDelta =
            (currentStats.timestamp - previousStatsRef.current.timestamp) / 1000;
          if (timeDelta > 0) {
            const bytesReceivedDelta =
              currentStats.bytesReceived - previousStatsRef.current.bytesReceived;
            const bytesSentDelta =
              currentStats.bytesSent - previousStatsRef.current.bytesSent;

            currentStats.bytesReceived = Math.round(bytesReceivedDelta / timeDelta);
            currentStats.bytesSent = Math.round(bytesSentDelta / timeDelta);
          }
        }

        setStats(currentStats);
      } catch {
        // Silently ignore stats collection errors
      }
    };

    const intervalId = setInterval(collectStats, interval);
    collectStats();

    return () => {
      mountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [peerConnection, interval, enabled]);

  return stats;
}
