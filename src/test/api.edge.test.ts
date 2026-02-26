import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

describe('API Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Token Management', () => {
    it('should set token in localStorage', () => {
      api.setToken('test-token');
      expect(localStorage.getItem('access_token')).toBe('test-token');
    });

    it('should remove token from localStorage when set to null', () => {
      localStorage.setItem('access_token', 'old-token');
      api.setToken(null);
      expect(localStorage.getItem('access_token')).toBeNull();
    });

    it('should return token from localStorage if not set in memory', () => {
      localStorage.setItem('access_token', 'stored-token');
      const token = api.getToken();
      expect(token).toBe('stored-token');
    });

    it('should return null if no token exists', () => {
      api.setToken(null);
      localStorage.clear();
      const token = api.getToken();
      expect(token).toBeFalsy();
    });
  });

  describe('Request Error Handling', () => {
    it('should throw error with message from response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });

      await expect(api.login('user', 'pass')).rejects.toThrow('Unauthorized');
    });

    it('should throw generic error when response has no message', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(api.login('user', 'pass')).rejects.toThrow('HTTP 500');
    });

    it('should throw generic error when JSON parsing fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => { throw new Error('Parse error'); },
      });

      await expect(api.login('user', 'pass')).rejects.toThrow('Request failed');
    });

    it('should include Authorization header when token exists', async () => {
      api.setToken('Bearer token');
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ user: {}, access_token: '', refresh_token: '' }),
      });

      await api.login('user', 'pass');

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/api/auth/login`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer Bearer token',
          }),
        })
      );
    });

    it('should not include Authorization header when no token', async () => {
      api.setToken(null);
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ user: {}, access_token: '', refresh_token: '' }),
      });

      await api.login('user', 'pass');

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/api/auth/login`,
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.any(String),
          }),
        })
      );
    });
  });

  describe('File Upload', () => {
    it('should upload file with FormData', async () => {
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'file-1',
          file_name: 'test.txt',
          file_size: 4,
          content_type: 'text/plain',
          url: 'https://example.com/test.txt',
        }),
      });

      const result = await api.uploadFile('room-1', mockFile);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/api/files`,
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result.id).toBe('file-1');
    });

    it('should handle upload error', async () => {
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 413,
        json: async () => ({ message: 'File too large' }),
      });

      await expect(api.uploadFile('room-1', mockFile)).rejects.toThrow('File too large');
    });
  });

  describe('Query Parameters', () => {
    it('should properly encode query parameters', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await api.searchMessages('hello world', 50);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/api/messages/search?q=hello%20world&limit=50`,
        expect.any(Object)
      );
    });

    it('should handle special characters in search query', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await api.searchMessages('test&query=special', 25);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/api/messages/search?q=test%26query%3Dspecial&limit=25`,
        expect.any(Object)
      );
    });
  });

  describe('API Methods', () => {
    it('should handle optional parameters correctly', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await api.getMessages('room-1');
      await api.getMessages('room-1', 100);

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should call correct endpoints for different methods', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await api.getRooms();
      await api.getRoom('room-1');
      await api.getCategories();

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/api/rooms`,
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/api/room?id=room-1`,
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/api/categories`,
        expect.any(Object)
      );
    });
  });
});

describe('API Content Types', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send JSON content type for regular requests', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: {}, access_token: '', refresh_token: '' }),
    });

    await api.login('user', 'pass');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });
});
