import { useEffect, useState, useRef, useCallback } from 'react';
import { useReservasStore } from '@store/reservasStore';
import { useSocket } from '@hooks/useSocket';

import {
  FiCalendar, FiPhone, FiUsers, FiClock, FiCheck, FiX,
  FiMessageSquare, FiSend, FiWifi, FiWifiOff,
  FiRefreshCw, FiPlus, FiSearch
} from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import api from '@services/api';

const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-400' },
  { value: 'confirmada', label: 'Confirmada', color: 'bg-blue-100 text-blue-800', dot: 'bg-blue-400' },
  { value: 'completada', label: 'Completada', color: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
  { value: 'cancelada', label: 'Cancelada', color: 'bg-red-100 text-red-800', dot: 'bg-red-400' },
  { value: 'no_asistio', label: 'No asistió', color: 'bg-gray-100 text-gray-800', dot: 'bg-gray-400' },
];

const getEstadoInfo = (estado) => ESTADOS.find(e => e.value === estado) || ESTADOS[0];

export default function CajaReservas() {

  const { socket, isConnected } = useSocket();
  
  const {
    reservasHoy, isLoading,
    fetchReservasHoy, cambiarEstadoReserva,
    crearReserva,
    whatsappStatus, whatsappQR, fetchWhatsappStatus,
    conectarWhatsapp, desconectarWhatsapp,
    enviarConfirmacionWhatsapp, enviarRecordatorioWhatsapp,
    setWhatsappQR, setWhatsappStatus,
    fetchMesasDisponibles, mesasDisponibles
  } = useReservasStore();

  const [showQRModal, setShowQRModal] = useState(false);
  const [showNuevaReserva, setShowNuevaReserva] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [mesasAll, setMesasAll] = useState([]);
  const [formData, setFormData] = useState({
    nombre_cliente: '',
    telefono_cliente: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: '19:00',
    num_personas: '2',
    mesa_id: '',
    notas: '',
    duracion_estimada: '120'
  });

  useEffect(() => {
    fetchReservasHoy();
    fetchWhatsappStatus();
    loadMesas();

    // Refrescar cada 60 segundos
    const interval = setInterval(() => {
      fetchReservasHoy();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Escuchar eventos de WhatsApp por Socket
  useEffect(() => {
  if (!socket || !isConnected) return;

  const handleQR = (data) => {
    console.log('📱 QR WhatsApp recibido');
    setWhatsappQR(data.qr);
    setQrLoading(false);
  };

  const handleStatus = (data) => {
    console.log('📱 Estado WhatsApp:', data);
    setWhatsappStatus(data);

    if (data.estado === 'conectado') {
      setShowQRModal(false);
      toast.success('WhatsApp conectado exitosamente', {
        icon: '📱',
        duration: 4000
      });
    }
  };

  const handleRefresh = () => {
    fetchReservasHoy();
  };

  // ✅ listeners
  socket.on('whatsapp:qr', handleQR);
  socket.on('whatsapp:status', handleStatus);

  socket.on('reserva:created', handleRefresh);
  socket.on('reserva:updated', handleRefresh);
  socket.on('reserva:estado_changed', handleRefresh);
  socket.on('reserva:estados_actualizados', handleRefresh);

  return () => {
    // ✅ cleanup correcto
    socket.off('whatsapp:qr', handleQR);
    socket.off('whatsapp:status', handleStatus);

    socket.off('reserva:created', handleRefresh);
    socket.off('reserva:updated', handleRefresh);
    socket.off('reserva:estado_changed', handleRefresh);
    socket.off('reserva:estados_actualizados', handleRefresh);
  };
}, [socket, isConnected]);

  // Polling de estado WhatsApp - deshabilitado, se usa botón manual
  // El usuario confirma manualmente con el botón 'Ya escaneé el QR'

  // Buscar mesas disponibles cuando cambian fecha/hora/personas
  useEffect(() => {
    if (showNuevaReserva && formData.fecha && formData.hora) {
      fetchMesasDisponibles(
        formData.fecha, formData.hora,
        parseInt(formData.duracion_estimada),
        parseInt(formData.num_personas)
      );
    }
  }, [showNuevaReserva, formData.fecha, formData.hora, formData.num_personas, formData.duracion_estimada]);

  const loadMesas = async () => {
    try {
      const res = await api.get('/mesas');
      setMesasAll(res.data.data);
    } catch (e) { /* ignore */ }
  };

  const handleConectarWhatsapp = async () => {
    setQrLoading(true);
    setWhatsappQR(null);
    await conectarWhatsapp();
    setShowQRModal(true);
    
    // Polling para obtener el QR del backend (el WebSocket puede no estar disponible durante reconexión)
    let attempts = 0;
    const qrPoll = setInterval(async () => {
      attempts++;
      try {
        const status = await fetchWhatsappStatus();
        if (status?.qrCode) {
          setWhatsappQR(status.qrCode);
          setQrLoading(false);
          clearInterval(qrPoll);
        }
        if (status?.estado === 'conectado') {
          setQrLoading(false);
          clearInterval(qrPoll);
        }
      } catch (e) { /* ignore */ }
      if (attempts > 20) {
        setQrLoading(false);
        clearInterval(qrPoll);
      }
    }, 2000);
  };

  const handleVerificarConexion = async () => {
    setQrLoading(true);
    try {
      const status = await fetchWhatsappStatus();
      if (status?.estado === 'conectado') {
        setShowQRModal(false);
        setWhatsappQR(null);
        setQrLoading(false);
        toast.success('¡WhatsApp conectado exitosamente!', { icon: '📱', duration: 4000 });
      } else {
        setQrLoading(false);
        toast.error('Aún no se detecta la conexión. Escanea el QR e intenta de nuevo.', { icon: '⚠️', duration: 3000 });
      }
    } catch (e) {
      setQrLoading(false);
      toast.error('Error al verificar conexión', { icon: '❌' });
    }
  };

  const handleCrearReservaRapida = async (e) => {
    e.preventDefault();
    const data = {
      cliente_nombre: formData.nombre_cliente,
      cliente_telefono: formData.telefono_cliente,
      fecha_reserva: formData.fecha,
      hora_reserva: formData.hora,
      num_personas: parseInt(formData.num_personas),
      mesa_id: formData.mesa_id ? parseInt(formData.mesa_id) : null,
      duracion_minutos: parseInt(formData.duracion_estimada),
      notas: formData.notas || null
    };
    const result = await crearReserva(data);
    if (result) {
      setShowNuevaReserva(false);
      fetchReservasHoy();
      setFormData({
        nombre_cliente: '',
        telefono_cliente: '',
        fecha: new Date().toISOString().split('T')[0],
        hora: '19:00',
        num_personas: '2',
        mesa_id: '',
        notas: '',
        duracion_estimada: '120'
      });
    }
  };

  // Separar reservas por estado
  const pendientes = reservasHoy.filter(r => r.estado === 'pendiente');
  const confirmadas = reservasHoy.filter(r => r.estado === 'confirmada');
  const completadas = reservasHoy.filter(r => r.estado === 'completada');
  const otrasHoy = reservasHoy.filter(r => !['pendiente', 'confirmada', 'completada'].includes(r.estado));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-cafe-800 flex items-center gap-2">
            <FiCalendar className="text-oliva-500" />
            Reservas de Hoy
          </h2>
          <p className="text-cafe-500 text-sm">
            {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
            {' • '}{reservasHoy.length} reserva(s)
          </p>
        </div>
        <div className="flex gap-2">
          {/* WhatsApp Control */}
          <button
            onClick={whatsappStatus?.estado === 'conectado' ? desconectarWhatsapp : handleConectarWhatsapp}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-button transition-colors text-sm',
              whatsappStatus?.estado === 'conectado'
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
            )}
          >
            {whatsappStatus?.estado === 'conectado' ? (
              <><FiWifi className="w-4 h-4" /> WhatsApp Activo</>
            ) : (
              <><FiWifiOff className="w-4 h-4" /> Conectar WhatsApp</>
            )}
          </button>
          <button
            onClick={() => setShowNuevaReserva(true)}
            className="flex items-center gap-2 px-4 py-2 bg-oliva-500 text-white rounded-button hover:bg-oliva-600 text-sm"
          >
            <FiPlus /> Reserva Rápida
          </button>
          <button onClick={fetchReservasHoy} className="p-2 text-cafe-500 hover:text-cafe-700">
            <FiRefreshCw />
          </button>
        </div>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-button p-4 text-center">
          <p className="text-2xl font-bold text-yellow-700">{pendientes.length}</p>
          <p className="text-sm text-yellow-600">Pendientes</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-button p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{confirmadas.length}</p>
          <p className="text-sm text-blue-600">Confirmadas</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-button p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{completadas.length}</p>
          <p className="text-sm text-green-600">Completadas</p>
        </div>
      </div>

      {/* Lista de reservas del día */}
      {isLoading ? (
        <div className="bg-white rounded-button shadow-sm border p-8 text-center text-cafe-400">
          <div className="w-8 h-8 border-4 border-oliva-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Cargando reservas...
        </div>
      ) : reservasHoy.length === 0 ? (
        <div className="bg-white rounded-button shadow-sm border p-12 text-center">
          <FiCalendar className="w-16 h-16 mx-auto mb-3 text-cafe-300" />
          <p className="text-cafe-500 text-lg">No hay reservas para hoy</p>
          <button onClick={() => setShowNuevaReserva(true)}
            className="mt-4 px-4 py-2 bg-oliva-500 text-white rounded-button hover:bg-oliva-600 text-sm">
            Crear primera reserva
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Pendientes primero, luego confirmadas, luego el resto */}
          {[...pendientes, ...confirmadas, ...completadas, ...otrasHoy].map((reserva) => {
            const estadoInfo = getEstadoInfo(reserva.estado);
            const esActiva = ['pendiente', 'confirmada'].includes(reserva.estado);
            
            return (
              <div key={reserva.id} className={clsx(
                'bg-white rounded-button shadow-sm border p-4 transition-all',
                esActiva && 'border-l-4',
                reserva.estado === 'pendiente' && 'border-l-yellow-400',
                reserva.estado === 'confirmada' && 'border-l-blue-400'
              )}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-cafe-800">{reserva.cliente_nombre}</h3>
                      <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', estadoInfo.color)}>
                        <span className={clsx('w-1.5 h-1.5 rounded-full', estadoInfo.dot)}></span>
                        {estadoInfo.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-cafe-500">
                      <span className="flex items-center gap-1">
                        <FiClock className="w-4 h-4" /> {reserva.hora_reserva?.substring(0, 5)}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiUsers className="w-4 h-4" /> {reserva.num_personas} personas
                      </span>
                      {reserva.mesa_numero && (
                        <span className="font-medium text-cafe-700">Mesa {reserva.mesa_numero}</span>
                      )}
                      {reserva.cliente_telefono && (
                        <span className="flex items-center gap-1">
                          <FiPhone className="w-4 h-4" /> {reserva.cliente_telefono}
                        </span>
                      )}
                    </div>
                    {reserva.notas && (
                      <p className="text-xs text-cafe-400 mt-1 italic">📝 {reserva.notas}</p>
                    )}
                  </div>
                  
                  {/* Acciones */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* WhatsApp actions */}
                    {reserva.cliente_telefono && whatsappStatus?.estado === 'conectado' && esActiva && (
                      <button
                        onClick={() => enviarConfirmacionWhatsapp(reserva.id)}
                        className="p-2 bg-green-50 text-green-600 rounded-button hover:bg-green-100 transition-colors"
                        title="Enviar mensaje WhatsApp"
                      >
                        <FiSend className="w-4 h-4" />
                      </button>
                    )}
                    
                    {/* Estado actions */}
                    {reserva.estado === 'pendiente' && (
                      <button onClick={() => cambiarEstadoReserva(reserva.id, 'confirmada')}
                        className="p-2 bg-blue-50 text-blue-600 rounded-button hover:bg-blue-100" title="Confirmar">
                        <FiCheck className="w-4 h-4" />
                      </button>
                    )}
                    {reserva.estado === 'confirmada' && (
                      <button onClick={() => cambiarEstadoReserva(reserva.id, 'completada')}
                        className="p-2 bg-green-50 text-green-600 rounded-button hover:bg-green-100" title="Completar">
                        <FiCheck className="w-4 h-4" />
                      </button>
                    )}
                    {esActiva && (
                      <button onClick={() => {
                        setShowCancelModal(reserva.id);
                        setMotivoCancelacion('');
                      }}
                        className="p-2 bg-red-50 text-red-600 rounded-button hover:bg-red-100" title="Cancelar">
                        <FiX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal QR WhatsApp */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold text-cafe-800 flex items-center gap-2">
                <FiMessageSquare className="text-green-600" />
                Conectar WhatsApp
              </h3>
              <button onClick={() => setShowQRModal(false)} className="text-cafe-400 hover:text-cafe-600">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 text-center">
              {whatsappStatus?.estado === 'conectado' ? (
                <div className="py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiCheck className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-lg font-medium text-green-700">WhatsApp Conectado</p>
                  <p className="text-sm text-cafe-500 mt-2">Los mensajes de reservas se enviarán automáticamente</p>
                </div>
              ) : qrLoading && !whatsappQR ? (
                <div className="py-12">
                  <div className="w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-cafe-500">Generando código QR...</p>
                  <p className="text-xs text-cafe-400 mt-2">Esto puede tardar unos segundos</p>
                </div>
              ) : whatsappQR ? (
                <div>
                  <p className="text-sm text-cafe-600 mb-4">
                    Escanea este código QR con WhatsApp en tu celular
                  </p>
                  <div className="bg-white p-4 rounded-lg inline-block border-2 border-green-200">
                    <QRCodeSVG
                      value={whatsappQR}
                      size={256}
                      level="M"
                      includeMargin={true}
                    />
                  </div>
                  <div className="mt-4 text-xs text-cafe-400 space-y-1">
                    <p>1. Abre WhatsApp en tu teléfono</p>
                    <p>2. Ve a Configuración → Dispositivos vinculados</p>
                    <p>3. Toca "Vincular un dispositivo"</p>
                    <p>4. Escanea este código QR</p>
                  </div>
                  <div className="mt-5 flex flex-col items-center gap-3">
                    <button
                      onClick={handleVerificarConexion}
                      disabled={qrLoading}
                      className="w-full max-w-xs px-5 py-3 bg-green-500 text-white rounded-button hover:bg-green-600 font-bold text-base transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {qrLoading ? (
                        <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Verificando...</>
                      ) : (
                        <><FiCheck className="w-5 h-5" /> Ya escaneé, Conectar</>
                      )}
                    </button>
                    <button
                      onClick={handleConectarWhatsapp}
                      className="text-sm text-cafe-500 hover:text-cafe-700 underline"
                    >
                      Regenerar QR
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8">
                  <FiWifiOff className="w-12 h-12 mx-auto text-cafe-300 mb-4" />
                  <p className="text-cafe-500">No se pudo generar el QR</p>
                  <button
                    onClick={handleConectarWhatsapp}
                    className="mt-4 px-4 py-2 bg-green-500 text-white rounded-button hover:bg-green-600"
                  >
                    Reintentar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Reserva Rápida */}
      {showNuevaReserva && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold text-cafe-800">Reserva Rápida</h3>
              <button onClick={() => setShowNuevaReserva(false)} className="text-cafe-400 hover:text-cafe-600">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCrearReservaRapida} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-cafe-700 mb-1">Nombre *</label>
                <input type="text" required
                  value={formData.nombre_cliente}
                  onChange={(e) => setFormData({ ...formData, nombre_cliente: e.target.value })}
                  className="w-full px-3 py-2 border rounded-button focus:ring-2 focus:ring-oliva-400"
                  placeholder="Nombre del cliente"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-cafe-700 mb-1">Teléfono (WhatsApp)</label>
                <input type="tel"
                  value={formData.telefono_cliente}
                  onChange={(e) => setFormData({ ...formData, telefono_cliente: e.target.value })}
                  className="w-full px-3 py-2 border rounded-button focus:ring-2 focus:ring-oliva-400"
                  placeholder="999999999"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-cafe-700 mb-1">Fecha</label>
                  <input type="date" required
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full px-3 py-2 border rounded-button focus:ring-2 focus:ring-oliva-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cafe-700 mb-1">Hora</label>
                  <input type="time" required
                    value={formData.hora}
                    onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                    className="w-full px-3 py-2 border rounded-button focus:ring-2 focus:ring-oliva-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-cafe-700 mb-1">Personas</label>
                  <input type="number" min="1" max="50"
                    value={formData.num_personas}
                    onChange={(e) => {
                      const newPersonas = e.target.value;
                      let newMesaId = formData.mesa_id;
                      if (newMesaId) {
                        const mesaSel = [...mesasDisponibles, ...mesasAll].find(m => String(m.id) === newMesaId);
                        if (mesaSel && mesaSel.capacidad < parseInt(newPersonas || 1)) newMesaId = '';
                      }
                      setFormData({ ...formData, num_personas: newPersonas, mesa_id: newMesaId });
                    }}
                    className="w-full px-3 py-2 border rounded-button focus:ring-2 focus:ring-oliva-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cafe-700 mb-1">Duración</label>
                  <select
                    value={formData.duracion_estimada}
                    onChange={(e) => setFormData({ ...formData, duracion_estimada: e.target.value })}
                    className="w-full px-3 py-2 border rounded-button focus:ring-2 focus:ring-oliva-400"
                  >
                    <option value="60">1 hora</option>
                    <option value="90">1.5 horas</option>
                    <option value="120">2 horas</option>
                    <option value="180">3 horas</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-cafe-700 mb-1">
                  Mesa {mesasDisponibles.length > 0 && <span className="text-green-600 text-xs">({mesasDisponibles.length} disponibles)</span>}
                </label>
                <select
                  value={formData.mesa_id}
                  onChange={(e) => setFormData({ ...formData, mesa_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-button focus:ring-2 focus:ring-oliva-400"
                >
                  <option value="">Sin asignar (se asignará después)</option>
                  {mesasDisponibles.length > 0 ? (
                    mesasDisponibles
                      .filter(m => m.capacidad >= parseInt(formData.num_personas || 1))
                      .map(m => (
                        <option key={m.id} value={m.id}>
                          Mesa {m.numero} - Cap: {m.capacidad} pers.{m.ubicacion ? ` (${m.ubicacion})` : ''}
                        </option>
                      ))
                  ) : (
                    mesasAll
                      .filter(m => m.capacidad >= parseInt(formData.num_personas || 1))
                      .map(m => (
                        <option key={m.id} value={m.id}>
                          Mesa {m.numero} - Cap: {m.capacidad} pers.
                        </option>
                      ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-cafe-700 mb-1">Notas</label>
                <input type="text"
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full px-3 py-2 border rounded-button focus:ring-2 focus:ring-oliva-400"
                  placeholder="Observaciones..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowNuevaReserva(false)}
                  className="px-4 py-2 border rounded-button hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-oliva-500 text-white rounded-button hover:bg-oliva-600">
                  Crear Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cancelar Reserva */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-5 border-b">
              <h3 className="text-lg font-bold text-cafe-800 flex items-center gap-2">
                <FiX className="text-red-500" /> Cancelar Reserva
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-cafe-600 text-sm">¿Está seguro de cancelar esta reserva?</p>
              <div>
                <label className="block text-sm font-medium text-cafe-700 mb-1">Motivo (opcional)</label>
                <textarea
                  value={motivoCancelacion}
                  onChange={(e) => setMotivoCancelacion(e.target.value)}
                  className="w-full px-3 py-2 border rounded-button focus:ring-2 focus:ring-red-300 focus:border-red-300"
                  rows="3"
                  placeholder="Ej: Cliente llamó para cancelar..."
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setShowCancelModal(null); setMotivoCancelacion(''); }}
                  className="px-4 py-2 border rounded-button hover:bg-gray-50 text-sm">Volver</button>
                <button type="button" onClick={async () => {
                  await cambiarEstadoReserva(showCancelModal, 'cancelada', motivoCancelacion);
                  setShowCancelModal(null);
                  setMotivoCancelacion('');
                  fetchReservasHoy();
                }}
                  className="px-4 py-2 bg-red-500 text-white rounded-button hover:bg-red-600 text-sm">
                  Confirmar Cancelación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
