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
}

export interface RoomCreate {
  name: string;
  description?: string;
  password?: string;
  is_private?: boolean;
  max_users?: number;
}

export interface ICEConfig {
  ice_servers:ICEServer[];
}

export interface ICEServer {
  urls: string[];
  username?: string;
  credential?: string;
}
