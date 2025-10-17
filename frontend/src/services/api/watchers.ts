import { apiClient as client } from './client';
import { 
  Watcher, 
  WatcherCreate, 
  WatcherUpdate, 
  WatcherStatistics, 
  WatcherExecutionResult 
} from '@/types/watcher';

export const watchersApi = {
  // List watchers with optional filters
  list: async (params?: {
    skip?: number;
    limit?: number;
    is_active?: boolean;
    execution_mode?: string;
    content_type?: string;
    search?: string;
  }): Promise<Watcher[]> => {
    const response = await client.get('/api/watchers', { params });
    return response.data;
  },

  // Get watcher by ID
  get: async (id: number): Promise<Watcher> => {
    const response = await client.get(`/api/watchers/${id}`);
    return response.data;
  },

  // Create new watcher
  create: async (data: WatcherCreate): Promise<Watcher> => {
    const response = await client.post('/api/watchers', data);
    return response.data;
  },

  // Update watcher
  update: async (id: number, data: WatcherUpdate): Promise<Watcher> => {
    const response = await client.put(`/api/watchers/${id}`, data);
    return response.data;
  },

  // Delete watcher
  delete: async (id: number): Promise<void> => {
    await client.delete(`/api/watchers/${id}`);
  },

  // Execute watcher manually
  execute: async (id: number): Promise<{ message: string; result: WatcherExecutionResult }> => {
    const response = await client.post(`/api/watchers/${id}/execute`);
    return response.data;
  },

  // Get watcher statistics
  getStatistics: async (): Promise<WatcherStatistics> => {
    const response = await client.get('/api/watchers/statistics');
    return response.data;
  }
};
