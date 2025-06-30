import { useAuth } from '@clerk/clerk-react';
import { useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useApi = () => {
  const { getToken } = useAuth();

  const apiCall = useCallback(async (
    endpoint: string, 
    options: RequestInit = {}
  ) => {
    try {
      const token = await getToken();
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }, [getToken]);

  return {
    get: (endpoint: string) => apiCall(endpoint),
    post: (endpoint: string, data: unknown) => apiCall(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    put: (endpoint: string, data: unknown) => apiCall(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    patch: (endpoint: string, data: unknown) => apiCall(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    delete: (endpoint: string) => apiCall(endpoint, {
      method: 'DELETE',
    }),
  };
};
