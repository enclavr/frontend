import { describe, it, expect } from 'vitest';
import { api } from '@/lib/api';

describe('API Module', () => {
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
});
