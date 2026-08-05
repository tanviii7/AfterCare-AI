import axios from 'axios';

// Create custom axios instance
const api = axios.create({
  baseURL: '', // Proxied automatically in Vite dev server, empty in production (same port serving)
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
