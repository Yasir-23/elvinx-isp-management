// frontend/src/services/api.js
import axios from 'axios';

// Your existing config (keep it)
const api = axios.create({
  baseURL: '/api', // already points to backend through proxy
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
  transformResponse: [
    (data) => {
      try {
        return JSON.parse(data, (_, value) => {
          // Convert BigInt-like values safely
          if (typeof value === "string" && /^\d+n$/.test(value)) {
            return Number(value.slice(0, -1));
          }
          return value;
        });
      } catch {
        // If it's not JSON, return as-is
        return data;
      }
    },
  ],
});

// ✅ Attach token from localStorage for authorized requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// -----------------------------------------------------------------------------
// 2. RESPONSE INTERCEPTOR (Handles 401 Errors)
// -----------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => {
    // If the response is good, just pass it along
    return response;
  },
  (error) => {
    // Check if the error is 401 (Unauthorized)
    if (error.response && error.response.status === 401) {
      console.warn("Session expired or invalid. Redirecting to login...");

      // 1. Clear the bad credentials
      localStorage.removeItem('token');
      localStorage.removeItem('admin');

      // 2. Force redirect to Login page (if not already there)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Pass the error to your specific catch blocks (so toasts can still show)
    return Promise.reject(error);
  }
);

export default api;
