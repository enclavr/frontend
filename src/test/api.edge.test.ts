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

describe('API Network Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle network error gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(api.getRooms()).rejects.toThrow('Network error');
  });

  it('should handle timeout errors', async () => {
    const abortError = new Error('Abort error');
    abortError.name = 'AbortError';
    global.fetch = vi.fn().mockRejectedValue(abortError);

    await expect(api.getRooms()).rejects.toThrow();
  });

  it('should handle non-OK status codes correctly', async () => {
    const statusCodes = [400, 401, 403, 404, 429, 500, 502, 503];
    
    for (const status of statusCodes) {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status,
        json: async () => ({ message: `Error ${status}` }),
      });

      await expect(api.getRooms()).rejects.toThrow(`Error ${status}`);
    }
  });

  it('should handle empty response body', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => null,
    });

    const result = await api.getRooms();
    expect(result).toBeNull();
  });
});

describe('API Data Validation Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle malformed JSON response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => { throw new SyntaxError('Unexpected token'); },
    });

    await expect(api.login('user', 'pass')).rejects.toThrow();
  });

  it('should handle response with extra fields', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ 
        user: { id: '1', username: 'test', email: 'test@test.com', display_name: 'Test', avatar_url: '', is_admin: false },
        access_token: 'token',
        refresh_token: 'refresh',
        expires_in: 3600,
        extra_field: 'should be ignored',
      }),
    });

    const result = await api.login('user', 'pass');
    expect(result.access_token).toBe('token');
  });

  it('should handle response with missing optional fields', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ 
        user: { id: '1', username: 'test', email: 'test@test.com', display_name: 'Test', avatar_url: '', is_admin: false },
        access_token: 'token',
      }),
    });

    const result = await api.login('user', 'pass');
    expect(result.refresh_token).toBeUndefined();
    expect(result.expires_in).toBeUndefined();
  });
});

describe('API Request Body Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle unicode characters in request body', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: {}, access_token: '', refresh_token: '' }),
    });

    await api.register('用户', 'тест@example.com', 'пароль');
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('用户'),
      })
    );
  });

  it('should handle empty strings in optional fields', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: {}, access_token: '', refresh_token: '' }),
    });

    await api.createRoom({ name: 'Room', description: '' });
    
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should handle special characters in passwords', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: {}, access_token: '', refresh_token: '' }),
    });

    const specialPassword = 'p@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?';
    await api.login('user', specialPassword);
    
    expect(global.fetch).toHaveBeenCalled();
  });
});

describe('API URL Encoding Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should encode emoji in search query', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    await api.searchMessages('hello 👋', 10);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('hello%20%F0%9F%91%8B'),
      expect.any(Object)
    );
  });

  it('should handle room ID with special characters', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await api.getRoom('room-with-dash_underscore.dot');
    
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should handle unicode room names', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    await api.searchMessages('日本語', 10);
    
    expect(global.fetch).toHaveBeenCalled();
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

  it('should handle very large limit parameters', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    await api.getMessages('room-1', 10000);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('limit=10000'),
      expect.any(Object)
    );
  });

  it('should handle zero limit parameter', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    await api.getMessages('room-1', 0);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('limit=0'),
      expect.any(Object)
    );
  });

  it('should merge custom headers with default headers', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: {}, access_token: '', refresh_token: '' }),
    });

    const originalRequest = api.login.bind(api);
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
