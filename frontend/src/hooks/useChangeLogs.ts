/**
 * Change Logs hooks using React Query
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { changeLogsApi } from '@services/api/changeLogs';
import { 
  ChangeLogFiltersExtended, 
  ChangeLogWithDiff, 
  ChangeLogStatistics, 
  ChangeLogComparison 
} from '@types/changeLog';
import { PaginationParams } from '@types/api';

// Query keys
export const changeLogKeys = {
  all: ['changeLogs'] as const,
  lists: () => [...changeLogKeys.all, 'list'] as const,
  list: (filters: ChangeLogFiltersExtended & PaginationParams) => [...changeLogKeys.lists(), filters] as const,
  details: () => [...changeLogKeys.all, 'detail'] as const,
  detail: (id: number) => [...changeLogKeys.details(), id] as const,
  statistics: (filters: ChangeLogFiltersExtended) => [...changeLogKeys.all, 'statistics', filters] as const,
  comparison: (ids: number[]) => [...changeLogKeys.all, 'comparison', ids] as const,
};

/**
 * Hook to get change logs with filters
 */
export const useChangeLogs = (filters?: ChangeLogFiltersExtended & PaginationParams) => {
  return useQuery({
    queryKey: changeLogKeys.list(filters || {}),
    queryFn: () => changeLogsApi.getAll(filters),
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook to get a single change log with diff
 */
export const useChangeLog = (id: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: changeLogKeys.detail(id),
    queryFn: () => changeLogsApi.getById(id),
    enabled: !!id && (options?.enabled !== false),
    staleTime: 60000, // 1 minute
  });
};

/**
 * Hook to get change log statistics
 */
export const useChangeLogStatistics = (filters?: ChangeLogFiltersExtended) => {
  return useQuery({
    queryKey: changeLogKeys.statistics(filters || {}),
    queryFn: () => changeLogsApi.getStatistics(filters),
    staleTime: 60000, // 1 minute
  });
};

/**
 * Hook to compare change logs
 */
export const useCompareChangeLogs = (logIds: number[]) => {
  return useQuery({
    queryKey: changeLogKeys.comparison(logIds),
    queryFn: () => changeLogsApi.compare(logIds),
    enabled: logIds.length >= 2,
    staleTime: 300000, // 5 minutes
  });
};

/**
 * Hook to invalidate change log queries
 */
export const useInvalidateChangeLogs = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: changeLogKeys.all }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: changeLogKeys.lists() }),
    invalidateDetails: () => queryClient.invalidateQueries({ queryKey: changeLogKeys.details() }),
    invalidateStatistics: () => queryClient.invalidateQueries({ queryKey: changeLogKeys.all, predicate: (query) => query.queryKey[2] === 'statistics' }),
  };
};
