/**
 * Logs (ChangeLogs) API client
 */
import { apiClient } from './client';

export interface ChangeLog {
  id: number;
  monitor_id?: number;
  request_id?: number;
  change_type: string;
  old_hash?: string;
  new_hash: string;
  old_size?: number;
  new_size: number;
  archive_path?: string;
  detected_at: string;
}

export interface ChangeLogStatistics {
  total: number;
  new: number;
  modified: number;
  error: number;
}

export const logsApi = {
  /**
   * Get all change logs
   */
  getAll: async (params?: {
    skip?: number;
    limit?: number;
    monitor_id?: number;
    request_id?: number;
    change_type?: string;
  }): Promise<ChangeLog[]> => {
    const response = await apiClient.get('/api/logs', { params });
    return response.data;
  },

  /**
   * Get change log by ID
   */
  getById: async (id: number): Promise<ChangeLog> => {
    const response = await apiClient.get(`/api/logs/${id}`);
    return response.data;
  },

  /**
   * Delete change log
   */
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/api/logs/${id}`);
    return response.data;
  },

  /**
   * Get change log statistics
   */
  getStatistics: async (): Promise<ChangeLogStatistics> => {
    const response = await apiClient.get('/api/logs/statistics');
    return response.data;
  },
};
