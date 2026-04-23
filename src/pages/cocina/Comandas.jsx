import { useEffect } from 'react';
import { useCocinaStore } from '@store/cocinaStore';
import { handleApiError } from '@utils';
import { FiClock, FiAlertCircle, FiCheck, FiCheckCircle } from 'react-icons/fi';
import clsx from 'clsx';
import toast from 'react-hot-toast';

export default function CocinaComandas() {
  const {
    comandas,
    filtroEstado,
    fetchComandas,
    cambiarEstadoItem,
    isLoading,
  } = useCocinaStore();

  // Polling para actualizar comandas cada 30 segundos
  useEffect(() => {
    const loadData = () => {
      fetchComandas(filtroEstado);
    };
    
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [filtroEstado]);

  // Marcar item como listo directamente
  const handleMarcarListo = async (itemId, productoNombre) => {
    const result = await cambiarEstadoItem(itemId, 'listo');
    if (result.success) {
      toast.success(`${productoNombre} ¡LISTO!`, {
        icon: '✅',
        duration: 2000,
        style: {
          background: '#22c55e',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '1.1rem'
        }
      });
      // Recargar comandas
      fetchComandas(filtroEstado);
    } else {
      toast.error(result.message);
    }
  };

  // Marcar todos los items de una comanda como listos
  const handleMarcarTodoListo = async (comanda) => {
    const itemsPendientes = comanda.items?.filter(i => i.estado !== 'listo') || [];
    if (itemsPendientes.length === 0) return;

    for (const item of itemsPendientes) {
      await cambiarEstadoItem(item.id, 'listo');
    }
    
    toast.success(`Mesa ${comanda.mesa_numero} ¡TODO LISTO!`, {
      icon: '',
      duration: 3000,
      style: {
        background: '#22c55e',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '1.2rem'
      }
    });
    
    fetchComandas(filtroEstado);
  };

  const getTiempoClasses = (minutos) => {
    if (minutos >= 15) return 'text-red-500 animate-pulse font-bold';
    if (minutos >= 10) return 'text-orange-400';
    return 'text-beige-300';
  };

  // Mostrar comandas según filtro del backend
  const comandasActivas = comandas;

  if (isLoading && comandas.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner" />
      </div>
    );
  }

  // Vista principal por pedido - SIMPLIFICADA
  return (
    <div className="grid-cocina">
      {comandasActivas.map((comanda) => {
        const itemsPendientes = comanda.items?.filter(
          (i) => i.estado !== 'listo'
        ) || [];
        const itemsListos = comanda.items?.filter(
          (i) => i.estado === 'listo'
        ).length || 0;
        const totalItems = comanda.items?.length || 0;

        const tiempoMinutos = comanda.created_at
          ? Math.floor(
              (new Date() - new Date(comanda.created_at)) / 1000 / 60
            )
          : 0;

        return (
          <div
            key={comanda.id}
            className={clsx(
              "bg-beige-100 rounded-card overflow-hidden shadow-lg transition-all",
              tiempoMinutos >= 15 && "ring-4 ring-red-500 animate-pulse"
            )}
          >
            {/* Header de la comanda */}
            <div className={clsx(
              "px-4 py-3 flex items-center justify-between",
              tiempoMinutos >= 15 ? "bg-red-600" : "bg-cafe-700"
            )}>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-beige-100">
                  {comanda.pedido_tipo === 'domicilio' ? '🚚' : comanda.mesa_numero}
                </span>
                <span className="text-beige-300 text-sm">
                  {comanda.pedido_tipo === 'domicilio' ? 'Delivery' : 'Mesa'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Indicador de tiempo */}
                <div
                  className={clsx(
                    'flex items-center gap-1 text-xl font-mono',
                    getTiempoClasses(tiempoMinutos)
                  )}
                >
                  <FiClock className="w-5 h-5" />
                  <span>{tiempoMinutos}min</span>
                </div>

                {/* Progreso */}
                <div className="bg-white/20 px-3 py-1 rounded-full text-beige-100 text-sm">
                  {itemsListos}/{totalItems}
                </div>
              </div>
            </div>

            {/* Items - Solo pendientes */}
            <div className="p-3 space-y-2">
              {itemsPendientes.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMarcarListo(item.id, item.producto_nombre)}
                  className={clsx(
                    'w-full rounded-lg p-4 flex items-center gap-4 transition-all',
                    'bg-yellow-100 border-l-4 border-yellow-500',
                    'hover:bg-green-100 hover:border-green-500 active:scale-98',
                    'cursor-pointer touch-manipulation'
                  )}
                >
                  {/* Cantidad */}
                  <span className="text-3xl font-bold text-cafe-800 min-w-[60px]">
                    {item.cantidad}x
                  </span>

                  {/* Producto */}
                  <div className="flex-1 text-left">
                    <h4 className="font-bold text-cafe-900 text-xl">
                      {item.producto_nombre}
                    </h4>
                    {item.notas && (
                      <p className="text-red-600 font-medium flex items-center gap-1 mt-1">
                        <FiAlertCircle className="w-4 h-4" />
                        {item.notas}
                      </p>
                    )}
                  </div>

                  {/* Icono de acción */}
                  <div className="text-green-600 bg-green-100 p-3 rounded-full">
                    <FiCheck className="w-8 h-8" />
                  </div>
                </button>
              ))}

              {/* Items listos (colapsados) */}
              {itemsListos > 0 && (
                <div className="bg-green-100 rounded-lg p-3 text-green-700 flex items-center gap-2">
                  <FiCheckCircle className="w-5 h-5" />
                  <span className="font-medium">{itemsListos} item(s) listo(s)</span>
                </div>
              )}
            </div>

            {/* Footer con botón de todo listo */}
            {itemsPendientes.length > 1 && (
              <div className="px-3 pb-3">
                <button
                  onClick={() => handleMarcarTodoListo(comanda)}
                  className="w-full py-3 bg-green-500 text-white rounded-lg font-bold text-lg hover:bg-green-600 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <FiCheckCircle className="w-6 h-6" />
                  TODO LISTO
                </button>
              </div>
            )}
          </div>
        );
      })}

      {comandasActivas.length === 0 && (
        <div className="col-span-full text-center py-16">
          <div className="text-6xl mb-4">🍳</div>
          <p className="text-beige-400 text-2xl font-medium mb-2">Sin comandas pendientes</p>
          <p className="text-beige-500">
            Las nuevas comandas aparecerán automáticamente
          </p>
        </div>
      )}
    </div>
  );
}
