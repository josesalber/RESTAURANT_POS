import { create } from 'zustand';
import api from '@services/api';
import toast from 'react-hot-toast';

export const useReservasStore = create((set, get) => ({
  reservas: [],
  reservasHoy: [],
  reservasProximas: [],
  reservaActual: null,
  mesasDisponibles: [],
  estadisticas: null,
  whatsappStatus: null,
  whatsappQR: null,
  isLoading: false,
  error: null,
  filtros: {
    estado: '',
    fecha: '',
    busqueda: ''
  },

  // ========================
  // RESERVAS CRUD
  // ========================

  fetchReservas: async (filtros = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.fecha) params.append('fecha', filtros.fecha);
      if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
      if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
      if (filtros.mesa_id) params.append('mesa_id', filtros.mesa_id);
      if (filtros.busqueda) params.append('busqueda', filtros.busqueda);

      const response = await api.get(`/reservas?${params.toString()}`);
      const data = response.data.data;
      set({ reservas: Array.isArray(data) ? data : data.reservas || [], isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Error al cargar reservas',
        isLoading: false
      });
    }
  },

  fetchReservasHoy: async () => {
    try {
      const response = await api.get('/reservas/hoy');
      set({ reservasHoy: response.data.data });
    } catch (error) {
      console.error('Error al cargar reservas de hoy:', error);
    }
  },

  fetchReservasProximas: async () => {
    try {
      const response = await api.get('/reservas/proximas');
      set({ reservasProximas: response.data.data });
    } catch (error) {
      console.error('Error al cargar reservas próximas:', error);
    }
  },

  fetchReserva: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/reservas/${id}`);
      set({ reservaActual: response.data.data, isLoading: false });
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Error al cargar reserva',
        isLoading: false
      });
      return null;
    }
  },

  crearReserva: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/reservas', data);
      const nuevaReserva = response.data.data;
      
      set((state) => ({
        reservas: [nuevaReserva, ...state.reservas],
        isLoading: false
      }));
      
      toast.success('Reserva creada exitosamente', { icon: '📅' });
      return nuevaReserva;
    } catch (error) {
      const message = error.response?.data?.message || 'Error al crear reserva';
      set({ error: message, isLoading: false });
      toast.error(message);
      return null;
    }
  },

  actualizarReserva: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/reservas/${id}`, data);
      const reservaActualizada = response.data.data;
      
      set((state) => ({
        reservas: state.reservas.map(r => r.id === id ? reservaActualizada : r),
        reservaActual: state.reservaActual?.id === id ? reservaActualizada : state.reservaActual,
        isLoading: false
      }));
      
      toast.success('Reserva actualizada', { icon: '✅' });
      return reservaActualizada;
    } catch (error) {
      const message = error.response?.data?.message || 'Error al actualizar reserva';
      set({ error: message, isLoading: false });
      toast.error(message);
      return null;
    }
  },

  cambiarEstadoReserva: async (id, estado, motivo = '') => {
    try {
      const response = await api.patch(`/reservas/${id}/estado`, { estado, motivo_cancelacion: motivo });
      const reservaActualizada = response.data.data;
      
      set((state) => ({
        reservas: state.reservas.map(r => r.id === id ? reservaActualizada : r),
        reservasHoy: state.reservasHoy.map(r => r.id === id ? reservaActualizada : r),
        reservaActual: state.reservaActual?.id === id ? reservaActualizada : state.reservaActual
      }));

      const estadoLabels = {
        confirmada: 'Reserva confirmada',
        cancelada: 'Reserva cancelada',
        completada: 'Reserva completada',
        no_asistio: 'Marcada como no asistió'
      };
      toast.success(estadoLabels[estado] || 'Estado actualizado', { icon: '📅' });
      return reservaActualizada;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cambiar estado');
      return null;
    }
  },

  eliminarReserva: async (id) => {
    try {
      await api.delete(`/reservas/${id}`);
      set((state) => ({
        reservas: state.reservas.filter(r => r.id !== id),
        reservasHoy: state.reservasHoy.filter(r => r.id !== id)
      }));
      toast.success('Reserva eliminada', { icon: '🗑️' });
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar reserva');
      return false;
    }
  },

  // ========================
  // DISPONIBILIDAD DE MESAS
  // ========================

  fetchMesasDisponibles: async (fecha, hora, duracion = 120, numPersonas = 2) => {
    try {
      const params = new URLSearchParams({ fecha, hora, duracion, num_personas: numPersonas });
      const response = await api.get(`/reservas/mesas-disponibles?${params.toString()}`);
      set({ mesasDisponibles: response.data.data });
      return response.data.data;
    } catch (error) {
      console.error('Error al buscar mesas disponibles:', error);
      return [];
    }
  },

  // ========================
  // ESTADÍSTICAS
  // ========================

  fetchEstadisticas: async (fechaInicio, fechaFin) => {
    try {
      const params = new URLSearchParams();
      if (fechaInicio) params.append('fecha_inicio', fechaInicio);
      if (fechaFin) params.append('fecha_fin', fechaFin);
      const response = await api.get(`/reservas/estadisticas?${params.toString()}`);
      set({ estadisticas: response.data.data });
      return response.data.data;
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      return null;
    }
  },

  // ========================
  // WHATSAPP
  // ========================

  fetchWhatsappStatus: async () => {
    try {
      const response = await api.get('/whatsapp/status');
      set({ whatsappStatus: response.data.data });
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener estado WhatsApp:', error);
      return null;
    }
  },

  conectarWhatsapp: async () => {
    try {
      const response = await api.post('/whatsapp/connect');
      set({ whatsappStatus: response.data.data });
      toast.success('Conexión WhatsApp iniciada. Escanee el QR.', { icon: '📱', duration: 5000 });
      return response.data.data;
    } catch (error) {
      toast.error('Error al conectar WhatsApp');
      return null;
    }
  },

  desconectarWhatsapp: async () => {
    try {
      await api.post('/whatsapp/disconnect');
      set({ whatsappStatus: { estado: 'desconectado' }, whatsappQR: null });
      toast.success('WhatsApp desconectado');
    } catch (error) {
      toast.error('Error al desconectar WhatsApp');
    }
  },

  fetchWhatsappQR: async () => {
    try {
      const response = await api.get('/whatsapp/qr');
      if (response.data.data.qr) {
        set({ whatsappQR: response.data.data.qr });
      }
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener QR:', error);
      return null;
    }
  },

  enviarConfirmacionWhatsapp: async (reservaId) => {
    try {
      await api.post(`/whatsapp/reserva/${reservaId}/confirmacion`);
      toast.success('Confirmación enviada por WhatsApp', { icon: '📱' });
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al enviar confirmación');
      return false;
    }
  },

  enviarRecordatorioWhatsapp: async (reservaId) => {
    try {
      await api.post(`/whatsapp/reserva/${reservaId}/recordatorio`);
      toast.success('Recordatorio enviado por WhatsApp', { icon: '📱' });
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al enviar recordatorio');
      return false;
    }
  },

  // ========================
  // SOCKET UPDATES
  // ========================

  updateReservaFromSocket: (reserva) => {
    set((state) => ({
      reservas: state.reservas.map(r => r.id === reserva.id ? { ...r, ...reserva } : r),
      reservasHoy: state.reservasHoy.map(r => r.id === reserva.id ? { ...r, ...reserva } : r)
    }));
  },

  addReservaFromSocket: (reserva) => {
    set((state) => ({
      reservas: [reserva, ...state.reservas.filter(r => r.id !== reserva.id)],
    }));
    // Refrescar hoy si aplica
    const hoy = new Date().toISOString().split('T')[0];
    if (reserva.fecha === hoy) {
      get().fetchReservasHoy();
    }
  },

  removeReservaFromSocket: (reservaId) => {
    set((state) => ({
      reservas: state.reservas.filter(r => r.id !== reservaId),
      reservasHoy: state.reservasHoy.filter(r => r.id !== reservaId)
    }));
  },

  setWhatsappQR: (qr) => {
    set({ whatsappQR: qr });
  },

  setWhatsappStatus: (status) => {
    set({ whatsappStatus: status });
  },

  setFiltros: (filtros) => {
    set({ filtros: { ...get().filtros, ...filtros } });
  },

  clearError: () => set({ error: null })
}));
