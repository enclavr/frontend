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
  urls: string | string[];
  username?: string;
  credential?: string;
}

export type MessageType = 'text' | 'user' | 'system' | 'image' | 'file';

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  type: MessageType;
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
  room_id?: string;
  room_name?: string;
  user_id?: string;
  username?: string;
  display_name?: string;
  content?: string;
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

export interface ServerEmoji {
  id: string;
  name: string;
  image_url: string;
  created_by: string;
  created_at: string;
}

export interface ServerSticker {
  id: string;
  name: string;
  image_url: string;
  created_by: string;
  created_at: string;
}

export interface SoundboardSound {
  id: string;
  name: string;
  audio_url: string;
  hotkey?: string;
  volume: number;
  created_by: string;
  created_at: string;
}

export interface AnalyticsOverview {
  total_messages: number;
  total_users: number;
  active_users: number;
  new_users: number;
  voice_minutes: number;
  messages_per_day: number;
}

export interface DailyActivity {
  date: string;
  message_count: number;
  user_count: number;
}

export interface ChannelStats {
  room_id: string;
  room_name: string;
  message_count: number;
  user_count: number;
}

export interface HourlyStats {
  hour: number;
  message_count: number;
  user_count: number;
}

export interface TopUser {
  user_id: string;
  username: string;
  avatar_url: string;
  message_count: number;
}

export interface PushSubscription {
  id: string;
  endpoint: string;
  is_active: boolean;
  device_id: string;
  device_os: string;
  created_at: string;
}

export interface NotificationSettings {
  enable_push: boolean;
  enable_dm_notifications: boolean;
  enable_mention_notifications: boolean;
  enable_room_notifications: boolean;
  enable_sound: boolean;
  notify_on_mobile: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export interface Ban {
  id: string;
  user_id: string;
  room_id: string;
  banned_by: string;
  reason: string;
  expires_at?: string;
  created_at: string;
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

export interface CreateBanRequest {
  user_id: string;
  room_id: string;
  reason: string;
  expires_at?: string;
}

export type ReportReason = 'spam' | 'harassment' | 'inappropriate_content' | 'violence' | 'misinformation' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  room_id: string;
  message_id?: string;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  reviewed_by?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
  reporter?: {
    id: string;
    username: string;
    display_name: string;
  };
  reported?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  room?: {
    id: string;
    name: string;
  };
}

export interface CreateReportRequest {
  reported_id: string;
  room_id: string;
  message_id?: string;
  reason: ReportReason;
  description: string;
}

export interface ServerSettings {
  id: string;
  server_name: string;
  server_description: string;
  allow_registration: boolean;
  max_rooms_per_user: number;
  max_members_per_room: number;
  enable_voice_chat: boolean;
  enable_direct_messages: boolean;
  enable_file_uploads: boolean;
  max_upload_size_mb: number;
  created_at: string;
  updated_at: string;
}

export interface TypingData {
  user_id: string;
  username?: string;
}

export interface VoiceUser {
  userId: string;
  username: string;
  isMuted: boolean;
  isSpeaking: boolean;
  isScreenSharing: boolean;
}
