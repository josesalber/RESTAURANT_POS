import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMesasStore } from '@store/mesasStore';
import { useReservasStore } from '@store/reservasStore';
import { FiRefreshCw, FiUsers, FiClock, FiBell, FiCalendar, FiAlertTriangle, FiGrid, FiList, FiZoomIn, FiZoomOut, FiLink, FiX, FiCheck, FiScissors } from 'react-icons/fi';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const MESA_BASE = 70;
const MESA_MAX = 130;
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;

const getMesaSize = (capacidad) => {
  const cap = Math.max(2, Math.min(capacidad || 4, 12));
  return MESA_BASE + ((cap - 2) / 10) * (MESA_MAX - MESA_BASE);
};

export default function MeseroMesasPlano() {
  const { mesas, fetchMesas, fetchResumen, isLoading, tienePedidoListo, desmarcarPedidoListo, mesasUnidas, fetchMesasUnidas, crearUnion, deshacerUnion, getGrupoDeMesa, updatePosicionesBatch } = useMesasStore();
  const { reservasHoy, fetchReservasHoy } = useReservasStore();
  const [resumen, setResumen] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [now, setNow] = useState(new Date());
  const [zoom, setZoom] = useState(1);
  const [vistaPlano, setVistaPlano] = useState(true);
  const [modoUnir, setModoUnir] = useState(false);
  const [mesasSeleccionadas, setMesasSeleccionadas] = useState([]);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    const timer = setInterval(() => setNow(new Date()), 60000);
    const reservaTimer = setInterval(() => fetchReservasHoy(), 120000);
    // Refrescar mesas cada 15 segundos
    const mesasTimer = setInterval(() => { fetchMesas(); fetchMesasUnidas(); }, 15000);
    return () => { clearInterval(timer); clearInterval(reservaTimer); clearInterval(mesasTimer); };
  }, []);

  // Detectar si las mesas tienen posiciones configuradas
  const tienenPosiciones = useMemo(() => {
    return mesas.some(m => m.pos_x > 0 || m.pos_y > 0);
  }, [mesas]);

  // Vista plano por defecto siempre (el usuario puede cambiar a lista manualmente si prefiere)

  const loadData = async () => {
    await Promise.all([fetchMesas(), fetchReservasHoy(), fetchMesasUnidas()]);
    const res = await fetchResumen();
    setResumen(res);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
    toast.success('Mesas actualizadas');
  };

  // ── Merge (Unir Mesas) helpers ──
  const toggleModoUnir = () => {
    setModoUnir(prev => !prev);
    setMesasSeleccionadas([]);
  };

  const handleSeleccionarMesaParaUnir = (mesa) => {
    setMesasSeleccionadas(prev => {
      if (prev.find(m => m.id === mesa.id)) {
        return prev.filter(m => m.id !== mesa.id);
      }
      if (prev.length >= 3) {
        toast.error('Máximo 3 mesas para unir');
        return prev;
      }
      // Verificar que no esté ya en un grupo
      const grupoExistente = getGrupoDeMesa(mesa.id);
      if (grupoExistente) {
        toast.error(`Mesa ${mesa.numero} ya está unida a "${grupoExistente.nombre}"`);
        return prev;
      }
      return [...prev, mesa];
    });
  };

  const handleConfirmarUnion = async () => {
    if (mesasSeleccionadas.length < 2) {
      toast.error('Selecciona al menos 2 mesas');
      return;
    }
    const ids = mesasSeleccionadas.map(m => m.id);
    const result = await crearUnion(ids);
    if (result.success) {
      // Auto-snap: mover mesas secundarias al costado de la primera
      const [m1, m2, m3] = mesasSeleccionadas;
      const w1 = Math.round(getMesaSize(m1.capacidad) * (m1.forma === 'rectangular' ? 1.4 : 1));
      const m2NewX = (m1.pos_x || 0) + w1 + 8;
      const posUpdates = [{ id: m2.id, pos_x: m2NewX, pos_y: m1.pos_y || 0 }];
      if (m3) {
        const w2 = Math.round(getMesaSize(m2.capacidad) * (m2.forma === 'rectangular' ? 1.4 : 1));
        posUpdates.push({ id: m3.id, pos_x: m2NewX + w2 + 8, pos_y: m1.pos_y || 0 });
      }
      await updatePosicionesBatch(posUpdates);
      toast.success(`Mesas ${mesasSeleccionadas.map(m => m.numero).join(' + ')} unidas correctamente`);
      setMesasSeleccionadas([]);
      setModoUnir(false);
    } else {
      toast.error(result.message || 'Error al unir mesas');
    }
  };

  const handleDeshacerUnion = async (grupoId, nombre) => {
    const result = await deshacerUnion(grupoId);
    if (result.success) {
      toast.success(`"${nombre}" separadas`);
    } else {
      toast.error(result.message || 'Error al separar mesas');
    }
  };

  // Mapa rápido: mesaId -> grupo al que pertenece
  const gruposPorMesa = useMemo(() => {
    const map = {};
    (mesasUnidas || []).forEach(grupo => {
      (grupo.mesa_ids || []).forEach(mid => {
        map[mid] = grupo;
      });
    });
    return map;
  }, [mesasUnidas]);

  // ── Reservation helpers ──
  const getReservaProxima = useCallback((mesaId) => {
    if (!reservasHoy || reservasHoy.length === 0) return null;
    const hoy = new Date();
    const currentMinutes = hoy.getHours() * 60 + hoy.getMinutes();

    const proximas = reservasHoy
      .filter(r => r.mesa_id === mesaId && ['pendiente', 'confirmada'].includes(r.estado))
      .map(r => {
        const [h, m] = (r.hora_reserva || '').split(':').map(Number);
        const reservaMinutes = h * 60 + m;
        const minutesFalta = reservaMinutes - currentMinutes;
        return { ...r, minutesFalta, horaCorta: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` };
      })
      .filter(r => r.minutesFalta > -30)
      .sort((a, b) => a.minutesFalta - b.minutesFalta);

    return proximas[0] || null;
  }, [reservasHoy, now]);

  const reservasPorMesa = useMemo(() => {
    const map = {};
    mesas.forEach(mesa => {
      const r = getReservaProxima(mesa.id);
      if (r) map[mesa.id] = r;
    });
    return map;
  }, [mesas, getReservaProxima]);

  const totalReservasProximas = useMemo(() => Object.keys(reservasPorMesa).length, [reservasPorMesa]);

  const handleMesaClick = (mesa) => {
    // Si estamos en modo unir, solo seleccionar
    if (modoUnir) {
      handleSeleccionarMesaParaUnir(mesa);
      return;
    }

    if (tienePedidoListo(mesa.id)) {
      desmarcarPedidoListo(mesa.id);
    }

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
            color: '#1E293B',
          },
          icon: reserva.minutesFalta <= 30 ? '🔶' : '📅',
        },
      );
    }

    if (mesa.estado === 'disponible' || mesa.estado === 'ocupada' || mesa.estado === 'cuenta') {
      navigate(`/mesero/pedido/${mesa.id}`);
    } else if (mesa.estado === 'reservada') {
      toast.error('Esta mesa está reservada');
    }
  };

  // ── Color Logic ──
  const getEstadoClasses = (mesa) => {
    const reserva = reservasPorMesa[mesa.id];
    if (reserva && reserva.minutesFalta > 0 && reserva.minutesFalta <= 30) {
      return 'bg-orange-100 border-orange-400 text-orange-800 ring-2 ring-orange-300/50';
    }
    if (reserva && reserva.minutesFalta > 30 && reserva.minutesFalta <= 60) {
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

  // ── Render sillas (visual) ──
  const renderSillas = (mesa) => {
    const capacidad = mesa.capacidad || 4;
    const forma = mesa.forma || 'cuadrada';
    const sillas = [];
    const mesaSz = getMesaSize(mesa.capacidad);
    const sillaSize = 10 * zoom;

    if (forma === 'redonda') {
      for (let i = 0; i < capacidad; i++) {
        const angle = (i * 2 * Math.PI) / capacidad - Math.PI / 2;
        const radius = (mesaSz * zoom) / 2 + sillaSize;
        sillas.push(
          <div
            key={i}
            className="absolute bg-cafe-200 rounded-full border border-cafe-300"
            style={{
              width: sillaSize,
              height: sillaSize,
              left: '50%',
              top: '50%',
              transform: `translate(${Math.cos(angle) * radius - sillaSize / 2}px, ${Math.sin(angle) * radius - sillaSize / 2}px)`,
            }}
          />
        );
      }
    } else {
      const mesaW = forma === 'rectangular' ? mesaSz * 1.4 * zoom : mesaSz * zoom;
      const mesaH = mesaSz * zoom;
      const sides = [
        { side: 'top', count: 0 },
        { side: 'bottom', count: 0 },
        { side: 'left', count: 0 },
        { side: 'right', count: 0 },
      ];
      for (let i = 0; i < capacidad; i++) sides[i % 4].count++;

      sides.forEach(({ side, count }) => {
        for (let i = 0; i < count; i++) {
          let left, top;
          if (side === 'top') { left = ((i + 1) * mesaW) / (count + 1) - sillaSize / 2; top = -sillaSize - 3; }
          else if (side === 'bottom') { left = ((i + 1) * mesaW) / (count + 1) - sillaSize / 2; top = mesaH + 3; }
          else if (side === 'left') { left = -sillaSize - 3; top = ((i + 1) * mesaH) / (count + 1) - sillaSize / 2; }
          else { left = mesaW + 3; top = ((i + 1) * mesaH) / (count + 1) - sillaSize / 2; }
          sillas.push(
            <div key={`${side}-${i}`}
              className="absolute bg-cafe-200 rounded-full border border-cafe-300"
              style={{ width: sillaSize, height: sillaSize, left, top }}
            />
          );
        }
      });
    }
    return sillas;
  };

  const getMesaStylePlano = (mesa) => {
    const forma = mesa.forma || 'cuadrada';
    const size = getMesaSize(mesa.capacidad) * zoom;
    return {
      width: forma === 'rectangular' ? size * 1.4 : size,
      height: size,
      left: (mesa.pos_x || 0) * zoom,
      top: (mesa.pos_y || 0) * zoom,
    };
  };

  // Agrupar mesas por zona (para vista lista)
  const mesasPorZona = mesas.reduce((acc, mesa) => {
    const zona = mesa.zona || 'General';
    if (!acc[zona]) acc[zona] = [];
    acc[zona].push(mesa);
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-cafe-800">Seleccionar Mesa</h2>
          <p className="text-cafe-500">Toque una mesa para ver o crear un pedido</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Resumen */}
          {resumen && (
            <div className="hidden tablet:flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-estado-disponible/20 rounded-button">
                <span className="w-3 h-3 bg-estado-disponible rounded-full" />
                <span className="text-sm font-medium text-green-700">{resumen.disponibles} libres</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-estado-ocupada/20 rounded-button">
                <span className="w-3 h-3 bg-estado-ocupada rounded-full" />
                <span className="text-sm font-medium text-yellow-700">{resumen.ocupadas} ocupadas</span>
              </div>
            </div>
          )}

          {/* Toggle vista */}
          {tienenPosiciones && (
            <div className="flex items-center bg-beige-100 rounded-lg p-0.5">
              <button
                onClick={() => setVistaPlano(true)}
                className={clsx(
                  'p-2 rounded-md transition-colors',
                  vistaPlano ? 'bg-oliva-400 text-white shadow' : 'text-cafe-500 hover:bg-beige-200'
                )}
                title="Vista plano"
              >
                <FiGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setVistaPlano(false)}
                className={clsx(
                  'p-2 rounded-md transition-colors',
                  !vistaPlano ? 'bg-oliva-400 text-white shadow' : 'text-cafe-500 hover:bg-beige-200'
                )}
                title="Vista lista"
              >
                <FiList className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Zoom (solo en plano) */}
          {vistaPlano && tienenPosiciones && (
            <div className="flex items-center gap-1 bg-beige-100 rounded-lg px-2 py-1">
              <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-1 hover:bg-beige-200 rounded">
                <FiZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="p-1 hover:bg-beige-200 rounded">
                <FiZoomIn className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Refrescar */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn-touch bg-oliva-400 text-white rounded-button hover:bg-oliva-500 disabled:opacity-50"
          >
            <FiRefreshCw className={clsx('w-5 h-5', isRefreshing && 'animate-spin')} />
          </button>

          {/* Unir mesas */}
          {vistaPlano && tienenPosiciones && (
            <button
              onClick={toggleModoUnir}
              className={clsx(
                'btn-touch rounded-button flex items-center gap-2 px-3 text-sm font-medium transition-all',
                modoUnir
                  ? 'bg-amber-500 text-white ring-2 ring-amber-300 shadow-lg'
                  : 'bg-cafe-100 text-cafe-700 hover:bg-cafe-200'
              )}
              title={modoUnir ? 'Cancelar unión' : 'Unir mesas'}
            >
              <FiLink className="w-4 h-4" />
              <span className="hidden tablet:inline">{modoUnir ? 'Cancelar' : 'Unir Mesas'}</span>
            </button>
          )}
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
                <div key={mesaId} className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm',
                  esUrgente ? 'bg-orange-50 border border-orange-300 text-orange-800' : 'bg-blue-50 border border-blue-200 text-blue-800'
                )}>
                  {esUrgente ? <FiAlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" /> : <FiCalendar className="w-5 h-5 text-blue-500 flex-shrink-0" />}
                  <div className="flex-1">
                    <span className="font-semibold">Mesa {reserva.mesa_numero || mesaId}</span>
                    {' — '}{reserva.cliente_nombre}{' • '}{reserva.num_personas} pers.{' • '}{reserva.horaCorta}
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
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      )}

      {/* ─── Vista Plano ─── */}
      {vistaPlano && tienenPosiciones ? (
        <>
          {/* Barra de modo unir */}
          {modoUnir && (
            <div className="mb-3 flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-300 rounded-xl">
              <FiLink className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="flex-1 text-sm text-amber-800">
                <span className="font-semibold">Modo Unir Mesas</span>
                {' — '}Selecciona 2 o 3 mesas para juntarlas.
                {mesasSeleccionadas.length > 0 && (
                  <span className="ml-2 font-bold">
                    Seleccionadas: {mesasSeleccionadas.map(m => m.numero).join(', ')}
                    {' '}({mesasSeleccionadas.reduce((s, m) => s + (m.capacidad || 4), 0)} personas)
                  </span>
                )}
              </div>
              <button
                onClick={handleConfirmarUnion}
                disabled={mesasSeleccionadas.length < 2}
                className={clsx(
                  'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all',
                  mesasSeleccionadas.length >= 2
                    ? 'bg-green-500 text-white hover:bg-green-600 shadow'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                )}
              >
                <FiCheck className="w-4 h-4" />
                Confirmar
              </button>
              <button
                onClick={toggleModoUnir}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-600 hover:bg-gray-300"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Lista de mesas unidas activas */}
          {mesasUnidas && mesasUnidas.length > 0 && !modoUnir && (
            <div className="mb-3 space-y-2">
              {mesasUnidas.map(grupo => (
                <div key={grupo.id} className="flex items-center gap-3 px-4 py-2.5 bg-purple-50 border border-purple-200 rounded-xl text-sm">
                  <FiLink className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <div className="flex-1 text-purple-800">
                    <span className="font-semibold">{grupo.nombre}</span>
                    <span className="mx-2 text-purple-400">•</span>
                    <span>{grupo.capacidad_total} personas</span>
                    {grupo.mesero_nombre && (
                      <>
                        <span className="mx-2 text-purple-400">•</span>
                        <span className="text-xs opacity-70">por {grupo.mesero_nombre}</span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeshacerUnion(grupo.id, grupo.nombre)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                    title="Separar mesas"
                  >
                    <FiScissors className="w-3.5 h-3.5" />
                    Separar
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="overflow-auto border-2 border-beige-300 rounded-xl bg-beige-50" style={{ minHeight: 400 }}>
          <div
            ref={canvasRef}
            className="relative"
            style={{
              width: CANVAS_WIDTH * zoom,
              height: CANVAS_HEIGHT * zoom,
              backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px)`,
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            }}
          >
            {/* SVG lines connecting merged tables */}
            <svg
              className="absolute inset-0 pointer-events-none z-[5]"
              width={CANVAS_WIDTH * zoom}
              height={CANVAS_HEIGHT * zoom}
            >
              {/* Lines for existing merged groups */}
              {(mesasUnidas || []).map(grupo => {
                const grupoMesas = (grupo.mesa_ids || [])
                  .map(id => mesas.find(m => m.id === id))
                  .filter(Boolean);
                if (grupoMesas.length < 2) return null;

                const lines = [];
                for (let i = 0; i < grupoMesas.length - 1; i++) {
                  const m1 = grupoMesas[i];
                  const m2 = grupoMesas[i + 1];
                  const s1 = getMesaSize(m1.capacidad);
                  const s2 = getMesaSize(m2.capacidad);
                  const x1 = ((m1.pos_x || 0) + (m1.forma === 'rectangular' ? s1 * 0.7 : s1 / 2)) * zoom;
                  const y1 = ((m1.pos_y || 0) + s1 / 2) * zoom;
                  const x2 = ((m2.pos_x || 0) + (m2.forma === 'rectangular' ? s2 * 0.7 : s2 / 2)) * zoom;
                  const y2 = ((m2.pos_y || 0) + s2 / 2) * zoom;
                  lines.push(
                    <g key={`${grupo.id}-${i}`}>
                      <line
                        x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke="#9333ea" strokeWidth={3 * zoom} strokeDasharray={`${8 * zoom} ${4 * zoom}`}
                        opacity={0.6}
                      />
                      <circle cx={x1} cy={y1} r={4 * zoom} fill="#9333ea" opacity={0.7} />
                      <circle cx={x2} cy={y2} r={4 * zoom} fill="#9333ea" opacity={0.7} />
                    </g>
                  );
                }

                // Label in the middle of the group
                const midX = grupoMesas.reduce((s, m) => s + ((m.pos_x || 0) + getMesaSize(m.capacidad) / 2) * zoom, 0) / grupoMesas.length;
                const minY = Math.min(...grupoMesas.map(m => (m.pos_y || 0) * zoom));
                lines.push(
                  <g key={`label-${grupo.id}`}>
                    <rect x={midX - 30 * zoom} y={minY - 20 * zoom} width={60 * zoom} height={16 * zoom} rx={4 * zoom} fill="#9333ea" opacity={0.85} />
                    <text x={midX} y={minY - 10 * zoom} textAnchor="middle" dominantBaseline="middle"
                      fill="white" fontSize={9 * zoom} fontWeight="bold">
                      {grupo.capacidad_total} pers.
                    </text>
                  </g>
                );

                return <g key={grupo.id}>{lines}</g>;
              })}

              {/* Lines for tables being selected (merge mode) */}
              {modoUnir && mesasSeleccionadas.length >= 2 && (() => {
                const lines = [];
                for (let i = 0; i < mesasSeleccionadas.length - 1; i++) {
                  const m1 = mesasSeleccionadas[i];
                  const m2 = mesasSeleccionadas[i + 1];
                  const s1 = getMesaSize(m1.capacidad);
                  const s2 = getMesaSize(m2.capacidad);
                  const x1 = ((m1.pos_x || 0) + (m1.forma === 'rectangular' ? s1 * 0.7 : s1 / 2)) * zoom;
                  const y1 = ((m1.pos_y || 0) + s1 / 2) * zoom;
                  const x2 = ((m2.pos_x || 0) + (m2.forma === 'rectangular' ? s2 * 0.7 : s2 / 2)) * zoom;
                  const y2 = ((m2.pos_y || 0) + s2 / 2) * zoom;
                  lines.push(
                    <line key={i}
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke="#f59e0b" strokeWidth={3 * zoom} strokeDasharray={`${6 * zoom} ${3 * zoom}`}
                      opacity={0.8}
                    />
                  );
                }
                return lines;
              })()}
            </svg>

            {mesas.filter(m => m.activo !== false).map(mesa => {
              const reserva = reservasPorMesa[mesa.id];
              const esUrgente = reserva && reserva.minutesFalta > 0 && reserva.minutesFalta <= 30;
              const estaSeleccionada = modoUnir && mesasSeleccionadas.some(m => m.id === mesa.id);
              const grupoUnida = gruposPorMesa[mesa.id];

              return (
                <button
                  key={mesa.id}
                  onClick={() => handleMesaClick(mesa)}
                  className={clsx(
                    'absolute flex flex-col items-center justify-center',
                    'border-2 shadow-md transition-all duration-200',
                    'active:scale-95 hover:shadow-lg',
                    modoUnir && !estaSeleccionada && !grupoUnida && 'ring-2 ring-amber-300/50 cursor-crosshair',
                    estaSeleccionada && 'ring-4 ring-amber-400 border-amber-500 bg-amber-100 scale-105 shadow-xl z-30',
                    grupoUnida && !modoUnir && 'ring-2 ring-purple-400/60',
                    !estaSeleccionada && getEstadoClasses(mesa),
                    mesa.forma === 'redonda' && 'rounded-full',
                    mesa.forma === 'cuadrada' || !mesa.forma ? 'rounded-xl' : '',
                    mesa.forma === 'rectangular' && 'rounded-xl',
                    mesa.estado === 'cuenta' && !modoUnir && 'animate-pulse-soft',
                    esUrgente && !modoUnir && 'animate-pulse-soft',
                  )}
                  style={getMesaStylePlano(mesa)}
                >
                  {/* Sillas */}
                  {renderSillas(mesa)}

                  {/* Número */}
                  <div className="text-xl font-bold leading-none z-10">{mesa.numero}</div>
                  <div className="flex items-center gap-0.5 text-[10px] z-10 mt-0.5 opacity-75">
                    <FiUsers className="w-3 h-3" />
                    {grupoUnida ? grupoUnida.capacidad_total : mesa.capacidad}
                  </div>
                  <div className="text-[9px] font-medium uppercase tracking-wider mt-0.5 z-10">
                    {estaSeleccionada ? 'SELECCIONADA' : esUrgente ? 'RESERVA!' : grupoUnida && !modoUnir ? 'UNIDA' : getEstadoLabel(mesa.estado)}
                  </div>

                  {/* Merge badge */}
                  {grupoUnida && !modoUnir && (
                    <div className="absolute -top-1 -right-1 flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full z-20 bg-purple-500 text-white">
                      <FiLink className="w-2.5 h-2.5" />
                    </div>
                  )}

                  {/* Selection number badge in merge mode */}
                  {estaSeleccionada && (
                    <div className="absolute -top-2 -left-2 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold z-30 shadow">
                      {mesasSeleccionadas.findIndex(m => m.id === mesa.id) + 1}
                    </div>
                  )}

                  {/* Reservation badge */}
                  {!modoUnir && reserva && reserva.minutesFalta > 0 && reserva.minutesFalta <= 60 && (
                    <div className={clsx(
                      'absolute -top-1 -left-1 flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full z-20',
                      esUrgente ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                    )}>
                      <FiCalendar className="w-2.5 h-2.5" />
                      {Math.round(reserva.minutesFalta)}m
                    </div>
                  )}

                  {/* Badge de pedido listo */}
                  {!modoUnir && tienePedidoListo(mesa.id) && (
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center animate-pulse z-20">
                      <FiBell className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        </>
      ) : (
        /* ─── Vista Lista (original) ─── */
        <>
          {Object.entries(mesasPorZona).map(([zona, mesasZona]) => (
            <div key={zona} className="mb-8">
              <h3 className="text-lg font-semibold text-cafe-700 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-oliva-400 rounded-full" />
                {zona}
              </h3>
              <div className="grid-mesas">
                {mesasZona.map(mesa => {
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
                      <div className="text-3xl font-bold mb-2">{mesa.numero}</div>
                      <div className="flex items-center justify-center gap-1 text-sm opacity-75">
                        <FiUsers className="w-4 h-4" /><span>{mesa.capacidad}</span>
                      </div>
                      <div className="mt-2 text-xs font-medium uppercase tracking-wide">
                        {esUrgente ? 'RESERVADA PRONTO' : getEstadoLabel(mesa.estado)}
                      </div>

                      {reserva && reserva.minutesFalta > 0 && reserva.minutesFalta <= 60 && (
                        <div className={clsx(
                          'absolute top-1.5 left-1.5 flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                          esUrgente ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                        )}>
                          <FiCalendar className="w-3 h-3" />
                          {Math.round(reserva.minutesFalta)}m
                        </div>
                      )}

                      {reserva && reserva.minutesFalta > 0 && reserva.minutesFalta <= 60 && (
                        <div className={clsx('mt-1.5 text-[10px] leading-tight truncate',
                          esUrgente ? 'text-orange-700' : 'text-blue-600'
                        )}>
                          {reserva.horaCorta} • {reserva.cliente_nombre}
                        </div>
                      )}

                      {mesa.estado === 'ocupada' && mesa.tiempoOcupada && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 text-xs bg-white/80 px-2 py-1 rounded-full">
                          <FiClock className="w-3 h-3" /><span>{mesa.tiempoOcupada}</span>
                        </div>
                      )}

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
        </>
      )}

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-4 mt-4 px-2 text-xs text-cafe-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-400 border border-green-500" /> Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-500" /> Ocupada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-400 border border-blue-500" /> Reservada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400 border border-red-500" /> Cuenta
        </span>
        {totalReservasProximas > 0 && (
          <>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-orange-400" /> Reserva &lt;30 min
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-400" /> Reserva &lt;1 hora
            </span>
          </>
        )}
        {mesasUnidas && mesasUnidas.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-400 border border-purple-500" /> Unidas
          </span>
        )}
      </div>

      {!isLoading && mesas.length === 0 && (
        <div className="text-center py-12">
          <p className="text-cafe-500 mb-4">No hay mesas configuradas</p>
          <p className="text-cafe-400 text-sm">Contacte al administrador para configurar las mesas</p>
        </div>
      )}
    </div>
  );
}
