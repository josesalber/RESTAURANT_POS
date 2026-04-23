import { useEffect, useState } from 'react';
import { usePedidosStore } from '@store/pedidosStore';
import { useAuthStore } from '@store/authStore';
import { formatCurrency } from '@utils/format';
import { FiSearch, FiClock, FiDollarSign, FiCheckCircle } from 'react-icons/fi';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';

export default function MeseroHistorial() {
  const { user } = useAuthStore();
  const { fetchPedidos, pedidos, isLoading } = usePedidosStore();
  const [filtro, setFiltro] = useState('hoy');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarPedidos();
  }, [filtro]);

  const cargarPedidos = async () => {
    let params = { mesero_id: user.id };

    if (filtro === 'hoy') {
      params.fecha = format(new Date(), 'yyyy-MM-dd');
    } else if (filtro === 'semana') {
      const hace7dias = new Date();
      hace7dias.setDate(hace7dias.getDate() - 7);
      params.desde = format(hace7dias, 'yyyy-MM-dd');
    }

    await fetchPedidos(params);
  };

  const pedidosFiltrados = pedidos.filter((pedido) => {
    if (!busqueda) return true;
    const searchLower = busqueda.toLowerCase();
    return (
      pedido.numero_pedido?.toLowerCase().includes(searchLower) ||
      pedido.mesa_numero?.toString().includes(searchLower)
    );
  });

  const getEstadoBadge = (estado) => {
    const config = {
      pendiente: { class: 'badge-warning', label: 'Pendiente' },
      en_preparacion: { class: 'badge-info', label: 'En Preparación' },
      listo: { class: 'badge-success', label: 'Listo' },
      entregado: { class: 'badge bg-cafe-200 text-cafe-700', label: 'Entregado' },
      cuenta_solicitada: { class: 'badge-warning', label: 'Cuenta Solicitada' },
      pagado: { class: 'badge-success', label: 'Pagado' },
      cancelado: { class: 'badge-danger', label: 'Cancelado' },
    };
    return config[estado] || { class: 'badge', label: estado };
  };

  // Calcular estadísticas
  const stats = {
    total: pedidos.length,
    completados: pedidos.filter((p) => p.estado === 'pagado').length,
    ventaTotal: pedidos
      .filter((p) => p.estado === 'pagado')
      .reduce((sum, p) => sum + parseFloat(p.total || 0), 0),
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-cafe-800">Mi Historial</h2>
          <p className="text-cafe-500">Pedidos atendidos</p>
        </div>

        {/* Estadísticas rápidas */}
        <div className="flex items-center gap-4">
          <div className="bg-oliva-100 px-4 py-2 rounded-button">
            <span className="text-oliva-700 font-bold text-lg">{stats.total}</span>
            <span className="text-oliva-600 text-sm ml-1">pedidos</span>
          </div>
          <div className="bg-estado-disponible/20 px-4 py-2 rounded-button">
            <span className="text-green-700 font-bold text-lg">
              {formatCurrency(stats.ventaTotal)}
            </span>
            <span className="text-green-600 text-sm ml-1">vendido</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Búsqueda */}
        <div className="relative flex-1 max-w-xs">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-cafe-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por # o mesa..."
            className="input pl-10"
          />
        </div>

        {/* Filtro de tiempo */}
        <div className="flex items-center gap-2 bg-beige-200 p-1 rounded-button">
          {[
            { value: 'hoy', label: 'Hoy' },
            { value: 'semana', label: '7 días' },
            { value: 'todos', label: 'Todos' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFiltro(option.value)}
              className={clsx(
                'px-4 py-2 rounded-button text-sm font-medium transition-colors',
                filtro === option.value
                  ? 'bg-oliva-400 text-white'
                  : 'text-cafe-600 hover:bg-beige-300'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="spinner" />
        </div>
      )}

      {/* Lista de pedidos */}
      {!isLoading && pedidosFiltrados.length === 0 && (
        <div className="text-center py-12">
          <p className="text-cafe-500 mb-2">No hay pedidos</p>
          <p className="text-cafe-400 text-sm">
            {busqueda
              ? 'No se encontraron resultados'
              : 'Los pedidos que atiendas aparecerán aquí'}
          </p>
        </div>
      )}

      {!isLoading && pedidosFiltrados.length > 0 && (
        <div className="space-y-3">
          {pedidosFiltrados.map((pedido) => {
            const estadoBadge = getEstadoBadge(pedido.estado);

            return (
              <div key={pedido.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-cafe-800">
                        #{pedido.numero_pedido}
                      </h3>
                      <span className={estadoBadge.class}>{estadoBadge.label}</span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-cafe-500">
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Mesa {pedido.mesa_numero}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <FiClock className="w-4 h-4" />
                        {pedido.created_at &&
                          format(new Date(pedido.created_at), "HH:mm 'hrs'", {
                            locale: es,
                          })}
                      </span>
                    </div>

                    {/* Items resumidos */}
                    {pedido.items && pedido.items.length > 0 && (
                      <p className="text-sm text-cafe-400 mt-2 line-clamp-1">
                        {pedido.items.map((i) => `${i.cantidad}x ${i.producto_nombre}`).join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-cafe-800">
                      {formatCurrency(parseFloat(pedido.total || 0))}
                    </p>
                    {pedido.estado === 'pagado' && (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <FiCheckCircle className="w-4 h-4" />
                        Completado
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
