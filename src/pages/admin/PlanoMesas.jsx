import { useEffect, useState, useRef, useCallback } from 'react';
import { useMesasStore } from '@store/mesasStore';
import Draggable from 'react-draggable';
import {
  FiSave,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiMove,
  FiGrid,
  FiZoomIn,
  FiZoomOut,
  FiUsers,
  FiArrowLeft,
  FiSquare,
  FiCircle,
  FiRotateCcw,
  FiX,
  FiCheck,
  FiMaximize,
} from 'react-icons/fi';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const GRID_SIZE = 20;
const MESA_BASE = 70; // px tamaño mínimo (2 pers)
const MESA_MAX = 130; // px tamaño máximo (12 pers)
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;

// Escala de mesa según capacidad: 2→70px, 4→80px, 6→90px, 8→100px, 10→110px, 12→130px
const getMesaSize = (capacidad) => {
  const cap = Math.max(2, Math.min(capacidad || 4, 12));
  return MESA_BASE + ((cap - 2) / 10) * (MESA_MAX - MESA_BASE);
};

const FORMAS = [
  { value: 'cuadrada', label: 'Cuadrada', icon: FiSquare },
  { value: 'redonda', label: 'Redonda', icon: FiCircle },
  { value: 'rectangular', label: 'Rectangular', icon: FiMaximize },
];

const ZONAS = ['Principal', 'Terraza', 'Privado', 'Barra', 'Exterior'];
const CAPACIDADES = [2, 4, 6, 8, 10, 12];

export default function AdminPlanoMesas() {
  const {
    mesas,
    fetchMesas,
    isLoading,
    updatePosicionesBatch,
    createMesa,
    updateMesa,
    deleteMesa,
  } = useMesasStore();

  const canvasRef = useRef(null);
  const [posiciones, setPosiciones] = useState({});
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [selectedMesa, setSelectedMesa] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showMesaModal, setShowMesaModal] = useState(false);
  const [mesaEditData, setMesaEditData] = useState(null);
  const [formData, setFormData] = useState({
    numero: '',
    capacidad: '4',
    zona: 'Principal',
    forma: 'cuadrada',
  });

  useEffect(() => {
    fetchMesas();
  }, []);

  // Inicializar/mergear posiciones desde las mesas (no sobrescribir posiciones locales)
  useEffect(() => {
    if (mesas.length > 0) {
      setPosiciones((prev) => {
        const updated = { ...prev };
        mesas.forEach((mesa) => {
          // Solo agregar mesas que no existen localmente
          if (!updated[mesa.id]) {
            updated[mesa.id] = {
              x: mesa.pos_x || 0,
              y: mesa.pos_y || 0,
              forma: mesa.forma || 'cuadrada',
            };
          }
        });
        // Eliminar mesas que ya no existen
        Object.keys(updated).forEach((id) => {
          if (!mesas.find((m) => m.id === parseInt(id))) {
            delete updated[id];
          }
        });
        return updated;
      });
    }
  }, [mesas]);

  const snapToGrid = (x, y) => ({
    x: Math.round(x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(y / GRID_SIZE) * GRID_SIZE,
  });

  const handleDragStop = useCallback((mesaId, e, data) => {
    const snapped = showGrid
      ? snapToGrid(data.x, data.y)
      : { x: data.x, y: data.y };

    setPosiciones((prev) => ({
      ...prev,
      [mesaId]: {
        ...prev[mesaId],
        x: Math.max(0, Math.min(snapped.x, CANVAS_WIDTH - MESA_MAX)),
        y: Math.max(0, Math.min(snapped.y, CANVAS_HEIGHT - MESA_MAX)),
      },
    }));
    setIsDirty(true);
  }, [showGrid]);

  const handleSave = async () => {
    setIsSaving(true);
    const mesasToUpdate = Object.entries(posiciones).map(([id, pos]) => ({
      id: parseInt(id),
      pos_x: pos.x,
      pos_y: pos.y,
      forma: pos.forma,
    }));

    const result = await updatePosicionesBatch(mesasToUpdate);
    if (result.success) {
      toast.success('Plano guardado correctamente');
      setIsDirty(false);
    } else {
      toast.error(result.message);
    }
    setIsSaving(false);
  };

  const handleSelectMesa = (mesa) => {
    setSelectedMesa(selectedMesa?.id === mesa.id ? null : mesa);
  };

  const handleChangeMesaForma = (forma) => {
    if (!selectedMesa) return;
    setPosiciones((prev) => ({
      ...prev,
      [selectedMesa.id]: { ...prev[selectedMesa.id], forma },
    }));
    setIsDirty(true);
  };

  const handleResetPositions = () => {
    if (!confirm('¿Resetear todas las posiciones? Las mesas se colocarán en grilla automáticamente.')) return;
    const pos = {};
    mesas.forEach((mesa, i) => {
      const cols = Math.floor(CANVAS_WIDTH / (MESA_MAX + 30));
      const row = Math.floor(i / cols);
      const col = i % cols;
      pos[mesa.id] = {
        x: col * (MESA_MAX + 30) + 20,
        y: row * (MESA_MAX + 50) + 20,
        forma: mesa.forma || 'cuadrada',
      };
    });
    setPosiciones(pos);
    setIsDirty(true);
    toast.success('Posiciones reseteadas');
  };

  // ─── CRUD Modal ───
  const handleNuevaMesa = () => {
    setMesaEditData(null);
    const siguienteNumero = mesas.length > 0
      ? Math.max(...mesas.map((m) => parseInt(m.numero) || 0)) + 1
      : 1;
    setFormData({
      numero: siguienteNumero.toString(),
      capacidad: '4',
      zona: 'Principal',
      forma: 'cuadrada',
    });
    setShowMesaModal(true);
  };

  const handleEditarMesa = (mesa) => {
    setMesaEditData(mesa);
    setFormData({
      numero: mesa.numero?.toString() || '',
      capacidad: mesa.capacidad?.toString() || '4',
      zona: mesa.zona || 'Principal',
      forma: posiciones[mesa.id]?.forma || mesa.forma || 'cuadrada',
    });
    setShowMesaModal(true);
  };

  const handleEliminarMesa = async (mesa) => {
    if (!confirm(`¿Eliminar Mesa ${mesa.numero}?`)) return;
    const result = await deleteMesa(mesa.id);
    if (result.success) {
      toast.success(`Mesa ${mesa.numero} eliminada`);
      setSelectedMesa(null);
      setPosiciones((prev) => {
        const updated = { ...prev };
        delete updated[mesa.id];
        return updated;
      });
    } else {
      toast.error(result.message);
    }
  };

  const handleSubmitMesa = async (e) => {
    e.preventDefault();
    if (!formData.numero || !formData.capacidad) {
      toast.error('Complete los campos requeridos');
      return;
    }

    const data = {
      numero: parseInt(formData.numero),
      nombre: `Mesa ${formData.numero}`,
      capacidad: parseInt(formData.capacidad),
      zona: formData.zona,
      forma: formData.forma,
      pos_x: 100,
      pos_y: 100,
    };

    if (mesaEditData) {
      const result = await updateMesa(mesaEditData.id, data);
      if (result.success) {
        toast.success('Mesa actualizada');
        setPosiciones((prev) => ({
          ...prev,
          [mesaEditData.id]: { ...prev[mesaEditData.id], forma: formData.forma },
        }));
      } else {
        toast.error(result.message);
        return;
      }
    } else {
      const result = await createMesa(data);
      if (result.success) {
        toast.success('Mesa creada');
        setPosiciones((prev) => ({
          ...prev,
          [result.data.id]: { x: data.pos_x, y: data.pos_y, forma: formData.forma },
        }));
        setIsDirty(true);
      } else {
        toast.error(result.message);
        return;
      }
    }
    setShowMesaModal(false);
  };

  const getEstadoColor = (estado) => {
    const colors = {
      disponible: { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700', fill: '#22c55e' },
      ocupada: { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-700', fill: '#eab308' },
      reservada: { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700', fill: '#3b82f6' },
      cuenta: { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-700', fill: '#ef4444' },
    };
    return colors[estado] || colors.disponible;
  };

  const getMesaClasses = (mesa) => {
    const color = getEstadoColor(mesa.estado);
    const forma = posiciones[mesa.id]?.forma || mesa.forma || 'cuadrada';
    const isSelected = selectedMesa?.id === mesa.id;

    return clsx(
      'absolute flex flex-col items-center justify-center cursor-grab active:cursor-grabbing',
      'border-2 shadow-md hover:shadow-lg transition-shadow',
      color.bg, color.border, color.text,
      forma === 'redonda' && 'rounded-full',
      forma === 'cuadrada' && 'rounded-xl',
      forma === 'rectangular' && 'rounded-xl',
      isSelected && 'ring-4 ring-oliva-400 ring-offset-2 z-20',
      mesa.estado === 'cuenta' && 'animate-pulse',
    );
  };

  const getMesaStyle = (mesa) => {
    const forma = posiciones[mesa.id]?.forma || mesa.forma || 'cuadrada';
    const size = getMesaSize(mesa.capacidad) * zoom;
    return {
      width: forma === 'rectangular' ? size * 1.4 : size,
      height: size,
    };
  };

  // Renderizar sillas alrededor de la mesa
  const renderSillas = (mesa) => {
    const capacidad = mesa.capacidad || 4;
    const forma = posiciones[mesa.id]?.forma || mesa.forma || 'cuadrada';
    const sillas = [];
    const mesaSz = getMesaSize(mesa.capacidad);
    const sillaSize = 12 * zoom;

    if (forma === 'redonda') {
      // Sillas en círculo
      for (let i = 0; i < capacidad; i++) {
        const angle = (i * 2 * Math.PI) / capacidad - Math.PI / 2;
        const radius = (mesaSz * zoom) / 2 + sillaSize;
        sillas.push(
          <div
            key={i}
            className="absolute bg-cafe-300 rounded-full border border-cafe-400"
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
      // Sillas en los lados
      const mesaW = forma === 'rectangular' ? mesaSz * 1.4 * zoom : mesaSz * zoom;
      const mesaH = mesaSz * zoom;
      const sides = [
        { side: 'top', count: 0 },
        { side: 'bottom', count: 0 },
        { side: 'left', count: 0 },
        { side: 'right', count: 0 },
      ];

      // Distribuir sillas
      for (let i = 0; i < capacidad; i++) {
        sides[i % 4].count++;
      }

      sides.forEach(({ side, count }) => {
        for (let i = 0; i < count; i++) {
          let left, top;
          if (side === 'top') {
            left = ((i + 1) * mesaW) / (count + 1) - sillaSize / 2;
            top = -sillaSize - 4;
          } else if (side === 'bottom') {
            left = ((i + 1) * mesaW) / (count + 1) - sillaSize / 2;
            top = mesaH + 4;
          } else if (side === 'left') {
            left = -sillaSize - 4;
            top = ((i + 1) * mesaH) / (count + 1) - sillaSize / 2;
          } else {
            left = mesaW + 4;
            top = ((i + 1) * mesaH) / (count + 1) - sillaSize / 2;
          }
          sillas.push(
            <div
              key={`${side}-${i}`}
              className="absolute bg-cafe-300 rounded-full border border-cafe-400"
              style={{
                width: sillaSize,
                height: sillaSize,
                left,
                top,
              }}
            />
          );
        }
      });
    }

    return sillas;
  };

  if (isLoading && mesas.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ─── Toolbar ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-cafe-800">Plano del Restaurante</h2>
          <p className="text-cafe-500 text-sm">Arrastra las mesas para organizarlas en el plano</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom */}
          <div className="flex items-center gap-1 bg-beige-100 rounded-lg px-2 py-1">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              className="p-1 hover:bg-beige-200 rounded"
              title="Alejar"
            >
              <FiZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
              className="p-1 hover:bg-beige-200 rounded"
              title="Acercar"
            >
              <FiZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Grid toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              showGrid ? 'bg-oliva-400 text-white' : 'bg-beige-100 text-cafe-600 hover:bg-beige-200'
            )}
            title="Mostrar/ocultar grilla"
          >
            <FiGrid className="w-4 h-4" />
          </button>

          {/* Reset */}
          <button
            onClick={handleResetPositions}
            className="p-2 bg-beige-100 text-cafe-600 rounded-lg hover:bg-beige-200"
            title="Resetear posiciones"
          >
            <FiRotateCcw className="w-4 h-4" />
          </button>

          {/* Agregar mesa */}
          <button
            onClick={handleNuevaMesa}
            className="flex items-center gap-2 px-3 py-2 bg-oliva-400 text-white rounded-lg hover:bg-oliva-500"
          >
            <FiPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva Mesa</span>
          </button>

          {/* Guardar */}
          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
              isDirty
                ? 'bg-terracota-500 text-white hover:bg-terracota-600 shadow-md'
                : 'bg-beige-200 text-cafe-400 cursor-not-allowed'
            )}
          >
            <FiSave className="w-4 h-4" />
            {isSaving ? 'Guardando...' : 'Guardar Plano'}
          </button>
        </div>
      </div>

      {/* ─── Leyenda de estados ─── */}
      <div className="flex flex-wrap items-center gap-4 mb-3 px-2 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-400 border border-green-500" />
          Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-500" />
          Ocupada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-400 border border-blue-500" />
          Reservada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400 border border-red-500" />
          Cuenta
        </span>
        {isDirty && (
          <span className="ml-auto text-terracota-500 font-medium animate-pulse">
            ● Cambios sin guardar
          </span>
        )}
      </div>

      {/* ─── Selected Mesa Panel ─── */}
      {selectedMesa && (
        <div className="flex flex-wrap items-center gap-3 mb-3 p-3 bg-oliva-50 border border-oliva-200 rounded-lg">
          <span className="font-semibold text-cafe-800">
            Mesa {selectedMesa.numero}
          </span>
          <span className="text-sm text-cafe-500">
            ({selectedMesa.capacidad} pers. · {selectedMesa.zona || 'Sin zona'})
          </span>

          <div className="flex items-center gap-1 ml-auto">
            <span className="text-xs text-cafe-500 mr-2">Forma:</span>
            {FORMAS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => handleChangeMesaForma(value)}
                className={clsx(
                  'p-2 rounded-lg transition-colors',
                  (posiciones[selectedMesa.id]?.forma || 'cuadrada') === value
                    ? 'bg-oliva-400 text-white'
                    : 'bg-white text-cafe-600 hover:bg-beige-100 border border-beige-200'
                )}
                title={label}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          <button
            onClick={() => handleEditarMesa(selectedMesa)}
            className="p-2 bg-white text-cafe-600 rounded-lg hover:bg-beige-100 border border-beige-200"
            title="Editar mesa"
          >
            <FiEdit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEliminarMesa(selectedMesa)}
            className="p-2 bg-white text-terracota-600 rounded-lg hover:bg-terracota-50 border border-beige-200"
            title="Eliminar mesa"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Canvas ─── */}
      <div
        className="flex-1 overflow-auto border-2 border-beige-300 rounded-xl bg-beige-50"
        style={{ minHeight: 500 }}
      >
        <div
          ref={canvasRef}
          className="relative"
          style={{
            width: CANVAS_WIDTH * zoom,
            height: CANVAS_HEIGHT * zoom,
            backgroundImage: showGrid
              ? `linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)`
              : 'none',
            backgroundSize: showGrid ? `${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px` : 'auto',
          }}
          onClick={(e) => {
            // Deselect mesa if clicking canvas bg
            if (e.target === canvasRef.current) {
              setSelectedMesa(null);
            }
          }}
        >
          {/* Mesas arrastrables */}
          {mesas.filter(m => m.activo !== false).map((mesa) => {
            const pos = posiciones[mesa.id] || { x: 0, y: 0 };
            return (
              <Draggable
                key={mesa.id}
                position={{ x: pos.x * zoom, y: pos.y * zoom }}
                onStop={(e, data) =>
                  handleDragStop(mesa.id, e, {
                    x: data.x / zoom,
                    y: data.y / zoom,
                  })
                }
                bounds="parent"
                grid={showGrid ? [GRID_SIZE * zoom, GRID_SIZE * zoom] : undefined}
              >
                <div
                  className={getMesaClasses(mesa)}
                  style={getMesaStyle(mesa)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectMesa(mesa);
                  }}
                >
                  {/* Sillas */}
                  {renderSillas(mesa)}

                  {/* Contenido mesa */}
                  <div className="text-xl font-bold leading-none">{mesa.numero}</div>
                  <div className="flex items-center gap-0.5 text-[10px] mt-0.5 opacity-80">
                    <FiUsers className="w-3 h-3" />
                    {mesa.capacidad}
                  </div>
                  <div className="text-[9px] font-medium uppercase tracking-wider mt-0.5">
                    {mesa.estado}
                  </div>
                </div>
              </Draggable>
            );
          })}
        </div>
      </div>

      {/* ─── Modal crear/editar mesa ─── */}
      {showMesaModal && (
        <div className="modal-overlay" onClick={() => setShowMesaModal(false)}>
          <div className="modal-content p-6 max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-cafe-800 mb-6">
              {mesaEditData ? `Editar Mesa ${mesaEditData.numero}` : 'Nueva Mesa'}
            </h3>

            <form onSubmit={handleSubmitMesa} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Número *</label>
                  <input
                    type="number"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    className="input"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="label">Capacidad *</label>
                  <select
                    value={formData.capacidad}
                    onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
                    className="input"
                  >
                    {CAPACIDADES.map((cap) => (
                      <option key={cap} value={cap}>{cap} personas</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Zona</label>
                <select
                  value={formData.zona}
                  onChange={(e) => setFormData({ ...formData, zona: e.target.value })}
                  className="input"
                >
                  {ZONAS.map((zona) => (
                    <option key={zona} value={zona}>{zona}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Forma</label>
                <div className="flex gap-2">
                  {FORMAS.map(({ value, label, icon: Icon }) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setFormData({ ...formData, forma: value })}
                      className={clsx(
                        'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border-2 transition-colors',
                        formData.forma === value
                          ? 'border-oliva-400 bg-oliva-50 text-oliva-700'
                          : 'border-beige-200 bg-white text-cafe-600 hover:bg-beige-50'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMesaModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {mesaEditData ? 'Actualizar' : 'Crear Mesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
