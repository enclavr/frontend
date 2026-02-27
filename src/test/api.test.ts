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

    it('should handle token with special characters', () => {
      const specialToken = 'token/with+special=chars&more';
      api.setToken(specialToken);
      expect(api.getToken()).toBe(specialToken);
    });

    it('should handle very long token', () => {
      const longToken = 'a'.repeat(10000);
      api.setToken(longToken);
      expect(api.getToken()).toBe(longToken);
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

    it('should handle 401 unauthorized error', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ message: 'Unauthorized' }),
      } as unknown as Response);

      await expect(api.getRooms()).rejects.toThrow('Unauthorized');
    });

    it('should handle 403 forbidden error', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 403,
        json: vi.fn().mockResolvedValue({ message: 'Forbidden' }),
      } as unknown as Response);

      await expect(api.getRooms()).rejects.toThrow('Forbidden');
    });

    it('should handle 404 not found error', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValue({ message: 'Not found' }),
      } as unknown as Response);

      await expect(api.getRooms()).rejects.toThrow('Not found');
    });

    it('should handle 429 rate limit error', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 429,
        json: vi.fn().mockResolvedValue({ message: 'Too many requests' }),
      } as unknown as Response);

      await expect(api.getRooms()).rejects.toThrow('Too many requests');
    });

    it('should handle 500 internal server error', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ message: 'Internal server error' }),
      } as unknown as Response);

      await expect(api.getRooms()).rejects.toThrow('Internal server error');
    });

    it('should handle non-JSON response', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
        text: vi.fn().mockResolvedValue('Internal Server Error'),
      } as unknown as Response);

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

    it('should handle empty response body', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(null),
      } as unknown as Response);

      const result = await api.getRooms();
      expect(result).toBeNull();
    });

    it('should handle empty array response', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      } as unknown as Response);

      const rooms = await api.getRooms();
      expect(rooms).toEqual([]);
    });
  });

  describe('API Edge Cases', () => {
    it('should handle concurrent API calls', async () => {
      const mockRooms = [{ id: '1', name: 'Room 1' }];
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockRooms),
      } as unknown as Response);

      const [rooms1, rooms2] = await Promise.all([
        api.getRooms(),
        api.getRooms(),
      ]);

      expect(rooms1).toEqual(rooms2);
    });

    it('should include token in authorization header', async () => {
      api.setToken('test-token');
      
      const mockRooms = [{ id: '1', name: 'Room 1' }];
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockRooms),
      } as unknown as Response);

      await api.getRooms();

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should handle request timeout', async () => {
      const controller = new AbortController();
      vi.mocked(fetch).mockRejectedValue(new Error('AbortError'));
      
      await expect(api.getRooms()).rejects.toThrow();
    });
  });
});
