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
});

// ✅ Attach token from localStorage for authorized requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
