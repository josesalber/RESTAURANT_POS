import { create } from 'zustand';
import api from '@services/api';

export const useDashboardStore = create((set, get) => ({
  // Estado del dashboard
  dashboard: null,
  ventasHora: [],
  ventasHoraPedido: [],
  ventasHoraPago: [],
  topProductos: [],
  personalActivo: [],
  tiempoPreparacion: null,
  mesas: null,
  isLoading: false,
  error: null,
  isRealTimeEnabled: false,

  // Obtener datos iniciales del dashboard
  fetchDashboard: async () => {
    try {
      set({ isLoading: true, error: null });

      // Obtener fecha actual y fecha de ayer para productos
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [dashRes, horaRes, pedidoHoraRes, pagoHoraRes, prodRes, personalRes, tiempoRes] = await Promise.all([
        api.get('/reportes/dashboard'),
        api.get('/reportes/ventas/hora', {
          params: { fecha: today }
        }),
        api.get('/reportes/ventas/pedidos-hora', {
          params: { fecha: today }
        }),
        api.get('/reportes/ventas/pagos-hora', {
          params: { fecha: today }
        }),
        api.get('/reportes/ventas/producto', {
          params: {
            fecha_inicio: yesterday,
            fecha_fin: today,
            limit: 5
          }
        }),
        api.get('/reportes/personal-activo'), // Agregar llamada para personal activo
        api.get('/reportes/tiempo-preparacion', {
          params: {
            fecha_inicio: yesterday,
            fecha_fin: today
          }
        })
      ]);

      set({
        dashboard: dashRes.data.data,
        ventasHora: horaRes.data.data || [],
        ventasHoraPedido: pedidoHoraRes.data.data || [],
        ventasHoraPago: pagoHoraRes.data.data || [],
        topProductos: prodRes.data.data || [],
        personalActivo: personalRes.data.data || [], // Usar datos de la API
        tiempoPreparacion: tiempoRes.data.data || null,
        mesas: dashRes.data.data.mesas || null,
        isLoading: false
      });

      return {
        dashboard: dashRes.data.data,
        ventasHora: horaRes.data.data || [],
        ventasHoraPedido: pedidoHoraRes.data.data || [],
        ventasHoraPago: pagoHoraRes.data.data || [],
        topProductos: prodRes.data.data || [],
        personalActivo: personalRes.data.data || [],
        tiempoPreparacion: tiempoRes.data.data || null,
        mesas: dashRes.data.data.mesas || null
      };
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
      let errorMessage = 'Error al cargar los datos del dashboard';

      if (error.response?.status === 401) {
        errorMessage = 'Error de autenticación';
      } else if (error.response?.status === 403) {
        errorMessage = 'No tienes permisos';
      } else if (error.response?.status === 500) {
        errorMessage = 'Error interno del servidor';
      } else if (!error.response) {
        errorMessage = 'No se puede conectar al servidor';
      }

      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Actualizar dashboard desde WebSocket
  updateDashboard: (newData) => {
    console.log('updateDashboard called with:', newData);
    set((state) => {
      const newDashboard = state.dashboard ? { ...state.dashboard, ...newData } : newData;
      console.log('New dashboard state:', newDashboard);
      return { dashboard: newDashboard };
    });
  },

  // Actualizar ventas por hora
  updateVentasHora: (ventas) => {
    set({ ventasHora: ventas });
  },

  // Actualizar pedidos por hora
  updateVentasHoraPedido: (pedidos) => {
    set({ ventasHoraPedido: pedidos });
  },

  // Actualizar pagos por hora
  updateVentasHoraPago: (pagos) => {
    set({ ventasHoraPago: pagos });
  },

  // Actualizar top productos
  updateTopProductos: (productos) => {
    set({ topProductos: productos });
  },

  // Actualizar personal activo
  updatePersonalActivo: (personal) => {
    set({ personalActivo: personal });
  },

  // Actualizar tiempo de preparación
  updateTiempoPreparacion: (tiempo) => {
    set({ tiempoPreparacion: tiempo });
  },

  // Actualizar mesas
  updateMesas: (mesas) => {
    set({ mesas });
  },

  // Habilitar/deshabilitar modo tiempo real
  setRealTimeEnabled: (enabled) => {
    set({ isRealTimeEnabled: enabled });
  },

  // Limpiar estado
  clearDashboard: () => {
    set({
      dashboard: null,
      ventasHora: [],
      ventasHoraPedido: [],
      ventasHoraPago: [],
      topProductos: [],
      personalActivo: [],
      tiempoPreparacion: null,
      mesas: null,
      isLoading: false,
      error: null,
      isRealTimeEnabled: false
    });
  }
}));