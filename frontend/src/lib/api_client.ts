import axios from 'axios';

const api_client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api_client.interceptors.request.use(
  (config) => {
    // Add JWT Token here if available from local storage or context
    const token = typeof window !== "undefined" ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api_client;
