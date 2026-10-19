import { useCallback, useState } from 'react';

import { api, ApiError } from '@/services/api';
import { authService } from '@/services/auth.service';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const execute = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (err: any) {
      const message =
        err instanceof ApiError
          ? err.message
          : err?.message || 'Erro de conexão com o servidor.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback(
    async <T = any>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) => {
      return execute(async () => {
        const res = await api.get<T>(endpoint, { params });
        return res.data;
      });
    },
    [execute]
  );

  const post = useCallback(
    async <T = any>(endpoint: string, body?: any) => {
      return execute(async () => {
        const res = await api.post<T>(endpoint, body);
        return res.data;
      });
    },
    [execute]
  );

  const put = useCallback(
    async <T = any>(endpoint: string, body?: any) => {
      return execute(async () => {
        const res = await api.put<T>(endpoint, body);
        return res.data;
      });
    },
    [execute]
  );

  const del = useCallback(
    async <T = any>(endpoint: string) => {
      return execute(async () => {
        const res = await api.delete<T>(endpoint);
        return res.data;
      });
    },
    [execute]
  );

  return {
    loading,
    error,
    clearError,
    execute,
    get,
    post,
    put,
    del,
    api,
    authService,
  };
}
