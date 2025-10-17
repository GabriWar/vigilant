import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { headersApi, Header, HeaderCreate, HeaderUpdate } from '@services/api/headers';

export const useHeaders = (activeOnly: boolean = false) => {
  return useQuery({
    queryKey: ['headers', { activeOnly }],
    queryFn: () => headersApi.getHeaders(activeOnly),
  });
};

export const useHeader = (id: number) => {
  return useQuery({
    queryKey: ['headers', id],
    queryFn: () => headersApi.getHeader(id),
    enabled: !!id,
  });
};

export const useCreateHeader = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: HeaderCreate) => headersApi.createHeader(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['headers'] });
    },
  });
};

export const useUpdateHeader = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: HeaderUpdate }) => 
      headersApi.updateHeader(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['headers'] });
      queryClient.invalidateQueries({ queryKey: ['headers', id] });
    },
  });
};

export const useDeleteHeader = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => headersApi.deleteHeader(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['headers'] });
    },
  });
};
