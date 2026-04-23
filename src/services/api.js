import axios from 'axios';
import { useAuthStore } from '@store/authStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
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

    // Si es error 401 y no es el endpoint de refresh
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/refresh')) {
      originalRequest._retry = true;

      const authStore = useAuthStore.getState();
      
      // Intentar refrescar el token
      if (authStore.refreshToken) {
        const success = await authStore.refreshAccessToken();
        
        if (success) {
          // Reintentar la petición original con el nuevo token
          originalRequest.headers.Authorization = `Bearer ${useAuthStore.getState().token}`;
          return api(originalRequest);
        } else {
          // Si falló el refresh (token inválido), redirigir al login sin mostrar error
          authStore.logout();
          // No rechazar el error, solo redirigir
          return Promise.reject({ ...error, silent: true });
        }
      }

      // Si no hay refresh token, cerrar sesión
      authStore.logout();
      return Promise.reject({ ...error, silent: true });
    }

    return Promise.reject(error);
  }
);

export default api;
