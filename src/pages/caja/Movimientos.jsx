import { useEffect, useState } from 'react';
import { useCajaStore } from '@store/cajaStore';
import { useConfigStore } from '@store/configStore';
import { useAuthStore } from '@store/authStore';
import { formatCurrency } from '@utils/format';
import { handleApiError } from '@utils';
import { FiPlus, FiMinus, FiDollarSign, FiClock, FiFilter, FiPrinter, FiFileText } from 'react-icons/fi';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import api from '@services/api';

export default function CajaMovimientos() {
  const { movimientos, fetchMovimientos, registrarMovimiento, estadoCaja, fetchEstadoCaja, isLoading } = useCajaStore();
  const { config } = useConfigStore();
  const { user } = useAuthStore();
  const isAdmin = user?.rol === 'admin';
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    tipo: 'entrada',
    monto: '',
    descripcion: '',
    categoria: 'otros',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comprobantesMap, setComprobantesMap] = useState({}); // pagoId -> comprobante

  // Función para imprimir ticket de pago
  const handleImprimirTicket = async (movimiento) => {
    // Extraer ID del pedido de la descripción
    const pedidoMatch = movimiento.descripcion.match(/Pago pedido #(\d+)/);
    if (!pedidoMatch) {
      toast.error('No se puede identificar el pedido para este movimiento');
      return;
    }

    const pedidoId = pedidoMatch[1];

    try {
      // Obtener datos del pedido
      const pedidoResponse = await api.get(`/pedidos/${pedidoId}`);
      const pedido = pedidoResponse.data.data;

      // Obtener datos del pago
      const pagoResponse = await api.get(`/pagos/pedido/${pedidoId}`);
      const pago = pagoResponse.data.data?.[0]; // Tomar el primer pago

      if (!pago) {
        toast.error('No se encontraron datos del pago');
        return;
      }

      const fechaActual = new Date().toLocaleString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      const items = pedido.items || [];
      const subtotal = parseFloat(pedido.subtotal || 0);
      const iva = items.reduce((total, item) => {
        const precioConIGV = parseFloat(item.precio || item.subtotal / item.cantidad);
        const precioSinIGV = parseFloat(item.precio_base || 0);
        return total + ((precioConIGV - precioSinIGV) * item.cantidad);
      }, 0);
      const propinaNum = parseFloat(pago.propina || 0);
      const totalConPropina = parseFloat(pago.monto_total || 0);
      const porcentajeIVA = config.iva || 18;

      const ticketHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Ticket #${pedido.numero_pedido || pedido.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              width: 280px;
              padding: 10px;
              margin: 0 auto;
            }
            .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .header h1 { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            .header p { font-size: 10px; }
            .info { margin: 10px 0; font-size: 11px; }
            .info-row { display: flex; justify-content: space-between; margin: 3px 0; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .items { margin: 10px 0; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; font-size: 11px; }
            .item-name { flex: 1; }
            .item-qty { width: 30px; text-align: center; }
            .item-price { width: 60px; text-align: right; }
            .totals { margin-top: 10px; }
            .total-row { display: flex; justify-content: space-between; margin: 3px 0; }
            .total-row.grand { font-size: 14px; font-weight: bold; margin-top: 5px; }
            .footer { text-align: center; margin-top: 15px; font-size: 10px; border-top: 1px dashed #000; padding-top: 10px; }
            @media print {
              body { width: 72mm; }
              @page { margin: 0; size: 72mm auto; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${config.nombreRestaurante || '🍽️ RESTAURANTE'}</h1>
            ${config.direccion ? `<p>${config.direccion}</p>` : ''}
            ${config.telefono ? `<p>Tel: ${config.telefono}</p>` : ''}
            ${config.rfc ? `<p>${config.rfc}</p>` : ''}
            <p>Sistema POS</p>
            <p>${fechaActual}</p>
          </div>

          <div class="info">
            <div class="info-row"><span>Ticket:</span><span>#${pedido.numero_pedido || pedido.id}</span></div>
            <div class="info-row"><span>Tipo:</span><span>${pedido.tipo === 'domicilio' ? 'DELIVERY' : 'MESA'}</span></div>
            <div class="info-row"><span>Mesa:</span><span>${pedido.mesa_numero || 'N/A'}</span></div>
            <div class="info-row"><span>Mesero:</span><span>${pedido.mesero_nombre || 'N/A'}</span></div>
            <div class="info-row"><span>Método:</span><span>${pago.metodo_pago?.toUpperCase()}</span></div>
          </div>

          <div class="divider"></div>

          <div class="items">
            <div class="item" style="font-weight: bold;">
              <span class="item-name">PRODUCTO</span>
              <span class="item-qty">CANT</span>
              <span class="item-price">PRECIO</span>
            </div>
            ${items.map(item => {
              const precioUnitario = parseFloat(item.precio || item.subtotal / item.cantidad);
              const precioSinIGV = parseFloat(item.precio_base || 0);
              return `
                <div class="item">
                  <span class="item-name">${item.producto_nombre || item.nombre}</span>
                  <span class="item-qty">${item.cantidad}</span>
                  <span class="item-price">${formatCurrency(precioUnitario)}<br><small style="color: #666; font-size: 9px;">(${formatCurrency(precioSinIGV)} sin IGV)</small></span>
                </div>
              `;
            }).join('')}
          </div>

          <div class="divider"></div>

          <div class="totals">
            <div class="total-row"><span>Subtotal:</span><span>${formatCurrency(subtotal)}</span></div>
            <div class="total-row"><span>IVA (${porcentajeIVA}%):</span><span>${formatCurrency(iva)}</span></div>
            ${propinaNum > 0 ? `<div class="total-row"><span>Propina:</span><span>${formatCurrency(propinaNum)}</span></div>` : ''}
            <div class="total-row grand"><span>TOTAL:</span><span>${formatCurrency(totalConPropina)}</span></div>
            ${pago.metodo_pago === 'efectivo' && pago.monto_efectivo > 0 ? `
              <div class="total-row"><span>Pagado:</span><span>${formatCurrency(pago.monto_efectivo)}</span></div>
              <div class="total-row" style="font-weight: bold;"><span>Cambio:</span><span>${formatCurrency(pago.cambio || 0)}</span></div>
            ` : ''}
          </div>

          <div class="footer">
            <p>¡Gracias por su visita!</p>
            <p>Vuelva pronto</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank', 'width=320,height=600');
      if (printWindow) {
        printWindow.document.write(ticketHTML);
        printWindow.document.close();
        toast.success('Ticket generado');
      } else {
        toast.error('No se pudo abrir la ventana de impresión. Verifique los popups.');
      }
    } catch (error) {
      console.error('Error al generar ticket:', error);
      handleApiError(error);
    }
  };

  // Verificar si un movimiento es un pago
  const esMovimientoPago = (movimiento) => {
    return movimiento.tipo === 'ingreso' && movimiento.descripcion?.includes('Pago pedido');
  };

  // Extraer pedidoId de la descripción del movimiento
  const getPedidoIdFromMov = (movimiento) => {
    const match = movimiento.descripcion?.match(/Pago pedido #(\d+)/);
    return match ? parseInt(match[1]) : null;
  };

  // Obtener comprobante asociado a un movimiento de pago (por pedido_id)
  const getComprobante = (movimiento) => {
    const pedidoId = getPedidoIdFromMov(movimiento);
    return pedidoId ? comprobantesMap[pedidoId] : null;
  };

  useEffect(() => {
    fetchEstadoCaja();
    fetchMovimientos();
  }, []);

  // Cargar comprobantes asociados a pagos
  useEffect(() => {
    const loadComprobantes = async () => {
      try {
        const facturacionActiva = config.facturacionActiva === true || config.facturacionActiva === 'true';
        if (!facturacionActiva) return;
        
        const res = await api.get('/facturacion', { params: { limit: 200 } });
        if (res.data?.data) {
          const map = {};
          for (const comp of res.data.data) {
            if (comp.pedido_id) map[comp.pedido_id] = comp;
          }
          setComprobantesMap(map);
        }
      } catch (err) {
        // Silenciosamente - facturación puede no estar activa
      }
    };
    loadComprobantes();
  }, [movimientos, config.facturacionActiva]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      toast.error('Ingrese un monto válido');
      return;
    }

    if (!formData.descripcion.trim()) {
      toast.error('Ingrese una descripción');
      return;
    }

    setIsSubmitting(true);

    const result = await registrarMovimiento(
      formData.tipo,
      parseFloat(formData.monto),
      formData.descripcion,
      formData.categoria
    );

    if (result.success) {
      toast.success('Movimiento registrado');
      setShowModal(false);
      setFormData({ tipo: 'entrada', monto: '', descripcion: '', categoria: 'otros' });
      fetchMovimientos();
    } else {
      toast.error(result.message);
    }

    setIsSubmitting(false);
  };

  const movimientosFiltrados = movimientos.filter((mov) => {
    if (filtroTipo === 'todos') return true;
    if (filtroTipo === 'entrada') return ['entrada', 'apertura', 'ingreso', 'deposito'].includes(mov.tipo);
    if (filtroTipo === 'salida') return ['egreso', 'retiro', 'cierre'].includes(mov.tipo);
    return mov.tipo === filtroTipo;
  });

  const totales = {
    entradas: movimientos
      .filter((m) => ['entrada', 'apertura', 'ingreso', 'deposito'].includes(m.tipo))
      .reduce((sum, m) => sum + parseFloat(m.monto), 0),
    salidas: movimientos
      .filter((m) => ['egreso', 'retiro', 'cierre'].includes(m.tipo))
      .reduce((sum, m) => sum + parseFloat(m.monto), 0),
  };

  const categorias = [
    { value: 'venta', label: 'Venta' },
    { value: 'propina', label: 'Propina' },
    { value: 'gasto', label: 'Gasto' },
    { value: 'retiro', label: 'Retiro' },
    { value: 'fondo', label: 'Fondo' },
    { value: 'otros', label: 'Otros' },
  ];

  if (!estadoCaja && !isAdmin) {
    return (
      <div className="card text-center py-12">
        <h2 className="text-xl font-bold text-cafe-800 mb-2">Caja Cerrada</h2>
        <p className="text-cafe-500">Debe abrir la caja para ver movimientos</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-cafe-800">Movimientos de Caja</h2>
          <p className="text-cafe-500">Registro de entradas y salidas</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus className="w-5 h-5" />
          Nuevo Movimiento
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card bg-green-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <FiPlus className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600">Entradas</p>
              <p className="text-xl font-bold text-green-700">
                {formatCurrency(totales.entradas)}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-red-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <FiMinus className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-red-600">Salidas</p>
              <p className="text-xl font-bold text-red-700">
                {formatCurrency(totales.salidas)}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-oliva-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-oliva-100 rounded-full flex items-center justify-center">
              <FiDollarSign className="w-5 h-5 text-oliva-600" />
            </div>
            <div>
              <p className="text-sm text-oliva-600">Saldo Actual</p>
              <p className="text-xl font-bold text-oliva-700">
                ${estadoCaja?.saldoActual?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2 bg-beige-200 p-1 rounded-button">
          {[
            { value: 'todos', label: 'Todos' },
            { value: 'entrada', label: 'Entradas' },
            { value: 'salida', label: 'Salidas' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFiltroTipo(option.value)}
              className={clsx(
                'px-4 py-2 rounded-button text-sm font-medium transition-colors',
                filtroTipo === option.value
                  ? 'bg-oliva-400 text-white'
                  : 'text-cafe-600 hover:bg-beige-300'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de movimientos */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : movimientosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-cafe-500">No hay movimientos registrados</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Tipo</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Comprobante</th>
                <th className="text-right">Monto</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {movimientosFiltrados.map((mov) => {
                const comprobante = esMovimientoPago(mov) ? getComprobante(mov) : null;
                return (
                <tr key={mov.id}>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FiClock className="w-4 h-4 text-cafe-400" />
                      {mov.created_at &&
                        format(new Date(mov.created_at), 'HH:mm', { locale: es })}
                    </div>
                  </td>
                  <td>
                    <span
                      className={clsx(
                        'badge',
                        ['entrada', 'apertura', 'ingreso', 'deposito'].includes(mov.tipo) ? 'badge-success' : 'badge-danger'
                      )}
                    >
                      {['entrada', 'apertura', 'ingreso', 'deposito'].includes(mov.tipo) ? 'Entrada' : 'Salida'}
                    </span>
                  </td>
                  <td className="capitalize">{mov.categoria || '-'}</td>
                  <td>{mov.descripcion}</td>
                  <td className="whitespace-nowrap">
                    {comprobante ? (
                      <div className="flex items-center gap-1">
                        <span className={clsx(
                          'px-2 py-0.5 rounded text-xs font-medium',
                          comprobante.tipo_comprobante === '01' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        )}>
                          {comprobante.tipo_comprobante === '01' ? 'F' : 'B'} {comprobante.serie}-{String(comprobante.correlativo).padStart(8, '0')}
                        </span>
                        {comprobante.estado === 'aceptado' && (
                          <span className="text-green-500 text-xs" title="Aceptado SUNAT">✓</span>
                        )}
                        {comprobante.estado === 'rechazado' && (
                          <span className="text-red-500 text-xs" title="Rechazado SUNAT">✗</span>
                        )}
                        {comprobante.estado === 'pendiente' && (
                          <span className="text-yellow-500 text-xs" title="Pendiente">⏳</span>
                        )}
                      </div>
                    ) : esMovimientoPago(mov) ? (
                      <span className="text-xs text-cafe-400">Sin comprobante</span>
                    ) : (
                      <span className="text-cafe-300">-</span>
                    )}
                  </td>
                  <td
                    className={clsx(
                      'text-right font-semibold',
                      ['entrada', 'apertura', 'ingreso', 'deposito'].includes(mov.tipo) ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {['entrada', 'apertura', 'ingreso', 'deposito'].includes(mov.tipo) ? '+' : '-'}$
                    {parseFloat(mov.monto).toFixed(2)}
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {esMovimientoPago(mov) && (
                        <button
                          onClick={() => handleImprimirTicket(mov)}
                          className="btn-icon text-cafe-600 hover:text-cafe-800"
                          title="Imprimir ticket"
                        >
                          <FiPrinter className="w-4 h-4" />
                        </button>
                      )}
                      {comprobante && (
                        <button
                          onClick={() => {
                            const w = window.open(`/api/facturacion/${comprobante.id}/html`, '_blank', 'width=400,height=700');
                            if (!w) toast.error('Habilite popups para imprimir');
                          }}
                          className="btn-icon text-blue-600 hover:text-blue-800"
                          title={`Ver ${comprobante.tipo_comprobante === '01' ? 'Factura' : 'Boleta'}`}
                        >
                          <FiFileText className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de nuevo movimiento */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-cafe-800 mb-6">
              Nuevo Movimiento
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipo */}
              <div>
                <label className="label">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipo: 'entrada' })}
                    className={clsx(
                      'p-3 rounded-button flex items-center justify-center gap-2 transition-colors',
                      formData.tipo === 'entrada'
                        ? 'bg-green-500 text-white'
                        : 'bg-beige-200 text-cafe-700'
                    )}
                  >
                    <FiPlus className="w-5 h-5" />
                    Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipo: 'salida' })}
                    className={clsx(
                      'p-3 rounded-button flex items-center justify-center gap-2 transition-colors',
                      formData.tipo === 'salida'
                        ? 'bg-red-500 text-white'
                        : 'bg-beige-200 text-cafe-700'
                    )}
                  >
                    <FiMinus className="w-5 h-5" />
                    Salida
                  </button>
                </div>
              </div>

              {/* Categoría */}
              <div>
                <label className="label">Categoría</label>
                <select
                  value={formData.categoria}
                  onChange={(e) =>
                    setFormData({ ...formData, categoria: e.target.value })
                  }
                  className="input"
                >
                  {categorias.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Monto */}
              <div>
                <label className="label">Monto</label>
                <input
                  type="number"
                  value={formData.monto}
                  onChange={(e) =>
                    setFormData({ ...formData, monto: e.target.value })
                  }
                  placeholder="0.00"
                  className="input text-xl"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="label">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                  placeholder="Describa el motivo del movimiento..."
                  className="input resize-none"
                  rows={3}
                  required
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-1"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
