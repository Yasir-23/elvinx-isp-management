// import axios from 'axios';
// const api = axios.create({ baseURL: '/api', timeout: 10000 });
// export default api;


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

export default api;
