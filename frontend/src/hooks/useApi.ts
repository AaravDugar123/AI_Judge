import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { AxiosResponse } from 'axios';

// Generic hook for API calls with loading and error states
export function useApi<T>(
  url: string,
  dependencies: any[] = [],
  options?: { immediate?: boolean }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response: AxiosResponse<T> = await api.get(url);
      setData(response.data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setData(null); // Clear stale data on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (options?.immediate !== false) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...dependencies]);

  return { data, loading, error, refetch: fetchData };
}

// Hook for mutations (POST, PUT, DELETE)
export function useMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<AxiosResponse<TData>>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (variables: TVariables): Promise<TData | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await mutationFn(variables);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}
