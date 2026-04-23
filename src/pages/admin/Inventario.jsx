import { useEffect, useState, useRef } from 'react';
import { useInventarioStore } from '@store/inventarioStore';
import { formatCurrency, formatDate } from '@utils/format';
import {
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiPackage, FiTruck,
  FiClipboard, FiAlertTriangle, FiEye, FiXCircle, FiCheckCircle,
  FiBell, FiChevronDown, FiChevronUp, FiPrinter, FiCalendar, FiExternalLink,
  FiTrendingUp, FiTrendingDown, FiBarChart2, FiDollarSign, FiActivity
} from 'react-icons/fi';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'ingredientes', label: 'Ingredientes', icon: FiPackage },
  { id: 'ingresos', label: 'Ingresos', icon: FiTruck },
  { id: 'uso', label: 'Uso Diario', icon: FiClipboard },
  { id: 'uso-rango', label: 'Uso por Rango', icon: FiBarChart2 },
  { id: 'alertas', label: 'Alertas', icon: FiBell },
];

const UNIDADES = ['kg', 'g', 'litros', 'ml', 'unidades', 'docena', 'libra', 'onza', 'taza', 'sobre', 'bolsa', 'caja', 'lata', 'botella'];

// Generar codigo automático: PRIMERA_PALABRA + FECHA + HORA
function generarCodigoAutomatico(nombre) {
  const now = new Date();
  const primeraPalabra = (nombre || 'ING').trim().split(/\s+/)[0].toUpperCase().substring(0, 6);
  const fecha = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getFullYear()).slice(-2)}`;
  const hora = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  return `${primeraPalabra}-${fecha}-${hora}`;
}

export default function AdminInventario() {
  const [tabActiva, setTabActiva] = useState('ingredientes');
  const { alertasNoLeidas, fetchAlertasNoLeidas } = useInventarioStore();

  useEffect(() => {
    fetchAlertasNoLeidas();
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-cafe-800">Inventario</h2>
          <p className="text-cafe-500">Control de ingredientes y stock</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-beige-200 p-1 rounded-button mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTabActiva(tab.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-3 rounded-button text-sm font-medium transition-colors whitespace-nowrap',
              tabActiva === tab.id
                ? 'bg-white text-cafe-800 shadow-sm'
                : 'text-cafe-500 hover:text-cafe-700'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.id === 'alertas' && alertasNoLeidas > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {alertasNoLeidas}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenido de la tab */}
      {tabActiva === 'ingredientes' && <TabIngredientes />}
      {tabActiva === 'ingresos' && <TabIngresos />}
      {tabActiva === 'uso' && <TabUsoDiario />}
      {tabActiva === 'uso-rango' && <TabUsoRango />}
      {tabActiva === 'alertas' && <TabAlertas />}
    </div>
  );
}

// ==========================================
// TAB: INGREDIENTES
// ==========================================
function TabIngredientes() {
  const {
    ingredientes, categorias, fetchIngredientes, fetchCategorias,
    crearIngrediente, actualizarIngrediente, eliminarIngrediente, isLoading,
  } = useInventarioStore();

  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '', descripcion: '', codigo: '', categoria: 'General',
    unidad_medida: 'kg', stock_actual: '', stock_minimo: '',
    costo_unitario: '', proveedor: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchIngredientes();
    fetchCategorias();
  }, []);

  const ingredientesFiltrados = ingredientes.filter((ing) => {
    const matchBusqueda = ing.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchCategoria = !filtroCategoria || ing.categoria === filtroCategoria;
    return matchBusqueda && matchCategoria;
  });

  const handleNuevo = () => {
    setEditando(null);
    setFormData({ nombre: '', descripcion: '', codigo: '', categoria: 'General', unidad_medida: 'kg', stock_actual: '', stock_minimo: '', costo_unitario: '', proveedor: '' });
    setShowModal(true);
  };

  const handleEditar = (ing) => {
    setEditando(ing);
    setFormData({
      nombre: ing.nombre, descripcion: ing.descripcion || '', codigo: ing.codigo || '',
      categoria: ing.categoria || 'General', unidad_medida: ing.unidad_medida || 'kg',
      stock_actual: ing.stock_actual?.toString() || '0', stock_minimo: ing.stock_minimo?.toString() || '0',
      costo_unitario: ing.costo_unitario?.toString() || '0', proveedor: ing.proveedor || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre) { toast.error('Nombre es requerido'); return; }
    setIsSubmitting(true);

    // Auto-generar código si es nuevo y no tiene código
    let codigoFinal = formData.codigo;
    if (!editando && !codigoFinal) {
      codigoFinal = generarCodigoAutomatico(formData.nombre);
    }

    const data = {
      ...formData,
      codigo: codigoFinal,
      stock_actual: parseFloat(formData.stock_actual) || 0,
      stock_minimo: parseFloat(formData.stock_minimo) || 0,
      costo_unitario: parseFloat(formData.costo_unitario) || 0,
    };

    const result = editando
      ? await actualizarIngrediente(editando.id, data)
      : await crearIngrediente(data);

    if (result.success) {
      toast.success(editando ? 'Ingrediente actualizado' : 'Ingrediente creado');
      setShowModal(false);
      fetchIngredientes();
    } else {
      toast.error(result.message);
    }
    setIsSubmitting(false);
  };

  const handleEliminar = async (ing) => {
    if (!confirm(`¿Eliminar "${ing.nombre}"?`)) return;
    const result = await eliminarIngrediente(ing.id);
    if (result.success) toast.success('Ingrediente eliminado');
    else toast.error(result.message);
  };

  const getStockClass = (ing) => {
    if (ing.stock_minimo > 0 && parseFloat(ing.stock_actual) <= parseFloat(ing.stock_minimo)) {
      return 'text-red-600 font-bold';
    }
    if (ing.stock_minimo > 0 && parseFloat(ing.stock_actual) <= parseFloat(ing.stock_minimo) * 1.5) {
      return 'text-amber-600 font-semibold';
    }
    return 'text-green-600';
  };

  return (
    <>
      {/* Barra de acciones */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-xs">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-cafe-400" />
          <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar ingrediente..." className="input pl-10" />
        </div>
        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="input max-w-xs">
          <option value="">Todas las categorías</option>
          {categorias.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
        </select>
        <button onClick={handleNuevo} className="btn-primary flex items-center gap-2">
          <FiPlus className="w-5 h-5" /> Nuevo Ingrediente
        </button>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="spinner" /></div>
        ) : ingredientesFiltrados.length === 0 ? (
          <div className="text-center py-12"><p className="text-cafe-500">No hay ingredientes</p></div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Ingrediente</th>
                <th>Categoría</th>
                <th>Stock</th>
                <th>Mínimo</th>
                <th>Costo Unit.</th>
                <th>Proveedor</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ingredientesFiltrados.map((ing) => (
                <tr key={ing.id}>
                  <td>
                    <div>
                      <p className="font-medium text-cafe-800">{ing.nombre}</p>
                      {ing.codigo && <p className="text-xs text-cafe-400">{ing.codigo}</p>}
                    </div>
                  </td>
                  <td><span className="px-2 py-1 bg-beige-200 rounded text-sm">{ing.categoria}</span></td>
                  <td>
                    <span className={getStockClass(ing)}>
                      {parseFloat(ing.stock_actual).toFixed(2)} {ing.unidad_medida}
                    </span>
                    {ing.stock_minimo > 0 && parseFloat(ing.stock_actual) <= parseFloat(ing.stock_minimo) && (
                      <FiAlertTriangle className="inline w-4 h-4 text-red-500 ml-1" />
                    )}
                  </td>
                  <td>{parseFloat(ing.stock_minimo).toFixed(2)} {ing.unidad_medida}</td>
                  <td>{formatCurrency(parseFloat(ing.costo_unitario))}</td>
                  <td className="text-sm text-cafe-500">{ing.proveedor || '-'}</td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEditar(ing)}
                        className="p-2 bg-beige-200 rounded-button hover:bg-beige-300" title="Editar">
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEliminar(ing)}
                        className="p-2 bg-terracota-100 text-terracota-600 rounded-button hover:bg-terracota-200" title="Eliminar">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Ingrediente */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content p-6 max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-cafe-800 mb-6">
              {editando ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Nombre *</label>
                  <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="input" required />
                </div>
                <div>
                  <label className="label">Código {!editando && <span className="text-xs text-cafe-400">(auto-generado)</span>}</label>
                  <input type="text"
                    value={editando ? formData.codigo : (formData.nombre ? generarCodigoAutomatico(formData.nombre) : '')}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    className="input bg-beige-50" placeholder="Se genera automáticamente"
                    readOnly={!editando} />
                </div>
                <div>
                  <label className="label">Categoría</label>
                  <input type="text" value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} className="input" list="categorias-list" />
                  <datalist id="categorias-list">
                    {categorias.map((cat) => (<option key={cat} value={cat} />))}
                  </datalist>
                </div>
                <div>
                  <label className="label">Unidad de Medida</label>
                  <select value={formData.unidad_medida} onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })} className="input">
                    {UNIDADES.map((u) => (<option key={u} value={u}>{u}</option>))}
                  </select>
                </div>
                <div>
                  <label className="label">Stock Actual</label>
                  <input type="number" step="0.001" value={formData.stock_actual} onChange={(e) => setFormData({ ...formData, stock_actual: e.target.value })} className="input" min="0" />
                </div>
                <div>
                  <label className="label">Stock Mínimo</label>
                  <input type="number" step="0.001" value={formData.stock_minimo} onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })} className="input" min="0" />
                </div>
                <div>
                  <label className="label">Costo Unitario</label>
                  <input type="number" step="0.01" value={formData.costo_unitario} onChange={(e) => setFormData({ ...formData, costo_unitario: e.target.value })} className="input" min="0" />
                </div>
                <div className="col-span-2">
                  <label className="label">Proveedor</label>
                  <input type="text" value={formData.proveedor} onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })} className="input" />
                </div>
                <div className="col-span-2">
                  <label className="label">Descripción</label>
                  <textarea value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} className="input resize-none" rows={2} />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ==========================================
// TAB: INGRESOS
// ==========================================
function TabIngresos() {
  const {
    ingresos, ingredientes, ingresoDetalle, fetchIngresos, fetchIngredientes,
    fetchIngresoDetalle, crearIngreso, anularIngreso, clearIngresoDetalle, isLoading,
  } = useInventarioStore();

  const [showModal, setShowModal] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [formData, setFormData] = useState({ proveedor: '', notas: '', items: [{ ingrediente_id: '', cantidad: '', costo_unitario: '' }] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const printRef = useRef(null);

  useEffect(() => {
    fetchIngresos();
    fetchIngredientes();
  }, []);

  const handleBuscar = () => {
    fetchIngresos({ fecha_desde: fechaDesde || undefined, fecha_hasta: fechaHasta || undefined });
  };

  const addItem = () => {
    setFormData({ ...formData, items: [...formData.items, { ingrediente_id: '', cantidad: '', costo_unitario: '' }] });
  };

  const removeItem = (index) => {
    if (formData.items.length <= 1) return;
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const calcularTotal = () => {
    return formData.items.reduce((sum, item) => {
      return sum + (parseFloat(item.cantidad) || 0) * (parseFloat(item.costo_unitario) || 0);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const itemsValidos = formData.items.filter(i => i.ingrediente_id && parseFloat(i.cantidad) > 0);
    if (itemsValidos.length === 0) { toast.error('Agregue al menos un item válido'); return; }
    setIsSubmitting(true);

    const data = {
      proveedor: formData.proveedor,
      notas: formData.notas,
      items: itemsValidos.map(i => ({
        ingrediente_id: parseInt(i.ingrediente_id),
        cantidad: parseFloat(i.cantidad),
        costo_unitario: parseFloat(i.costo_unitario) || 0,
      })),
    };

    const result = await crearIngreso(data);
    if (result.success) {
      toast.success(`Ingreso ${result.data.numero_orden} creado`);
      setShowModal(false);
      setFormData({ proveedor: '', notas: '', items: [{ ingrediente_id: '', cantidad: '', costo_unitario: '' }] });
      fetchIngresos();
      fetchIngredientes();
      // Abrir automáticamente el documento de ingreso generado
      await fetchIngresoDetalle(result.data.id);
      setShowDetalle(true);
    } else {
      toast.error(result.message);
    }
    setIsSubmitting(false);
  };

  const handleVerDetalle = async (ingreso) => {
    await fetchIngresoDetalle(ingreso.id);
    setShowDetalle(true);
  };

  const handleAnular = async (ingreso) => {
    if (!confirm(`¿Anular orden ${ingreso.numero_orden}? Se revertirá el stock.`)) return;
    const result = await anularIngreso(ingreso.id);
    if (result.success) { toast.success('Ingreso anulado'); fetchIngredientes(); }
    else toast.error(result.message);
  };

  // Abrir documento como recibo en nueva pestaña permanente
  const handleGenerarRecibo = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Recibo de Ingreso - ${ingresoDetalle?.numero_orden || ''}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f2f0ec; color: #333; }
    .toolbar { background: #4E342E; color: #fff; padding: 10px 24px; display: flex; align-items: center; gap: 16px; position: sticky; top: 0; z-index: 10; }
    .toolbar span { font-size: 14px; font-weight: bold; flex: 1; }
    .btn-print { background: #fff; color: #4E342E; border: none; padding: 8px 22px; border-radius: 20px; font-size: 13px; font-weight: bold; cursor: pointer; }
    .btn-print:hover { background: #f5f0eb; }
    .page { max-width: 820px; margin: 30px auto; background: #fff; padding: 36px 44px; border-radius: 6px; box-shadow: 0 2px 14px rgba(0,0,0,0.10); }
    .doc-header { text-align: center; border-bottom: 2px solid #4E342E; padding-bottom: 12px; margin-bottom: 16px; }
    .doc-header h1 { font-size: 20px; margin: 0; color: #4E342E; }
    .doc-header h2 { font-size: 13px; font-weight: normal; margin: 4px 0 0 0; color: #888; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; font-size: 13px; border: 1px solid #ddd; padding: 12px; border-radius: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th { background: #f5f5f5; text-align: left; padding: 8px; border: 1px solid #ddd; font-size: 12px; }
    td { padding: 8px; border: 1px solid #ddd; font-size: 12px; }
    .estado { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: bold; }
    .estado-completado { background: #d1fae5; color: #065f46; }
    .estado-anulado { background: #fee2e2; color: #991b1b; }
    @media print { .toolbar { display: none; } body { background: #fff; } .page { box-shadow: none; margin: 0; border-radius: 0; } }
  </style>
</head>
<body>
  <div class="toolbar">
    <span>Recibo de Ingreso &mdash; ${ingresoDetalle?.numero_orden || ''}</span>
    <button class="btn-print" onclick="window.print()">Imprimir</button>
  </div>
  <div class="page">${printContent}</div>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  // Imprimir solo el documento de ingreso (ventana nueva, sin duplicado)
  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`
      <html>
      <head>
        <title>Documento de Ingreso - ${ingresoDetalle?.numero_orden || ''}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .doc-header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
          .doc-header h1 { font-size: 20px; margin: 0; }
          .doc-header h2 { font-size: 14px; font-weight: normal; margin: 4px 0 0 0; color: #666; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 15px; font-size: 13px; border: 1px solid #ddd; padding: 12px; border-radius: 4px; }
          .info-label { color: #666; }
          .info-value { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th { background: #f5f5f5; text-align: left; padding: 8px; border: 1px solid #ddd; font-size: 12px; }
          td { padding: 8px; border: 1px solid #ddd; font-size: 12px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .total-row { font-weight: bold; font-size: 14px; background: #f0f0f0; }
          .notas { margin-top: 10px; padding: 8px; background: #fafafa; border: 1px solid #eee; border-radius: 4px; font-size: 12px; }
          .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #ddd; padding-top: 10px; }
          .firma-section { display: flex; justify-content: space-between; margin-top: 50px; }
          .firma-line { text-align: center; width: 200px; }
          .firma-line .line { border-top: 1px solid #333; margin-bottom: 5px; }
          .firma-line span { font-size: 11px; color: #666; }
          .estado { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: bold; }
          .estado-completado { background: #d1fae5; color: #065f46; }
          .estado-anulado { background: #fee2e2; color: #991b1b; }
        </style>
      </head>
      <body>
        ${printContent}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <>
      {/* Filtros y acciones */}
      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div>
          <label className="label text-xs">Desde</label>
          <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label text-xs">Hasta</label>
          <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="input" />
        </div>
        <button onClick={handleBuscar} className="btn-secondary flex items-center gap-2">
          <FiSearch className="w-4 h-4" /> Buscar
        </button>
        <div className="flex-1" />
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <FiPlus className="w-5 h-5" /> Nueva Orden de Ingreso
        </button>
      </div>

      {/* Tabla ingresos */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="spinner" /></div>
        ) : ingresos.length === 0 ? (
          <div className="text-center py-12"><p className="text-cafe-500">No hay ingresos registrados</p></div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>N° Orden</th>
                <th>Fecha</th>
                <th>Proveedor</th>
                <th>Total</th>
                <th>Registrado por</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ingresos.map((ing) => (
                <tr key={ing.id} className={ing.estado === 'anulado' ? 'opacity-50' : ''}>
                  <td className="font-mono font-medium text-cafe-800">{ing.numero_orden}</td>
                  <td>{formatDate(ing.created_at, 'datetime')}</td>
                  <td>{ing.proveedor || '-'}</td>
                  <td className="font-semibold">{formatCurrency(parseFloat(ing.total))}</td>
                  <td className="text-sm">{ing.usuario_nombre} {ing.usuario_apellido}</td>
                  <td>
                    <span className={clsx('px-2 py-1 rounded text-xs font-medium',
                      ing.estado === 'completado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    )}>
                      {ing.estado === 'completado' ? 'Completado' : 'Anulado'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleVerDetalle(ing)}
                        className="p-2 bg-beige-200 rounded-button hover:bg-beige-300" title="Ver documento">
                        <FiEye className="w-4 h-4" />
                      </button>
                      {ing.estado === 'completado' && (
                        <button onClick={() => handleAnular(ing)}
                          className="p-2 bg-terracota-100 text-terracota-600 rounded-button hover:bg-terracota-200" title="Anular">
                          <FiXCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Nueva Orden de Ingreso */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content p-6 max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-cafe-800 mb-6">Nueva Orden de Ingreso</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Proveedor</label>
                  <input type="text" value={formData.proveedor} onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })} className="input" />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="label mb-0">Items *</label>
                  <button type="button" onClick={addItem} className="text-sm text-oliva-600 hover:text-oliva-700 flex items-center gap-1">
                    <FiPlus className="w-4 h-4" /> Agregar item
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 bg-beige-50 p-3 rounded-button">
                      <select value={item.ingrediente_id} onChange={(e) => updateItem(index, 'ingrediente_id', e.target.value)}
                        className="input flex-[2]">
                        <option value="">Seleccionar ingrediente</option>
                        {ingredientes.map((ing) => (<option key={ing.id} value={ing.id}>{ing.nombre} ({ing.unidad_medida})</option>))}
                      </select>
                      <input type="number" step="0.001" min="0" value={item.cantidad} onChange={(e) => updateItem(index, 'cantidad', e.target.value)}
                        placeholder="Cantidad" className="input flex-1" />
                      <input type="number" step="0.01" min="0" value={item.costo_unitario} onChange={(e) => updateItem(index, 'costo_unitario', e.target.value)}
                        placeholder="Costo unit." className="input flex-1" />
                      <span className="text-sm text-cafe-500 w-20 text-right">
                        {formatCurrency((parseFloat(item.cantidad) || 0) * (parseFloat(item.costo_unitario) || 0))}
                      </span>
                      {formData.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(index)} className="p-1 text-red-500 hover:text-red-700">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-right mt-3 text-lg font-bold text-cafe-800">
                  Total: {formatCurrency(calcularTotal())}
                </div>
              </div>

              <div>
                <label className="label">Notas</label>
                <textarea value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} className="input resize-none" rows={2} />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                  {isSubmitting ? 'Registrando...' : 'Registrar Ingreso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Documento de Ingreso (Imprimible) */}
      {showDetalle && ingresoDetalle && (
        <div className="modal-overlay" onClick={() => { setShowDetalle(false); clearIngresoDetalle(); }}>
          <div className="modal-content p-6 max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-cafe-800">Documento de Ingreso</h3>
              <div className="flex items-center gap-2">
                <button onClick={handleGenerarRecibo} className="btn-secondary flex items-center gap-2 text-sm">
                  <FiExternalLink className="w-4 h-4" /> Generar Recibo
                </button>
                <button onClick={handlePrint} className="btn-primary flex items-center gap-2 text-sm">
                  <FiPrinter className="w-4 h-4" /> Imprimir
                </button>
              </div>
            </div>

            {/* Contenido imprimible (solo se imprime esto) */}
            <div ref={printRef}>
              <div className="doc-header" style={{ textAlign: 'center', borderBottom: '2px solid #4E342E', paddingBottom: '10px', marginBottom: '15px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>DOCUMENTO DE INGRESO DE INVENTARIO</h1>
                <h2 style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0', fontWeight: 'normal' }}>Restaurant POS - Control de Stock</h2>
              </div>

              <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', border: '1px solid #ddd', padding: '12px', borderRadius: '4px', marginBottom: '15px', fontSize: '13px' }}>
                <div><span style={{ color: '#666' }}>N° Documento:</span> <strong>{ingresoDetalle.numero_orden}</strong></div>
                <div><span style={{ color: '#666' }}>Fecha de Ingreso:</span> <span>{formatDate(ingresoDetalle.created_at, 'datetime')}</span></div>
                <div><span style={{ color: '#666' }}>Proveedor:</span> <span>{ingresoDetalle.proveedor || 'No especificado'}</span></div>
                <div><span style={{ color: '#666' }}>Registrado por:</span> <span>{ingresoDetalle.usuario_nombre} {ingresoDetalle.usuario_apellido}</span></div>
                <div>
                  <span style={{ color: '#666' }}>Estado:</span>{' '}
                  <span className={clsx('estado', ingresoDetalle.estado === 'completado' ? 'estado-completado' : 'estado-anulado')}
                    style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold',
                      background: ingresoDetalle.estado === 'completado' ? '#d1fae5' : '#fee2e2',
                      color: ingresoDetalle.estado === 'completado' ? '#065f46' : '#991b1b' }}>
                    {ingresoDetalle.estado === 'completado' ? 'COMPLETADO' : 'ANULADO'}
                  </span>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', margin: '15px 0' }}>
                <thead>
                  <tr>
                    <th style={{ background: '#f5f5f5', textAlign: 'center', padding: '8px', border: '1px solid #ddd', fontSize: '12px', width: '40px' }}>#</th>
                    <th style={{ background: '#f5f5f5', textAlign: 'left', padding: '8px', border: '1px solid #ddd', fontSize: '12px' }}>Ingrediente</th>
                    <th style={{ background: '#f5f5f5', textAlign: 'right', padding: '8px', border: '1px solid #ddd', fontSize: '12px' }}>Cantidad</th>
                    <th style={{ background: '#f5f5f5', textAlign: 'right', padding: '8px', border: '1px solid #ddd', fontSize: '12px' }}>Costo Unit.</th>
                    <th style={{ background: '#f5f5f5', textAlign: 'right', padding: '8px', border: '1px solid #ddd', fontSize: '12px' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {ingresoDetalle.detalle?.map((d, idx) => (
                    <tr key={d.id}>
                      <td style={{ padding: '8px', border: '1px solid #ddd', fontSize: '12px', textAlign: 'center', color: '#999' }}>{idx + 1}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd', fontSize: '12px', fontWeight: '500' }}>{d.ingrediente_nombre}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd', fontSize: '12px', textAlign: 'right' }}>{parseFloat(d.cantidad).toFixed(3)} {d.unidad_medida}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd', fontSize: '12px', textAlign: 'right' }}>{formatCurrency(parseFloat(d.costo_unitario))}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd', fontSize: '12px', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(parseFloat(d.subtotal))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="4" style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold', fontSize: '14px', background: '#f0f0f0' }}>TOTAL:</td>
                    <td style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold', fontSize: '14px', background: '#f0f0f0' }}>{formatCurrency(parseFloat(ingresoDetalle.total))}</td>
                  </tr>
                </tfoot>
              </table>

              {ingresoDetalle.notas && (
                <div style={{ marginTop: '10px', padding: '8px', background: '#fafafa', border: '1px solid #eee', borderRadius: '4px' }}>
                  <span style={{ color: '#666', fontSize: '12px', fontWeight: '600' }}>Observaciones:</span>
                  <p style={{ fontSize: '12px', marginTop: '4px' }}>{ingresoDetalle.notas}</p>
                </div>
              )}

              {/* Sección de firmas */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px' }}>
                <div style={{ textAlign: 'center', width: '200px' }}>
                  <div style={{ borderTop: '1px solid #333', marginBottom: '5px' }}></div>
                  <span style={{ fontSize: '11px', color: '#666' }}>Recibido por</span>
                </div>
                <div style={{ textAlign: 'center', width: '200px' }}>
                  <div style={{ borderTop: '1px solid #333', marginBottom: '5px' }}></div>
                  <span style={{ fontSize: '11px', color: '#666' }}>Autorizado por</span>
                </div>
              </div>

              <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '10px', color: '#999', borderTop: '1px solid #eee', paddingTop: '8px' }}>
                Documento generado automáticamente por Restaurant POS - {new Date().toLocaleString('es-PE')}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button onClick={() => { setShowDetalle(false); clearIngresoDetalle(); }} className="btn-secondary">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ==========================================
// TAB: USO DIARIO
// ==========================================
function TabUsoDiario() {
  const {
    ingredientes, reporteUso, fetchIngredientes, registrarUso, fetchReporteUso, isLoading,
  } = useInventarioStore();

  const hoy = new Date();
  const fechaLocal = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  const [fecha, setFecha] = useState(fechaLocal);
  const [showModalUso, setShowModalUso] = useState(false);
  const [formUso, setFormUso] = useState({ ingrediente_id: '', cantidad_usada: '', notas: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchIngredientes();
    fetchReporteUso();
  }, []);

  const handleBuscarReporte = () => {
    fetchReporteUso(fecha);
  };

  const handleRegistrarUso = async (e) => {
    e.preventDefault();
    if (!formUso.ingrediente_id || !formUso.cantidad_usada) { toast.error('Complete los campos'); return; }

    const ingredienteSeleccionado = ingredientes.find(i => i.id === parseInt(formUso.ingrediente_id));
    if (ingredienteSeleccionado) {
      const stockDisponible = parseFloat(ingredienteSeleccionado.stock_actual);
      const cantidadSolicitada = parseFloat(formUso.cantidad_usada);
      if (cantidadSolicitada > stockDisponible) {
        toast.error(`La cantidad (${cantidadSolicitada}) supera el stock disponible (${stockDisponible.toFixed(3)} ${ingredienteSeleccionado.unidad_medida})`);
        return;
      }
    }

    setIsSubmitting(true);

    const result = await registrarUso({
      ingrediente_id: parseInt(formUso.ingrediente_id),
      cantidad_usada: parseFloat(formUso.cantidad_usada),
      notas: formUso.notas,
    });

    if (result.success) {
      toast.success('Uso registrado');
      setShowModalUso(false);
      setFormUso({ ingrediente_id: '', cantidad_usada: '', notas: '' });
      fetchReporteUso(fecha);
      fetchIngredientes();
    } else {
      toast.error(result.message);
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div>
          <label className="label text-xs">Fecha del Reporte</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="input" />
        </div>
        <button onClick={handleBuscarReporte} className="btn-secondary flex items-center gap-2">
          <FiSearch className="w-4 h-4" /> Ver Reporte
        </button>
        <div className="flex-1" />
        <button onClick={() => setShowModalUso(true)} className="btn-primary flex items-center gap-2">
          <FiPlus className="w-5 h-5" /> Registrar Uso
        </button>
      </div>

      {reporteUso && (
        <>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-cafe-800 mb-3">
              Resumen de Uso - {formatDate(reporteUso.fecha, 'long')}
            </h3>
          </div>

          {reporteUso.resumen.length > 0 ? (
            <div className="card overflow-hidden mb-6">
              <table className="table">
                <thead>
                  <tr>
                    <th>Ingrediente</th>
                    <th>Categoría</th>
                    <th>Total Usado</th>
                    <th>Stock Inicio Día</th>
                    <th>Stock Fin Día</th>
                  </tr>
                </thead>
                <tbody>
                  {reporteUso.resumen.map((r, i) => (
                    <tr key={i}>
                      <td className="font-medium text-cafe-800">{r.nombre}</td>
                      <td><span className="px-2 py-1 bg-beige-200 rounded text-sm">{r.categoria}</span></td>
                      <td className="font-semibold text-terracota-600">{parseFloat(r.total_usado).toFixed(3)} {r.unidad_medida}</td>
                      <td>{parseFloat(r.stock_inicio_dia).toFixed(3)} {r.unidad_medida}</td>
                      <td>{parseFloat(r.stock_fin_dia).toFixed(3)} {r.unidad_medida}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card p-8 text-center mb-6">
              <p className="text-cafe-500">No hay registros de uso para esta fecha</p>
            </div>
          )}

          {reporteUso.movimientos.length > 0 && (
            <>
              <h4 className="text-md font-semibold text-cafe-700 mb-3">Movimientos Detallados</h4>
              <div className="card overflow-hidden">
                <table className="table">
                  <thead>
                    <tr><th>Hora</th><th>Ingrediente</th><th>Cantidad</th><th>Registrado por</th><th>Notas</th></tr>
                  </thead>
                  <tbody>
                    {reporteUso.movimientos.map((m) => (
                      <tr key={m.id}>
                        <td className="text-sm">{new Date(m.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="font-medium">{m.ingrediente_nombre}</td>
                        <td className="text-terracota-600 font-semibold">-{parseFloat(m.cantidad_usada).toFixed(3)} {m.unidad_medida}</td>
                        <td className="text-sm">{m.registrado_por_nombre || '-'}</td>
                        <td className="text-sm text-cafe-500">{m.notas || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {showModalUso && (
        <div className="modal-overlay" onClick={() => setShowModalUso(false)}>
          <div className="modal-content p-6 max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-cafe-800 mb-6">Registrar Uso de Ingrediente</h3>
            <form onSubmit={handleRegistrarUso} className="space-y-4">
              <div>
                <label className="label">Ingrediente *</label>
                <select value={formUso.ingrediente_id} onChange={(e) => setFormUso({ ...formUso, ingrediente_id: e.target.value })} className="input" required>
                  <option value="">Seleccionar...</option>
                  {ingredientes.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.nombre} (Stock: {parseFloat(ing.stock_actual).toFixed(2)} {ing.unidad_medida})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Cantidad Usada *</label>
                <input type="number" step="0.001" min="0.001"
                  max={formUso.ingrediente_id ? parseFloat(ingredientes.find(i => i.id === parseInt(formUso.ingrediente_id))?.stock_actual || 0) : undefined}
                  value={formUso.cantidad_usada}
                  onChange={(e) => setFormUso({ ...formUso, cantidad_usada: e.target.value })} className="input" required />
                {formUso.ingrediente_id && (() => {
                  const sel = ingredientes.find(i => i.id === parseInt(formUso.ingrediente_id));
                  return sel ? (
                    <p className="text-xs text-cafe-500 mt-1">Stock disponible: {parseFloat(sel.stock_actual).toFixed(3)} {sel.unidad_medida}</p>
                  ) : null;
                })()}
              </div>
              <div>
                <label className="label">Notas</label>
                <input type="text" value={formUso.notas} onChange={(e) => setFormUso({ ...formUso, notas: e.target.value })} className="input" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModalUso(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                  {isSubmitting ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ==========================================
// TAB: USO POR RANGO (Semanal / Personalizado)
// ==========================================
function TabUsoRango() {
  const { fetchReporteUsoRango, isLoading } = useInventarioStore();
  const [modo, setModo] = useState('semanal');
  const [reporte, setReporte] = useState(null);

  const hoy = new Date();
  const hace7dias = new Date(hoy);
  hace7dias.setDate(hace7dias.getDate() - 7);
  const hace30dias = new Date(hoy);
  hace30dias.setDate(hace30dias.getDate() - 30);

  const formatLocalDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const [fechaDesde, setFechaDesde] = useState(formatLocalDate(hace7dias));
  const [fechaHasta, setFechaHasta] = useState(formatLocalDate(hoy));

  useEffect(() => {
    handleBuscar();
  }, []);

  const handleModoSemanal = () => {
    setModo('semanal');
    setFechaDesde(formatLocalDate(hace7dias));
    setFechaHasta(formatLocalDate(hoy));
  };

  const handleModoMensual = () => {
    setModo('personalizado');
    setFechaDesde(formatLocalDate(hace30dias));
    setFechaHasta(formatLocalDate(hoy));
  };

  const handleBuscar = async () => {
    const data = await fetchReporteUsoRango(fechaDesde, fechaHasta);
    if (data) setReporte(data);
  };

  const metricas = reporte ? calcularMetricas(reporte) : null;

  return (
    <>
      {/* Controles */}
      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div className="flex gap-1 bg-beige-200 p-1 rounded-button">
          <button onClick={handleModoSemanal}
            className={clsx('px-4 py-2 rounded-button text-sm font-medium transition-colors',
              modo === 'semanal' ? 'bg-white text-cafe-800 shadow-sm' : 'text-cafe-500 hover:text-cafe-700')}>
            Última Semana
          </button>
          <button onClick={handleModoMensual}
            className={clsx('px-4 py-2 rounded-button text-sm font-medium transition-colors',
              modo === 'personalizado' ? 'bg-white text-cafe-800 shadow-sm' : 'text-cafe-500 hover:text-cafe-700')}>
            Último Mes
          </button>
        </div>
        <div>
          <label className="label text-xs">Desde</label>
          <input type="date" value={fechaDesde} onChange={(e) => { setFechaDesde(e.target.value); setModo('personalizado'); }} className="input" />
        </div>
        <div>
          <label className="label text-xs">Hasta</label>
          <input type="date" value={fechaHasta} onChange={(e) => { setFechaHasta(e.target.value); setModo('personalizado'); }} className="input" />
        </div>
        <button onClick={handleBuscar} className="btn-primary flex items-center gap-2">
          <FiSearch className="w-4 h-4" /> Analizar
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      )}

      {!isLoading && metricas && reporte && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-terracota-100 rounded-full">
                  <FiDollarSign className="w-5 h-5 text-terracota-600" />
                </div>
                <div>
                  <p className="text-xs text-cafe-500">Gasto Total Estimado</p>
                  <p className="text-xl font-bold text-cafe-800">{formatCurrency(metricas.gastoTotal)}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-full">
                  <FiActivity className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-cafe-500">Ingredientes Distintos</p>
                  <p className="text-xl font-bold text-cafe-800">{metricas.totalIngredientes}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 rounded-full">
                  <FiCalendar className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-cafe-500">Gasto Promedio/Día</p>
                  <p className="text-xl font-bold text-cafe-800">{formatCurrency(metricas.gastoPorDia)}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-full">
                  <FiTrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-cafe-500">Total Registros</p>
                  <p className="text-xl font-bold text-cafe-800">{metricas.totalRegistros}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Rankings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Top por costo */}
            <div className="card">
              <h4 className="text-md font-bold text-cafe-800 mb-4 flex items-center gap-2">
                <FiTrendingUp className="w-4 h-4 text-terracota-500" />
                Top Ingredientes por Costo
              </h4>
              {metricas.topCostosos.length > 0 ? (
                <div className="space-y-3">
                  {metricas.topCostosos.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className={clsx(
                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white',
                        idx === 0 ? 'bg-terracota-500' : idx === 1 ? 'bg-terracota-400' : 'bg-cafe-400'
                      )}>
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-cafe-800 text-sm truncate">{item.nombre}</p>
                        <p className="text-xs text-cafe-400">{parseFloat(item.total_usado).toFixed(2)} {item.unidad_medida}</p>
                      </div>
                      <span className="font-bold text-terracota-600 text-sm">{formatCurrency(item.costo_estimado)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-cafe-400">Sin datos en este rango</p>
              )}
            </div>

            {/* Top por volumen */}
            <div className="card">
              <h4 className="text-md font-bold text-cafe-800 mb-4 flex items-center gap-2">
                <FiBarChart2 className="w-4 h-4 text-blue-500" />
                Top Ingredientes por Volumen
              </h4>
              {metricas.topVolumen.length > 0 ? (
                <div className="space-y-3">
                  {metricas.topVolumen.map((item, idx) => {
                    const maxVol = parseFloat(metricas.topVolumen[0]?.total_usado || 1);
                    const pct = (parseFloat(item.total_usado) / maxVol) * 100;
                    return (
                      <div key={idx}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium text-cafe-800 truncate">{item.nombre}</span>
                          <span className="text-cafe-500">{parseFloat(item.total_usado).toFixed(2)} {item.unidad_medida}</span>
                        </div>
                        <div className="w-full bg-beige-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-cafe-400">Sin datos en este rango</p>
              )}
            </div>
          </div>

          {/* Distribución por categoría */}
          {metricas.porCategoria.length > 0 && (
            <div className="card mb-6">
              <h4 className="text-md font-bold text-cafe-800 mb-4 flex items-center gap-2">
                <FiPackage className="w-4 h-4 text-oliva-500" />
                Gasto por Categoría
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {metricas.porCategoria.map((cat, idx) => (
                  <div key={idx} className="bg-beige-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-cafe-500 mb-1">{cat.categoria}</p>
                    <p className="text-lg font-bold text-cafe-800">{formatCurrency(cat.costo)}</p>
                    <p className="text-xs text-cafe-400">{cat.porcentaje}% del total</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabla detallada */}
          <div className="card overflow-hidden">
            <h4 className="text-md font-bold text-cafe-800 mb-4">Detalle de Consumo en el Rango</h4>
            {reporte.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Ingrediente</th>
                    <th>Categoría</th>
                    <th className="text-right">Total Usado</th>
                    <th className="text-right">Registros</th>
                    <th className="text-right">Prom./Día</th>
                    <th className="text-right">Costo Est.</th>
                  </tr>
                </thead>
                <tbody>
                  {reporte.map((r, i) => (
                    <tr key={i}>
                      <td className="font-medium text-cafe-800">{r.nombre}</td>
                      <td><span className="px-2 py-1 bg-beige-200 rounded text-xs">{r.categoria}</span></td>
                      <td className="text-right font-semibold text-terracota-600">{parseFloat(r.total_usado).toFixed(3)} {r.unidad_medida}</td>
                      <td className="text-right">{r.registros}</td>
                      <td className="text-right text-sm">{parseFloat(r.promedio_diario || 0).toFixed(3)} {r.unidad_medida}</td>
                      <td className="text-right font-semibold">{formatCurrency(parseFloat(r.costo_estimado || 0))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-bold">
                    <td colSpan="5" className="text-right">TOTAL ESTIMADO:</td>
                    <td className="text-right text-lg">{formatCurrency(metricas.gastoTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <div className="text-center py-8">
                <p className="text-cafe-500">No hay registros de uso en este rango de fechas</p>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

// Calcular métricas del reporte de rango
function calcularMetricas(reporte) {
  if (!reporte || reporte.length === 0) {
    return {
      gastoTotal: 0, totalIngredientes: 0, gastoPorDia: 0, totalRegistros: 0,
      topCostosos: [], topVolumen: [], porCategoria: [],
    };
  }

  const gastoTotal = reporte.reduce((sum, r) => sum + parseFloat(r.costo_estimado || 0), 0);
  const totalIngredientes = reporte.length;
  const totalRegistros = reporte.reduce((sum, r) => sum + parseInt(r.registros || 0), 0);
  const maxDias = Math.max(...reporte.map(r => parseInt(r.dias_uso || 1)), 1);
  const gastoPorDia = gastoTotal / maxDias;

  const topCostosos = [...reporte]
    .sort((a, b) => parseFloat(b.costo_estimado || 0) - parseFloat(a.costo_estimado || 0))
    .slice(0, 5);

  const topVolumen = [...reporte]
    .sort((a, b) => parseFloat(b.total_usado || 0) - parseFloat(a.total_usado || 0))
    .slice(0, 5);

  const catMap = {};
  reporte.forEach(r => {
    const cat = r.categoria || 'Sin categoría';
    if (!catMap[cat]) catMap[cat] = 0;
    catMap[cat] += parseFloat(r.costo_estimado || 0);
  });
  const porCategoria = Object.entries(catMap)
    .map(([categoria, costo]) => ({
      categoria,
      costo,
      porcentaje: gastoTotal > 0 ? Math.round((costo / gastoTotal) * 100) : 0,
    }))
    .sort((a, b) => b.costo - a.costo);

  return { gastoTotal, totalIngredientes, gastoPorDia, totalRegistros, topCostosos, topVolumen, porCategoria };
}

// ==========================================
// TAB: ALERTAS
// ==========================================
function TabAlertas() {
  const {
    alertas, fetchAlertas, marcarAlertaLeida, marcarTodasLeidas, fetchAlertasNoLeidas,
  } = useInventarioStore();

  const [filtro, setFiltro] = useState('todas');

  useEffect(() => {
    fetchAlertas();
  }, []);

  const alertasFiltradas = alertas.filter((a) => {
    if (filtro === 'no-leidas') return !a.leida;
    if (filtro === 'leidas') return a.leida;
    return true;
  });

  const handleMarcarLeida = async (alerta) => {
    await marcarAlertaLeida(alerta.id);
    fetchAlertasNoLeidas();
  };

  const handleMarcarTodas = async () => {
    await marcarTodasLeidas();
    fetchAlertas();
    fetchAlertasNoLeidas();
  };

  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case 'stock_bajo': return { label: 'Stock Bajo', class: 'bg-amber-100 text-amber-700' };
      case 'agotado': return { label: 'Agotado', class: 'bg-red-100 text-red-700' };
      case 'solicitud_cocina': return { label: 'Solicitud Cocina', class: 'bg-blue-100 text-blue-700' };
      default: return { label: tipo, class: 'bg-gray-100 text-gray-700' };
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex gap-1 bg-beige-200 p-1 rounded-button">
          {[
            { id: 'todas', label: 'Todas' },
            { id: 'no-leidas', label: 'No leídas' },
            { id: 'leidas', label: 'Leídas' },
          ].map((f) => (
            <button key={f.id} onClick={() => setFiltro(f.id)}
              className={clsx('px-3 py-2 rounded-button text-sm transition-colors',
                filtro === f.id ? 'bg-white text-cafe-800 shadow-sm' : 'text-cafe-500 hover:text-cafe-700')}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button onClick={handleMarcarTodas} className="btn-secondary flex items-center gap-2 text-sm">
          <FiCheckCircle className="w-4 h-4" /> Marcar todas como leídas
        </button>
      </div>

      <div className="space-y-3">
        {alertasFiltradas.length === 0 ? (
          <div className="card p-8 text-center"><p className="text-cafe-500">No hay alertas</p></div>
        ) : (
          alertasFiltradas.map((alerta) => {
            const tipo = getTipoLabel(alerta.tipo);
            return (
              <div key={alerta.id}
                className={clsx('card p-4 flex items-start gap-4 transition-colors',
                  !alerta.leida && 'border-l-4 border-l-terracota-500 bg-terracota-50')}>
                <div className={clsx('p-2 rounded-full', !alerta.leida ? 'bg-terracota-100' : 'bg-beige-200')}>
                  <FiAlertTriangle className={clsx('w-5 h-5', !alerta.leida ? 'text-terracota-600' : 'text-cafe-400')} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={clsx('px-2 py-0.5 rounded text-xs font-medium', tipo.class)}>{tipo.label}</span>
                    <span className="text-xs text-cafe-400">{formatDate(alerta.created_at, 'datetime')}</span>
                  </div>
                  <p className="text-cafe-800 font-medium">{alerta.ingrediente_nombre}</p>
                  <p className="text-sm text-cafe-600">{alerta.mensaje}</p>
                  {alerta.enviado_por_nombre && (
                    <p className="text-xs text-cafe-400 mt-1">Enviado por: {alerta.enviado_por_nombre}</p>
                  )}
                  <div className="text-xs text-cafe-400 mt-1">
                    Stock actual: {parseFloat(alerta.stock_actual).toFixed(2)} {alerta.unidad_medida}
                    {alerta.stock_minimo > 0 && ` | Mínimo: ${parseFloat(alerta.stock_minimo).toFixed(2)} ${alerta.unidad_medida}`}
                  </div>
                </div>
                {!alerta.leida && (
                  <button onClick={() => handleMarcarLeida(alerta)}
                    className="p-2 bg-beige-200 rounded-button hover:bg-beige-300 flex-shrink-0" title="Marcar como leída">
                    <FiCheckCircle className="w-4 h-4 text-oliva-600" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
