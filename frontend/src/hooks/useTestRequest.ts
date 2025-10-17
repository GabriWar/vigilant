import { useMutation } from '@tanstack/react-query';
import { requestApi } from '@services/api/requests';

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
        return await requestApi.test(data);
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