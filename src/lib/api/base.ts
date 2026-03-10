import * as Sentry from '@sentry/nextjs';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export class BaseApiClient {
  protected token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token');
    }
    return this.token;
  }

  protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const startTime = Date.now();
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
        
        const error = new Error(errorData.message || `HTTP ${response.status}`);
        (error as any).status = response.status;
        (error as any).endpoint = endpoint;
        (error as any).method = options.method || 'GET';
        
        Sentry.withScope((scope) => {
          scope.setTag('api_error', 'true');
          scope.setTag('endpoint', endpoint);
          scope.setTag('method', options.method || 'GET');
          scope.setLevel('warning');
          scope.setExtra('status', response.status);
          scope.setExtra('duration', duration);
          scope.setExtra('response', errorData);
          
          if (response.status >= 500) {
            scope.setTag('severity', 'high');
            Sentry.captureException(error);
          } else if (response.status >= 400) {
            scope.setTag('severity', 'medium');
            Sentry.captureMessage(`API Error: ${response.status} on ${endpoint}`, 'warning');
          }
        });

        throw error;
      }

      if (duration > 3000) {
        Sentry.withScope((scope) => {
          scope.setTag('slow_request', 'true');
          scope.setTag('endpoint', endpoint);
          scope.setExtra('duration', duration);
          scope.setExtra('threshold', 3000);
          Sentry.captureMessage(`Slow API request: ${duration}ms on ${endpoint}`, 'info');
        });
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        Sentry.withScope((scope) => {
          scope.setTag('network_error', 'true');
          scope.setTag('endpoint', endpoint);
          scope.setLevel('error');
          scope.setExtra('duration', Date.now() - startTime);
          Sentry.captureException(error);
        });
      }
      throw error;
    }
  }
}

export const apiBase = new BaseApiClient();
