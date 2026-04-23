import React, { useState, useEffect } from 'react';
import {
  FiSmartphone, FiWifi, FiWifiOff, FiRefreshCw, FiPower,
  FiCheckCircle, FiAlertCircle, FiLoader
} from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import api from '@services/api';

const WhatsAppConnection = ({ onStatsUpdate }) => {
  const [connectionStatus, setConnectionStatus] = useState({
    isReady: false,
    hasQR: false,
    qrCode: null,
    isConnecting: false,
    status: 'disconnected' // disconnected, connecting, waiting_scan, processing, ready
  });
  const [isInitializing, setIsInitializing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Verificar estado de conexión al cargar y cada 3s
  useEffect(() => {
    checkConnectionStatus();
    const interval = setInterval(checkConnectionStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await api.get('/whatsapp/status');
      const data = response.data;

      if (data.success) {
        const wasNotReady = !connectionStatus.isReady;

        setConnectionStatus({
          isReady: data.isReady,
          hasQR: data.hasQR,
          qrCode: data.qrCode,
          isConnecting: data.isConnecting || false,
          status: data.status || (data.isReady ? 'ready' :
                  data.hasQR ? 'waiting_scan' :
                  data.isConnecting ? 'connecting' : 'disconnected')
        });

        if (data.isReady && wasNotReady) {
          toast.success('¡WhatsApp conectado exitosamente!', { icon: '📱', duration: 4000 });
        }
      }
    } catch (error) {
      console.error('Error verificando estado:', error);
    }
  };

  const initializeWhatsApp = async () => {
    setIsInitializing(true);
    setConnectionStatus(prev => ({
      ...prev,
      isConnecting: true,
      status: 'connecting',
      hasQR: false,
      qrCode: null
    }));

    try {
      const response = await api.post('/whatsapp/initialize');
      const data = response.data;

      if (data.success) {
        toast.success(data.message || 'Conectando a WhatsApp...', { icon: '📱' });
        setTimeout(checkConnectionStatus, 1000);
      } else {
        toast.error(data.error || 'Error al inicializar WhatsApp');
        setConnectionStatus(prev => ({
          ...prev,
          isConnecting: false,
          status: 'disconnected'
        }));
      }
    } catch (error) {
      console.error('Error inicializando WhatsApp:', error);
      toast.error('Error de conexión al servidor');
      setConnectionStatus(prev => ({
        ...prev,
        isConnecting: false,
        status: 'disconnected'
      }));
    } finally {
      setIsInitializing(false);
    }
  };

  const disconnectWhatsApp = async () => {
    setIsDisconnecting(true);
    try {
      const response = await api.post('/whatsapp/disconnect');
      const data = response.data;

      if (data.success) {
        toast.success('WhatsApp desconectado correctamente');
        setConnectionStatus({
          isReady: false,
          hasQR: false,
          qrCode: null,
          isConnecting: false,
          status: 'disconnected'
        });
        if (onStatsUpdate) onStatsUpdate();
      } else {
        toast.error(data.error || 'Error al desconectar WhatsApp');
      }
    } catch (error) {
      console.error('Error desconectando WhatsApp:', error);
      toast.error('Error de conexión al servidor');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const forceNewSession = async () => {
    const confirmed = window.confirm(
      '¿Está seguro de que desea limpiar la sesión?\n\n' +
      'Esto eliminará las credenciales guardadas y deberá escanear el QR nuevamente.'
    );
    if (!confirmed) return;

    setIsDisconnecting(true);
    try {
      const response = await api.post('/whatsapp/force-new-session');
      const data = response.data;

      if (data.success) {
        toast.success('Sesión limpiada exitosamente. Puede conectar WhatsApp nuevamente.');
        setConnectionStatus({
          isReady: false,
          hasQR: false,
          qrCode: null,
          isConnecting: false,
          status: 'disconnected'
        });
      } else {
        toast.error(data.error || 'Error al limpiar sesión');
      }
    } catch (error) {
      console.error('Error limpiando sesión:', error);
      toast.error('Error de conexión al servidor');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const getStatusColor = () => {
    if (connectionStatus.isReady) return 'text-green-500';
    if (connectionStatus.status === 'processing') return 'text-green-500';
    if (connectionStatus.hasQR) return 'text-yellow-500';
    if (connectionStatus.isConnecting) return 'text-blue-500';
    return 'text-gray-400';
  };

  const getStatusText = () => {
    if (connectionStatus.isReady) return 'Conectado';
    if (connectionStatus.status === 'processing') return 'Procesando conexión...';
    if (connectionStatus.hasQR) return 'Esperando escaneo QR';
    if (connectionStatus.isConnecting) return 'Conectando...';
    return 'Desconectado';
  };

  return (
    <div className="space-y-6">
      {/* Header con estado */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${
              connectionStatus.isReady ? 'bg-green-100' :
              connectionStatus.hasQR ? 'bg-yellow-100' :
              connectionStatus.isConnecting ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              {connectionStatus.isConnecting ? (
                <FiLoader className="h-6 w-6 text-blue-500 animate-spin" />
              ) : (
                <FiSmartphone className={`h-6 w-6 ${getStatusColor()}`} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Estado de WhatsApp</h2>
              <div className="flex items-center space-x-2 mt-1">
                {connectionStatus.isReady ? (
                  <FiWifi className="h-4 w-4 text-green-500" />
                ) : (
                  <FiWifiOff className="h-4 w-4 text-gray-400" />
                )}
                <span className={`text-sm font-medium ${getStatusColor()}`}>
                  {getStatusText()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 flex-wrap gap-2">
            <button
              onClick={checkConnectionStatus}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <FiRefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </button>

            {/* Botón para forzar nueva sesión */}
            {!connectionStatus.isReady && !connectionStatus.isConnecting && (
              <button
                onClick={forceNewSession}
                disabled={isDisconnecting}
                className="inline-flex items-center px-3 py-2 border border-orange-300 rounded-lg text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Limpiar sesión y credenciales para empezar desde cero"
              >
                {isDisconnecting ? (
                  <FiLoader className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FiRefreshCw className="h-4 w-4 mr-2" />
                )}
                Limpiar Sesión
              </button>
            )}

            {connectionStatus.isReady ? (
              <button
                onClick={disconnectWhatsApp}
                disabled={isDisconnecting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDisconnecting ? (
                  <FiLoader className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FiPower className="h-4 w-4 mr-2" />
                )}
                Desconectar
              </button>
            ) : (
              <button
                onClick={initializeWhatsApp}
                disabled={isInitializing || connectionStatus.isConnecting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {(isInitializing || connectionStatus.isConnecting) ? (
                  <>
                    <FiLoader className="h-4 w-4 mr-2 animate-spin" />
                    {connectionStatus.isConnecting ? 'Conectando...' : 'Iniciando...'}
                  </>
                ) : (
                  <>
                    <FiPower className="h-4 w-4 mr-2" />
                    Conectar
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Estados de conexión */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Estado de Conectando */}
        {connectionStatus.isConnecting && !connectionStatus.hasQR && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <FiLoader className="h-12 w-12 text-blue-500 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Conectando a WhatsApp
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Estableciendo conexión y generando código QR...
              </p>
              <div className="animate-pulse">
                <div className="h-2 bg-blue-200 rounded w-3/4 mx-auto mb-2"></div>
                <div className="h-2 bg-blue-200 rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          </div>
        )}

        {/* QR Code */}
        {connectionStatus.hasQR && connectionStatus.qrCode && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Escanea el código QR
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Abre WhatsApp en tu teléfono y escanea este código.
              </p>

              <div className="inline-block bg-white p-4 rounded-lg shadow-inner border-2 border-green-200">
                <QRCodeSVG
                  value={connectionStatus.qrCode}
                  size={220}
                  level="M"
                  includeMargin={true}
                />
              </div>

              <p className="text-xs text-gray-500 mt-3">
                El estado se actualizará automáticamente al escanear
              </p>
            </div>
          </div>
        )}

        {/* Estado de conexión */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Información de Conexión
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Estado</span>
              <div className="flex items-center space-x-2">
                {connectionStatus.isReady ? (
                  <FiCheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <FiAlertCircle className="h-4 w-4 text-gray-400" />
                )}
                <span className={`text-sm font-medium ${getStatusColor()}`}>
                  {getStatusText()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">QR Disponible</span>
              <span className={`text-sm font-medium ${connectionStatus.hasQR ? 'text-yellow-600' : 'text-gray-500'}`}>
                {connectionStatus.hasQR ? 'Sí' : 'No'}
              </span>
            </div>

            {connectionStatus.isReady && (
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FiCheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    WhatsApp conectado y listo para enviar mensajes
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instrucciones */}
      {!connectionStatus.isReady && (
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              Cómo conectar WhatsApp
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>Haz clic en el botón "Conectar" para inicializar WhatsApp</li>
              <li>Aparecerá un código QR en pantalla</li>
              <li>Abre WhatsApp en tu teléfono</li>
              <li>Ve a Configuración → Dispositivos vinculados</li>
              <li>Toca "Vincular un dispositivo" y escanea el código QR</li>
              <li><strong className="text-green-700">¡Listo! La conexión se detectará automáticamente</strong></li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppConnection;
