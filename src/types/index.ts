export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  avatar_url: string;
  is_admin: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  is_private: boolean;
  max_users: number;
  created_by: string;
  created_at: string;
  user_count: number;
  category_id?: string;
}

export interface RoomCreate {
  name: string;
  description?: string;
  password?: string;
  is_private?: boolean;
  max_users?: number;
  category_id?: string;
}

export interface Category {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
  room_count: number;
}

export interface ICEConfig {
  ice_servers:ICEServer[];
}

export interface ICEServer {
  urls: string[];
  username?: string;
  credential?: string;
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  type: string;
  content: string;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at?: string;
}

export interface TypingUser {
  user_id: string;
  username: string;
}

export interface Presence {
  user_id: string;
  username: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  room_id?: string;
  last_seen: string;
}

export interface Conversation {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  last_message: string;
  last_time: string;
  unread_count: number;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  sender: User;
  receiver: User;
}

export interface Invite {
  id: string;
  code: string;
  room_id: string;
  room_name: string;
  created_by: string;
  expires_at: string;
  max_uses: number;
  uses: number;
  is_revoked: boolean;
  created_at: string;
}

export interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  username: string;
  emoji: string;
  created_at: string;
}

export interface ReactionWithCount {
  emoji: string;
  count: number;
  users: string[];
  has_reacted: boolean;
}

export interface Role {
  name: string;
  permissions: string[];
}

export interface RoomMember {
  user_id: string;
  username: string;
  avatar_url: string;
  role: string;
  joined_at: string;
}

export interface Webhook {
  id: string;
  room_id: string;
  url: string;
  events: string[];
  is_active: boolean;
  created_at: string;
}

export interface WebhookCreate {
  url: string;
  events: string[];
}

export interface WebhookLog {
  id: string;
  webhook_id: string;
  event: string;
  payload: string;
  status_code: number;
  success: boolean;
  error_message: string;
  response_body: string;
  created_at: string;
}

export interface SearchResult {
  id: string;
  room_id: string;
  room_name: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
}

export interface UploadedFile {
  id: string;
  user_id: string;
  room_id: string;
  message_id?: string;
  file_name: string;
  file_size: number;
  content_type: string;
  url: string;
  is_deleted: boolean;
  created_at: string;
}
