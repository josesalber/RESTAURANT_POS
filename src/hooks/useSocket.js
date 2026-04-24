// hooks/useSocket.js
import { useState, useEffect } from 'react';
import socketService from '@services/socket';
import { useAuthStore } from '@store/authStore';

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(socketService.connected);
  const [socket, setSocket] = useState(socketService.socket);
  const { token, user, isInitialized } = useAuthStore();

  useEffect(() => {
    // Función para actualizar el estado cuando cambia la conexión
    const updateConnectionStatus = () => {
      setIsConnected(socketService.connected);
      setSocket(socketService.socket);
    };

    // Verificar estado inicial
    updateConnectionStatus();

    // Intentar conectar si hay token y usuario pero no está conectado, y la auth está inicializada
    if (isInitialized && token && user && !socketService.connected) {
      console.log('🔌 Intentando conectar socket automáticamente - token length:', token.length, 'user:', user.username);
      socketService.connect();
    }

    // Configurar interval para verificar cambios de conexión
    const interval = setInterval(updateConnectionStatus, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [token, user, isInitialized]);

  // Función para emitir eventos
  const emit = (event, data) => {
    if (socketService.socket && socketService.connected) {
      console.log(`📤 Emitiendo evento: ${event}`, data);
      socketService.socket.emit(event, data);
      return true;
    } else {
      console.warn(`⚠️ No se pudo emitir ${event}: socket no conectado`);
      return false;
    }
  };

  // Función para suscribirse a eventos
  const on = (event, callback) => {
    if (socketService.socket) {
      socketService.socket.on(event, callback);
      console.log(`📡 Suscrito a evento: ${event}`);
      return () => socketService.socket?.off(event, callback);
    }
    return () => {};
  };

  // Función para desuscribirse
  const off = (event, callback) => {
    if (socketService.socket) {
      socketService.socket.off(event, callback);
    }
  };

  return {
    socket,
    isConnected,
    connect: () => socketService.connect(),
    disconnect: () => socketService.disconnect(),
    emit,
    on,
    off,
  };
};
