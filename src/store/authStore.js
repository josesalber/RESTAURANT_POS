import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@services/api';

// Función helper para decodificar JWT
const decodeJWT = (token) => {
  try {
    const payload = token.split('.')[1];
    // Convertir base64url a base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // Decodificar
    return JSON.parse(atob(base64));
  } catch (error) {
    console.error('Error decodificando token:', error);
    return null;
  }
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isInitialized: false,

      // Login con usuario y contraseña
      login: async (usuario, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', { username: usuario, password });
          const { user, accessToken, refreshToken } = response.data.data;

          // Decodificar token para obtener rol
          const tokenPayload = decodeJWT(accessToken);
          
          console.log('Login normal - Token payload:', tokenPayload);
          console.log('Login normal - Rol del token:', tokenPayload?.rol);
          
          set({
            user: { ...user, rol: tokenPayload.rol },
            token: accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          // Configurar token en axios
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Error al iniciar sesión';
          set({ isLoading: false, error: message });
          return { success: false, message };
        }
      },

      // Login con PIN (para tablets)
      loginWithPin: async (pin) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login-pin', { pin });
          const { user, accessToken, refreshToken } = response.data.data;

          // Decodificar token para obtener rol
          const tokenPayload = decodeJWT(accessToken);

          set({
            user: { ...user, rol: tokenPayload.rol },
            token: accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'PIN incorrecto';
          set({ isLoading: false, error: message });
          return { success: false, message };
        }
      },

      // Logout
      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
        delete api.defaults.headers.common['Authorization'];
        
        // Redirigir al login inmediatamente
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      },

      // Refrescar token
      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          get().logout();
          return false;
        }

        try {
          const response = await api.post('/auth/refresh', { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          set({
            token: accessToken,
            refreshToken: newRefreshToken,
          });

          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          return true;
        } catch (error) {
          // Token de refresh inválido - cerrar sesión silenciosamente
          console.log('Token de refresh inválido, cerrando sesión...');
          console.log('Error completo:', error);
          
          // Limpiar localStorage completamente
          if (typeof window !== 'undefined') {
            localStorage.clear();
            console.log('localStorage limpiado completamente');
          }
          
          get().logout();
          return false;
        }
      },

      // Obtener perfil actualizado
      fetchProfile: async () => {
        try {
          const response = await api.get('/auth/profile');
          set({ user: response.data.data });
        } catch (error) {
          console.error('Error al obtener perfil:', error);
        }
      },

      // Cambiar contraseña
      changePassword: async (currentPassword, newPassword) => {
        try {
          await api.put('/auth/change-password', { currentPassword, newPassword });
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Error al cambiar contraseña';
          return { success: false, message };
        }
      },

      // Limpiar error
      clearError: () => set({ error: null }),

      // Inicializar auth state (validar token persistido)
      initializeAuth: async () => {
        const { token, refreshToken } = get();
        
        console.log('🔄 Inicializando auth state...');
        console.log('Token presente:', !!token);
        console.log('Refresh token presente:', !!refreshToken);
        
        if (!token) {
          console.log('❌ No hay token, usuario no autenticado');
          set({ isInitialized: true });
          return;
        }

        try {
          // Verificar si el token es válido decodificándolo
          const tokenPayload = decodeJWT(token);
          if (!tokenPayload) {
            console.log('❌ Token inválido (no se puede decodificar)');
            get().logout();
            set({ isInitialized: true });
            return;
          }

          // Verificar si el token ha expirado
          const currentTime = Date.now() / 1000;
          if (tokenPayload.exp && tokenPayload.exp < currentTime) {
            console.log('⏰ Token expirado, intentando refrescar...');
            
            if (refreshToken) {
              const refreshSuccess = await get().refreshAccessToken();
              if (refreshSuccess) {
                console.log('✅ Token refrescado exitosamente');
              } else {
                console.log('❌ Falló el refresh del token');
              }
            } else {
              console.log('❌ Token expirado y no hay refresh token');
              get().logout();
            }
          } else {
            console.log('✅ Token válido, configurando autenticación');
            // Configurar token en axios
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            set({ isAuthenticated: true });
          }
        } catch (error) {
          console.error('❌ Error durante inicialización de auth:', error);
          get().logout();
        }
        
        set({ isInitialized: true });
      },

      // Limpiar localStorage completamente (para casos de tokens corruptos)
      clearStorage: () => {
        if (typeof window !== 'undefined') {
          localStorage.clear();
          console.log('localStorage limpiado completamente');
        }
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          isInitialized: false,
        });
      },
      }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);