import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { watchersApi } from '@/services/api/watchers';
import { 
  Watcher, 
  WatcherCreate, 
  WatcherUpdate, 
  WatcherStatistics 
} from '@/types/watcher';

// Query keys
export const watcherKeys = {
  all: ['watchers'] as const,
  lists: () => [...watcherKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...watcherKeys.lists(), filters] as const,
  details: () => [...watcherKeys.all, 'detail'] as const,
  detail: (id: number) => [...watcherKeys.details(), id] as const,
  statistics: () => [...watcherKeys.all, 'statistics'] as const,
};

// Hook to get watchers list
export const useWatchers = (filters?: {
  skip?: number;
  limit?: number;
  is_active?: boolean;
  execution_mode?: string;
  content_type?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: watcherKeys.list(filters || {}),
    queryFn: () => watchersApi.list(filters),
  });
};

// Hook to get single watcher
export const useWatcher = (id: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: watcherKeys.detail(id),
    queryFn: () => watchersApi.get(id),
    enabled: options?.enabled !== false && !!id,
  });
};

// Hook to get watcher statistics
export const useWatcherStatistics = () => {
  return useQuery({
    queryKey: watcherKeys.statistics(),
    queryFn: () => watchersApi.getStatistics(),
  });
};

// Hook to create watcher
export const useCreateWatcher = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: WatcherCreate) => watchersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: watcherKeys.lists() });
      queryClient.invalidateQueries({ queryKey: watcherKeys.statistics() });
    },
  });
};

// Hook to update watcher
export const useUpdateWatcher = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: WatcherUpdate }) => 
      watchersApi.update(id, data),
    onSuccess: (updatedWatcher) => {
      queryClient.invalidateQueries({ queryKey: watcherKeys.lists() });
      queryClient.invalidateQueries({ queryKey: watcherKeys.detail(updatedWatcher.id) });
      queryClient.invalidateQueries({ queryKey: watcherKeys.statistics() });
    },
  });
};

// Hook to delete watcher
export const useDeleteWatcher = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => watchersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: watcherKeys.lists() });
      queryClient.invalidateQueries({ queryKey: watcherKeys.statistics() });
    },
  });
};

// Hook to execute watcher
export const useExecuteWatcher = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => watchersApi.execute(id),
    onSuccess: (_, watcherId) => {
      queryClient.invalidateQueries({ queryKey: watcherKeys.detail(watcherId) });
      queryClient.invalidateQueries({ queryKey: watcherKeys.lists() });
      queryClient.invalidateQueries({ queryKey: watcherKeys.statistics() });
      // Also invalidate change logs since execution creates new logs
      queryClient.invalidateQueries({ queryKey: ['change-logs'] });
    },
  });
};
