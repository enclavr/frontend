import type { ICEConfig } from '@/types';

export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export async function fetchICEServers(): Promise<RTCIceServer[]> {
  try {
    const apiUrl =
      typeof window !== 'undefined'
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
