/**
 * React Query hooks for monitors
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { monitorApi } from '@services/api/monitors';
import { MonitorCreate, MonitorUpdate } from '@types/monitor';

const QUERY_KEY = 'monitors';

export const useMonitors = (params?: any) => {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => monitorApi.getAll(params),
  });
};

export const useMonitor = (id: number) => {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => monitorApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateMonitor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MonitorCreate) => monitorApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

export const useUpdateMonitor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: MonitorUpdate }) =>
      monitorApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.id] });
    },
  });
};

export const useDeleteMonitor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => monitorApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

export const useTestRequest = () => {
  return useMutation({
    mutationFn: ({ url, method, headers, body }: { 
      url: string; 
      method?: string; 
      headers?: Record<string, string>; 
      body?: string; 
    }) => monitorApi.testRequest(url, method, headers, body),
  });
};
