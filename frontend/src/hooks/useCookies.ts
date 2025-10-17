import { useQuery } from '@tanstack/react-query';
import { cookiesApi, Cookie } from '@services/api/cookies';

export const useCookies = (requestId?: number) => {
  return useQuery({
    queryKey: ['cookies', { requestId }],
    queryFn: () => cookiesApi.getCookies(requestId),
    enabled: !!requestId,
  });
};

export const useAllCookies = () => {
  return useQuery({
    queryKey: ['cookies', 'all'],
    queryFn: () => cookiesApi.getAllCookies(),
  });
};
