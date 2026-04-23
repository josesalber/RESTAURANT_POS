import { useEffect, useState, useCallback } from 'react';
import { useReservasStore } from '@store/reservasStore';
import {
  FiCalendar, FiPlus, FiEdit2, FiTrash2, FiPhone, FiUsers,
  FiClock, FiCheck, FiX, FiMessageSquare, FiSearch,
  FiFilter, FiRefreshCw, FiBarChart2, FiSend
} from 'react-icons/fi';
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

export default function AdminReservas() {
  const {
    reservas, estadisticas, isLoading,
    fetchReservas, fetchEstadisticas, crearReserva,
    actualizarReserva, cambiarEstadoReserva, eliminarReserva,
    fetchMesasDisponibles, mesasDisponibles,
    whatsappStatus, fetchWhatsappStatus,
    enviarConfirmacionWhatsapp, enviarRecordatorioWhatsapp
  } = useReservasStore();

  const [showModal, setShowModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [reservaEditar, setReservaEditar] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [mesasAll, setMesasAll] = useState([]);
  const [formData, setFormData] = useState({
    nombre_cliente: '',
    telefono_cliente: '',
    email_cliente: '',
    fecha: '',
    hora: '',
    num_personas: '2',
    mesa_id: '',
    notas: '',
    duracion_estimada: '120'
  });

  useEffect(() => {
    fetchReservas();
    fetchWhatsappStatus();
    fetchEstadisticas();
    loadMesas();
  }, []);

  const loadMesas = async () => {
    try {
      const res = await api.get('/mesas');
      setMesasAll(res.data.data);
    } catch (e) { /* ignore */ }
  };

  const handleBuscar = useCallback(() => {
    fetchReservas({ estado: filtroEstado, fecha: filtroFecha, busqueda });
  }, [filtroEstado, filtroFecha, busqueda]);

  useEffect(() => {
    const t = setTimeout(handleBuscar, 300);
    return () => clearTimeout(t);
  }, [filtroEstado, filtroFecha, busqueda]);

  const handleNuevo = () => {
    setReservaEditar(null);
    const hoy = new Date();
    setFormData({
      nombre_cliente: '',
      telefono_cliente: '',
      email_cliente: '',
      fecha: hoy.toISOString().split('T')[0],
      hora: '19:00',
      num_personas: '2',
      mesa_id: '',
      notas: '',
      duracion_estimada: '120'
    });
    setShowModal(true);
  };

  const handleEditar = (reserva) => {
    setReservaEditar(reserva);
    setFormData({
      nombre_cliente: reserva.cliente_nombre || '',
      telefono_cliente: reserva.cliente_telefono || '',
      email_cliente: reserva.cliente_email || '',
      fecha: reserva.fecha_reserva?.split('T')[0] || '',
      hora: reserva.hora_reserva?.substring(0, 5) || '',
      num_personas: String(reserva.num_personas || 2),
      mesa_id: String(reserva.mesa_id || ''),
      notas: reserva.notas || '',
      duracion_estimada: String(reserva.duracion_minutos || 120)
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      cliente_nombre: formData.nombre_cliente,
      cliente_telefono: formData.telefono_cliente,
      cliente_email: formData.email_cliente || null,
      fecha_reserva: formData.fecha,
      hora_reserva: formData.hora,
      num_personas: parseInt(formData.num_personas),
      mesa_id: formData.mesa_id ? parseInt(formData.mesa_id) : null,
      duracion_minutos: parseInt(formData.duracion_estimada),
      notas: formData.notas || null
    };

    let result;
    if (reservaEditar) {
      result = await actualizarReserva(reservaEditar.id, data);
    } else {
      result = await crearReserva(data);
    }

    if (result) {
      setShowModal(false);
      fetchReservas({ estado: filtroEstado, fecha: filtroFecha, busqueda });
    }
  };

  const handleEliminar = (id) => {
    setShowDeleteModal(id);
  };

  const confirmarEliminar = async () => {
    if (showDeleteModal) {
      await eliminarReserva(showDeleteModal);
      setShowDeleteModal(null);
    }
  };

  const handleCambiarEstado = async (id, estado) => {
    if (estado === 'cancelada') {
      setShowCancelModal(id);
      setMotivoCancelacion('');
      return;
    }
    await cambiarEstadoReserva(id, estado, '');
  };

  const confirmarCancelacion = async () => {
    if (showCancelModal) {
      await cambiarEstadoReserva(showCancelModal, 'cancelada', motivoCancelacion);
      setShowCancelModal(null);
      setMotivoCancelacion('');
    }
  };

  const handleBuscarMesas = async () => {
    if (formData.fecha && formData.hora) {
      await fetchMesasDisponibles(
        formData.fecha, formData.hora,
        parseInt(formData.duracion_estimada),
        parseInt(formData.num_personas)
      );
    }
  };

  useEffect(() => {
    if (showModal && formData.fecha && formData.hora) {
      handleBuscarMesas();
    }
  }, [formData.fecha, formData.hora, formData.num_personas, showModal]);

  const reservasFiltradas = reservas;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-cafe-800 flex items-center gap-2">
            <FiCalendar className="text-oliva-500" />
            Gestión de Reservas
          </h2>
          <p className="text-cafe-500 text-sm mt-1">Administra las reservas del restaurante</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="flex items-center gap-2 px-4 py-2 bg-cafe-100 text-cafe-700 rounded-button hover:bg-cafe-200 transition-colors"
          >
            <FiBarChart2 /> Estadísticas
          </button>
          <button
            onClick={handleNuevo}
            className="flex items-center gap-2 px-4 py-2 bg-oliva-500 text-white rounded-button hover:bg-oliva-600 transition-colors"
          >
            <FiPlus /> Nueva Reserva
          </button>
        </div>
      </div>

      {/* WhatsApp Status Banner */}
      {whatsappStatus && (
        <div className={clsx(
          'p-3 rounded-button flex items-center justify-between',
          whatsappStatus.estado === 'conectado' ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
        )}>
          <div className="flex items-center gap-2">
            <FiMessageSquare className={whatsappStatus.estado === 'conectado' ? 'text-green-600' : 'text-yellow-600'} />
            <span className="text-sm font-medium">
              WhatsApp: {whatsappStatus.estado === 'conectado' ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          {whatsappStatus.estado === 'conectado' && (
            <span className="text-xs text-green-600">Los recordatorios automáticos están activos</span>
          )}
        </div>
      )}

      {/* Estadísticas Panel */}
      {showStats && estadisticas && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-button shadow-sm border">
            <p className="text-sm text-cafe-500">Total Reservas</p>
            <p className="text-2xl font-bold text-cafe-800">{estadisticas.total || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-button shadow-sm border">
            <p className="text-sm text-cafe-500">Confirmadas</p>
            <p className="text-2xl font-bold text-blue-600">{estadisticas.confirmadas || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-button shadow-sm border">
            <p className="text-sm text-cafe-500">Completadas</p>
            <p className="text-2xl font-bold text-green-600">{estadisticas.completadas || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-button shadow-sm border">
            <p className="text-sm text-cafe-500">Canceladas</p>
            <p className="text-2xl font-bold text-red-600">{estadisticas.canceladas || 0}</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-button shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-cafe-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-button focus:ring-2 focus:ring-oliva-400 focus:border-oliva-400"
            />
          </div>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 border rounded-button focus:ring-2 focus:ring-oliva-400"
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map(e => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="px-3 py-2 border rounded-button focus:ring-2 focus:ring-oliva-400"
          />
          <button
            onClick={() => { setFiltroEstado(''); setFiltroFecha(''); setBusqueda(''); }}
            className="px-3 py-2 text-cafe-500 hover:text-cafe-700"
            title="Limpiar filtros"
          >
            <FiRefreshCw />
          </button>
        </div>
      </div>

      {/* Lista de Reservas */}
      <div className="bg-white rounded-button shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-cafe-400">
            <div className="w-8 h-8 border-4 border-oliva-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Cargando reservas...
          </div>
        ) : reservasFiltradas.length === 0 ? (
          <div className="p-8 text-center text-cafe-400">
            <FiCalendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay reservas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cafe-50 text-cafe-700">
                <tr>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Fecha/Hora</th>
                  <th className="px-4 py-3 text-center">Personas</th>
                  <th className="px-4 py-3 text-left">Mesa</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">WhatsApp</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reservasFiltradas.map((reserva) => {
                  const estadoInfo = getEstadoInfo(reserva.estado);
                  return (
                    <tr key={reserva.id} className="hover:bg-beige-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-cafe-800">{reserva.cliente_nombre}</p>
                          {reserva.cliente_telefono && (
                            <p className="text-xs text-cafe-400 flex items-center gap-1">
                              <FiPhone className="w-3 h-3" /> {reserva.cliente_telefono}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{reserva.fecha_reserva ? new Date(reserva.fecha_reserva).toLocaleDateString('es-PE') : ''}</p>
                        <p className="text-xs text-cafe-400">{reserva.hora_reserva?.substring(0, 5)}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1">
                          <FiUsers className="w-3 h-3" /> {reserva.num_personas}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {reserva.mesa_numero ? `Mesa ${reserva.mesa_numero}` : <span className="text-cafe-300">Sin asignar</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', estadoInfo.color)}>
                          <span className={clsx('w-1.5 h-1.5 rounded-full', estadoInfo.dot)}></span>
                          {estadoInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {reserva.cliente_telefono && whatsappStatus?.estado === 'conectado' && (
                            <>
                              {reserva.estado === 'pendiente' && (
                                <button
                                  onClick={() => enviarConfirmacionWhatsapp(reserva.id)}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                                  title="Enviar confirmación"
                                >
                                  <FiSend className="w-4 h-4" />
                                </button>
                              )}
                              {reserva.estado === 'confirmada' && !reserva.whatsapp_recordatorio_enviado && (
                                <button
                                  onClick={() => enviarRecordatorioWhatsapp(reserva.id)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Enviar recordatorio"
                                >
                                  <FiClock className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                          {reserva.whatsapp_recordatorio_enviado && (
                            <span className="text-xs text-green-500" title="Recordatorio enviado">✓</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {reserva.estado === 'pendiente' && (
                            <button onClick={() => handleCambiarEstado(reserva.id, 'confirmada')}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Confirmar">
                              <FiCheck className="w-4 h-4" />
                            </button>
                          )}
                          {(reserva.estado === 'pendiente' || reserva.estado === 'confirmada') && (
                            <button onClick={() => handleCambiarEstado(reserva.id, 'completada')}
                              className="p-1 text-green-600 hover:bg-green-50 rounded" title="Completar">
                              <FiCheck className="w-4 h-4" />
                            </button>
                          )}
                          {(reserva.estado === 'pendiente' || reserva.estado === 'confirmada') && (
                            <button onClick={() => handleCambiarEstado(reserva.id, 'cancelada')}
                              className="p-1 text-red-600 hover:bg-red-50 rounded" title="Cancelar">
                              <FiX className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => handleEditar(reserva)}
                            className="p-1 text-cafe-500 hover:bg-cafe-50 rounded" title="Editar">
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEliminar(reserva.id)}
                            className="p-1 text-red-400 hover:bg-red-50 rounded" title="Eliminar">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear/Editar Reserva */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold text-cafe-800">
                {reservaEditar ? 'Editar Reserva' : 'Nueva Reserva'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-cafe-700 mb-1">Nombre del cliente *</label>
                  <input
                    type="text" required
                    value={formData.nombre_cliente}
                    onChange={(e) => setFormData({ ...formData, nombre_cliente: e.target.value })}
                    className="w-full px-3 py-2 border rounded-button focus:ring-2 focus:ring-oliva-400"
                    placeholder="Nombre completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cafe-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.telefono_cliente}
                    onChange={(e) => setFormData({ ...formData, telefono_cliente: e.target.value })}
                    className="w-full px-3 py-2 border rounded-button focus:ring-2 focus:ring-oliva-400"
                    placeholder="999999999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cafe-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email_cliente}
                    onChange={(e) => setFormData({ ...formData, email_cliente: e.target.value })}
                    className="w-full px-3 py-2 border rounded-button focus:ring-2 focus:ring-oliva-400"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cafe-700 mb-1">Fecha *</label>
                  <input
                    type="date" required
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full px-3 py-2 border rounded-button focus:ring-2 focus:ring-oliva-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cafe-700 mb-1">Hora *</label>
                  <input
                    type="time" required
                    value={formData.hora}
                    onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                    className="w-full px-3 py-2 border rounded-button focus:ring-2 focus:ring-oliva-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cafe-700 mb-1">N° Personas *</label>
                  <input
                    type="number" required min="1" max="50"
                    value={formData.num_personas}
                    onChange={(e) => {
                      const newPersonas = e.target.value;
                      // Si la mesa seleccionada no tiene capacidad suficiente, deseleccionarla
                      let newMesaId = formData.mesa_id;
                      if (newMesaId) {
                        const mesaSeleccionada = [...mesasDisponibles, ...mesasAll].find(m => String(m.id) === newMesaId);
                        if (mesaSeleccionada && mesaSeleccionada.capacidad < parseInt(newPersonas || 1)) {
                          newMesaId = '';
                        }
                      }
                      setFormData({ ...formData, num_personas: newPersonas, mesa_id: newMesaId });
                    }}
                    className="w-full px-3 py-2 border rounded-button focus:ring-2 focus:ring-oliva-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cafe-700 mb-1">Duración (min)</label>
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
                <div className="col-span-2">
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
                            Mesa {m.numero} - Cap: {m.capacidad} personas{m.ubicacion ? ` (${m.ubicacion})` : ''}
                          </option>
                        ))
                    ) : (
                      mesasAll
                        .filter(m => m.capacidad >= parseInt(formData.num_personas || 1))
                        .map(m => (
                          <option key={m.id} value={m.id}>
                            Mesa {m.numero} - Cap: {m.capacidad} personas
                          </option>
                        ))
                    )}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-cafe-700 mb-1">Notas</label>
                  <textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    className="w-full px-3 py-2 border rounded-button focus:ring-2 focus:ring-oliva-400"
                    rows="2"
                    placeholder="Observaciones, alergias, ocasión especial..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-button hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={isLoading}
                  className="px-4 py-2 bg-oliva-500 text-white rounded-button hover:bg-oliva-600 disabled:opacity-50">
                  {reservaEditar ? 'Actualizar' : 'Crear Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Confirmar Cancelación */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm animate-slide-in">
            <div className="p-5 border-b">
              <h3 className="text-lg font-bold text-cafe-800 flex items-center gap-2">
                <FiX className="text-red-500" /> Cancelar Reserva
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-cafe-600 text-sm">¿Está seguro de cancelar esta reserva?</p>
              <div>
                <label className="block text-sm font-medium text-cafe-700 mb-1">Motivo de cancelación (opcional)</label>
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
                <button type="button" onClick={confirmarCancelacion}
                  className="px-4 py-2 bg-red-500 text-white rounded-button hover:bg-red-600 text-sm">
                  Confirmar Cancelación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm animate-slide-in">
            <div className="p-5 border-b">
              <h3 className="text-lg font-bold text-cafe-800 flex items-center gap-2">
                <FiTrash2 className="text-red-500" /> Eliminar Reserva
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-cafe-600 text-sm">¿Está seguro de eliminar esta reserva? Esta acción no se puede deshacer.</p>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowDeleteModal(null)}
                  className="px-4 py-2 border rounded-button hover:bg-gray-50 text-sm">Cancelar</button>
                <button type="button" onClick={confirmarEliminar}
                  className="px-4 py-2 bg-red-500 text-white rounded-button hover:bg-red-600 text-sm">
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
