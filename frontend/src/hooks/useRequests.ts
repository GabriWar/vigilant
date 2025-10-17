/**
 * React Query hooks for requests
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requestApi } from '@services/api/requests';
import { RequestCreate, RequestUpdate } from '@types/request';

const QUERY_KEY = 'requests';

export const useRequests = (params?: any) => {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => requestApi.getAll(params),
  });
};

export const useRequest = (id: number) => {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => requestApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RequestCreate) => requestApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

export const useUpdateRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RequestUpdate }) =>
      requestApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.id] });
    },
  });
};

export const useDeleteRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => requestApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

export const useExecuteRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => requestApi.execute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};