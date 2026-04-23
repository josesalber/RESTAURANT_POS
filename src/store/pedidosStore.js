import { create } from 'zustand';
import api from '@services/api';

export const usePedidosStore = create((set, get) => ({
  pedidos: [],
  pedidoActual: null,
  pedidosActivos: [],
  isLoading: false,
  error: null,

  // Obtener pedidos activos (para mesero y caja)
  fetchPedidosActivos: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/pedidos/activos');
      set({ pedidosActivos: response.data.data, isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Error al cargar pedidos',
        isLoading: false,
      });
    }
  },

  // Obtener pedidos con filtros
  fetchPedidos: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/pedidos', { params });
      set({ pedidos: response.data.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Error al cargar pedidos',
        isLoading: false,
      });
      return null;
    }
  },

  // Obtener un pedido específico
  fetchPedido: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/pedidos/${id}`);
      set({ pedidoActual: response.data.data, isLoading: false });
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Error al cargar pedido',
        isLoading: false,
      });
      return null;
    }
  },

  // Crear pedido nuevo
  crearPedido: async (data) => {
    try {
      const response = await api.post('/pedidos', data);
      const nuevoPedido = response.data.data;

      set((state) => ({
        pedidosActivos: [...state.pedidosActivos, nuevoPedido],
      }));

      return { success: true, data: nuevoPedido };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al crear pedido',
      };
    }
  },

  // Agregar items a un pedido existente
  agregarItems: async (pedidoId, items) => {
    try {
      const response = await api.post(`/pedidos/${pedidoId}/items`, { items });
      const pedidoActualizado = response.data.data;

      set((state) => ({
        pedidosActivos: state.pedidosActivos.map((p) =>
          p.id === pedidoId ? pedidoActualizado : p
        ),
        pedidoActual:
          state.pedidoActual?.id === pedidoId
            ? pedidoActualizado
            : state.pedidoActual,
      }));

      return { success: true, data: pedidoActualizado };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al agregar items',
      };
    }
  },

  // Actualizar pedido
  actualizarPedido: async (id, data) => {
    try {
      const response = await api.put(`/pedidos/${id}`, data);
      const pedidoActualizado = response.data.data;

      set((state) => ({
        pedidosActivos: state.pedidosActivos.map((p) =>
          p.id === id ? pedidoActualizado : p
        ),
        pedidoActual:
          state.pedidoActual?.id === id
            ? pedidoActualizado
            : state.pedidoActual,
      }));

      return { success: true, data: pedidoActualizado };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar pedido',
      };
    }
  },

  // Cancelar pedido
  cancelarPedido: async (id, motivo) => {
    try {
      const response = await api.put(`/pedidos/${id}/cancelar`, { motivo });

      set((state) => ({
        pedidosActivos: state.pedidosActivos.filter((p) => p.id !== id),
        pedidoActual:
          state.pedidoActual?.id === id ? null : state.pedidoActual,
      }));

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al cancelar pedido',
      };
    }
  },

  // Solicitar cuenta
  solicitarCuenta: async (id) => {
    try {
      const response = await api.post(`/pedidos/${id}/solicitar-cuenta`);
      const pedidoActualizado = response.data.data;

      set((state) => ({
        pedidosActivos: state.pedidosActivos.map((p) =>
          p.id === id ? pedidoActualizado : p
        ),
      }));

      return { success: true, data: pedidoActualizado };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al solicitar cuenta',
      };
    }
  },

  // Cambiar estado del pedido
  cambiarEstadoPedido: async (id, estado) => {
    try {
      const response = await api.patch(`/pedidos/${id}/estado`, { estado });
      const pedidoActualizado = response.data.data;

      set((state) => {
        // Si el pedido está pagado o cancelado, removerlo de activos
        if (['pagado', 'cancelado'].includes(estado)) {
          return {
            pedidosActivos: state.pedidosActivos.filter((p) => p.id !== id),
            pedidoActual: state.pedidoActual?.id === id ? null : state.pedidoActual,
          };
        }
        
        // Actualizar en la lista
        return {
          pedidosActivos: state.pedidosActivos.map((p) =>
            p.id === id ? pedidoActualizado : p
          ),
          pedidoActual: state.pedidoActual?.id === id ? pedidoActualizado : state.pedidoActual,
        };
      });

      return { success: true, data: pedidoActualizado };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al cambiar estado',
      };
    }
  },

  // Actualizar pedido desde WebSocket
  updatePedidoFromSocket: (pedido) => {
    set((state) => {
      const existeEnActivos = state.pedidosActivos.some((p) => p.id === pedido.id);

      // Si el pedido ya no está activo, removerlo
      if (['pagado', 'cancelado'].includes(pedido.estado)) {
        return {
          pedidosActivos: state.pedidosActivos.filter((p) => p.id !== pedido.id),
          pedidoActual:
            state.pedidoActual?.id === pedido.id ? null : state.pedidoActual,
        };
      }

      // Si existe, actualizarlo; si no, agregarlo
      if (existeEnActivos) {
        return {
          pedidosActivos: state.pedidosActivos.map((p) =>
            p.id === pedido.id ? { ...p, ...pedido } : p
          ),
          pedidoActual:
            state.pedidoActual?.id === pedido.id
              ? { ...state.pedidoActual, ...pedido }
              : state.pedidoActual,
        };
      } else {
        return {
          pedidosActivos: [...state.pedidosActivos, pedido],
        };
      }
    });
  },

  // Seleccionar pedido actual
  setPedidoActual: (pedido) => set({ pedidoActual: pedido }),

  // Limpiar pedido actual
  clearPedidoActual: () => set({ pedidoActual: null }),

  // Limpiar error
  clearError: () => set({ error: null }),
}));
