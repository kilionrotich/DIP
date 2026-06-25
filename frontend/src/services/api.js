import axios from 'axios';

const api = axios.create({
  // Deployed backend (used when env var is not set at build time)
  baseURL: process.env.REACT_APP_API_BASE_URL || 'https://dip-5u7u.onrender.com',
});

// helpful for local debugging
if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line no-console
  console.log('API baseURL:', api.defaults.baseURL);
}


api.interceptors.request.use((config) => {

  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

