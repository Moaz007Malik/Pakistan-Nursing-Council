import axios from 'axios';
import { API_BASE_URL } from '../config/env';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const auth = JSON.parse(localStorage.getItem('pnmc_auth') || 'null');
  if (auth?.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const auth = JSON.parse(localStorage.getItem('pnmc_auth') || 'null');
      if (auth?.refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken: auth.refreshToken,
          });
          const newAuth = {
            ...auth,
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken,
          };
          localStorage.setItem('pnmc_auth', JSON.stringify(newAuth));
          original.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(original);
        } catch {
          localStorage.removeItem('pnmc_auth');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
