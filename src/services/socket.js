// services/socket.js
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('❌ No token available for WebSocket connection');
      return false;
    }

    if (this.socket && this.connected) {
      console.log('🔌 WebSocket already connected');
      return true;
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    console.log('🔌 Connecting to WebSocket:', API_URL);
    
    this.socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.connected = true;
      this.reconnectAttempts = 0;
      
      this.socket.emit('connection:registered', { timestamp: Date.now() });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached');
      }
    });

    this.socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });

    return true;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      console.log('🔌 WebSocket disconnected');
    }
  }

  emit(event, data) {
    if (this.socket && this.connected) {
      console.log(`📤 Emitting ${event}:`, data);
      this.socket.emit(event, data);
      return true;
    } else {
      console.warn(`⚠️ Cannot emit ${event}: socket not connected`);
      return false;
    }
  }

  on(event, callback) {
    if (this.socket) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, new Set());
      }
      this.listeners.get(event).add(callback);
      this.socket.on(event, callback);
      console.log(`📡 Listening to ${event}`);
    }
  }

  off(event, callback) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
        this.listeners.get(event)?.delete(callback);
      } else {
        this.socket.off(event);
        this.listeners.delete(event);
      }
    }
  }

  getConnectionStatus() {
    return {
      connected: this.connected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Crear instancia única
const socketService = new SocketService();

// Exportar como default y también como named export
export default socketService;
export { socketService };
