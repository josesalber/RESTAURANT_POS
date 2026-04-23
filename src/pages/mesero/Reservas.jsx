import { useEffect, useState } from 'react';
import { useReservasStore } from '@store/reservasStore';
import socketService from '@services/socket';
import {
  FiCalendar, FiClock, FiUsers, FiPhone, FiCheck, FiRefreshCw, FiAlertCircle
} from 'react-icons/fi';
import clsx from 'clsx';

const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-400' },
  { value: 'confirmada', label: 'Confirmada', color: 'bg-blue-100 text-blue-800', dot: 'bg-blue-400' },
  { value: 'completada', label: 'Completada', color: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
  { value: 'cancelada', label: 'Cancelada', color: 'bg-red-100 text-red-800', dot: 'bg-red-400' },
  { value: 'no_asistio', label: 'No asistió', color: 'bg-gray-100 text-gray-800', dot: 'bg-gray-400' },
];

const getEstadoInfo = (estado) => ESTADOS.find(e => e.value === estado) || ESTADOS[0];

export default function MeseroReservas() {
  const {
    reservasHoy, isLoading,
    fetchReservasHoy, cambiarEstadoReserva
  } = useReservasStore();

  const [filtro, setFiltro] = useState('activas'); // activas | todas

  useEffect(() => {
    fetchReservasHoy();

    // Refrescar cada 2 minutos
    const interval = setInterval(fetchReservasHoy, 120000);

    // Escuchar eventos de reservas en tiempo real
    socketService.on('reserva:created', () => fetchReservasHoy());
    socketService.on('reserva:updated', () => fetchReservasHoy());
    socketService.on('reserva:estado_changed', () => fetchReservasHoy());
    socketService.on('reserva:estados_actualizados', () => fetchReservasHoy());

    return () => {
      clearInterval(interval);
      socketService.off('reserva:created');
      socketService.off('reserva:updated');
      socketService.off('reserva:estado_changed');
      socketService.off('reserva:estados_actualizados');
    };
  }, []);

  // Filtrar reservas
  const reservasFiltradas = filtro === 'activas'
    ? reservasHoy.filter(r => ['pendiente', 'confirmada'].includes(r.estado))
    : reservasHoy;

  // Ordenar por hora
  const reservasOrdenadas = [...reservasFiltradas].sort((a, b) => {
    if (a.hora < b.hora) return -1;
    if (a.hora > b.hora) return 1;
    return 0;
  });

  // Encontrar la próxima reserva
  const ahora = new Date();
  const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
  const proximaReserva = reservasOrdenadas.find(r =>
    r.hora >= horaActual && ['pendiente', 'confirmada'].includes(r.estado)
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-cafe-800 flex items-center gap-2">
            <FiCalendar className="text-oliva-500" />
            Reservas Hoy
          </h2>
          <p className="text-sm text-cafe-500">
            {reservasHoy.filter(r => ['pendiente', 'confirmada'].includes(r.estado)).length} activas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-beige-200 rounded-button p-0.5">
            <button
              onClick={() => setFiltro('activas')}
              className={clsx(
                'px-3 py-1.5 text-xs rounded-button transition-colors',
                filtro === 'activas' ? 'bg-white text-cafe-800 shadow-sm' : 'text-cafe-500'
              )}
            >
              Activas
            </button>
            <button
              onClick={() => setFiltro('todas')}
              className={clsx(
                'px-3 py-1.5 text-xs rounded-button transition-colors',
                filtro === 'todas' ? 'bg-white text-cafe-800 shadow-sm' : 'text-cafe-500'
              )}
            >
              Todas
            </button>
          </div>
          <button onClick={fetchReservasHoy} className="p-2 text-cafe-400 hover:text-cafe-600">
            <FiRefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Próxima reserva destacada */}
      {proximaReserva && (
        <div className="bg-oliva-50 border-2 border-oliva-200 rounded-button p-4">
          <div className="flex items-center gap-2 mb-2">
            <FiAlertCircle className="text-oliva-600 w-5 h-5" />
            <span className="text-sm font-bold text-oliva-700">Próxima Reserva</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-cafe-800 text-lg">{proximaReserva.nombre_cliente}</p>
              <div className="flex gap-3 text-sm text-cafe-600 mt-1">
                <span className="flex items-center gap-1"><FiClock /> {proximaReserva.hora?.substring(0, 5)}</span>
                <span className="flex items-center gap-1"><FiUsers /> {proximaReserva.num_personas}</span>
                {proximaReserva.mesa_numero && (
                  <span className="font-medium">Mesa {proximaReserva.mesa_numero}</span>
                )}
              </div>
            </div>
            {proximaReserva.estado === 'confirmada' && (
              <button
                onClick={() => cambiarEstadoReserva(proximaReserva.id, 'completada')}
                className="px-4 py-2 bg-green-500 text-white rounded-button hover:bg-green-600 text-sm flex items-center gap-1"
              >
                <FiCheck /> Llegó
              </button>
            )}
          </div>
          {proximaReserva.notas && (
            <p className="text-xs text-cafe-500 mt-2 italic bg-white/50 p-2 rounded">📝 {proximaReserva.notas}</p>
          )}
        </div>
      )}

      {/* Lista de reservas */}
      {isLoading ? (
        <div className="text-center py-8 text-cafe-400">
          <div className="w-8 h-8 border-4 border-oliva-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Cargando...
        </div>
      ) : reservasOrdenadas.length === 0 ? (
        <div className="text-center py-12 text-cafe-400">
          <FiCalendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{filtro === 'activas' ? 'No hay reservas activas para hoy' : 'No hay reservas para hoy'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reservasOrdenadas.map((reserva) => {
            const estadoInfo = getEstadoInfo(reserva.estado);
            const esActiva = ['pendiente', 'confirmada'].includes(reserva.estado);
            const esPasada = reserva.hora < horaActual;

            return (
              <div key={reserva.id} className={clsx(
                'bg-white rounded-button shadow-sm border p-3 flex items-center gap-3',
                !esActiva && 'opacity-60',
                esPasada && esActiva && 'border-orange-300'
              )}>
                {/* Hora */}
                <div className={clsx(
                  'flex-shrink-0 w-16 h-16 rounded-button flex flex-col items-center justify-center',
                  esActiva ? 'bg-oliva-50 text-oliva-700' : 'bg-gray-50 text-gray-500'
                )}>
                  <FiClock className="w-4 h-4" />
                  <span className="text-sm font-bold">{reserva.hora?.substring(0, 5)}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-cafe-800 truncate">{reserva.nombre_cliente}</p>
                    <span className={clsx('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium', estadoInfo.color)}>
                      {estadoInfo.label}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs text-cafe-500 mt-0.5">
                    <span className="flex items-center gap-0.5"><FiUsers className="w-3 h-3" /> {reserva.num_personas}</span>
                    {reserva.mesa_numero && <span>Mesa {reserva.mesa_numero}</span>}
                    {reserva.telefono_cliente && (
                      <span className="flex items-center gap-0.5"><FiPhone className="w-3 h-3" /> {reserva.telefono_cliente}</span>
                    )}
                  </div>
                  {reserva.notas && (
                    <p className="text-[10px] text-cafe-400 mt-0.5 truncate">📝 {reserva.notas}</p>
                  )}
                </div>

                {/* Acción rápida */}
                {reserva.estado === 'confirmada' && (
                  <button
                    onClick={() => cambiarEstadoReserva(reserva.id, 'completada')}
                    className="flex-shrink-0 p-2 bg-green-50 text-green-600 rounded-button hover:bg-green-100"
                    title="Marcar como completada"
                  >
                    <FiCheck className="w-5 h-5" />
                  </button>
                )}
                {reserva.estado === 'pendiente' && (
                  <button
                    onClick={() => cambiarEstadoReserva(reserva.id, 'confirmada')}
                    className="flex-shrink-0 p-2 bg-blue-50 text-blue-600 rounded-button hover:bg-blue-100"
                    title="Confirmar reserva"
                  >
                    <FiCheck className="w-5 h-5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
