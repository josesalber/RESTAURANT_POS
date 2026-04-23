import axios from 'axios';
import { useAuthStore } from '@store/authStore';

// ❗ OBLIGATORIO: definir en Vercel
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error('❌ VITE_API_URL no está definida');
}

const api = axios.create({
  // 👉 agregamos /api aquí
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si es error 401 y no es refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      const authStore = useAuthStore.getState();

      if (authStore.refreshToken) {
        const success = await authStore.refreshAccessToken();

        if (success) {
          originalRequest.headers.Authorization = `Bearer ${useAuthStore.getState().token}`;
          return api(originalRequest);
        } else {
          authStore.logout();
          return Promise.reject({ ...error, silent: true });
        }
      }

      authStore.logout();
      return Promise.reject({ ...error, silent: true });
    }

    return Promise.reject(error);
  }
);

export default api;
