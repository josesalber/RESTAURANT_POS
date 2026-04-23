import { io } from 'socket.io-client';
import { useAuthStore } from '@store/authStore';
import { useMesasStore } from '@store/mesasStore';
import { usePedidosStore } from '@store/pedidosStore';
import { useCocinaStore } from '@store/cocinaStore';
import { useCajaStore } from '@store/cajaStore';
import { useReservasStore } from '@store/reservasStore';
import toast from 'react-hot-toast';

// Usar URL relativa para WebSocket - el proxy de Nginx manejará la conexión
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
    this.listenersConfigured = false;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 3;
  }

  connect() {
    const token = useAuthStore.getState().token;
    const user = useAuthStore.getState().user;

    console.log('Socket connect - token length:', token?.length, 'user:', user?.username);
    console.log('Socket connect - token preview:', token?.substring(0, 20) + '...');

    if (!token || !user) {
      console.warn('No se puede conectar socket sin autenticación');
      return;
    }

    // Si ya está conectado y configurado, no hacer nada
    if (this.socket?.connected && this.listenersConfigured) {
      console.log('Socket ya conectado y configurado');
      return;
    }

    // Si hay un socket existente pero no está conectado, desconectar primero
    if (this.socket && !this.socket.connected) {
      this.socket.disconnect();
      this.socket = null;
      this.listenersConfigured = false;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    console.log('Socket.IO instance created with URL:', SOCKET_URL);

    this.setupListeners();
  }

  setupListeners() {
    if (!this.socket || this.listenersConfigured) return;
    this.listenersConfigured = true;

    // Conexión
    this.socket.on('connect', () => {
      console.log('✅ Socket conectado:', this.socket.id);
      this.connected = true;
      this.connectionAttempts = 0; // Resetear contador de intentos

      // El backend automáticamente une a la sala del rol
      // No necesitamos emitir 'join:role' manualmente
    });

    // Desconexión
    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket desconectado:', reason);
      this.connected = false;
      
      // Resetear contador si fue desconexión intencional
      if (reason === 'io client disconnect') {
        this.connectionAttempts = 0;
      }
    });

    // Error
    this.socket.on('connect_error', (error) => {
      this.connectionAttempts++;
      console.error(`Error de conexión socket (${this.connectionAttempts}/${this.maxConnectionAttempts}):`, error.message);
      
      if (this.connectionAttempts >= this.maxConnectionAttempts) {
        console.warn('Demasiados intentos de conexión fallidos. Deshabilitando reconexión automática.');
        this.socket.disconnect();
        // No mostrar toast para evitar spam al usuario
      }
    });

    // === EVENTOS DE MESAS ===
    this.socket.on('mesa:updated', (mesa) => {
      console.log('📍 Mesa actualizada:', mesa);
      useMesasStore.getState().updateMesaFromSocket(mesa);
    });

    this.socket.on('mesa:estadoCambiado', (mesa) => {
      console.log('📍 Estado de mesa cambiado:', mesa);
      // Actualizar mesa específica en lugar de recargar todas
      useMesasStore.getState().updateMesaFromSocket(mesa);
    });

    // === EVENTOS DE MESAS UNIDAS ===
    this.socket.on('mesas:unidas', (grupo) => {
      console.log('🔗 Mesas unidas:', grupo);
      useMesasStore.getState().updateMesasUnidasFromSocket(grupo);
    });

    this.socket.on('mesas:desunidas', (data) => {
      console.log('✂️ Mesas separadas:', data);
      useMesasStore.getState().removeMesasUnidasFromSocket(data.id);
    });

    // === EVENTOS DE PEDIDOS ===
    this.socket.on('pedido:nuevo', (pedido) => {
      console.log('🆕 Nuevo pedido recibido:', pedido);
      const user = useAuthStore.getState().user;
      
      // Actualizar stores según el rol
      if (user?.rol === 'Cocina') {
        // Recargar comandas completas para asegurar datos correctos
        useCocinaStore.getState().fetchComandas();
        toast.success(`Nuevo pedido - Mesa ${pedido.mesa_numero || pedido.mesa_id}`, {
          icon: '🍳',
          duration: 5000
        });
      } else if (user?.rol === 'Caja') {
        usePedidosStore.getState().fetchPedidosActivos();
      }
    });

    this.socket.on('pedido:actualizado', (pedido) => {
      console.log('📝 Pedido actualizado:', pedido);
      const user = useAuthStore.getState().user;
      
      if (user?.rol === 'Cocina') {
        // Recargar comandas para mostrar nuevos items
        useCocinaStore.getState().fetchComandas();
        toast.success(`Pedido actualizado - Mesa ${pedido.mesa_numero || ''}`, {
          icon: '📝',
          duration: 3000
        });
      } else if (user?.rol === 'Mesero') {
        usePedidosStore.getState().fetchPedidosActivos();
      } else if (user?.rol === 'Caja') {
        usePedidosStore.getState().fetchPedidosActivos();
      }
    });

    this.socket.on('pedido:updated', (pedido) => {
      // Alias para compatibilidad
      this.socket.emit('pedido:actualizado', pedido);
    });

    this.socket.on('pedido:item_updated', (data) => {
      console.log('🔄 Item actualizado:', data);
      useCocinaStore.getState().updateComandaFromSocket({ tipo: 'item_actualizado', item: data });
    });

    this.socket.on('pedido:cuenta_solicitada', (pedido) => {
      console.log('💰 Cuenta solicitada:', pedido);
      usePedidosStore.getState().updatePedidoFromSocket(pedido);
      useCajaStore.getState().updateFromSocket({ tipo: 'cuenta_solicitada', pedido });
      
      const user = useAuthStore.getState().user;
      if (user?.rol === 'Caja') {
        toast.success(`Mesa ${pedido.mesa_numero || ''} solicita la cuenta`, {
          icon: '💰',
          duration: 5000
        });
      }
    });

    // === EVENTOS DE COCINA ===
    this.socket.on('cocina:estadoCambiado', (data) => {
      console.log('👨‍🍳 Estado de cocina cambiado:', data);
      const user = useAuthStore.getState().user;
      
      // Solo mostrar notificación para cambios que no sean 'listo' (ese se maneja en eventos específicos)
      if (user?.rol === 'Mesero' && data.estado !== 'listo') {
        toast.success(`${data.productoNombre} - Estado: ${data.estado} - Mesa ${data.mesaNumero}`, {
          icon: '👨‍🍳',
          duration: 5000
        });
      }
      
      // Actualizar datos
      useCocinaStore.getState().fetchComandas();
      usePedidosStore.getState().fetchPedidosActivos();
    });

    this.socket.on('cocina:itemListo', (data) => {
      console.log('✅ Item listo en cocina:', data);
      const user = useAuthStore.getState().user;
      
      if (user?.rol === 'Mesero') {
        toast.success(`${data.productoNombre || 'Platillo'} listo - Mesa ${data.mesaNumero}`, {
          icon: '🔔',
          duration: 6000
        });
        // Recargar pedidos activos para ver estado actualizado
        usePedidosStore.getState().fetchPedidosActivos();
      }
    });

    this.socket.on('pedido:listo', (data) => {
      console.log('Pedido completamente listo:', data);
      const user = useAuthStore.getState().user;
      
      if ((user?.rol === 'Mesero' || user?.rol_nombre === 'Mesero') && this.connected) {
        console.log('Procesando notificación para mesero');
        // Marcar mesa como con pedido listo para mostrar indicador visual
        useMesasStore.getState().marcarPedidoListo(data.mesaId);
        
        toast.success(`Mesa ${data.mesaNumero} - ¡Pedido completo listo!`, {
          icon: '',
          duration: 8000,
          style: {
            background: '#22c55e',
            color: '#fff',
            fontWeight: 'bold'
          }
        });
        // Recargar pedidos activos
        usePedidosStore.getState().fetchPedidosActivos();
      } else {
        console.log('Notificación ignorada - usuario no es mesero o socket no conectado');
      }
    });

    // === EVENTOS DE PAGOS ===
    this.socket.on('pago:procesado', (data) => {
      console.log('💳 Pago procesado:', data);
      usePedidosStore.getState().updatePedidoFromSocket({ ...data.pedido, estado: 'pagado' });
      useCajaStore.getState().updateFromSocket({ tipo: 'pago_procesado', ...data });
      useMesasStore.getState().fetchMesas();
    });

    this.socket.on('pago:realizado', (data) => {
      console.log('💵 Pago realizado:', data);
      useMesasStore.getState().fetchMesas();
      usePedidosStore.getState().fetchPedidosActivos();
    });

    // === EVENTOS DE CAJA ===
    this.socket.on('caja:movimiento', (data) => {
      console.log('Movimiento de caja:', data);
      useCajaStore.getState().updateFromSocket({ tipo: 'movimiento_registrado', ...data });
    });

    // === EVENTOS DE INVENTARIO ===
    this.socket.on('inventario:alerta_recibida', (data) => {
      console.log('Alerta de inventario recibida:', data);
      const user = useAuthStore.getState().user;
      if (user?.rol === 'Administrador') {
        toast(
          `Cocina alerta: ${data.ingrediente_nombre} - Stock: ${parseFloat(data.stock_actual).toFixed(2)} ${data.unidad_medida}`,
          {
            icon: '\u26A0\uFE0F',
            duration: 8000,
            style: { background: '#FEF2F2', color: '#991B1B', border: '2px solid #F87171', fontWeight: 'bold' }
          }
        );
      }
    });

    this.socket.on('inventario:stock_actualizado', (data) => {
      console.log('Stock actualizado:', data);
    });

    // === EVENTOS DE RESERVAS ===
    this.socket.on('reserva:created', (data) => {
      console.log('📅 Nueva reserva:', data);
      useReservasStore.getState().addReservaFromSocket(data.reserva || data);
      useReservasStore.getState().fetchReservasHoy();
      const user = useAuthStore.getState().user;
      const reserva = data.reserva || data;
      const mesaInfo = reserva.mesa_numero ? ` - Mesa ${reserva.mesa_numero}` : '';
      if (user?.rol === 'Caja' || user?.rol === 'Administrador') {
        toast.success(`Nueva reserva: ${reserva.cliente_nombre || 'Cliente'}${mesaInfo}`, {
          icon: '📅', duration: 4000
        });
      } else if (user?.rol === 'Mesero') {
        toast(`Nueva reserva: ${reserva.cliente_nombre || 'Cliente'}${mesaInfo} a las ${reserva.hora_reserva?.substring(0, 5) || ''}`, {
          icon: '📅', duration: 5000,
          style: { background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' }
        });
      }
    });

    this.socket.on('reserva:updated', (data) => {
      console.log('📅 Reserva actualizada:', data);
      useReservasStore.getState().updateReservaFromSocket(data.reserva || data);
      useReservasStore.getState().fetchReservasHoy();
    });

    this.socket.on('reserva:estado_changed', (data) => {
      console.log('📅 Estado de reserva cambiado:', data);
      useReservasStore.getState().updateReservaFromSocket(data.reserva || data);
      useReservasStore.getState().fetchReservasHoy();
      const user = useAuthStore.getState().user;
      const reserva = data.reserva || data;
      if (user?.rol === 'Mesero' && reserva.estado === 'confirmada' && reserva.mesa_numero) {
        toast(`Reserva confirmada: Mesa ${reserva.mesa_numero} - ${reserva.cliente_nombre || 'Cliente'}`, {
          icon: '✅', duration: 5000,
          style: { background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' }
        });
      }
    });

    this.socket.on('reserva:deleted', (data) => {
      console.log('📅 Reserva eliminada:', data);
      useReservasStore.getState().removeReservaFromSocket(data.id);
      useReservasStore.getState().fetchReservasHoy();
    });

    this.socket.on('reserva:recordatorio_enviado', (data) => {
      console.log('📱 Recordatorio de reserva enviado:', data);
      const user = useAuthStore.getState().user;
      if (user?.rol === 'Administrador' || user?.rol === 'Caja') {
        toast.success(`Recordatorio enviado a ${data.cliente}`, { icon: '📱', duration: 3000 });
      }
    });

    this.socket.on('reserva:estados_actualizados', (data) => {
      console.log('🔄 Estados de reservas actualizados:', data);
      useReservasStore.getState().fetchReservasHoy();
      useReservasStore.getState().fetchReservas();
      const user = useAuthStore.getState().user;
      if (user?.rol === 'Administrador' || user?.rol === 'Caja') {
        const msgs = [];
        if (data.no_asistio?.length) msgs.push(`${data.no_asistio.length} no asistió`);
        if (data.completadas?.length) msgs.push(`${data.completadas.length} completada(s)`);
        toast(`Reservas actualizadas: ${msgs.join(', ')}`, { icon: '🔄', duration: 4000 });
      }
    });

    // === EVENTOS DE WHATSAPP ===
    this.socket.on('whatsapp:qr', (data) => {
      console.log('📱 QR WhatsApp recibido');
      useReservasStore.getState().setWhatsappQR(data.qr);
    });

    this.socket.on('whatsapp:status', (data) => {
      console.log('📱 Estado WhatsApp cambiado:', data);
      useReservasStore.getState().setWhatsappStatus(data);
    });
  }

  // Emitir evento
  emit(event, data) {
    if (!this.socket?.connected) {
      console.warn('Socket no conectado, no se puede emitir:', event);
      return false;
    }
    this.socket.emit(event, data);
    return true;
  }

  // Unirse a sala específica
  joinRoom(room) {
    this.emit('join:room', room);
  }

  // Salir de sala
  leaveRoom(room) {
    this.emit('leave:room', room);
  }

  // Agregar listener personalizado
  on(event, callback) {
    if (!this.socket) return;
    this.socket.on(event, callback);
    this.listeners.set(event, callback);
  }

  // Remover listener
  off(event) {
    if (!this.socket) return;
    const callback = this.listeners.get(event);
    if (callback) {
      this.socket.off(event, callback);
      this.listeners.delete(event);
    }
  }

  // Desconectar
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.listeners.clear();
    }
  }

  // Verificar si está conectado
  isConnected() {
    return this.socket?.connected || false;
  }
}

// Exportar instancia única
const socketService = new SocketService();
export { socketService };
export default socketService;
