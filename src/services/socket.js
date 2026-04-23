import { io } from 'socket.io-client';
import { useAuthStore } from '@store/authStore';
import { useMesasStore } from '@store/mesasStore';
import { usePedidosStore } from '@store/pedidosStore';
import { useCocinaStore } from '@store/cocinaStore';
import { useCajaStore } from '@store/cajaStore';
import { useReservasStore } from '@store/reservasStore';
import toast from 'react-hot-toast';

// ✅ SOLO backend (Render)
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

if (!SOCKET_URL) {
  console.error('❌ VITE_SOCKET_URL no está definida');
}

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

    if (!token || !user) {
      console.warn('No se puede conectar socket sin autenticación');
      return;
    }

    // Evitar reconexiones innecesarias
    if (this.socket?.connected && this.listenersConfigured) {
      return;
    }

    if (this.socket && !this.socket.connected) {
      this.socket.disconnect();
      this.socket = null;
      this.listenersConfigured = false;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'], // 🔥 importante
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    console.log('🔌 Conectando socket a:', SOCKET_URL);

    this.setupListeners();
  }

  setupListeners() {
    if (!this.socket || this.listenersConfigured) return;
    this.listenersConfigured = true;

    this.socket.on('connect', () => {
      console.log('✅ Socket conectado:', this.socket.id);
      this.connected = true;
      this.connectionAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket desconectado:', reason);
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      this.connectionAttempts++;
      console.error(
        `Error socket (${this.connectionAttempts}/${this.maxConnectionAttempts}):`,
        error.message
      );

      if (this.connectionAttempts >= this.maxConnectionAttempts) {
        this.socket.disconnect();
      }
    });

    // === MESAS ===
    this.socket.on('mesa:updated', (mesa) => {
      useMesasStore.getState().updateMesaFromSocket(mesa);
    });

    this.socket.on('mesa:estadoCambiado', (mesa) => {
      useMesasStore.getState().updateMesaFromSocket(mesa);
    });

    // === PEDIDOS ===
    this.socket.on('pedido:nuevo', (pedido) => {
      const user = useAuthStore.getState().user;

      if (user?.rol === 'Cocina') {
        useCocinaStore.getState().fetchComandas();
        toast.success(`Nuevo pedido - Mesa ${pedido.mesa_numero}`, { icon: '🍳' });
      } else {
        usePedidosStore.getState().fetchPedidosActivos();
      }
    });

    this.socket.on('pedido:actualizado', () => {
      usePedidosStore.getState().fetchPedidosActivos();
      useCocinaStore.getState().fetchComandas();
    });

    // === COCINA ===
    this.socket.on('cocina:itemListo', (data) => {
      const user = useAuthStore.getState().user;

      if (user?.rol === 'Mesero') {
        toast.success(`Listo: ${data.productoNombre}`, { icon: '🔔' });
        usePedidosStore.getState().fetchPedidosActivos();
      }
    });

    // === PAGOS ===
    this.socket.on('pago:procesado', (data) => {
      usePedidosStore.getState().updatePedidoFromSocket(data.pedido);
      useMesasStore.getState().fetchMesas();
    });

    // === RESERVAS ===
    this.socket.on('reserva:created', (data) => {
      useReservasStore.getState().addReservaFromSocket(data);
    });

    // === WHATSAPP ===
    this.socket.on('whatsapp:qr', (data) => {
      useReservasStore.getState().setWhatsappQR(data.qr);
    });
  }

  emit(event, data) {
    if (!this.socket?.connected) return false;
    this.socket.emit(event, data);
    return true;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.listeners.clear();
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

const socketService = new SocketService();
export { socketService };
export default socketService;
