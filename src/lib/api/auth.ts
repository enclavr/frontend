import { BaseApiClient } from './base';
import type { AuthResponse, User } from '@/types';

export class AuthApi extends BaseApiClient {
  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  }

  async login(username: string, password: string): Promise<AuthResponse | { require_2fa: boolean; user_id: string }> {
    return this.request<AuthResponse | { require_2fa: boolean; user_id: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async verify2FA(userId: string, code: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, code }),
    });
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  async getMe(): Promise<User> {
    return this.request<User>('/api/auth/me');
  }

  async getOAuthProviders(): Promise<{ google: boolean; github: boolean }> {
    return this.request<{ google: boolean; github: boolean }>('/api/auth/oauth/providers');
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/auth/password/forgot', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  }

  async validateResetToken(token: string): Promise<{ valid: boolean }> {
    return this.request<{ valid: boolean }>(`/api/auth/password/validate-token?token=${token}`);
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/auth/password/change', {
      method: 'POST',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    });
  }

  async get2FAStatus(): Promise<{ enabled: boolean }> {
    return this.request<{ enabled: boolean }>('/api/auth/2fa/status');
  }

  async setup2FA(): Promise<{ secret: string; qr_code_url: string; recovery_codes: string[] }> {
    return this.request<{ secret: string; qr_code_url: string; recovery_codes: string[] }>('/api/auth/2fa/setup', {
      method: 'POST',
    });
  }

  async enable2FA(code: string): Promise<{ enabled: boolean }> {
    return this.request<{ enabled: boolean }>('/api/auth/2fa/enable', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async disable2FA(code: string): Promise<{ enabled: boolean }> {
    return this.request<{ enabled: boolean }>('/api/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async getRecoveryCodes(): Promise<{ codes: string[] }> {
    return this.request<{ codes: string[] }>('/api/auth/2fa/recovery-codes');
  }

  async sendVerificationEmail(userId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/auth/email/verify/send', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/auth/email/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }
}

export const authApi = new AuthApi();
