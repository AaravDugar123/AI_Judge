import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";

export const api = axios.create({ 
  baseURL: "http://localhost:5002",
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Global error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string }>) => {
    const errorMap: Record<string, string> = {
      'ECONNREFUSED': 'Backend server is not running',
      'ECONNABORTED': 'Request timed out'
    };

    if (error.code && errorMap[error.code]) {
      toast.error(errorMap[error.code]);
    } else if (error.response) {
      const message = error.response.data?.error || 
                     (error.response.status === 500 ? 'Server error' : 'Request failed');
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

export const withLoading = async <T>(
  operation: () => Promise<T>,
  loadingMessage?: string
): Promise<T> => {
  const toastId = loadingMessage ? toast.loading(loadingMessage) : null;
  try {
    const result = await operation();
    if (toastId) toast.success('Success', { id: toastId });
    return result;
  } catch (error) {
    if (toastId) toast.dismiss(toastId);
    throw error;
  }
};
