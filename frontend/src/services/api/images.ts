/**
 * Images API service
 */
import { apiClient } from './client';
import { API_ENDPOINTS } from '@constants/api';
import { Image } from '@types/image';

export const imageApi = {
  /**
   * Get all images
   */
  getAll: async (params?: { 
    skip?: number; 
    limit?: number; 
    monitor_id?: number 
  }) => {
    const { data } = await apiClient.get<Image[]>(API_ENDPOINTS.IMAGES, { params });
    return data;
  },

  /**
   * Get single image
   */
  getById: async (id: number) => {
    const { data } = await apiClient.get<Image>(API_ENDPOINTS.IMAGE_DETAIL(id));
    return data;
  },

  /**
   * Delete image
   */
  delete: async (id: number) => {
    await apiClient.delete(API_ENDPOINTS.IMAGE_DETAIL(id));
  },

  /**
   * Download image
   */
  download: async (id: number) => {
    const response = await apiClient.get(API_ENDPOINTS.IMAGE_DOWNLOAD(id), {
      responseType: 'blob'
    });
    return response.data;
  },
};