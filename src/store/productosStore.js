import { create } from 'zustand';
import api from '@services/api';

export const useProductosStore = create((set, get) => ({
  productos: [],
  menu: [], // Productos agrupados por categoría
  categorias: [],
  isLoading: false,
  error: null,
  categoriaSeleccionada: null,

  // Obtener menú (productos disponibles agrupados)
  fetchMenu: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/productos/menu');
      const menuData = response.data.data;
      // Auto-seleccionar primera categoría si no hay ninguna seleccionada
      const categoriaActual = get().categoriaSeleccionada;
      if (!categoriaActual && menuData.length > 0) {
        set({ menu: menuData, categoriaSeleccionada: menuData[0].id, isLoading: false });
      } else {
        set({ menu: menuData, isLoading: false });
      }
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Error al cargar menú',
        isLoading: false,
      });
    }
  },

  // Obtener todos los productos
  fetchProductos: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      // Usar límite mayor por defecto para evitar problemas de paginación
      const defaultParams = { limit: 200, ...params };
      const response = await api.get('/productos', { params: defaultParams });
      set({ productos: response.data.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Error al cargar productos',
        isLoading: false,
      });
      return null;
    }
  },

  // Obtener categorías
  fetchCategorias: async () => {
    try {
      const response = await api.get('/categorias');
      set({ categorias: response.data.data });
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  },

  // Crear producto
  crearProducto: async (data) => {
    try {
      const response = await api.post('/productos', data);
      set((state) => ({
        productos: [...state.productos, response.data.data],
      }));
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al crear producto',
      };
    }
  },

  // Actualizar producto
  actualizarProducto: async (id, data) => {
    try {
      const response = await api.put(`/productos/${id}`, data);
      set((state) => ({
        productos: state.productos.map((p) =>
          p.id === id ? response.data.data : p
        ),
      }));
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar producto',
      };
    }
  },

  // Eliminar producto
  eliminarProducto: async (id) => {
    try {
      await api.delete(`/productos/${id}`);
      set((state) => ({
        productos: state.productos.filter((p) => p.id !== id),
      }));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al eliminar producto',
      };
    }
  },

  // Toggle disponibilidad
  toggleDisponible: async (id) => {
    try {
      const response = await api.put(`/productos/${id}/toggle-disponible`);
      set((state) => ({
        productos: state.productos.map((p) =>
          p.id === id ? response.data.data : p
        ),
      }));
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al cambiar disponibilidad',
      };
    }
  },

  // Actualizar stock
  actualizarStock: async (id, cantidad, tipo = 'set') => {
    try {
      const response = await api.put(`/productos/${id}/stock`, { cantidad, tipo });
      set((state) => ({
        productos: state.productos.map((p) =>
          p.id === id ? response.data.data : p
        ),
      }));
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar stock',
      };
    }
  },

  // Obtener productos con stock bajo
  fetchLowStock: async () => {
    try {
      const response = await api.get('/productos/low-stock');
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener productos con stock bajo:', error);
      return [];
    }
  },

  // Seleccionar categoría
  setCategoriaSeleccionada: (categoria) =>
    set({ categoriaSeleccionada: categoria }),

  // Obtener productos de una categoría
  getProductosByCategoria: (categoriaId) => {
    const { menu } = get();
    if (!categoriaId) return [];
    const categoria = menu.find((c) => c.id === categoriaId);
    return categoria?.productos || [];
  },

  // Limpiar error
  clearError: () => set({ error: null }),
}));
