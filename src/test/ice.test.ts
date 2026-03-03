import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchICEServers, DEFAULT_ICE_SERVERS } from '@/lib/webrtc/ice';

describe('ICE Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchICEServers', () => {
    it('should return default ICE servers when fetch fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      
      const servers = await fetchICEServers();
      
      expect(servers).toEqual(DEFAULT_ICE_SERVERS);
    });

    it('should return default ICE servers when response is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });
      
      const servers = await fetchICEServers();
      
      expect(servers).toEqual(DEFAULT_ICE_SERVERS);
    });

    it('should return default ICE servers when response is 404', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });
      
      const servers = await fetchICEServers();
      
      expect(servers).toEqual(DEFAULT_ICE_SERVERS);
    });

    it('should return parsed ICE servers when fetch succeeds', async () => {
      const mockServers = {
        ice_servers: [
          { urls: 'stun:stun.example.com:19302' },
          { urls: 'stun:stun2.example.com:19302', username: 'user', credential: 'pass' },
        ],
      };
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockServers),
      });
      
      const servers = await fetchICEServers();
      
      expect(servers).toHaveLength(2);
      expect(servers[0]).toEqual({ urls: 'stun:stun.example.com:19302' });
      expect(servers[1]).toEqual({ 
        urls: 'stun:stun2.example.com:19302', 
        username: 'user', 
        credential: 'pass' 
      });
    });

    it('should handle empty ice_servers array', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ice_servers: [] }),
      });
      
      const servers = await fetchICEServers();
      
      expect(servers).toHaveLength(0);
    });

    it('should handle array of urls in ice server config', async () => {
      const mockServers = {
        ice_servers: [
          { urls: ['stun:stun1.example.com:19302', 'stun:stun2.example.com:19302'] },
        ],
      };
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockServers),
      });
      
      const servers = await fetchICEServers();
      
      expect(servers).toHaveLength(1);
      expect(servers[0].urls).toEqual(['stun:stun1.example.com:19302', 'stun:stun2.example.com:19302']);
    });

    it('should use defaults when JSON parsing fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });
      
      const servers = await fetchICEServers();
      
      expect(servers).toEqual(DEFAULT_ICE_SERVERS);
    });

    it('should log warning when fetch fails', async () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      
      await fetchICEServers();
      
      expect(consoleWarn).toHaveBeenCalled();
      consoleWarn.mockRestore();
    });
  });

  describe('DEFAULT_ICE_SERVERS', () => {
    it('should have at least one STUN server', () => {
      expect(DEFAULT_ICE_SERVERS.length).toBeGreaterThan(0);
    });

    it('should use standard Google STUN servers', () => {
      expect(DEFAULT_ICE_SERVERS[0].urls).toContain('stun.l.google.com');
    });
  });
});
