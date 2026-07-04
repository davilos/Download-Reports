import axios from 'axios';

/**
 * Pre-configured Axios instance for all API calls.
 * In production, set the baseURL to your real backend origin.
 */
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30_000,
});

// Inject JWT token from localStorage into every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
