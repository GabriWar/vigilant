/**
 * Cookies API client
 */
import { apiClient } from './client';

export interface Cookie {
  id: number;
  request_id: number;
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: string;
  created_at: string;
  updated_at: string;
}

export interface CookieWithExpirationInfo {
  cookie: Cookie;
  is_expired: boolean;
  expires_in_seconds: number | null;
}

export interface ExpiredCookieInfo {
  cookie: Cookie;
  expired_since_seconds: number;
}

export interface CookieStatistics {
  total: number;
  valid: number;
  expired: number;
  expiring_soon_24h: number;
  session: number;
}

export interface CleanupResponse {
  deleted_count: number;
  message: string;
}

export const cookiesApi = {
  /**
   * Get all cookies
   */
  getAll: async (params?: {
    skip?: number;
    limit?: number;
    include_expired?: boolean;
  }): Promise<Cookie[]> => {
    const response = await apiClient.get('/cookies', { params });
    return response.data;
  },

  /**
   * Get cookie by ID
   */
  getById: async (id: number): Promise<Cookie> => {
    const response = await apiClient.get(`/cookies/${id}`);
    return response.data;
  },

  /**
   * Get cookies expiring soon
   */
  getExpiringSoon: async (hours: number = 24): Promise<CookieWithExpirationInfo[]> => {
    const response = await apiClient.get('/cookies/expiring-soon', {
      params: { hours }
    });
    return response.data;
  },

  /**
   * Get expired cookies
   */
  getExpired: async (): Promise<ExpiredCookieInfo[]> => {
    const response = await apiClient.get('/cookies/expired');
    return response.data;
  },

  /**
   * Get cookie statistics
   */
  getStatistics: async (): Promise<CookieStatistics> => {
    const response = await apiClient.get('/cookies/statistics');
    return response.data;
  },

  /**
   * Cleanup expired cookies
   */
  cleanup: async (): Promise<CleanupResponse> => {
    const response = await apiClient.delete('/cookies/cleanup');
    return response.data;
  },
};
