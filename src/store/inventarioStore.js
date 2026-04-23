import { create } from 'zustand';
import api from '@services/api';

export const useInventarioStore = create((set, get) => ({
  // Estado
  ingredientes: [],
  categorias: [],
  ingresos: [],
  alertas: [],
  alertasNoLeidas: 0,
  reporteUso: null,
  ingresoDetalle: null,
  isLoading: false,
  error: null,

  // ==========================================
  // INGREDIENTES
  // ==========================================

  fetchIngredientes: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const defaultParams = { limit: 200, ...params };
      const response = await api.get('/inventario/ingredientes', { params: defaultParams });
      set({ ingredientes: response.data.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error al cargar ingredientes', isLoading: false });
      return null;
    }
  },

  fetchCategorias: async () => {
    try {
      const response = await api.get('/inventario/ingredientes/categorias');
      set({ categorias: response.data.data });
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  },

  crearIngrediente: async (data) => {
    try {
      const response = await api.post('/inventario/ingredientes', data);
      set((state) => ({
        ingredientes: [...state.ingredientes, response.data.data],
      }));
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error al crear ingrediente' };
    }
  },

  actualizarIngrediente: async (id, data) => {
    try {
      const response = await api.put(`/inventario/ingredientes/${id}`, data);
      set((state) => ({
        ingredientes: state.ingredientes.map((i) => i.id === id ? response.data.data : i),
      }));
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error al actualizar ingrediente' };
    }
  },

  eliminarIngrediente: async (id) => {
    try {
      await api.delete(`/inventario/ingredientes/${id}`);
      set((state) => ({
        ingredientes: state.ingredientes.filter((i) => i.id !== id),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error al eliminar ingrediente' };
    }
  },

  fetchStockBajo: async () => {
    try {
      const response = await api.get('/inventario/ingredientes/stock-bajo');
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener stock bajo:', error);
      return [];
    }
  },

  // ==========================================
  // INGRESOS
  // ==========================================

  fetchIngresos: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/inventario/ingresos', { params });
      set({ ingresos: response.data.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error al cargar ingresos', isLoading: false });
      return null;
    }
  },

  fetchIngresoDetalle: async (id) => {
    try {
      const response = await api.get(`/inventario/ingresos/${id}`);
      set({ ingresoDetalle: response.data.data });
      return response.data.data;
    } catch (error) {
      console.error('Error al cargar detalle de ingreso:', error);
      return null;
    }
  },

  crearIngreso: async (data) => {
    try {
      const response = await api.post('/inventario/ingresos', data);
      set((state) => ({
        ingresos: [response.data.data, ...state.ingresos],
      }));
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error al crear ingreso' };
    }
  },

  anularIngreso: async (id) => {
    try {
      await api.put(`/inventario/ingresos/${id}/anular`);
      set((state) => ({
        ingresos: state.ingresos.map((i) => i.id === id ? { ...i, estado: 'anulado' } : i),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error al anular ingreso' };
    }
  },

  // ==========================================
  // USO DIARIO
  // ==========================================

  registrarUso: async (data) => {
    try {
      const response = await api.post('/inventario/uso', data);
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error al registrar uso' };
    }
  },

  fetchReporteUso: async (fecha = null) => {
    set({ isLoading: true });
    try {
      const params = fecha ? { fecha } : {};
      const response = await api.get('/inventario/uso/reporte', { params });
      set({ reporteUso: response.data.data, isLoading: false });
      return response.data.data;
    } catch (error) {
      set({ isLoading: false });
      console.error('Error al cargar reporte de uso:', error);
      return null;
    }
  },

  fetchReporteUsoRango: async (fecha_desde, fecha_hasta) => {
    set({ isLoading: true });
    try {
      const response = await api.get('/inventario/reportes/uso-rango', {
        params: { fecha_desde, fecha_hasta }
      });
      set({ isLoading: false });
      return response.data.data;
    } catch (error) {
      set({ isLoading: false });
      console.error('Error al cargar reporte de uso por rango:', error);
      return null;
    }
  },

  // ==========================================
  // ALERTAS
  // ==========================================

  fetchAlertas: async (leida = undefined) => {
    try {
      const params = leida !== undefined ? { leida } : {};
      const response = await api.get('/inventario/alertas', { params });
      set({ alertas: response.data.data });
      return response.data.data;
    } catch (error) {
      console.error('Error al cargar alertas:', error);
      return [];
    }
  },

  fetchAlertasNoLeidas: async () => {
    try {
      const response = await api.get('/inventario/alertas/no-leidas/count');
      set({ alertasNoLeidas: response.data.data.count });
      return response.data.data.count;
    } catch (error) {
      return 0;
    }
  },

  crearAlerta: async (data) => {
    try {
      const response = await api.post('/inventario/alertas', data);
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error al crear alerta' };
    }
  },

  marcarAlertaLeida: async (id) => {
    try {
      await api.put(`/inventario/alertas/${id}/leida`);
      set((state) => ({
        alertas: state.alertas.map((a) => a.id === id ? { ...a, leida: true } : a),
        alertasNoLeidas: Math.max(state.alertasNoLeidas - 1, 0),
      }));
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  },

  marcarTodasLeidas: async () => {
    try {
      await api.put('/inventario/alertas/marcar-todas-leidas');
      set((state) => ({
        alertas: state.alertas.map((a) => ({ ...a, leida: true })),
        alertasNoLeidas: 0,
      }));
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  },

  // ==========================================
  // COCINA - Ingredientes para alerta
  // ==========================================

  fetchIngredientesParaAlerta: async () => {
    try {
      const response = await api.get('/inventario/ingredientes/para-alerta');
      return response.data.data;
    } catch (error) {
      console.error('Error al cargar ingredientes para alerta:', error);
      return [];
    }
  },

  // Limpiar
  clearError: () => set({ error: null }),
  clearIngresoDetalle: () => set({ ingresoDetalle: null }),
}));
