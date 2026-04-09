import axios from 'axios';

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't force redirect on 401 - let components handle authentication
    // The ProtectedRoute component already manages redirects for unauthenticated users
    if (error.response?.status === 401) {
      // Clear invalid session data
      localStorage.removeItem('token');
      localStorage.removeItem('delivery_user');
      // Don't redirect here - this causes infinite loops in the DeliveryProvider
      // Components will handle redirects via ProtectedRoute
    }
    return Promise.reject(error);
  }
);

export default api;
