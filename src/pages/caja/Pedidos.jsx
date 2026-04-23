import { useEffect, useState } from 'react';
import { usePedidosStore } from '@store/pedidosStore';
import { useCajaStore } from '@store/cajaStore';
import { useConfigStore } from '@store/configStore';
import { formatCurrency } from '@utils/format';
import { handleApiError } from '@utils';
import { FiSearch, FiClock, FiDollarSign, FiUser, FiAlertCircle } from 'react-icons/fi';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import toast from 'react-hot-toast';

export default function CajaPedidos() {
  const { pedidosActivos, fetchPedidosActivos, fetchPedido, isLoading } = usePedidosStore();
  const { estadoCaja } = useCajaStore();
  const { config } = useConfigStore();
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  useEffect(() => {
    fetchPedidosActivos();
    // Refrescar cada 30 segundos
    const interval = setInterval(fetchPedidosActivos, 30000);
    return () => clearInterval(interval);
  }, []);

  // Cargar detalle completo cuando se selecciona un pedido
  const handleSeleccionarPedido = async (pedido) => {
    setLoadingDetalle(true);
    try {
      const detalle = await fetchPedido(pedido.id);
      setPedidoSeleccionado(detalle);
    } catch (error) {
      handleApiError(error);
      setPedidoSeleccionado(pedido); // Mostrar al menos lo básico
    } finally {
      setLoadingDetalle(false);
    }
  };

  const pedidosFiltrados = pedidosActivos
    .filter((pedido) => {
      // Filtro por estado
      if (filtro === 'cuenta') return pedido.estado === 'cuenta';
      if (filtro === 'listos') return pedido.estado === 'listo';
      if (filtro === 'entregados') return pedido.estado === 'entregado';
      return true;
    })
    .filter((pedido) => {
      // Búsqueda
      if (!busqueda) return true;
      const searchLower = busqueda.toLowerCase();
      return (
        pedido.id?.toString().includes(searchLower) ||
        pedido.mesa_numero?.toString().includes(searchLower) ||
        (pedido.tipo === 'domicilio' && 'delivery'.includes(searchLower))
      );
    })
    .sort((a, b) => {
      // Priorizar los que pidieron cuenta, luego entregados, luego otros
      if (a.estado === 'cuenta' && b.estado !== 'cuenta') return -1;
      if (b.estado === 'cuenta' && a.estado !== 'cuenta') return 1;
      if (a.estado === 'entregado' && b.estado !== 'entregado' && b.estado !== 'cuenta') return -1;
      if (b.estado === 'entregado' && a.estado !== 'entregado' && a.estado !== 'cuenta') return 1;
      return 0;
    });

  const cuentasPendientes = pedidosActivos.filter(
    (p) => p.estado === 'cuenta'
  ).length;

  const entregadosPendientes = pedidosActivos.filter(
    (p) => p.estado === 'entregado'
  ).length;

  const getEstadoBadge = (estado) => {
    const config = {
      pendiente: { class: 'badge-warning', label: 'En cocina' },
      en_preparacion: { class: 'badge-info', label: 'Preparando' },
      listo: { class: 'badge-success', label: 'Listo' },
      entregado: { class: 'badge-primary', label: 'Entregado' },
      cuenta: { class: 'badge-danger animate-pulse', label: '¡Cuenta!' },
    };
    return config[estado] || { class: 'badge', label: estado };
  };

  if (!estadoCaja?.abierta) {
    return (
      <div className="card text-center py-12">
        <FiAlertCircle className="w-16 h-16 mx-auto text-terracota-500 mb-4" />
        <h2 className="text-xl font-bold text-cafe-800 mb-2">Caja Cerrada</h2>
        <p className="text-cafe-500 mb-6">
          Debe abrir la caja para ver y procesar pedidos
        </p>
        <a href="/caja/cierre" className="btn-primary inline-block">
          Abrir Caja
        </a>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-180px)]">
      {/* Lista de pedidos */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header y filtros */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-xs">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-cafe-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar pedido, mesa o delivery..."
              className="input pl-10"
            />
          </div>

          <div className="flex items-center gap-2 bg-beige-200 p-1 rounded-button">
            {[
              { value: 'todos', label: 'Todos' },
              { value: 'cuenta', label: `Cuenta (${cuentasPendientes})`, alert: cuentasPendientes > 0 },
              { value: 'entregados', label: `Entregados (${entregadosPendientes})` },
              { value: 'listos', label: 'Listos' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFiltro(option.value)}
                className={clsx(
                  'px-4 py-2 rounded-button text-sm font-medium transition-colors',
                  filtro === option.value
                    ? 'bg-oliva-400 text-white'
                    : 'text-cafe-600 hover:bg-beige-300',
                  option.alert && filtro !== option.value && 'text-terracota-600'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-auto space-y-3">
          {isLoading && pedidosActivos.length === 0 && (
            <div className="flex justify-center py-12">
              <div className="spinner" />
            </div>
          )}

          {!isLoading && pedidosFiltrados.length === 0 && (
            <div className="text-center py-12">
              <p className="text-cafe-500">No hay pedidos activos</p>
            </div>
          )}

          {pedidosFiltrados.map((pedido) => {
            const estadoBadge = getEstadoBadge(pedido.estado);
            const isSelected = pedidoSeleccionado?.id === pedido.id;

            return (
              <button
                key={pedido.id}
                onClick={() => handleSeleccionarPedido(pedido)}
                disabled={loadingDetalle}
                className={clsx(
                  'card w-full text-left transition-all',
                  isSelected
                    ? 'ring-2 ring-oliva-400 bg-oliva-50'
                    : 'hover:shadow-card-hover',
                  pedido.estado === 'cuenta' && 'border-l-4 border-terracota-500',
                  loadingDetalle && 'opacity-50 cursor-wait'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-cafe-800 text-lg">
                        {pedido.tipo === 'domicilio' ? '🚚 Delivery' : `Mesa ${pedido.mesa_numero}`}
                      </h3>
                      <span className={estadoBadge.class}>{estadoBadge.label}</span>
                      {pedido.tipo && (
                        <span className={clsx(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          pedido.tipo === 'domicilio' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-green-100 text-green-700'
                        )}>
                          {pedido.tipo === 'domicilio' ? 'Delivery' : pedido.tipo}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-cafe-500">
                      <span className="font-mono">#{pedido.id}</span>
                      <span className="flex items-center gap-1">
                        <FiClock className="w-4 h-4" />
                        {pedido.created_at &&
                          format(new Date(pedido.created_at), 'HH:mm', { locale: es })}
                      </span>
                      {pedido.mesero_nombre && (
                        <span className="flex items-center gap-1">
                          <FiUser className="w-4 h-4" />
                          {pedido.mesero_nombre}
                        </span>
                      )}
                    </div>

                    {/* Items resumidos */}
                    <p className="text-sm text-cafe-400 mt-2 line-clamp-1">
                      {pedido.total_items || pedido.items?.length || 0} productos
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold text-cafe-800">
                      {formatCurrency(parseFloat(pedido.total || 0))}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel de detalle */}
      <div className="w-96 bg-white rounded-card shadow-card flex flex-col overflow-hidden">
        {!pedidoSeleccionado ? (
          <div className="flex-1 flex items-center justify-center text-cafe-400">
            <p>Seleccione un pedido</p>
          </div>
        ) : loadingDetalle ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="spinner" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-beige-200 bg-beige-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-cafe-800">
                  {pedidoSeleccionado.tipo === 'domicilio' ? '🚚 Delivery' : `Mesa ${pedidoSeleccionado.mesa_numero}`}
                </h3>
                <div className="flex items-center gap-2">
                  {pedidoSeleccionado.tipo && (
                    <span className={clsx(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      pedidoSeleccionado.tipo === 'domicilio' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-green-100 text-green-700'
                    )}>
                      {pedidoSeleccionado.tipo === 'domicilio' ? 'Delivery' : pedidoSeleccionado.tipo}
                    </span>
                  )}
                  <span className="font-mono text-cafe-500">
                    #{pedidoSeleccionado.id}
                  </span>
                </div>
              </div>
              {pedidoSeleccionado.mesero_nombre && (
                <p className="text-sm text-cafe-500">
                  Mesero: {pedidoSeleccionado.mesero_nombre}
                </p>
              )}
            </div>

            {/* Items */}
            <div className="flex-1 overflow-auto p-4">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-cafe-500">
                    <th className="pb-2">Producto</th>
                    <th className="pb-2 text-center">Cant</th>
                    <th className="pb-2 text-right">Precio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-beige-200">
                  {pedidoSeleccionado.items?.map((item, idx) => (
                    <tr key={idx} className="text-cafe-800">
                      <td className="py-2">
                        <span className="font-medium">{item.producto_nombre}</span>
                        {item.notas && (
                          <p className="text-xs text-terracota-500">{item.notas}</p>
                        )}
                      </td>
                      <td className="py-2 text-center">{item.cantidad}</td>
                      <td className="py-2 text-right">
                        <div className="text-sm font-medium">
                          {formatCurrency(parseFloat(item.precio_unitario) * item.cantidad)}
                        </div>
                        <div className="text-xs text-cafe-500">
                          ({formatCurrency(parseFloat(item.precio_base || 0) * item.cantidad)} sin IGV)
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totales */}
            <div className="p-4 border-t border-beige-200 bg-beige-50">
              <div className="flex justify-between text-cafe-600 mb-1">
                <span>Subtotal</span>
                <span>{formatCurrency(parseFloat(pedidoSeleccionado.subtotal || pedidoSeleccionado.total || 0))}</span>
              </div>
              {pedidoSeleccionado.descuento > 0 && (
                <div className="flex justify-between text-green-600 mb-1">
                  <span>Descuento</span>
                  <span>-{formatCurrency(parseFloat(pedidoSeleccionado.descuento))}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-cafe-800 pt-2 border-t border-beige-300">
                <span>Total</span>
                <span>{formatCurrency(parseFloat(pedidoSeleccionado.total || 0))}</span>
              </div>
            </div>

            {/* Acciones */}
            <div className="p-4 border-t border-beige-200">
              <a
                href={`/caja/pagos?pedido=${pedidoSeleccionado.id}`}
                className="btn-primary w-full py-3 text-center flex items-center justify-center gap-2"
              >
                <FiDollarSign className="w-5 h-5" />
                Procesar Pago
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
