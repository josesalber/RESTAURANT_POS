import { create } from 'zustand';
import api from '@services/api';

export const useMesasStore = create((set, get) => ({
  mesas: [],
  mesaActual: null,
  mesasConPedidosListos: new Set(), // IDs de mesas con pedidos listos
  mesasUnidas: [], // Grupos de mesas unidas
  isLoading: false,
  error: null,

  // Obtener todas las mesas
  fetchMesas: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/mesas');
      set({ mesas: response.data.data, isLoading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Error al cargar mesas',
        isLoading: false 
      });
    }
  },

  // Obtener resumen de mesas
  fetchResumen: async () => {
    try {
      const response = await api.get('/mesas/resumen');
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener resumen:', error);
      return null;
    }
  },

  // Obtener una mesa específica
  fetchMesa: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/mesas/${id}`);
      set({ mesaActual: response.data.data, isLoading: false });
      return response.data.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Error al cargar mesa',
        isLoading: false 
      });
      return null;
    }
  },

  // Cambiar estado de mesa
  cambiarEstado: async (id, estado) => {
    try {
      const response = await api.patch(`/mesas/${id}/estado`, { estado });
      const mesaActualizada = response.data.data;
      
      // Actualizar en la lista
      set((state) => ({
        mesas: state.mesas.map((m) =>
          m.id === id ? mesaActualizada : m
        ),
        mesaActual: state.mesaActual?.id === id ? mesaActualizada : state.mesaActual,
      }));

      return { success: true, data: mesaActualizada };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al cambiar estado' 
      };
    }
  },

  // Actualizar mesa desde WebSocket
  updateMesaFromSocket: (mesa) => {
    set((state) => ({
      mesas: state.mesas.map((m) =>
        m.id === mesa.id ? { ...m, ...mesa } : m
      ),
      mesaActual: state.mesaActual?.id === mesa.id 
        ? { ...state.mesaActual, ...mesa } 
        : state.mesaActual,
    }));
  },

  // Seleccionar mesa
  setMesaActual: (mesa) => set({ mesaActual: mesa }),

  // Limpiar mesa actual
  clearMesaActual: () => set({ mesaActual: null }),

  // Marcar mesa como con pedido listo
  marcarPedidoListo: (mesaId) => {
    set((state) => ({
      mesasConPedidosListos: new Set([...state.mesasConPedidosListos, mesaId])
    }));
  },

  // Desmarcar mesa como con pedido listo (cuando se atiende)
  desmarcarPedidoListo: (mesaId) => {
    set((state) => {
      const newSet = new Set(state.mesasConPedidosListos);
      newSet.delete(mesaId);
      return { mesasConPedidosListos: newSet };
    });
  },

  // Verificar si una mesa tiene pedido listo
  tienePedidoListo: (mesaId) => {
    return get().mesasConPedidosListos.has(mesaId);
  },

  // Limpiar error
  clearError: () => set({ error: null }),

  // Actualizar posiciones en batch (editor de plano)
  updatePosicionesBatch: async (mesas) => {
    try {
      await api.put('/mesas/posiciones/batch', { mesas });
      // Actualizar posiciones locales
      set((state) => ({
        mesas: state.mesas.map((m) => {
          const updated = mesas.find((u) => u.id === m.id);
          if (updated) {
            return { ...m, pos_x: updated.pos_x, pos_y: updated.pos_y, forma: updated.forma || m.forma };
          }
          return m;
        }),
      }));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al guardar posiciones',
      };
    }
  },

  // Crear mesa
  createMesa: async (data) => {
    try {
      const response = await api.post('/mesas', data);
      set((state) => ({ mesas: [...state.mesas, response.data.data] }));
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al crear mesa',
      };
    }
  },

  // Actualizar mesa
  updateMesa: async (id, data) => {
    try {
      const response = await api.put(`/mesas/${id}`, data);
      set((state) => ({
        mesas: state.mesas.map((m) => (m.id === id ? response.data.data : m)),
      }));
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar mesa',
      };
    }
  },

  // Eliminar mesa
  deleteMesa: async (id) => {
    try {
      await api.delete(`/mesas/${id}`);
      set((state) => ({
        mesas: state.mesas.filter((m) => m.id !== id),
      }));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al eliminar mesa',
      };
    }
  },

  // ── Mesas Unidas (grupos temporales) ──

  // Obtener grupos activos de mesas unidas
  fetchMesasUnidas: async () => {
    try {
      const response = await api.get('/mesas-unidas');
      set({ mesasUnidas: response.data.data || [] });
      return response.data.data || [];
    } catch (error) {
      console.error('Error al cargar mesas unidas:', error);
      return [];
    }
  },

  // Crear grupo de mesas unidas
  crearUnion: async (mesa_ids, nombre) => {
    try {
      const response = await api.post('/mesas-unidas', { mesa_ids, nombre });
      const grupo = response.data.data;
      set((state) => ({
        mesasUnidas: [...state.mesasUnidas, grupo],
      }));
      return { success: true, data: grupo };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al unir mesas',
      };
    }
  },

  // Deshacer unión de mesas
  deshacerUnion: async (grupoId) => {
    try {
      await api.delete(`/mesas-unidas/${grupoId}`);
      set((state) => ({
        mesasUnidas: state.mesasUnidas.filter((g) => g.id !== grupoId),
      }));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al separar mesas',
      };
    }
  },

  // Verificar si una mesa pertenece a un grupo
  getGrupoDeMesa: (mesaId) => {
    return get().mesasUnidas.find((g) => g.mesa_ids?.includes(mesaId)) || null;
  },

  // Actualizar mesas unidas desde WebSocket
  updateMesasUnidasFromSocket: (data) => {
    set((state) => ({
      mesasUnidas: [...state.mesasUnidas, data],
    }));
  },

  removeMesasUnidasFromSocket: (grupoId) => {
    set((state) => ({
      mesasUnidas: state.mesasUnidas.filter((g) => g.id !== grupoId),
    }));
  },
}));
