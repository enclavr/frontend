import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '@/lib/api';

describe('API Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    vi.stubGlobal('fetch', vi.fn());
  });

  describe('api methods exist', () => {
    it('should have setToken method', () => {
      expect(typeof api.setToken).toBe('function');
    });

    it('should have login method', () => {
      expect(typeof api.login).toBe('function');
    });

    it('should have register method', () => {
      expect(typeof api.register).toBe('function');
    });

    it('should have getRooms method', () => {
      expect(typeof api.getRooms).toBe('function');
    });

    it('should have createRoom method', () => {
      expect(typeof api.createRoom).toBe('function');
    });

    it('should have getMessages method', () => {
      expect(typeof api.getMessages).toBe('function');
    });

    it('should have getRoom method', () => {
      expect(typeof api.getRoom).toBe('function');
    });
  });

  describe('Token Management', () => {
    it('should return null when no token is set', () => {
      expect(api.getToken()).toBeNull();
    });

    it('should set and retrieve token', () => {
      api.setToken('test-token');
      expect(api.getToken()).toBe('test-token');
    });

    it('should clear token when null is passed', () => {
      api.setToken('test-token');
      api.setToken(null);
      expect(api.getToken()).toBeNull();
    });
  });

  describe('API Error Handling', () => {
    it('should throw error on non-ok response', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ message: 'Server error' }),
      } as unknown as Response);

      await expect(api.getRooms()).rejects.toThrow('Server error');
    });

    it('should handle error with no message', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({}),
      } as unknown as Response);

      await expect(api.getRooms()).rejects.toThrow('HTTP 400');
    });

    it('should handle network error', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      await expect(api.getRooms()).rejects.toThrow();
    });
  });

  describe('API Success Cases', () => {
    it('should parse successful response', async () => {
      const mockRooms = [{ id: '1', name: 'Room 1' }];
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockRooms),
      } as unknown as Response);

      const rooms = await api.getRooms();
      expect(rooms).toEqual(mockRooms);
    });
  });
});
