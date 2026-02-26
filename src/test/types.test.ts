import { describe, it, expect, vi } from 'vitest';
import type { User, Room, Message, RoomCreate, Presence, Conversation, DirectMessage, Reaction, Category } from '@/types';

describe('Type Definitions', () => {
  describe('User type', () => {
    it('should have all required fields', () => {
      const user: User = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        display_name: 'Test User',
        avatar_url: 'https://example.com/avatar.png',
        is_admin: false,
      };
      
      expect(user.id).toBe('1');
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.display_name).toBe('Test User');
      expect(user.avatar_url).toBe('https://example.com/avatar.png');
      expect(user.is_admin).toBe(false);
    });

    it('should handle admin user', () => {
      const adminUser: User = {
        id: '2',
        username: 'admin',
        email: 'admin@example.com',
        display_name: 'Administrator',
        avatar_url: 'https://example.com/admin.png',
        is_admin: true,
      };
      
      expect(adminUser.is_admin).toBe(true);
    });

    it('should handle user with default avatar', () => {
      const user: User = {
        id: '3',
        username: 'newuser',
        email: 'new@example.com',
        display_name: 'New User',
        avatar_url: '',
        is_admin: false,
      };
      
      expect(user.avatar_url).toBe('');
    });

    it('should handle user with special characters in username', () => {
      const user: User = {
        id: '4',
        username: 'user_name-123',
        email: 'special@example.com',
        display_name: 'User Name 123',
        avatar_url: 'https://example.com/special.png',
        is_admin: false,
      };
      
      expect(user.username).toBe('user_name-123');
    });
  });

  describe('Room type', () => {
    it('should have all required fields', () => {
      const room: Room = {
        id: '1',
        name: 'Test Room',
        description: 'A test room',
        is_private: false,
        max_users: 50,
        created_by: 'user-1',
        created_at: '2026-02-26T10:00:00Z',
        user_count: 5,
      };
      
      expect(room.id).toBe('1');
      expect(room.name).toBe('Test Room');
      expect(room.description).toBe('A test room');
      expect(room.is_private).toBe(false);
      expect(room.max_users).toBe(50);
      expect(room.created_by).toBe('user-1');
      expect(room.user_count).toBe(5);
    });

    it('should handle private room', () => {
      const room: Room = {
        id: '2',
        name: 'Private Room',
        description: 'A private room',
        is_private: true,
        max_users: 10,
        created_by: 'user-2',
        created_at: '2026-02-26T11:00:00Z',
        user_count: 3,
      };
      
      expect(room.is_private).toBe(true);
      expect(room.max_users).toBe(10);
    });

    it('should handle room at capacity', () => {
      const room: Room = {
        id: '3',
        name: 'Full Room',
        description: 'Room at max capacity',
        is_private: false,
        max_users: 5,
        created_by: 'user-3',
        created_at: '2026-02-26T12:00:00Z',
        user_count: 5,
      };
      
      expect(room.user_count).toBe(room.max_users);
    });

    it('should handle room with category', () => {
      const room: Room = {
        id: '4',
        name: 'Gaming Room',
        description: 'Gaming discussion',
        is_private: false,
        max_users: 100,
        created_by: 'user-4',
        created_at: '2026-02-26T13:00:00Z',
        user_count: 25,
        category_id: 'cat-gaming',
      };
      
      expect(room.category_id).toBe('cat-gaming');
    });

    it('should handle empty room', () => {
      const room: Room = {
        id: '5',
        name: 'Empty Room',
        description: '',
        is_private: false,
        max_users: 50,
        created_by: 'user-5',
        created_at: '2026-02-26T14:00:00Z',
        user_count: 0,
      };
      
      expect(room.user_count).toBe(0);
      expect(room.description).toBe('');
    });
  });

  describe('RoomCreate type', () => {
    it('should allow creating room with minimal fields', () => {
      const roomCreate: RoomCreate = {
        name: 'New Room',
      };
      
      expect(roomCreate.name).toBe('New Room');
      expect(roomCreate.description).toBeUndefined();
      expect(roomCreate.password).toBeUndefined();
    });

    it('should allow creating private room with password', () => {
      const roomCreate: RoomCreate = {
        name: 'Secret Room',
        description: 'A secret room',
        password: 'secret123',
        is_private: true,
        max_users: 5,
      };
      
      expect(roomCreate.password).toBe('secret123');
      expect(roomCreate.is_private).toBe(true);
      expect(roomCreate.max_users).toBe(5);
    });

    it('should handle default max users when not specified', () => {
      const roomCreate: RoomCreate = {
        name: 'Room',
      };
      
      expect(roomCreate.max_users).toBeUndefined();
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

    it('should handle deleted message', () => {
      const message: Message = {
        id: '1',
        room_id: 'room-1',
        user_id: 'user-1',
        username: 'testuser',
        type: 'user',
        content: '',
        is_edited: false,
        is_deleted: true,
        created_at: '2026-02-26T10:00:00Z',
        updated_at: '2026-02-26T10:10:00Z',
      };
      
      expect(message.is_deleted).toBe(true);
      expect(message.content).toBe('');
    });

    it('should handle message without updated_at', () => {
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
      };
      
      expect(message.updated_at).toBeUndefined();
    });

    it('should handle message with special characters', () => {
      const message: Message = {
        id: '1',
        room_id: 'room-1',
        user_id: 'user-1',
        username: 'testuser',
        type: 'user',
        content: 'Hello <script>alert("xss")</script>',
        is_edited: false,
        is_deleted: false,
        created_at: '2026-02-26T10:00:00Z',
      };
      
      expect(message.content).toContain('<script>');
    });

    it('should handle empty message content', () => {
      const message: Message = {
        id: '1',
        room_id: 'room-1',
        user_id: 'user-1',
        username: 'testuser',
        type: 'user',
        content: '',
        is_edited: false,
        is_deleted: false,
        created_at: '2026-02-26T10:00:00Z',
      };
      
      expect(message.content).toBe('');
    });

    it('should handle very long message content', () => {
      const longContent = 'a'.repeat(10000);
      const message: Message = {
        id: '1',
        room_id: 'room-1',
        user_id: 'user-1',
        username: 'testuser',
        type: 'user',
        content: longContent,
        is_edited: false,
        is_deleted: false,
        created_at: '2026-02-26T10:00:00Z',
      };
      
      expect(message.content.length).toBe(10000);
    });
  });

  describe('Presence type', () => {
    it('should have all required fields', () => {
      const presence: Presence = {
        user_id: 'user-1',
        username: 'testuser',
        status: 'online',
        last_seen: '2026-02-26T10:00:00Z',
      };
      
      expect(presence.status).toBe('online');
    });

    it('should handle all presence statuses', () => {
      const statuses: Presence['status'][] = ['online', 'away', 'busy', 'offline'];
      
      statuses.forEach(status => {
        const presence: Presence = {
          user_id: 'user-1',
          username: 'testuser',
          status,
          last_seen: '2026-02-26T10:00:00Z',
        };
        expect(presence.status).toBe(status);
      });
    });

    it('should handle presence with room_id', () => {
      const presence: Presence = {
        user_id: 'user-1',
        username: 'testuser',
        status: 'online',
        room_id: 'room-1',
        last_seen: '2026-02-26T10:00:00Z',
      };
      
      expect(presence.room_id).toBe('room-1');
    });
  });

  describe('Conversation type', () => {
    it('should have all required fields', () => {
      const conversation: Conversation = {
        user_id: 'user-1',
        username: 'friend',
        display_name: 'Friend Name',
        avatar_url: 'https://example.com/avatar.png',
        last_message: 'Hello there!',
        last_time: '2026-02-26T10:00:00Z',
        unread_count: 3,
      };
      
      expect(conversation.unread_count).toBe(3);
    });

    it('should handle conversation with no unread messages', () => {
      const conversation: Conversation = {
        user_id: 'user-1',
        username: 'friend',
        display_name: 'Friend Name',
        avatar_url: '',
        last_message: 'Seen message',
        last_time: '2026-02-26T10:00:00Z',
        unread_count: 0,
      };
      
      expect(conversation.unread_count).toBe(0);
    });
  });

  describe('DirectMessage type', () => {
    it('should have required fields', () => {
      const dm: DirectMessage = {
        id: 'dm-1',
        sender_id: 'user-1',
        receiver_id: 'user-2',
        content: 'Hello!',
        is_edited: false,
        is_deleted: false,
        created_at: '2026-02-26T10:00:00Z',
        updated_at: '2026-02-26T10:00:00Z',
        sender: {
          id: 'user-1',
          username: 'sender',
          email: 'sender@example.com',
          display_name: 'Sender User',
          avatar_url: '',
          is_admin: false,
        },
        receiver: {
          id: 'user-2',
          username: 'receiver',
          email: 'receiver@example.com',
          display_name: 'Receiver User',
          avatar_url: '',
          is_admin: false,
        },
      };
      
      expect(dm.id).toBe('dm-1');
      expect(dm.sender.id).toBe('user-1');
      expect(dm.receiver.id).toBe('user-2');
    });

    it('should handle edited direct message', () => {
      const dm: DirectMessage = {
        id: 'dm-1',
        sender_id: 'user-1',
        receiver_id: 'user-2',
        content: 'Edited message',
        is_edited: true,
        is_deleted: false,
        created_at: '2026-02-26T10:00:00Z',
        updated_at: '2026-02-26T10:05:00Z',
        sender: {
          id: 'user-1',
          username: 'sender',
          email: 'sender@example.com',
          display_name: 'Sender User',
          avatar_url: '',
          is_admin: false,
        },
        receiver: {
          id: 'user-2',
          username: 'receiver',
          email: 'receiver@example.com',
          display_name: 'Receiver User',
          avatar_url: '',
          is_admin: false,
        },
      };
      
      expect(dm.is_edited).toBe(true);
    });
  });

  describe('Reaction type', () => {
    it('should have required fields', () => {
      const reaction: Reaction = {
        id: 'reaction-1',
        message_id: 'message-1',
        user_id: 'user-1',
        username: 'testuser',
        emoji: '👍',
        created_at: '2026-02-26T10:00:00Z',
      };
      
      expect(reaction.emoji).toBe('👍');
    });

    it('should handle various emoji reactions', () => {
      const emojis = ['👍', '❤️', '😂', '😢', '😮', '🎉'];
      
      emojis.forEach(emoji => {
        const reaction: Reaction = {
          id: 'reaction-1',
          message_id: 'message-1',
          user_id: 'user-1',
          username: 'testuser',
          emoji,
          created_at: '2026-02-26T10:00:00Z',
        };
        expect(reaction.emoji).toBe(emoji);
      });
    });
  });

  describe('Category type', () => {
    it('should have required fields', () => {
      const category: Category = {
        id: 'cat-1',
        name: 'Gaming',
        sort_order: 1,
        created_at: '2026-02-26T10:00:00Z',
        room_count: 10,
      };
      
      expect(category.room_count).toBe(10);
    });

    it('should handle category with zero rooms', () => {
      const category: Category = {
        id: 'cat-2',
        name: 'Empty Category',
        sort_order: 2,
        created_at: '2026-02-26T10:00:00Z',
        room_count: 0,
      };
      
      expect(category.room_count).toBe(0);
    });
  });
});
