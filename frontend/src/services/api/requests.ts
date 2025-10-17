/**
 * Request API service
 */
import { apiClient } from './client';
import { API_ENDPOINTS } from '@constants/api';
import { Request, RequestCreate, RequestUpdate } from '@types/request';

export const requestApi = {
  /**
   * Get all requests
   */
  getAll: async (params?: { is_active?: boolean }) => {
    const { data } = await apiClient.get<Request[]>(API_ENDPOINTS.REQUESTS, { params });
    return data;
  },

  /**
   * Get single request
   */
  getById: async (id: number) => {
    const { data } = await apiClient.get<Request>(API_ENDPOINTS.REQUEST_DETAIL(id));
    return data;
  },

  /**
   * Create new request
   */
  create: async (request: RequestCreate) => {
    const { data } = await apiClient.post<Request>(API_ENDPOINTS.REQUESTS, request);
    return data;
  },

  /**
   * Update request
   */
  update: async (id: number, request: RequestUpdate) => {
    const { data } = await apiClient.put<Request>(API_ENDPOINTS.REQUEST_DETAIL(id), request);
    return data;
  },

  /**
   * Delete request
   */
  delete: async (id: number) => {
    await apiClient.delete(API_ENDPOINTS.REQUEST_DETAIL(id));
  },

  /**
   * Execute request
   */
  execute: async (id: number) => {
    const { data } = await apiClient.post<{ success: boolean; message: string }>(
      `${API_ENDPOINTS.REQUEST_DETAIL(id)}/execute`
    );
    return data;
  },

  /**
   * Test request without saving
   */
  test: async (testData: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
  }) => {
    const { data } = await apiClient.post<{
      status: number;
      statusText: string;
      headers: Record<string, string>;
      body: string;
      cookies?: string[];
    }>(`${API_ENDPOINTS.REQUESTS}/test/`, testData);
    return data;
  },
};