import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import api from '@services/api';
import {
  FiSave,
  FiUsers,
  FiCheck,
  FiAlertTriangle,
  FiX,
} from 'react-icons/fi';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { handleApiError } from '@utils';
import socketService from '@services/socket';

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
const DIAS_CORTO = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];
const HORA_INICIO = 6;
const HORA_FIN = 24;
const SLOT_MINUTOS = 30;
const SLOTS_POR_HORA = 60 / SLOT_MINUTOS;
const TOTAL_SLOTS = (HORA_FIN - HORA_INICIO) * SLOTS_POR_HORA;
const SLOT_HEIGHT = 30;
const DEFAULT_DURATION_SLOTS = 8; // 4 horas

const ROL_COLORES = {
  Caja:   { bg: '#0ea5e9', text: '#fff', badge: 'bg-sky-100 text-sky-700' },
  Mesero: { bg: '#f472b6', text: '#fff', badge: 'bg-pink-100 text-pink-700' },
  Cocina: { bg: '#f59e0b', text: '#fff', badge: 'bg-amber-100 text-amber-700' },
};

function pad(n) { return String(n).padStart(2, '0'); }

function slotToTime(slot) {
  const totalMin = HORA_INICIO * 60 + slot * SLOT_MINUTOS;
  return `${pad(Math.floor(totalMin / 60))}:${pad(totalMin % 60)}`;
}

function timeToSlot(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return ((h - HORA_INICIO) * 60 + m) / SLOT_MINUTOS;
}

function clampSlot(s) { return Math.max(0, Math.min(s, TOTAL_SLOTS)); }

/**
 * Calcula layout de columnas para turnos solapados en un mismo dia.
 * Asigna a cada turno una columna (col) y el total de columnas del grupo (totalCols)
 * para que se rendericen lado a lado sin taparse.
 */
function computeOverlapLayout(turnosDia) {
  if (!turnosDia.length) return new Map();

  // Ordenar por hora inicio, luego por hora fin
  const sorted = [...turnosDia].sort((a, b) => {
    const sA = timeToSlot(a.hora_inicio), sB = timeToSlot(b.hora_inicio);
    if (sA !== sB) return sA - sB;
    return timeToSlot(a.hora_fin) - timeToSlot(b.hora_fin);
  });

  const layout = new Map(); // key -> { col, totalCols }
  const groups = []; // array de arrays de turnos que se solapan entre si

  for (const turno of sorted) {
    const tStart = timeToSlot(turno.hora_inicio);
    const tEnd = timeToSlot(turno.hora_fin);
    const key = turno.id || turno._tempId;

    // Buscar un grupo existente con el que se solape
    let placed = false;
    for (const group of groups) {
      const groupEnd = Math.max(...group.map(t => timeToSlot(t.hora_fin)));
      if (tStart < groupEnd) {
        // Solapa con este grupo, encontrar primera columna libre
        const usedCols = new Set();
        for (const gt of group) {
          const gtKey = gt.id || gt._tempId;
          const gtStart = timeToSlot(gt.hora_inicio);
          const gtEnd = timeToSlot(gt.hora_fin);
          // Solo considerar ocupada si realmente se solapan
          if (tStart < gtEnd && tEnd > gtStart) {
            usedCols.add(layout.get(gtKey).col);
          }
        }
        let col = 0;
        while (usedCols.has(col)) col++;
        layout.set(key, { col, totalCols: 1 }); // totalCols se recalcula despues
        group.push(turno);
        placed = true;
        break;
      }
    }

    if (!placed) {
      // Nuevo grupo
      layout.set(key, { col: 0, totalCols: 1 });
      groups.push([turno]);
    }
  }

  // Recalcular totalCols por grupo
  for (const group of groups) {
    const maxCol = Math.max(...group.map(t => layout.get(t.id || t._tempId).col));
    const totalCols = maxCol + 1;
    for (const t of group) {
      layout.get(t.id || t._tempId).totalCols = totalCols;
    }
  }

  return layout;
}

export default function AdminTurnos() {
  const [turnos, setTurnos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [deletedIds, setDeletedIds] = useState([]);
  const [showAsistencias, setShowAsistencias] = useState(false);
  const [asistencias, setAsistencias] = useState([]);
  const [resumenAsist, setResumenAsist] = useState(null);
  const [personalActivo, setPersonalActivo] = useState([]);
  const [filtroRol, setFiltroRol] = useState('todos');

  // Interaccion de arrastre con pointer events
  const [dragging, setDragging] = useState(null);
  const [ghostPos, setGhostPos] = useState(null);
  const columnRefs = useRef([]);
  const scrollContainerRef = useRef(null);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const socket = socketService.socket;
    if (!socket) return;
    const handler = (data) => setPersonalActivo(data || []);
    socket.on('dashboard:personalActivo', handler);
    return () => socket.off('dashboard:personalActivo', handler);
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [turnosRes, usuariosRes] = await Promise.all([
        api.get('/turnos/resumen-semanal'),
        api.get('/usuarios'),
      ]);
      setTurnos(turnosRes.data.data || []);
      const all = usuariosRes.data.data || [];
      setUsuarios(all.filter(u => u.activo && u.rol_nombre !== 'Administrador'));
      try {
        const [asistRes, resumenRes] = await Promise.all([
          api.get('/asistencias/hoy'),
          api.get('/asistencias/resumen'),
        ]);
        setAsistencias(asistRes.data.data || []);
        setResumenAsist(resumenRes.data.data || null);
      } catch (_) { /* no bloquea */ }
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const usuariosFiltrados = useMemo(() => {
    if (filtroRol === 'todos') return usuarios;
    return usuarios.filter(u => u.rol_nombre === filtroRol);
  }, [usuarios, filtroRol]);

  // Fusionar turnos con cambios pendientes
  const turnosMerged = useMemo(() => {
    const base = turnos.map(t => ({ ...t }));
    const newOnes = pendingChanges.filter(p => !p.id);
    const merged = [...base, ...newOnes];
    pendingChanges.filter(p => p.id).forEach(upd => {
      const idx = merged.findIndex(t => t.id === upd.id);
      if (idx >= 0) Object.assign(merged[idx], upd);
    });
    return merged.filter(t => !deletedIds.includes(t.id));
  }, [turnos, pendingChanges, deletedIds]);

  const turnosPorDia = useMemo(() => {
    const r = {};
    for (let d = 0; d < 7; d++) r[d] = turnosMerged.filter(t => t.dia_semana === d);
    return r;
  }, [turnosMerged]);

  // Layout de solapamiento por dia
  const layoutPorDia = useMemo(() => {
    const r = {};
    for (let d = 0; d < 7; d++) r[d] = computeOverlapLayout(turnosPorDia[d] || []);
    return r;
  }, [turnosPorDia]);

  const hasPending = pendingChanges.length > 0 || deletedIds.length > 0;

  // Calcular dia y slot a partir de coordenadas del puntero
  const getDiaSlotFromPointer = useCallback((clientX, clientY) => {
    for (let d = 0; d < 7; d++) {
      const col = columnRefs.current[d];
      if (!col) continue;
      const rect = col.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right) {
        const relY = clientY - rect.top;
        const slot = Math.floor(relY / SLOT_HEIGHT);
        return { dia: d, slot: clampSlot(slot) };
      }
    }
    return null;
  }, []);

  // Listener global de pointer move/up cuando hay drag activo
  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e) => {
      e.preventDefault();
      const pos = getDiaSlotFromPointer(e.clientX, e.clientY);
      if (!pos) {
        setGhostPos(null);
        return;
      }

      if (dragging.type === 'new') {
        const dur = DEFAULT_DURATION_SLOTS;
        const endSlot = clampSlot(pos.slot + dur);
        setGhostPos({ dia: pos.dia, slot: pos.slot, duracion: endSlot - pos.slot, rolNombre: dragging.usuario.rol_nombre, nombre: dragging.usuario.nombre });
      } else if (dragging.type === 'move') {
        const dur = dragging.duracionSlots;
        const endSlot = clampSlot(pos.slot + dur);
        setGhostPos({ dia: pos.dia, slot: pos.slot, duracion: endSlot - pos.slot, rolNombre: dragging.turno.rol_nombre, nombre: dragging.turno.nombre });
      } else if (dragging.type === 'resize') {
        const newEnd = Math.max(pos.slot, dragging.slotInicio + 1);
        setGhostPos({ dia: dragging.dia, slot: dragging.slotInicio, duracion: clampSlot(newEnd) - dragging.slotInicio, rolNombre: dragging.turno.rol_nombre, nombre: dragging.turno.nombre });
      }
    };

    const handleUp = (e) => {
      const pos = getDiaSlotFromPointer(e.clientX, e.clientY);

      if (dragging.type === 'new' && pos) {
        const u = dragging.usuario;
        const startSlot = pos.slot;
        const endSlot = clampSlot(startSlot + DEFAULT_DURATION_SLOTS);
        if (endSlot > startSlot) {
          setPendingChanges(prev => [...prev, {
            _tempId: `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            usuario_id: u.id, nombre: u.nombre, apellido: u.apellido,
            username: u.username, rol_nombre: u.rol_nombre,
            dia_semana: pos.dia, hora_inicio: slotToTime(startSlot), hora_fin: slotToTime(endSlot),
          }]);
        }
      } else if (dragging.type === 'move' && pos) {
        const t = dragging.turno;
        const dur = dragging.duracionSlots;
        const endSlot = clampSlot(pos.slot + dur);
        if (endSlot > pos.slot) {
          applyUpdate(t, { dia_semana: pos.dia, hora_inicio: slotToTime(pos.slot), hora_fin: slotToTime(endSlot) });
        }
      } else if (dragging.type === 'resize' && ghostPos) {
        const t = dragging.turno;
        const endSlot = clampSlot(ghostPos.slot + ghostPos.duracion);
        applyUpdate(t, { hora_fin: slotToTime(endSlot) });
      }

      setDragging(null);
      setGhostPos(null);
    };

    window.addEventListener('pointermove', handleMove, { passive: false });
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragging, ghostPos, getDiaSlotFromPointer]);

  const applyUpdate = (turno, upd) => {
    if (turno.id) {
      setPendingChanges(prev => {
        const exists = prev.find(p => p.id === turno.id);
        if (exists) return prev.map(p => p.id === turno.id ? { ...p, ...upd } : p);
        return [...prev, { id: turno.id, ...upd }];
      });
    } else if (turno._tempId) {
      setPendingChanges(prev => prev.map(p => p._tempId === turno._tempId ? { ...p, ...upd } : p));
    }
  };

  // Arrastre de usuario desde sidebar
  const handleUserPointerDown = (e, usuario) => {
    e.preventDefault();
    setDragging({ type: 'new', usuario });
  };

  // Arrastre de bloque existente
  const handleBlockPointerDown = (e, turno) => {
    e.preventDefault();
    e.stopPropagation();
    const slotI = timeToSlot(turno.hora_inicio);
    const slotF = timeToSlot(turno.hora_fin);
    setDragging({ type: 'move', turno, duracionSlots: slotF - slotI });
  };

  // Redimensionar
  const handleResizePointerDown = (e, turno) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging({
      type: 'resize', turno,
      dia: turno.dia_semana,
      slotInicio: timeToSlot(turno.hora_inicio),
    });
  };

  const handleDeleteTurno = (turno) => {
    if (turno.id) {
      setDeletedIds(prev => [...prev, turno.id]);
    } else if (turno._tempId) {
      setPendingChanges(prev => prev.filter(p => p._tempId !== turno._tempId));
    }
  };

  // Guardar todos los cambios en lote
  const handleGuardar = async () => {
    setIsSaving(true);
    try {
      const ops = [];
      deletedIds.forEach(id => ops.push({ id, _delete: true }));
      pendingChanges.forEach(c => {
        if (c.id) {
          ops.push({ id: c.id, dia_semana: c.dia_semana, hora_inicio: c.hora_inicio, hora_fin: c.hora_fin });
        } else {
          ops.push({ usuario_id: c.usuario_id, dia_semana: c.dia_semana, hora_inicio: c.hora_inicio, hora_fin: c.hora_fin });
        }
      });
      if (ops.length === 0) { toast('Sin cambios'); setIsSaving(false); return; }
      await api.post('/turnos/bulk', { turnos: ops });
      toast.success(`${ops.length} cambios guardados`);
      setPendingChanges([]);
      setDeletedIds([]);
      fetchData();
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-16 h-16 border-4 border-oliva-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const diaHoy = (() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; })();

  return (
    <div className="h-full flex flex-col" style={{ userSelect: dragging ? 'none' : undefined }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-cafe-800">Turnos y Asistencia</h2>
          <p className="text-cafe-500">Arrastra personal desde el panel izquierdo al horario</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowAsistencias(!showAsistencias)}
            className={clsx('flex items-center gap-2 px-4 py-2 rounded-button text-sm font-medium transition-colors',
              showAsistencias ? 'bg-oliva-400 text-white' : 'bg-beige-200 text-cafe-700 hover:bg-beige-300')}>
            <FiCheck className="w-4 h-4" /> Asistencia Hoy
          </button>
          {hasPending && (
            <>
              <button onClick={() => { setPendingChanges([]); setDeletedIds([]); }}
                className="flex items-center gap-2 px-4 py-2 rounded-button text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200">
                Descartar
              </button>
              <button onClick={handleGuardar} disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-button text-sm font-medium bg-oliva-400 text-white hover:bg-oliva-500 disabled:opacity-50">
                <FiSave className="w-4 h-4" />
                {isSaving ? 'Guardando...' : `Guardar (${pendingChanges.length + deletedIds.length})`}
              </button>
            </>
          )}
        </div>
      </div>

      {showAsistencias && resumenAsist && (
        <AsistenciaPanel resumen={resumenAsist} asistencias={asistencias} personalActivo={personalActivo} />
      )}

      {/* Main: sidebar + grilla */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        {/* Sidebar personal */}
        <div className="w-56 flex-shrink-0 flex flex-col bg-white rounded-xl border border-beige-300 overflow-hidden">
          <div className="p-3 border-b border-beige-200">
            <h3 className="font-semibold text-cafe-800 text-sm flex items-center gap-2">
              <FiUsers className="w-4 h-4" /> Personal
            </h3>
            <select value={filtroRol} onChange={e => setFiltroRol(e.target.value)}
              className="mt-2 w-full text-xs border border-beige-300 rounded-lg px-2 py-1.5 text-cafe-700">
              <option value="todos">Todos los roles</option>
              <option value="Caja">Caja</option>
              <option value="Mesero">Mesero</option>
              <option value="Cocina">Cocina</option>
            </select>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {usuariosFiltrados.map(usuario => {
              const c = ROL_COLORES[usuario.rol_nombre] || { bg: '#888', badge: 'bg-gray-100 text-gray-700' };
              const online = personalActivo.some(p => p.username === usuario.username);
              return (
                <div key={usuario.id}
                  onPointerDown={(e) => handleUserPointerDown(e, usuario)}
                  className="flex items-center gap-2 p-2 rounded-lg cursor-grab active:cursor-grabbing
                    border-2 border-transparent hover:border-beige-300 bg-beige-50 hover:bg-beige-100 touch-none select-none"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 relative"
                    style={{ background: c.bg, color: '#fff' }}>
                    {usuario.nombre.charAt(0)}{usuario.apellido?.charAt(0)}
                    {online && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-cafe-800 truncate">{usuario.nombre} {usuario.apellido?.charAt(0)}.</p>
                    <p className={clsx('text-[10px] font-medium', c.badge)}>{usuario.rol_nombre}</p>
                  </div>
                </div>
              );
            })}
            {usuariosFiltrados.length === 0 && (
              <p className="text-xs text-cafe-400 text-center py-4">Sin personal</p>
            )}
          </div>
          <div className="p-3 border-t border-beige-200 space-y-1.5">
            {Object.entries(ROL_COLORES).map(([rol, c]) => (
              <div key={rol} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ background: c.bg }} />
                <span className="text-[10px] text-cafe-600">{rol}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grilla semanal */}
        <div className="flex-1 bg-white rounded-xl border border-beige-300 overflow-hidden flex flex-col">
          {/* Header dias */}
          <div className="flex border-b border-beige-300 bg-beige-50 flex-shrink-0">
            <div className="w-14 flex-shrink-0 border-r border-beige-200" />
            {DIAS_SEMANA.map((dia, idx) => (
              <div key={dia} className={clsx('flex-1 text-center py-2 border-r border-beige-200 last:border-r-0', idx === diaHoy && 'bg-oliva-50')}>
                <p className={clsx('text-xs font-bold', idx === diaHoy ? 'text-oliva-600' : 'text-cafe-700')}>{DIAS_CORTO[idx]}</p>
                <p className={clsx('text-[10px]', idx === diaHoy ? 'text-oliva-500' : 'text-cafe-400')}>{dia}</p>
              </div>
            ))}
          </div>

          {/* Grid con scroll */}
          <div className="flex-1 overflow-auto" ref={scrollContainerRef}>
            <div className="flex relative" style={{ height: TOTAL_SLOTS * SLOT_HEIGHT }}>
              {/* Columna de horas */}
              <div className="w-14 flex-shrink-0 border-r border-beige-200 relative sticky left-0 bg-white z-10">
                {Array.from({ length: HORA_FIN - HORA_INICIO }, (_, i) => (
                  <div key={i} className="absolute right-2 text-[10px] text-cafe-400 font-mono"
                    style={{ top: i * SLOTS_POR_HORA * SLOT_HEIGHT - 6 }}>
                    {pad(HORA_INICIO + i)}:00
                  </div>
                ))}
              </div>

              {/* Columnas de dias */}
              {Array.from({ length: 7 }, (_, diaIdx) => {
                const dTurnos = turnosPorDia[diaIdx] || [];
                const esHoy = diaIdx === diaHoy;

                return (
                  <div key={diaIdx}
                    ref={el => columnRefs.current[diaIdx] = el}
                    className={clsx('flex-1 border-r border-beige-200 last:border-r-0 relative', esHoy && 'bg-oliva-50/30')}
                    style={{ height: TOTAL_SLOTS * SLOT_HEIGHT }}>

                    {/* Lineas de fondo */}
                    {Array.from({ length: TOTAL_SLOTS }, (_, s) => (
                      <div key={s}
                        className={clsx('absolute left-0 right-0', s % SLOTS_POR_HORA === 0 ? 'border-t border-beige-200' : 'border-t border-beige-100/50')}
                        style={{ top: s * SLOT_HEIGHT, height: SLOT_HEIGHT }} />
                    ))}

                    {/* Linea hora actual */}
                    {esHoy && <CurrentTimeLine />}

                    {/* Preview fantasma */}
                    {ghostPos && ghostPos.dia === diaIdx && (
                      <div className="absolute left-1 right-1 rounded-lg border-2 border-dashed pointer-events-none z-30 flex flex-col items-center justify-center"
                        style={{
                          top: ghostPos.slot * SLOT_HEIGHT,
                          height: ghostPos.duracion * SLOT_HEIGHT,
                          background: (ROL_COLORES[ghostPos.rolNombre]?.bg || '#888') + '66',
                          borderColor: ROL_COLORES[ghostPos.rolNombre]?.bg || '#888',
                        }}>
                        <span className="text-[11px] font-bold text-white drop-shadow-md">
                          {ghostPos.nombre}
                        </span>
                        <span className="text-[10px] text-white drop-shadow-md">
                          {slotToTime(ghostPos.slot)} - {slotToTime(ghostPos.slot + ghostPos.duracion)}
                        </span>
                      </div>
                    )}

                    {/* Bloques de turnos */}
                    {dTurnos.map(turno => {
                      const isDraggingThis = dragging?.turno &&
                        ((dragging.turno.id && dragging.turno.id === turno.id) ||
                         (dragging.turno._tempId && dragging.turno._tempId === turno._tempId));
                      const lKey = turno.id || turno._tempId;
                      const lInfo = layoutPorDia[diaIdx]?.get(lKey) || { col: 0, totalCols: 1 };
                      return (
                        <TurnoBlock
                          key={lKey}
                          turno={turno}
                          layoutCol={lInfo.col}
                          totalCols={lInfo.totalCols}
                          onPointerDown={handleBlockPointerDown}
                          onResizePointerDown={handleResizePointerDown}
                          onDelete={handleDeleteTurno}
                          isDragging={isDraggingThis}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== TurnoBlock ====================
function TurnoBlock({ turno, layoutCol = 0, totalCols = 1, onPointerDown, onResizePointerDown, onDelete, isDragging }) {
  const slotI = timeToSlot(turno.hora_inicio);
  const slotF = timeToSlot(turno.hora_fin);
  const durSlots = slotF - slotI;
  const c = ROL_COLORES[turno.rol_nombre] || { bg: '#888', text: '#fff' };
  const [hover, setHover] = useState(false);

  if (durSlots <= 0) return null;

  // Calcular posicion horizontal (porcentaje)
  const PAD = 2; // px padding a los lados
  const colWidthPct = 100 / totalCols;
  const leftPct = layoutCol * colWidthPct;

  return (
    <div
      onPointerDown={(e) => onPointerDown(e, turno)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={clsx(
        'absolute rounded-lg cursor-grab active:cursor-grabbing',
        'flex flex-col overflow-hidden shadow-sm hover:shadow-lg transition-shadow touch-none select-none',
        isDragging && 'opacity-30',
      )}
      style={{
        top: slotI * SLOT_HEIGHT + 1,
        height: Math.max(durSlots * SLOT_HEIGHT - 2, SLOT_HEIGHT - 2),
        left: `calc(${leftPct}% + ${PAD}px)`,
        width: `calc(${colWidthPct}% - ${PAD * 2}px)`,
        background: c.bg,
        color: c.text || '#fff',
        zIndex: hover ? 15 : 10,
        border: `2px solid ${c.bg}`,
        filter: hover ? 'brightness(1.1)' : undefined,
      }}
      title={`${turno.nombre} ${turno.apellido} - ${turno.rol_nombre}\n${turno.hora_inicio?.slice(0,5)} - ${turno.hora_fin?.slice(0,5)}`}
    >
      <div className="flex-1 px-1.5 py-1 overflow-hidden pointer-events-none">
        <p className="text-[11px] font-bold truncate leading-tight">
          {totalCols > 2 ? turno.nombre?.charAt(0) + turno.apellido?.charAt(0) : `${turno.nombre} ${turno.apellido?.charAt(0)}.`}
        </p>
        {durSlots >= 2 && totalCols <= 3 && (
          <p className="text-[10px] opacity-80 leading-tight">
            {turno.hora_inicio?.slice(0, 5)} - {turno.hora_fin?.slice(0, 5)}
          </p>
        )}
        {durSlots >= 4 && totalCols <= 2 && (
          <p className="text-[10px] opacity-70 leading-tight mt-0.5">{turno.rol_nombre}</p>
        )}
      </div>

      {/* Eliminar */}
      <button
        onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); onDelete(turno); }}
        className={clsx(
          'absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/30 hover:bg-red-600 flex items-center justify-center transition-all',
          hover ? 'opacity-100' : 'opacity-0'
        )}
      >
        <FiX className="w-3 h-3 text-white" />
      </button>

      {/* Resize handle */}
      <div
        onPointerDown={(e) => onResizePointerDown(e, turno)}
        className={clsx(
          'absolute bottom-0 left-0 right-0 h-3 cursor-s-resize rounded-b-lg flex items-center justify-center',
          hover ? 'bg-black/15' : ''
        )}
      >
        <div className="w-8 h-1 rounded-full bg-white/50" />
      </div>
    </div>
  );
}

// ==================== CurrentTimeLine ====================
function CurrentTimeLine() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(iv);
  }, []);
  const h = now.getHours(), m = now.getMinutes();
  if (h < HORA_INICIO || h >= HORA_FIN) return null;
  const top = ((h - HORA_INICIO) * 60 + m) / SLOT_MINUTOS * SLOT_HEIGHT;
  return (
    <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top }}>
      <div className="flex items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1" />
        <div className="flex-1 h-[2px] bg-red-500" />
      </div>
    </div>
  );
}

// ==================== AsistenciaPanel ====================
function AsistenciaPanel({ resumen, asistencias, personalActivo }) {
  return (
    <div className="mb-4 bg-white rounded-xl border border-beige-300 p-4">
      <div className="flex items-start gap-6 flex-wrap">
        <div className="flex gap-3">
          <StatBox v={resumen.total_presentes || 0} l="Presentes" c="green" />
          <StatBox v={resumen.puntuales || 0} l="Puntuales" c="blue" />
          <StatBox v={resumen.tardanzas || 0} l="Tardanzas" c="amber" />
          <StatBox v={resumen.activos_ahora || 0} l="Conectados" c="purple" />
        </div>
        {resumen.ausentes?.length > 0 && (
          <div className="flex-1 min-w-[200px]">
            <p className="text-xs font-semibold text-red-600 mb-1 flex items-center gap-1">
              <FiAlertTriangle className="w-3 h-3" /> Ausentes ({resumen.ausentes.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {resumen.ausentes.map(u => (
                <span key={u.id} className={clsx('text-[10px] px-2 py-0.5 rounded-full font-medium', ROL_COLORES[u.rol_nombre]?.badge)}>
                  {u.nombre} {u.apellido?.charAt(0)}.
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      {asistencias.length > 0 && (
        <div className="mt-3 pt-3 border-t border-beige-200">
          <p className="text-xs font-semibold text-cafe-700 mb-2">Registro de hoy</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {asistencias.map(a => {
              const c = ROL_COLORES[a.rol_nombre] || { bg: '#888' };
              const online = personalActivo.some(p => p.username === a.username);
              const entrada = new Date(a.hora_entrada).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
              const salida = a.hora_salida ? new Date(a.hora_salida).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : null;
              return (
                <div key={a.id} className="flex items-center gap-2 p-2 bg-beige-50 rounded-lg">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold relative"
                    style={{ background: c.bg, color: '#fff' }}>
                    {a.nombre?.charAt(0)}{a.apellido?.charAt(0)}
                    {online && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border border-white rounded-full" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-cafe-800 truncate">{a.nombre} {a.apellido?.charAt(0)}.</p>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-cafe-500">{entrada}{salida ? ` - ${salida}` : ' ...'}</span>
                      {a.puntual === true && <FiCheck className="w-3 h-3 text-green-500" />}
                      {a.puntual === false && <FiAlertTriangle className="w-3 h-3 text-amber-500" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ v, l, c }) {
  const m = { green: 'bg-green-50 text-green-600', blue: 'bg-blue-50 text-blue-600', amber: 'bg-amber-50 text-amber-600', purple: 'bg-purple-50 text-purple-600' };
  return (
    <div className={clsx('text-center px-4 py-2 rounded-lg', m[c])}>
      <p className="text-2xl font-bold">{v}</p>
      <p className="text-[10px] font-medium">{l}</p>
    </div>
  );
}
