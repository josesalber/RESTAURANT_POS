import { create } from 'zustand';
import api from '@services/api';
import socketService from '@services/socket';

export const useCajaStore = create((set, get) => ({
  estadoCaja: null,
  movimientos: [],
  resumenDia: null,
  isLoading: false,
  error: null,

  // Obtener estado actual de la caja
  fetchEstadoCaja: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/caja/estado');
      set({ estadoCaja: response.data.data, isLoading: false });
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Error al obtener estado',
        isLoading: false,
      });
      return null;
    }
  },

  // Abrir caja
  abrirCaja: async (montoInicial, observaciones = '') => {
    try {
      const response = await api.post('/caja/abrir', { monto: montoInicial, observaciones });
      // Después de abrir, obtener el estado actualizado
      await get().fetchEstadoCaja();
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al abrir caja',
      };
    }
  },

  // Cerrar caja
  cerrarCaja: async (montoFinal, observaciones = '') => {
    try {
      // Primero obtener el turno_id actual
      const estadoActual = get().estadoCaja;
      if (!estadoActual || !estadoActual.turno_id) {
        return {
          success: false,
          message: 'No hay caja abierta para cerrar',
        };
      }
      
      const response = await api.post('/caja/cerrar', { 
        turno_id: estadoActual.turno_id,
        monto_real: montoFinal, 
        notas: observaciones 
      });
      set({ estadoCaja: null });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al cerrar caja',
      };
    }
  },

  // Registrar movimiento
  registrarMovimiento: async (tipo, monto, descripcion, categoria) => {
    try {
      const response = await api.post('/caja/movimiento', {
        tipo,
        monto,
        descripcion,
        categoria,
      });
      
      // Actualizar estado de caja
      await get().fetchEstadoCaja();
      
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al registrar movimiento',
      };
    }
  },

  // Obtener movimientos
  fetchMovimientos: async (fecha = null) => {
    set({ isLoading: true, error: null });
    try {
      const params = fecha ? { fecha } : {};
      const response = await api.get('/caja/movimientos', { params });
      set({ movimientos: response.data.data, isLoading: false });
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Error al obtener movimientos',
        isLoading: false,
      });
      return [];
    }
  },

  // Obtener resumen del día
  fetchResumenDia: async (fecha = null) => {
    try {
      const params = fecha ? { fecha } : {};
      const response = await api.get('/pagos/resumen', { params });
      set({ resumenDia: response.data.data });
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener resumen:', error);
      return null;
    }
  },

  // Procesar pago
  procesarPago: async (pedidoId, metodoPago, montoPagado, propina = 0) => {
    try {
      const response = await api.post('/pagos', {
        pedido_id: pedidoId,
        metodo: metodoPago,
        monto: montoPagado,
        propina,
      });

      // Emitir evento de WebSocket para notificar el pago realizado
      socketService.emit('pago:realizado', {
        pedidoId,
        monto: response.data.data.totalPedido || montoPagado,
        metodo: metodoPago
      });

      // Actualizar estado de caja y resumen del día
      await get().fetchEstadoCaja();
      await get().fetchResumenDia();

      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al procesar pago',
      };
    }
  },

  // Anular pago
  anularPago: async (pagoId, motivo) => {
    try {
      const response = await api.put(`/pagos/${pagoId}/anular`, { motivo });

      // Actualizar estado de caja y resumen del día
      await get().fetchEstadoCaja();
      await get().fetchResumenDia();

      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al anular pago',
      };
    }
  },

  // Actualizar desde WebSocket
  updateFromSocket: (data) => {
    const { tipo } = data;

    if (tipo === 'pago_procesado' || tipo === 'movimiento_registrado') {
      // Refrescar estado de caja y resumen del día
      get().fetchEstadoCaja();
      get().fetchResumenDia();
    }
  },

  // Limpiar error
  clearError: () => set({ error: null }),
}));
