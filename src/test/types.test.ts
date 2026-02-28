import { describe, it, expect, vi } from 'vitest';
import type { User, Room, Message, RoomCreate, Presence, Conversation, DirectMessage, Reaction, Category, Invite, ReactionWithCount, Role, RoomMember, Webhook, WebhookLog, SearchResult, UploadedFile, Ban, Report, ReportReason, ReportStatus, ServerEmoji, ServerSticker, SoundboardSound, AnalyticsOverview, DailyActivity, ChannelStats, HourlyStats, TopUser, CreateBanRequest, CreateReportRequest, TypingData, NotificationSettings, PushSubscription, ServerSettings, AuthResponse, ICEConfig, ICEServer, TypingUser, VoiceUser } from '@/types';

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

  describe('Invite type', () => {
    it('should have all required fields', () => {
      const invite: Invite = {
        id: 'invite-1',
        code: 'abc123',
        room_id: 'room-1',
        room_name: 'Test Room',
        created_by: 'user-1',
        expires_at: '2026-03-26T10:00:00Z',
        max_uses: 10,
        uses: 5,
        is_revoked: false,
        created_at: '2026-02-26T10:00:00Z',
      };
      
      expect(invite.code).toBe('abc123');
      expect(invite.is_revoked).toBe(false);
      expect(invite.uses).toBeLessThan(invite.max_uses);
    });

    it('should handle expired invite', () => {
      const invite: Invite = {
        id: 'invite-2',
        code: 'expired123',
        room_id: 'room-1',
        room_name: 'Test Room',
        created_by: 'user-1',
        expires_at: '2020-01-01T00:00:00Z',
        max_uses: 5,
        uses: 0,
        is_revoked: false,
        created_at: '2020-01-01T00:00:00Z',
      };
      
      expect(new Date(invite.expires_at).getTime()).toBeLessThan(Date.now());
    });

    it('should handle maxed out invite', () => {
      const invite: Invite = {
        id: 'invite-3',
        code: 'maxed123',
        room_id: 'room-1',
        room_name: 'Test Room',
        created_by: 'user-1',
        expires_at: '2026-03-26T10:00:00Z',
        max_uses: 5,
        uses: 5,
        is_revoked: false,
        created_at: '2026-02-26T10:00:00Z',
      };
      
      expect(invite.uses).toBe(invite.max_uses);
    });

    it('should handle revoked invite', () => {
      const invite: Invite = {
        id: 'invite-4',
        code: 'revoked123',
        room_id: 'room-1',
        room_name: 'Test Room',
        created_by: 'user-1',
        expires_at: '2026-03-26T10:00:00Z',
        max_uses: 10,
        uses: 2,
        is_revoked: true,
        created_at: '2026-02-26T10:00:00Z',
      };
      
      expect(invite.is_revoked).toBe(true);
    });
  });

  describe('ReactionWithCount type', () => {
    it('should have all required fields', () => {
      const reaction: ReactionWithCount = {
        emoji: '👍',
        count: 5,
        users: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'],
        has_reacted: true,
      };
      
      expect(reaction.count).toBe(5);
      expect(reaction.users.length).toBe(5);
      expect(reaction.has_reacted).toBe(true);
    });

    it('should handle reaction without user reaction', () => {
      const reaction: ReactionWithCount = {
        emoji: '❤️',
        count: 3,
        users: ['user-1', 'user-2', 'user-3'],
        has_reacted: false,
      };
      
      expect(reaction.has_reacted).toBe(false);
    });

    it('should handle single user reaction', () => {
      const reaction: ReactionWithCount = {
        emoji: '😂',
        count: 1,
        users: ['user-1'],
        has_reacted: true,
      };
      
      expect(reaction.count).toBe(1);
      expect(reaction.users).toHaveLength(1);
    });
  });

  describe('Role type', () => {
    it('should have all required fields', () => {
      const role: Role = {
        name: 'admin',
        permissions: ['manage_messages', 'kick_users', 'ban_users'],
      };
      
      expect(role.name).toBe('admin');
      expect(role.permissions).toHaveLength(3);
    });

    it('should handle role with no permissions', () => {
      const role: Role = {
        name: 'guest',
        permissions: [],
      };
      
      expect(role.permissions).toHaveLength(0);
    });

    it('should handle role with single permission', () => {
      const role: Role = {
        name: 'member',
        permissions: ['send_messages'],
      };
      
      expect(role.permissions).toHaveLength(1);
    });
  });

  describe('RoomMember type', () => {
    it('should have all required fields', () => {
      const member: RoomMember = {
        user_id: 'user-1',
        username: 'testuser',
        avatar_url: 'https://example.com/avatar.png',
        role: 'member',
        joined_at: '2026-02-26T10:00:00Z',
      };
      
      expect(member.role).toBe('member');
    });

    it('should handle admin role', () => {
      const member: RoomMember = {
        user_id: 'user-2',
        username: 'adminuser',
        avatar_url: '',
        role: 'admin',
        joined_at: '2026-02-26T10:00:00Z',
      };
      
      expect(member.role).toBe('admin');
    });

    it('should handle member with no avatar', () => {
      const member: RoomMember = {
        user_id: 'user-3',
        username: 'newuser',
        avatar_url: '',
        role: 'member',
        joined_at: '2026-02-26T10:00:00Z',
      };
      
      expect(member.avatar_url).toBe('');
    });
  });

  describe('Webhook type', () => {
    it('should have all required fields', () => {
      const webhook: Webhook = {
        id: 'webhook-1',
        room_id: 'room-1',
        url: 'https://example.com/webhook',
        events: ['message_created', 'message_deleted'],
        is_active: true,
        created_at: '2026-02-26T10:00:00Z',
      };
      
      expect(webhook.is_active).toBe(true);
      expect(webhook.events).toHaveLength(2);
    });

    it('should handle inactive webhook', () => {
      const webhook: Webhook = {
        id: 'webhook-2',
        room_id: 'room-1',
        url: 'https://example.com/webhook',
        events: ['message_created'],
        is_active: false,
        created_at: '2026-02-26T10:00:00Z',
      };
      
      expect(webhook.is_active).toBe(false);
    });

    it('should handle webhook with single event', () => {
      const webhook: Webhook = {
        id: 'webhook-3',
        room_id: 'room-1',
        url: 'https://example.com/webhook',
        events: ['user_joined'],
        is_active: true,
        created_at: '2026-02-26T10:00:00Z',
      };
      
      expect(webhook.events).toHaveLength(1);
    });
  });

  describe('WebhookLog type', () => {
    it('should have all required fields', () => {
      const log: WebhookLog = {
        id: 'log-1',
        webhook_id: 'webhook-1',
        event: 'message_created',
        payload: '{"content": "test"}',
        status_code: 200,
        success: true,
        error_message: '',
        response_body: 'OK',
        created_at: '2026-02-26T10:00:00Z',
      };
      
      expect(log.success).toBe(true);
      expect(log.status_code).toBe(200);
    });

    it('should handle failed webhook', () => {
      const log: WebhookLog = {
        id: 'log-2',
        webhook_id: 'webhook-1',
        event: 'message_created',
        payload: '{"content": "test"}',
        status_code: 500,
        success: false,
        error_message: 'Internal Server Error',
        response_body: '',
        created_at: '2026-02-26T10:00:00Z',
      };
      
      expect(log.success).toBe(false);
      expect(log.error_message).toBe('Internal Server Error');
    });
  });

  describe('SearchResult type', () => {
    it('should have all required fields', () => {
      const result: SearchResult = {
        id: 'msg-1',
        room_id: 'room-1',
        room_name: 'Test Room',
        user_id: 'user-1',
        username: 'testuser',
        display_name: 'Test User',
        content: 'Hello world',
        created_at: '2026-02-26T10:00:00Z',
      };
      
      expect(result.content).toBe('Hello world');
    });

    it('should handle search result with missing optional fields', () => {
      const result: SearchResult = {
        id: 'msg-2',
        created_at: '2026-02-26T10:00:00Z',
      };
      
      expect(result.room_id).toBeUndefined();
      expect(result.content).toBeUndefined();
    });
  });

  describe('UploadedFile type', () => {
    it('should have all required fields', () => {
      const file: UploadedFile = {
        id: 'file-1',
        user_id: 'user-1',
        room_id: 'room-1',
        message_id: 'msg-1',
        file_name: 'document.pdf',
        file_size: 1024000,
        content_type: 'application/pdf',
        url: 'https://example.com/files/document.pdf',
        is_deleted: false,
        created_at: '2026-02-26T10:00:00Z',
      };
      
      expect(file.file_size).toBe(1024000);
      expect(file.is_deleted).toBe(false);
    });

    it('should handle deleted file', () => {
      const file: UploadedFile = {
        id: 'file-2',
        user_id: 'user-1',
        room_id: 'room-1',
        file_name: 'deleted.txt',
        file_size: 100,
        content_type: 'text/plain',
        url: 'https://example.com/files/deleted.txt',
        is_deleted: true,
        created_at: '2026-02-26T10:00:00Z',
      };
      
      expect(file.is_deleted).toBe(true);
    });

    it('should handle file without message_id', () => {
      const file: UploadedFile = {
        id: 'file-3',
        user_id: 'user-1',
        room_id: 'room-1',
        file_name: 'standalone.pdf',
        file_size: 500000,
        content_type: 'application/pdf',
        url: 'https://example.com/files/standalone.pdf',
        is_deleted: false,
        created_at: '2026-02-26T10:00:00Z',
      };
      
      expect(file.message_id).toBeUndefined();
    });

    it('should handle various content types', () => {
      const contentTypes = [
        'image/png',
        'image/gif',
        'video/mp4',
        'audio/mpeg',
        'application/zip',
      ];
      
      contentTypes.forEach(contentType => {
        const file: UploadedFile = {
          id: 'file-x',
          user_id: 'user-1',
          room_id: 'room-1',
          file_name: 'file',
          file_size: 1000,
          content_type: contentType,
          url: 'https://example.com/file',
          is_deleted: false,
          created_at: '2026-02-26T10:00:00Z',
        };
        expect(file.content_type).toBe(contentType);
      });
    });
  });

  describe('Ban type', () => {
    it('should have all required fields', () => {
      const ban: Ban = {
        id: 'ban-1',
        user_id: 'user-banned',
        room_id: 'room-1',
        banned_by: 'admin',
        reason: 'Spam',
        created_at: '2026-02-26T10:00:00Z',
        user: {
          id: 'user-banned',
          username: 'spammer',
          display_name: 'Spam User',
          avatar_url: '',
        },
      };
      
      expect(ban.reason).toBe('Spam');
      expect(ban.expires_at).toBeUndefined();
    });

    it('should handle temporary ban with expiration', () => {
      const ban: Ban = {
        id: 'ban-2',
        user_id: 'user-2',
        room_id: 'room-1',
        banned_by: 'admin',
        reason: 'Temporary violation',
        expires_at: '2026-03-26T10:00:00Z',
        created_at: '2026-02-26T10:00:00Z',
        user: {
          id: 'user-2',
          username: 'tempuser',
          display_name: 'Temp User',
          avatar_url: '',
        },
      };
      
      expect(ban.expires_at).toBeDefined();
      expect(new Date(ban.expires_at!).getTime()).toBeGreaterThan(Date.now());
    });

    it('should handle permanent ban without expiration', () => {
      const ban: Ban = {
        id: 'ban-3',
        user_id: 'user-3',
        room_id: 'room-1',
        banned_by: 'admin',
        reason: 'Severe violation',
        created_at: '2026-02-26T10:00:00Z',
        user: {
          id: 'user-3',
          username: 'permauser',
          display_name: 'Permanent User',
          avatar_url: '',
        },
      };
      
      expect(ban.expires_at).toBeUndefined();
    });
  });

  describe('CreateBanRequest type', () => {
    it('should have required fields', () => {
      const request: CreateBanRequest = {
        user_id: 'user-1',
        room_id: 'room-1',
        reason: 'Spam',
      };
      
      expect(request.user_id).toBe('user-1');
      expect(request.reason).toBe('Spam');
    });

    it('should allow optional expires_at', () => {
      const request: CreateBanRequest = {
        user_id: 'user-1',
        room_id: 'room-1',
        reason: 'Violation',
        expires_at: '2026-03-26T10:00:00Z',
      };
      
      expect(request.expires_at).toBeDefined();
    });
  });

  describe('Report types', () => {
    it('should handle all report reasons', () => {
      const reasons: ReportReason[] = ['spam', 'harassment', 'inappropriate_content', 'violence', 'misinformation', 'other'];
      
      reasons.forEach(reason => {
        const report: CreateReportRequest = {
          reported_id: 'user-1',
          room_id: 'room-1',
          reason,
          description: 'Test report',
        };
        expect(report.reason).toBe(reason);
      });
    });

    it('should handle all report statuses', () => {
      const statuses: ReportStatus[] = ['pending', 'reviewed', 'resolved', 'dismissed'];
      
      statuses.forEach(status => {
        const report: Report = {
          id: 'report-1',
          reporter_id: 'user-1',
          reported_id: 'user-2',
          room_id: 'room-1',
          reason: 'spam',
          description: 'Spam content',
          status,
          created_at: '2026-02-26T10:00:00Z',
          updated_at: '2026-02-26T10:00:00Z',
        };
        expect(report.status).toBe(status);
      });
    });

    it('should handle report with message_id', () => {
      const report: Report = {
        id: 'report-1',
        reporter_id: 'user-1',
        reported_id: 'user-2',
        room_id: 'room-1',
        message_id: 'msg-1',
        reason: 'harassment',
        description: 'Harassing message',
        status: 'pending',
        created_at: '2026-02-26T10:00:00Z',
        updated_at: '2026-02-26T10:00:00Z',
      };
      
      expect(report.message_id).toBe('msg-1');
    });

    it('should handle reviewed report with notes', () => {
      const report: Report = {
        id: 'report-1',
        reporter_id: 'user-1',
        reported_id: 'user-2',
        room_id: 'room-1',
        reason: 'spam',
        description: 'Spam content',
        status: 'resolved',
        reviewed_by: 'admin',
        review_notes: 'User was warned',
        created_at: '2026-02-26T10:00:00Z',
        updated_at: '2026-02-26T12:00:00Z',
      };
      
      expect(report.reviewed_by).toBe('admin');
      expect(report.review_notes).toBe('User was warned');
    });
  });

  describe('ServerEmoji type', () => {
    it('should have all required fields', () => {
      const emoji: ServerEmoji = {
        id: 'emoji-1',
        name: 'wave',
        image_url: 'https://example.com/emoji/wave.png',
        created_by: 'admin',
        created_at: '2026-02-26T10:00:00Z',
      };
      
      expect(emoji.name).toBe('wave');
    });

    it('should handle emoji with special characters in name', () => {
      const emoji: ServerEmoji = {
        id: 'emoji-2',
        name: '123_numbers',
        image_url: 'https://example.com/emoji/123.png',
        created_by: 'admin',
        created_at: '2026-02-26T10:00:00Z',
      };
      
      expect(emoji.name).toBe('123_numbers');
    });
  });

  describe('ServerSticker type', () => {
    it('should have all required fields', () => {
      const sticker: ServerSticker = {
        id: 'sticker-1',
        name: 'happy',
        image_url: 'https://example.com/sticker/happy.png',
        created_by: 'admin',
        created_at: '2026-02-26T10:00:00Z',
      };
      
      expect(sticker.name).toBe('happy');
    });
  });

  describe('SoundboardSound type', () => {
    it('should have all required fields', () => {
      const sound: SoundboardSound = {
        id: 'sound-1',
        name: 'Airhorn',
        audio_url: 'https://example.com/sounds/airhorn.mp3',
        volume: 0.8,
        created_by: 'admin',
        created_at: '2026-02-26T10:00:00Z',
      };
      
      expect(sound.volume).toBe(0.8);
    });

    it('should handle sound with hotkey', () => {
      const sound: SoundboardSound = {
        id: 'sound-2',
        name: 'Drum Roll',
        audio_url: 'https://example.com/sounds/drum.mp3',
        hotkey: 'F1',
        volume: 1.0,
        created_by: 'admin',
        created_at: '2026-02-26T10:00:00Z',
      };
      
      expect(sound.hotkey).toBe('F1');
    });

    it('should handle sound with zero volume', () => {
      const sound: SoundboardSound = {
        id: 'sound-3',
        name: 'Silent',
        audio_url: 'https://example.com/sounds/silent.mp3',
        volume: 0,
        created_by: 'admin',
        created_at: '2026-02-26T10:00:00Z',
      };
      
      expect(sound.volume).toBe(0);
    });
  });

  describe('Analytics types', () => {
    it('should handle AnalyticsOverview', () => {
      const analytics: AnalyticsOverview = {
        total_messages: 10000,
        total_users: 500,
        active_users: 200,
        new_users: 50,
        voice_minutes: 3000,
        messages_per_day: 333.33,
      };
      
      expect(analytics.total_messages).toBe(10000);
      expect(analytics.active_users).toBeLessThan(analytics.total_users);
    });

    it('should handle DailyActivity', () => {
      const activity: DailyActivity = {
        date: '2026-02-26',
        message_count: 500,
        user_count: 100,
      };
      
      expect(activity.date).toBe('2026-02-26');
    });

    it('should handle ChannelStats', () => {
      const stats: ChannelStats = {
        room_id: 'room-1',
        room_name: 'General',
        message_count: 1000,
        user_count: 50,
      };
      
      expect(stats.message_count).toBeGreaterThan(0);
    });

    it('should handle HourlyStats', () => {
      const stats: HourlyStats = {
        hour: 14,
        message_count: 100,
        user_count: 20,
      };
      
      expect(stats.hour).toBeGreaterThanOrEqual(0);
      expect(stats.hour).toBeLessThan(24);
    });

    it('should handle TopUser', () => {
      const topUser: TopUser = {
        user_id: 'user-1',
        username: 'topuser',
        avatar_url: 'https://example.com/avatar.png',
        message_count: 5000,
      };
      
      expect(topUser.message_count).toBe(5000);
    });
  });

  describe('TypingData type', () => {
    it('should have required fields', () => {
      const typing: TypingData = {
        user_id: 'user-1',
        username: 'testuser',
      };
      
      expect(typing.user_id).toBe('user-1');
    });

    it('should handle typing data without username', () => {
      const typing: TypingData = {
        user_id: 'user-1',
      };
      
      expect(typing.username).toBeUndefined();
    });
  });

  describe('NotificationSettings type', () => {
    it('should have all required fields', () => {
      const settings: NotificationSettings = {
        enable_push: true,
        enable_dm_notifications: true,
        enable_mention_notifications: true,
        enable_room_notifications: true,
        enable_sound: true,
        notify_on_mobile: true,
        quiet_hours_enabled: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
      };
      
      expect(settings.enable_push).toBe(true);
      expect(settings.quiet_hours_enabled).toBe(false);
    });

    it('should handle quiet hours enabled', () => {
      const settings: NotificationSettings = {
        enable_push: false,
        enable_dm_notifications: true,
        enable_mention_notifications: true,
        enable_room_notifications: false,
        enable_sound: false,
        notify_on_mobile: false,
        quiet_hours_enabled: true,
        quiet_hours_start: '21:00',
        quiet_hours_end: '07:00',
      };
      
      expect(settings.quiet_hours_enabled).toBe(true);
    });

    it('should handle all notifications disabled', () => {
      const settings: NotificationSettings = {
        enable_push: false,
        enable_dm_notifications: false,
        enable_mention_notifications: false,
        enable_room_notifications: false,
        enable_sound: false,
        notify_on_mobile: false,
        quiet_hours_enabled: false,
        quiet_hours_start: '',
        quiet_hours_end: '',
      };
      
      expect(settings.enable_push).toBe(false);
      expect(settings.enable_dm_notifications).toBe(false);
    });
  });

  describe('PushSubscription type', () => {
    it('should have all required fields', () => {
      const sub: PushSubscription = {
        id: 'sub-1',
        endpoint: 'https://example.com/push',
        is_active: true,
        device_id: 'device-123',
        device_os: 'android',
        created_at: '2026-02-26T10:00:00Z',
      };
      
      expect(sub.is_active).toBe(true);
      expect(sub.device_os).toBe('android');
    });

    it('should handle inactive subscription', () => {
      const sub: PushSubscription = {
        id: 'sub-2',
        endpoint: 'https://example.com/push',
        is_active: false,
        device_id: 'device-456',
        device_os: 'ios',
        created_at: '2026-02-26T10:00:00Z',
      };
      
      expect(sub.is_active).toBe(false);
    });
  });

  describe('ServerSettings type', () => {
    it('should have all required fields', () => {
      const settings: ServerSettings = {
        id: 'settings-1',
        server_name: 'Enclavr',
        server_description: 'Voice chat platform',
        allow_registration: true,
        max_rooms_per_user: 10,
        max_members_per_room: 100,
        enable_voice_chat: true,
        enable_direct_messages: true,
        enable_file_uploads: true,
        max_upload_size_mb: 50,
        created_at: '2026-02-26T10:00:00Z',
        updated_at: '2026-02-26T10:00:00Z',
      };
      
      expect(settings.server_name).toBe('Enclavr');
      expect(settings.enable_voice_chat).toBe(true);
    });

    it('should handle minimal settings', () => {
      const settings: ServerSettings = {
        id: 'settings-2',
        server_name: 'Minimal Server',
        server_description: '',
        allow_registration: false,
        max_rooms_per_user: 5,
        max_members_per_room: 50,
        enable_voice_chat: false,
        enable_direct_messages: false,
        enable_file_uploads: false,
        max_upload_size_mb: 10,
        created_at: '2026-02-26T10:00:00Z',
        updated_at: '2026-02-26T10:00:00Z',
      };
      
      expect(settings.allow_registration).toBe(false);
    });
  });

  describe('Invite edge cases', () => {
    it('should handle invite without expiration', () => {
      const invite: Invite = {
        id: 'invite-no-exp',
        code: 'noexp123',
        room_id: 'room-1',
        room_name: 'Test Room',
        created_by: 'user-1',
        expires_at: '',
        max_uses: 0,
        uses: 0,
        is_revoked: false,
        created_at: '2026-02-26T10:00:00Z',
      };
      
      expect(invite.expires_at).toBe('');
      expect(invite.max_uses).toBe(0);
    });

    it('should handle invite with unlimited uses', () => {
      const invite: Invite = {
        id: 'invite-unlimited',
        code: 'unlimited123',
        room_id: 'room-1',
        room_name: 'Test Room',
        created_by: 'user-1',
        expires_at: '2026-03-26T10:00:00Z',
        max_uses: 0,
        uses: 100,
        is_revoked: false,
        created_at: '2026-02-26T10:00:00Z',
      };
      
      expect(invite.max_uses).toBe(0);
      expect(invite.uses).toBe(100);
    });
  });

  describe('Room edge cases', () => {
    it('should handle room with maximum users', () => {
      const room: Room = {
        id: 'max-room',
        name: 'Max Room',
        description: 'Room at max capacity',
        is_private: false,
        max_users: 1000,
        created_by: 'user-1',
        created_at: '2026-02-26T10:00:00Z',
        user_count: 1000,
      };
      
      expect(room.user_count).toBe(room.max_users);
    });

    it('should handle room with very long name', () => {
      const room: Room = {
        id: 'long-name',
        name: 'a'.repeat(100),
        description: 'Room with long name',
        is_private: false,
        max_users: 50,
        created_by: 'user-1',
        created_at: '2026-02-26T10:00:00Z',
        user_count: 1,
      };
      
      expect(room.name.length).toBe(100);
    });

    it('should handle room with unicode name', () => {
      const room: Room = {
        id: 'unicode-room',
        name: '日本語ルーム',
        description: 'Japanese room name',
        is_private: false,
        max_users: 50,
        created_by: 'user-1',
        created_at: '2026-02-26T10:00:00Z',
        user_count: 1,
      };
      
      expect(room.name).toBe('日本語ルーム');
    });
  });

  describe('Message edge cases', () => {
    it('should handle message with only whitespace', () => {
      const message: Message = {
        id: 'msg-whitespace',
        room_id: 'room-1',
        user_id: 'user-1',
        username: 'testuser',
        type: 'text',
        content: '   \n\t  ',
        is_edited: false,
        is_deleted: false,
        created_at: '2026-02-26T10:00:00Z',
      };
      
      expect(message.content).toBe('   \n\t  ');
    });

    it('should handle message with JSON content', () => {
      const message: Message = {
        id: 'msg-json',
        room_id: 'room-1',
        user_id: 'user-1',
        username: 'testuser',
        type: 'text',
        content: '{"key": "value", "nested": {"a": 1}}',
        is_edited: false,
        is_deleted: false,
        created_at: '2026-02-26T10:00:00Z',
      };
      
      expect(message.content).toContain('"key": "value"');
    });

    it('should handle message with newlines and special characters', () => {
      const message: Message = {
        id: 'msg-newlines',
        room_id: 'room-1',
        user_id: 'user-1',
        username: 'testuser',
        type: 'text',
        content: 'Line 1\nLine 2\r\nLine 3\tTabbed',
        is_edited: false,
        is_deleted: false,
        created_at: '2026-02-26T10:00:00Z',
      };
      
      expect(message.content).toContain('\n');
      expect(message.content).toContain('\r\n');
      expect(message.content).toContain('\t');
    });
  });

  describe('Presence edge cases', () => {
    it('should handle presence with very old last_seen', () => {
      const presence: Presence = {
        user_id: 'user-1',
        username: 'testuser',
        status: 'offline',
        last_seen: '2020-01-01T00:00:00Z',
      };
      
      expect(new Date(presence.last_seen).getFullYear()).toBe(2020);
    });

    it('should handle presence with future last_seen', () => {
      const presence: Presence = {
        user_id: 'user-1',
        username: 'testuser',
        status: 'online',
        last_seen: '2030-01-01T00:00:00Z',
      };
      
      expect(new Date(presence.last_seen).getFullYear()).toBe(2030);
    });
  });

  describe('AuthResponse type', () => {
    it('should have all required fields', () => {
      const response: AuthResponse = {
        access_token: 'token-123',
        refresh_token: 'refresh-123',
        expires_in: 3600,
        user: {
          id: 'user-1',
          username: 'testuser',
          email: 'test@example.com',
          display_name: 'Test User',
          avatar_url: '',
          is_admin: false,
        },
      };
      
      expect(response.access_token).toBe('token-123');
      expect(response.expires_in).toBe(3600);
    });

    it('should handle auth response with minimal user data', () => {
      const response: AuthResponse = {
        access_token: 'token',
        refresh_token: 'refresh',
        expires_in: 7200,
        user: {
          id: 'user-1',
          username: 'minuser',
          email: 'min@example.com',
          display_name: '',
          avatar_url: '',
          is_admin: false,
        },
      };
      
      expect(response.user.display_name).toBe('');
    });
  });

  describe('ICEConfig type', () => {
    it('should have all required fields', () => {
      const config: ICEConfig = {
        ice_servers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'], username: 'user', credential: 'pass' },
        ],
      };
      
      expect(config.ice_servers).toHaveLength(2);
    });

    it('should handle ICE server with single URL string', () => {
      const server: ICEServer = {
        urls: 'stun:stun.l.google.com:19302',
      };
      
      expect(typeof server.urls).toBe('string');
    });

    it('should handle ICE server with multiple URL array', () => {
      const server: ICEServer = {
        urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
      };
      
      expect(Array.isArray(server.urls)).toBe(true);
      expect(server.urls).toHaveLength(2);
    });

    it('should handle ICE server with credentials', () => {
      const server: ICEServer = {
        urls: 'stun:example.com:3478',
        username: 'user123',
        credential: 'password123',
      };
      
      expect(server.username).toBe('user123');
      expect(server.credential).toBe('password123');
    });
  });

  describe('TypingUser type', () => {
    it('should have required fields', () => {
      const typing: TypingUser = {
        user_id: 'user-1',
        username: 'testuser',
      };
      
      expect(typing.user_id).toBe('user-1');
    });

    it('should handle typing user with special characters', () => {
      const typing: TypingUser = {
        user_id: 'user-test_123',
        username: 'User Name @#$%',
      };
      
      expect(typing.username).toBe('User Name @#$%');
    });
  });

  describe('VoiceUser type', () => {
    it('should have all required fields', () => {
      const voiceUser: VoiceUser = {
        userId: 'user-1',
        username: 'testuser',
        isMuted: false,
        isSpeaking: false,
        isScreenSharing: false,
      };
      
      expect(voiceUser.userId).toBe('user-1');
      expect(voiceUser.isMuted).toBe(false);
      expect(voiceUser.isSpeaking).toBe(false);
      expect(voiceUser.isScreenSharing).toBe(false);
    });

    it('should handle muted user', () => {
      const voiceUser: VoiceUser = {
        userId: 'user-1',
        username: 'testuser',
        isMuted: true,
        isSpeaking: false,
        isScreenSharing: false,
      };
      
      expect(voiceUser.isMuted).toBe(true);
    });

    it('should handle speaking user', () => {
      const voiceUser: VoiceUser = {
        userId: 'user-1',
        username: 'testuser',
        isMuted: false,
        isSpeaking: true,
        isScreenSharing: false,
      };
      
      expect(voiceUser.isSpeaking).toBe(true);
    });

    it('should handle screen sharing user', () => {
      const voiceUser: VoiceUser = {
        userId: 'user-1',
        username: 'testuser',
        isMuted: true,
        isSpeaking: true,
        isScreenSharing: true,
      };
      
      expect(voiceUser.isScreenSharing).toBe(true);
    });

    it('should handle voice user with empty username', () => {
      const voiceUser: VoiceUser = {
        userId: 'user-1',
        username: '',
        isMuted: false,
        isSpeaking: false,
        isScreenSharing: false,
      };
      
      expect(voiceUser.username).toBe('');
    });

    it('should handle voice user with unicode username', () => {
      const voiceUser: VoiceUser = {
        userId: 'user-1',
        username: '用户1',
        isMuted: false,
        isSpeaking: false,
        isScreenSharing: false,
      };
      
      expect(voiceUser.username).toBe('用户1');
    });
  });

  describe('VoiceUser edge cases', () => {
    it('should handle all voice states combined', () => {
      const voiceUser: VoiceUser = {
        userId: 'user-1',
        username: 'testuser',
        isMuted: true,
        isSpeaking: true,
        isScreenSharing: true,
      };
      
      expect(voiceUser.isMuted).toBe(true);
      expect(voiceUser.isSpeaking).toBe(true);
      expect(voiceUser.isScreenSharing).toBe(true);
    });

    it('should handle user with very long userId', () => {
      const longId = 'user-' + 'a'.repeat(100);
      const voiceUser: VoiceUser = {
        userId: longId,
        username: 'testuser',
        isMuted: false,
        isSpeaking: false,
        isScreenSharing: false,
      };
      
      expect(voiceUser.userId.length).toBe(105);
    });
  });
});
