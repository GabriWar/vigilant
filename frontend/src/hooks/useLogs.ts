/**
 * React Query hooks for logs
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logsApi } from '@services/api/logs';

const QUERY_KEY = 'logs';

export const useLogs = (params?: any) => {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => logsApi.getAll(params),
  });
};

export const useLog = (id: number) => {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => logsApi.getById(id),
    enabled: !!id,
  });
};

export const useLogStatistics = () => {
  return useQuery({
    queryKey: [QUERY_KEY, 'statistics'],
    queryFn: () => logsApi.getStatistics(),
  });
};

export const useDeleteLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => logsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};