/**
 * Change Logs API service
 */
import { apiClient } from './client';
import { 
  ChangeLogListResponse, 
  ChangeLogWithDiff, 
  ChangeLogStatistics, 
  ChangeLogComparison,
  ChangeLogFiltersExtended 
} from '@types/changeLog';
import { API_ENDPOINTS } from '@constants/api';
import { PaginationParams } from '@types/api';

export const changeLogsApi = {
  /**
   * Get all change logs with filters
   */
  getAll: async (filters?: ChangeLogFiltersExtended & PaginationParams) => {
    const { data } = await apiClient.get<ChangeLogListResponse[]>(API_ENDPOINTS.CHANGE_LOGS, { 
      params: filters 
    });
    return data;
  },

  /**
   * Get single change log with diff
   */
  getById: async (id: number) => {
    const { data } = await apiClient.get<ChangeLogWithDiff>(API_ENDPOINTS.CHANGE_LOG_DETAIL(id));
    return data;
  },

  /**
   * Get change log statistics
   */
  getStatistics: async (filters?: ChangeLogFiltersExtended) => {
    const { data } = await apiClient.get<ChangeLogStatistics>(API_ENDPOINTS.CHANGE_LOG_STATISTICS, {
      params: filters
    });
    return data;
  },

  /**
   * Compare multiple change logs
   */
  compare: async (logIds: number[]) => {
    const { data } = await apiClient.post<ChangeLogComparison>(API_ENDPOINTS.CHANGE_LOG_COMPARE, {
      log_ids: logIds
    });
    return data;
  },
};
