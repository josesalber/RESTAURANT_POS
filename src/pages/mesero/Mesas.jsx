import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMesasStore } from '@store/mesasStore';
import { useReservasStore } from '@store/reservasStore';
import { FiRefreshCw, FiUsers, FiClock, FiBell, FiCalendar, FiAlertTriangle } from 'react-icons/fi';
import clsx from 'clsx';
import toast from 'react-hot-toast';

export default function MeseroMesas() {
  const { mesas, fetchMesas, fetchResumen, isLoading, tienePedidoListo, desmarcarPedidoListo } = useMesasStore();
  const { reservasHoy, fetchReservasHoy } = useReservasStore();
  const [resumen, setResumen] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [now, setNow] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    // Actualizar "now" cada minuto para re-calcular tiempos
    const timer = setInterval(() => setNow(new Date()), 60000);
    // Refrescar reservas cada 2 minutos
    const reservaTimer = setInterval(() => fetchReservasHoy(), 120000);
    return () => { clearInterval(timer); clearInterval(reservaTimer); };
  }, []);

  const loadData = async () => {
    await Promise.all([fetchMesas(), fetchReservasHoy()]);
    const res = await fetchResumen();
    setResumen(res);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
    toast.success('Mesas actualizadas');
  };

  // ─── Reservation helpers ───
  // Get the soonest upcoming reservation for a given mesa (pendiente or confirmada, today)
  const getReservaProxima = useCallback((mesaId) => {
    if (!reservasHoy || reservasHoy.length === 0) return null;
    
    const hoy = new Date();
    const currentMinutes = hoy.getHours() * 60 + hoy.getMinutes();
    
    const proximas = reservasHoy
      .filter(r =>
        r.mesa_id === mesaId &&
        ['pendiente', 'confirmada'].includes(r.estado)
      )
      .map(r => {
        const [h, m] = (r.hora_reserva || '').split(':').map(Number);
        const reservaMinutes = h * 60 + m;
        const minutesFalta = reservaMinutes - currentMinutes;
        return { ...r, minutesFalta, horaCorta: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` };
      })
      .filter(r => r.minutesFalta > -30) // incluir reservas que empezaron hace menos de 30 min
      .sort((a, b) => a.minutesFalta - b.minutesFalta);

    return proximas[0] || null;
  }, [reservasHoy, now]);

  // Memoize reservation map for all mesas
  const reservasPorMesa = useMemo(() => {
    const map = {};
    mesas.forEach(mesa => {
      const r = getReservaProxima(mesa.id);
      if (r) map[mesa.id] = r;
    });
    return map;
  }, [mesas, getReservaProxima]);

  // Count upcoming reservations across all mesas
  const totalReservasProximas = useMemo(() => Object.keys(reservasPorMesa).length, [reservasPorMesa]);

  const handleMesaClick = (mesa) => {
    if (tienePedidoListo(mesa.id)) {
      desmarcarPedidoListo(mesa.id);
    }

    // Show reservation warning when clicking
    const reserva = reservasPorMesa[mesa.id];
    if (reserva && reserva.minutesFalta > 0 && reserva.minutesFalta <= 60) {
      const minText = reserva.minutesFalta <= 1 ? 'menos de 1 min' : `${Math.round(reserva.minutesFalta)} min`;
      toast(
        `⚠️ Mesa ${mesa.numero} reservada a las ${reserva.horaCorta} (en ${minText}) para ${reserva.cliente_nombre} — ${reserva.num_personas} personas`,
        {
          duration: 4000,
          style: { 
            background: reserva.minutesFalta <= 30 ? '#FEF3C7' : '#EFF6FF',
            border: reserva.minutesFalta <= 30 ? '1px solid #F59E0B' : '1px solid #60A5FA',
            color: '#1E293B'
          },
          icon: reserva.minutesFalta <= 30 ? '🔶' : '📅',
        }
      );
    }

    if (mesa.estado === 'disponible') {
      navigate(`/mesero/pedido/${mesa.id}`);
    } else if (mesa.estado === 'ocupada' || mesa.estado === 'cuenta') {
      navigate(`/mesero/pedido/${mesa.id}`);
    } else if (mesa.estado === 'reservada') {
      toast.error('Esta mesa está reservada');
    }
  };

  const getEstadoClasses = (mesa) => {
    const reserva = reservasPorMesa[mesa.id];
    
    // Si hay reserva próxima en 30 min → naranja urgente
    if (reserva && reserva.minutesFalta > 0 && reserva.minutesFalta <= 30) {
      return 'bg-orange-100 border-orange-400 text-orange-800 ring-2 ring-orange-300/50';
    }
    // Si hay reserva próxima en 1 hora → borde azul sutil
    if (reserva && reserva.minutesFalta > 30 && reserva.minutesFalta <= 60) {
      // Keep the base state color but add a ring
      const base = {
        disponible: 'bg-estado-disponible/20 border-estado-disponible text-green-700',
        ocupada: 'bg-estado-ocupada/20 border-estado-ocupada text-yellow-700',
        reservada: 'bg-estado-reservada/20 border-estado-reservada text-blue-700',
        cuenta: 'bg-estado-cuenta/20 border-estado-cuenta text-red-700',
      };
      return (base[mesa.estado] || base.disponible) + ' ring-2 ring-blue-300/50';
    }
    
    const classes = {
      disponible: 'bg-estado-disponible/20 border-estado-disponible text-green-700',
      ocupada: 'bg-estado-ocupada/20 border-estado-ocupada text-yellow-700',
      reservada: 'bg-estado-reservada/20 border-estado-reservada text-blue-700',
      cuenta: 'bg-estado-cuenta/20 border-estado-cuenta text-red-700',
    };
    return classes[mesa.estado] || classes.disponible;
  };

  const getEstadoLabel = (estado) => {
    const labels = {
      disponible: 'Disponible',
      ocupada: 'Ocupada',
      reservada: 'Reservada',
      cuenta: 'Pidió Cuenta',
    };
    return labels[estado] || estado;
  };

  // Agrupar mesas por zona
  const mesasPorZona = mesas.reduce((acc, mesa) => {
    const zona = mesa.zona || 'General';
    if (!acc[zona]) acc[zona] = [];
    acc[zona].push(mesa);
    return acc;
  }, {});

  return (
    <div>
      {/* Header con resumen */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-cafe-800">Seleccionar Mesa</h2>
          <p className="text-cafe-500">Toque una mesa para ver o crear un pedido</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Resumen de estados */}
          {resumen && (
            <div className="hidden tablet:flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-estado-disponible/20 rounded-button">
                <span className="w-3 h-3 bg-estado-disponible rounded-full" />
                <span className="text-sm font-medium text-green-700">
                  {resumen.disponibles} libres
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-estado-ocupada/20 rounded-button">
                <span className="w-3 h-3 bg-estado-ocupada rounded-full" />
                <span className="text-sm font-medium text-yellow-700">
                  {resumen.ocupadas} ocupadas
                </span>
              </div>
            </div>
          )}

          {/* Botón refrescar */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn-touch bg-oliva-400 text-white rounded-button hover:bg-oliva-500 disabled:opacity-50"
          >
            <FiRefreshCw
              className={clsx('w-5 h-5', isRefreshing && 'animate-spin')}
            />
          </button>
        </div>
      </div>

      {/* ─── Banner de reservas próximas ─── */}
      {totalReservasProximas > 0 && (
        <div className="mb-5 space-y-2">
          {Object.entries(reservasPorMesa)
            .filter(([, r]) => r.minutesFalta > 0 && r.minutesFalta <= 60)
            .sort((a, b) => a[1].minutesFalta - b[1].minutesFalta)
            .map(([mesaId, reserva]) => {
              const minutesFalta = Math.round(reserva.minutesFalta);
              const esUrgente = minutesFalta <= 30;
              return (
                <div
                  key={mesaId}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm',
                    esUrgente
                      ? 'bg-orange-50 border border-orange-300 text-orange-800'
                      : 'bg-blue-50 border border-blue-200 text-blue-800'
                  )}
                >
                  {esUrgente ? (
                    <FiAlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  ) : (
                    <FiCalendar className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <span className="font-semibold">Mesa {reserva.mesa_numero || mesaId}</span>
                    {' — '}
                    <span>{reserva.cliente_nombre}</span>
                    {' • '}{reserva.num_personas} pers.
                    {' • '}{reserva.horaCorta}
                    {reserva.notas && <span className="text-xs opacity-70"> — {reserva.notas}</span>}
                  </div>
                  <div className={clsx(
                    'flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold',
                    esUrgente ? 'bg-orange-200 text-orange-900' : 'bg-blue-200 text-blue-900'
                  )}>
                    {minutesFalta <= 1 ? '¡Ahora!' : `${minutesFalta} min`}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Loading */}
      {isLoading && mesas.length === 0 && (
        <div className="flex justify-center py-12">
          <div className="spinner" />
        </div>
      )}

      {/* Grid de mesas por zona */}
      {Object.entries(mesasPorZona).map(([zona, mesasZona]) => (
        <div key={zona} className="mb-8">
          <h3 className="text-lg font-semibold text-cafe-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-oliva-400 rounded-full" />
            {zona}
          </h3>

          <div className="grid-mesas">
            {mesasZona.map((mesa) => {
              const reserva = reservasPorMesa[mesa.id];
              const esUrgente = reserva && reserva.minutesFalta > 0 && reserva.minutesFalta <= 30;
              const esProxima = reserva && reserva.minutesFalta > 30 && reserva.minutesFalta <= 60;
              
              return (
                <button
                  key={mesa.id}
                  onClick={() => handleMesaClick(mesa)}
                  className={clsx(
                    'relative p-4 rounded-card border-2 transition-all duration-200',
                    'active:scale-95 touch-target',
                    getEstadoClasses(mesa),
                    mesa.estado === 'disponible' && 'hover:shadow-card-hover',
                    mesa.estado === 'cuenta' && 'animate-pulse-soft',
                    esUrgente && 'animate-pulse-soft'
                  )}
                >
                  {/* Número de mesa */}
                  <div className="text-3xl font-bold mb-2">{mesa.numero}</div>

                  {/* Capacidad */}
                  <div className="flex items-center justify-center gap-1 text-sm opacity-75">
                    <FiUsers className="w-4 h-4" />
                    <span>{mesa.capacidad}</span>
                  </div>

                  {/* Estado */}
                  <div className="mt-2 text-xs font-medium uppercase tracking-wide">
                    {esUrgente ? 'RESERVADA PRONTO' : getEstadoLabel(mesa.estado)}
                  </div>

                  {/* Reservation countdown badge */}
                  {reserva && reserva.minutesFalta > 0 && reserva.minutesFalta <= 60 && (
                    <div className={clsx(
                      'absolute top-1.5 left-1.5 flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                      esUrgente
                        ? 'bg-orange-500 text-white'
                        : 'bg-blue-500 text-white'
                    )}>
                      <FiCalendar className="w-3 h-3" />
                      {Math.round(reserva.minutesFalta)}m
                    </div>
                  )}

                  {/* Reservation info on hover-like hint */}
                  {reserva && reserva.minutesFalta > 0 && reserva.minutesFalta <= 60 && (
                    <div className={clsx(
                      'mt-1.5 text-[10px] leading-tight truncate',
                      esUrgente ? 'text-orange-700' : 'text-blue-600'
                    )}>
                      {reserva.horaCorta} • {reserva.cliente_nombre}
                    </div>
                  )}

                  {/* Indicador de tiempo si está ocupada */}
                  {mesa.estado === 'ocupada' && mesa.tiempoOcupada && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 text-xs bg-white/80 px-2 py-1 rounded-full">
                      <FiClock className="w-3 h-3" />
                      <span>{mesa.tiempoOcupada}</span>
                    </div>
                  )}

                  {/* Badge de pedido pendiente */}
                  {mesa.pedidoPendiente && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-terracota-500 text-white rounded-full flex items-center justify-center text-xs font-bold animate-bounce-soft">
                      !
                    </div>
                  )}

                  {/* Badge de pedido listo */}
                  {tienePedidoListo(mesa.id) && (
                    <div className="absolute -top-2 -left-2 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center animate-pulse">
                      <FiBell className="w-4 h-4" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Leyenda de indicadores de reserva */}
      {totalReservasProximas > 0 && (
        <div className="flex flex-wrap items-center gap-4 mt-4 px-2 text-xs text-cafe-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-400" /> Reserva en menos de 30 min
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-400" /> Reserva en menos de 1 hora
          </span>
        </div>
      )}

      {/* Sin mesas */}
      {!isLoading && mesas.length === 0 && (
        <div className="text-center py-12">
          <p className="text-cafe-500 mb-4">No hay mesas configuradas</p>
          <p className="text-cafe-400 text-sm">
            Contacte al administrador para configurar las mesas
          </p>
        </div>
      )}
    </div>
  );
}
