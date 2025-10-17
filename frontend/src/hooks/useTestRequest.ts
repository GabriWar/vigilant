import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@services/api/client';
import { watchersApi } from '@services/api/watchers';

interface TestRequestData {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
}

interface TestRequestResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  cookies?: string[];
}

export const useTestRequest = () => {
  return useMutation<TestRequestResponse, Error, TestRequestData>({
    mutationFn: async (data) => {
      try {
        // Create a temporary watcher for testing
        const testWatcher = await watchersApi.create({
          name: 'Test Watcher',
          url: data.url,
          method: data.method,
          headers: data.headers,
          body: data.body,
          execution_mode: 'manual',
          is_active: true
        });
        
        // Execute the watcher
        const result = await watchersApi.execute(testWatcher.id);
        
        // Delete the test watcher
        await watchersApi.delete(testWatcher.id);
        
        return result.result;
      } catch (error: any) {
        // Capturar informações detalhadas do erro
        const errorResponse = {
          error: error.message || 'Unknown error',
          errorDetails: {
            code: error.code,
            message: error.message,
            details: error.response?.data || error.response || error
          },
          requestData: data,
          status: error.response?.status,
          statusText: error.response?.statusText
        };
        throw errorResponse;
      }
    },
  });
};