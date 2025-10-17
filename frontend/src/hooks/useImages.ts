/**
 * React Query hooks for images
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { imageApi } from '@services/api/images';
import { ImageCreate, ImageUpdate, ImageListParams } from '@types/image';

const QUERY_KEY = 'images';

export const useImages = (params?: ImageListParams) => {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => imageApi.getAll(params),
  });
};

export const useImage = (id: number) => {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => imageApi.getById(id),
    enabled: !!id,
  });
};

export const useDeleteImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => imageApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

export const useDownloadImage = () => {
  return useMutation({
    mutationFn: (id: number) => imageApi.download(id),
  });
};