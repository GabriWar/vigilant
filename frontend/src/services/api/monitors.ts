/**
 * Monitor API service
 */
import { apiClient } from './client';
import { Monitor, MonitorCreate, MonitorUpdate } from '@types/monitor';
import { API_ENDPOINTS } from '@constants/api';
import { PaginationParams } from '@types/api';

export const monitorApi = {
  /**
   * Get all monitors
   */
  getAll: async (params?: PaginationParams & { is_active?: boolean; monitor_type?: string }) => {
    const { data } = await apiClient.get<Monitor[]>(API_ENDPOINTS.MONITORS, { params });
    return data;
  },

  /**
   * Get single monitor
   */
  getById: async (id: number) => {
    const { data } = await apiClient.get<Monitor>(API_ENDPOINTS.MONITOR_DETAIL(id));
    return data;
  },

  /**
   * Create new monitor
   */
  create: async (monitor: MonitorCreate) => {
    const { data } = await apiClient.post<Monitor>(API_ENDPOINTS.MONITORS, monitor);
    return data;
  },

  /**
   * Update monitor
   */
  update: async (id: number, monitor: MonitorUpdate) => {
    const { data } = await apiClient.put<Monitor>(API_ENDPOINTS.MONITOR_DETAIL(id), monitor);
    return data;
  },

  /**
   * Delete monitor
   */
  delete: async (id: number) => {
    await apiClient.delete(API_ENDPOINTS.MONITOR_DETAIL(id));
  },

  /**
   * Get monitor status
   */
  getStatus: async (id: number) => {
    const { data} = await apiClient.get<Monitor>(API_ENDPOINTS.MONITOR_STATUS(id));
    return data;
  },

  /**
   * Update monitor status
   */
  updateStatus: async (id: number, status: string, error_message?: string) => {
    const { data } = await apiClient.patch<Monitor>(
      API_ENDPOINTS.MONITOR_STATUS(id),
      { status, error_message }
    );
    return data;
  },

  /**
   * Test monitor request
   */
  testRequest: async (url: string, method: string = 'GET', headers: Record<string, string> = {}, body?: string, cookies?: Record<string, string>) => {
    const { data } = await apiClient.post('/api/requests/test/', {
      url,
      method,
      headers,
      body,
      cookies
    });
    return data;
  },
};
