import { apiClient } from './client';

export interface Header {
  id: number;
  name: string;
  value: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HeaderCreate {
  name: string;
  value: string;
  description?: string;
  is_active?: boolean;
}

export interface HeaderUpdate {
  name?: string;
  value?: string;
  description?: string;
  is_active?: boolean;
}

export const headersApi = {
  // Get all headers
  getHeaders: async (activeOnly: boolean = false): Promise<Header[]> => {
    const response = await apiClient.get(`/api/headers/?active_only=${activeOnly}`);
    return response.data;
  },

  // Get header by ID
  getHeader: async (id: number): Promise<Header> => {
    const response = await apiClient.get(`/api/headers/${id}`);
    return response.data;
  },

  // Create header
  createHeader: async (data: HeaderCreate): Promise<Header> => {
    const response = await apiClient.post('/api/headers/', data);
    return response.data;
  },

  // Update header
  updateHeader: async (id: number, data: HeaderUpdate): Promise<Header> => {
    const response = await apiClient.put(`/api/headers/${id}`, data);
    return response.data;
  },

  // Delete header
  deleteHeader: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/headers/${id}`);
  },
};
