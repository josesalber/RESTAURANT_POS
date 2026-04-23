import { create } from 'zustand';
import api from '@services/api';

export const useCocinaStore = create((set, get) => ({
  comandas: [],
  comandasAgrupadas: [],
  estadisticas: null,
  isLoading: false,
  error: null,
  filtroEstado: null,
  vistaAgrupada: false,

  // Obtener comandas
  fetchComandas: async (estado = null) => {
    set({ isLoading: true, error: null });
    try {
      const params = estado ? { estado } : {};
      const response = await api.get('/cocina/comandas', { params });
      const items = response.data.data;
      
      // Agrupar items por pedido para la vista
      const pedidosMap = new Map();
      for (const item of items) {
        if (!pedidosMap.has(item.pedido_id)) {
          pedidosMap.set(item.pedido_id, {
            id: item.pedido_id,
            pedido_id: item.pedido_id,
            numero_pedido: item.pedido_numero,
            pedido_tipo: item.pedido_tipo,
            mesa_numero: item.mesa_numero,
            mesa_nombre: item.mesa_nombre,
            created_at: item.hora_pedido,
            items: []
          });
        }
        pedidosMap.get(item.pedido_id).items.push({
          id: item.detalle_id,
          detalle_id: item.detalle_id,
          producto_id: item.producto_id,
          producto_nombre: item.producto_nombre,
          producto_codigo: item.producto_codigo,
          categoria_nombre: item.categoria_nombre,
          cantidad: item.cantidad,
          notas: item.notas,
          estado: item.estado,
          tiempo_preparacion: item.tiempo_preparacion,
          minutos_espera: Math.round(parseFloat(item.minutos_espera) || 0),
          cocinero_nombre: item.cocinero_nombre
        });
      }
      
      set({ comandas: Array.from(pedidosMap.values()), isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Error al cargar comandas',
        isLoading: false,
      });
    }
  },

  // Obtener comandas agrupadas por producto
  fetchComandasAgrupadas: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/cocina/comandas/agrupadas');
      set({ comandasAgrupadas: response.data.data, isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Error al cargar comandas',
        isLoading: false,
      });
    }
  },

  // Cambiar estado de un item
  cambiarEstadoItem: async (itemId, estado) => {
    try {
      const response = await api.put(`/cocina/items/${itemId}/estado`, { estado });
      const itemActualizado = response.data.data;

      // Actualizar en la lista de comandas
      set((state) => ({
        comandas: state.comandas.map((comanda) => ({
          ...comanda,
          items: comanda.items?.map((item) =>
            item.id === itemId ? { ...item, ...itemActualizado } : item
          ),
        })),
      }));

      return { success: true, data: itemActualizado };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al cambiar estado',
      };
    }
  },

  // Marcar varios items como listos
  marcarItemsListos: async (itemIds) => {
    try {
      const promises = itemIds.map((id) =>
        api.put(`/cocina/items/${id}/estado`, { estado: 'listo' })
      );
      await Promise.all(promises);

      // Actualizar estado local
      set((state) => ({
        comandas: state.comandas.map((comanda) => ({
          ...comanda,
          items: comanda.items?.map((item) =>
            itemIds.includes(item.id) ? { ...item, estado: 'listo' } : item
          ),
        })),
      }));

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: 'Error al marcar items como listos',
      };
    }
  },

  // Obtener estadísticas
  fetchEstadisticas: async () => {
    try {
      const response = await api.get('/cocina/estadisticas');
      set({ estadisticas: response.data.data });
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return null;
    }
  },

  // Actualizar comanda desde WebSocket
  updateComandaFromSocket: (data) => {
    const { pedido, item, tipo } = data;

    set((state) => {
      // Nuevo pedido
      if (tipo === 'nuevo_pedido' && pedido) {
        const existe = state.comandas.some((c) => c.id === pedido.id);
        if (!existe) {
          return { comandas: [pedido, ...state.comandas] };
        }
        return {
          comandas: state.comandas.map((c) =>
            c.id === pedido.id ? pedido : c
          ),
        };
      }

      // Actualización de item
      if (tipo === 'item_actualizado' && item) {
        return {
          comandas: state.comandas.map((comanda) => ({
            ...comanda,
            items: comanda.items?.map((i) =>
              i.id === item.id ? { ...i, ...item } : i
            ),
          })),
        };
      }

      return state;
    });
  },

  // Remover comanda completada
  removeComandaCompletada: (pedidoId) => {
    set((state) => ({
      comandas: state.comandas.filter((c) => c.id !== pedidoId),
    }));
  },

  // Cambiar filtro de estado
  setFiltroEstado: (estado) => set({ filtroEstado: estado }),

  // Cambiar vista agrupada
  toggleVistaAgrupada: () =>
    set((state) => ({ vistaAgrupada: !state.vistaAgrupada })),

  // Limpiar error
  clearError: () => set({ error: null }),
}));
