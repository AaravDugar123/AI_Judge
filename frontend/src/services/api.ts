import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";

// Create API client with proper configuration
export const api = axios.create({ 
  baseURL: "http://localhost:5002", // Backend runs on port 5002
  timeout: 30000, // 30 second timeout for LLM operations
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error: AxiosError<{ error?: string }>) => {
    console.error('API Response Error:', error);
    
    // Handle different error types
    if (error.code === 'ECONNREFUSED') {
      toast.error('Backend server is not running. Please start the server on port 5002.');
    } else if (error.response?.status === 400) {
      // Validation errors - show the specific error message from backend
      const errorMessage = error.response.data?.error || 'Invalid request';
      toast.error(errorMessage);
    } else if (error.response?.status === 404) {
      toast.error('API endpoint not found');
    } else if (error.response?.status === 500) {
      toast.error('Internal server error. Check backend logs.');
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timed out. This may happen with long-running AI evaluations.');
    } else {
      toast.error(`API Error: ${error.message}`);
    }
    
    return Promise.reject(error);
  }
);

// Helper function for handling async operations with loading states
export const withLoading = async <T>(
  operation: () => Promise<T>,
  loadingMessage?: string
): Promise<T> => {
  const toastId = loadingMessage ? toast.loading(loadingMessage) : null;
  try {
    const result = await operation();
    if (toastId) toast.success('Operation completed successfully', { id: toastId });
    return result;
  } catch (error) {
    if (toastId) toast.dismiss(toastId);
    throw error;
  }
};
