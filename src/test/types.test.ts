import { describe, it, expect, vi } from 'vitest';
import type { User, Room, Message } from '@/types';

describe('Type Definitions', () => {
  describe('User type', () => {
    it('should have required fields', () => {
      const user: User = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
      };
      
      expect(user.id).toBe('1');
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
    });

    it('should allow optional avatar_url field', () => {
      const user: User = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        avatar_url: 'https://example.com/avatar.png',
      };
      
      expect(user.avatar_url).toBe('https://example.com/avatar.png');
    });
  });

  describe('Room type', () => {
    it('should have required fields', () => {
      const room: Room = {
        id: '1',
        name: 'Test Room',
      };
      
      expect(room.id).toBe('1');
      expect(room.name).toBe('Test Room');
    });

    it('should allow optional description and password', () => {
      const room: Room = {
        id: '1',
        name: 'Private Room',
        description: 'A private room',
        password: 'secret',
        is_private: true,
      };
      
      expect(room.description).toBe('A private room');
      expect(room.password).toBe('secret');
      expect(room.is_private).toBe(true);
    });
  });

  describe('Message type', () => {
    it('should have required fields', () => {
      const message: Message = {
        id: '1',
        room_id: 'room-1',
        user_id: 'user-1',
        username: 'testuser',
        type: 'user',
        content: 'Hello!',
        is_edited: false,
        is_deleted: false,
        created_at: '2026-02-26T10:00:00Z',
        updated_at: '2026-02-26T10:00:00Z',
      };
      
      expect(message.id).toBe('1');
      expect(message.content).toBe('Hello!');
      expect(message.type).toBe('user');
    });

    it('should support system messages', () => {
      const message: Message = {
        id: '1',
        room_id: 'room-1',
        user_id: 'system',
        username: 'System',
        type: 'system',
        content: 'User joined the room',
        is_edited: false,
        is_deleted: false,
        created_at: '2026-02-26T10:00:00Z',
        updated_at: '2026-02-26T10:00:00Z',
      };
      
      expect(message.type).toBe('system');
      expect(message.username).toBe('System');
    });

    it('should track edited and deleted states', () => {
      const message: Message = {
        id: '1',
        room_id: 'room-1',
        user_id: 'user-1',
        username: 'testuser',
        type: 'user',
        content: 'Updated content',
        is_edited: true,
        is_deleted: false,
        created_at: '2026-02-26T10:00:00Z',
        updated_at: '2026-02-26T10:05:00Z',
      };
      
      expect(message.is_edited).toBe(true);
      expect(message.is_deleted).toBe(false);
    });
  });
});
