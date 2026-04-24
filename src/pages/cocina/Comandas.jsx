import { useEffect } from 'react';
import { useCocinaStore } from '@store/cocinaStore';
import { useSocket } from '@hooks/useSocket';
import { handleApiError } from '@utils';
import { FiClock, FiAlertCircle, FiCheck, FiCheckCircle, FiWifi, FiWifiOff } from 'react-icons/fi';
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
  
  const { socket, isConnected, emit } = useSocket();

  // Polling para actualizar comandas cada 30 segundos (fallback)
  useEffect(() => {
    const loadData = () => {
      fetchComandas(filtroEstado);
    };
    
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [filtroEstado, fetchComandas]);

  // Escuchar eventos WebSocket entrantes
  useEffect(() => {
    if (!socket) return;

    const handleNuevoPedido = (data) => {
      console.log('📦 Cocina: Nuevo pedido recibido via WebSocket:', data);
      toast.success(`Nuevo pedido #${data.numero}`, {
        icon: '📦',
        duration: 3000
      });
      fetchComandas(filtroEstado);
    };

    const handlePedidoActualizado = (data) => {
      console.log('🔄 Cocina: Pedido actualizado via WebSocket:', data);
      fetchComandas(filtroEstado);
    };

    socket.on('pedido:nuevo', handleNuevoPedido);
    socket.on('pedido:actualizado', handlePedidoActualizado);

    return () => {
      socket.off('pedido:nuevo', handleNuevoPedido);
      socket.off('pedido:actualizado', handlePedidoActualizado);
    };
  }, [socket, fetchComandas, filtroEstado]);

  // Marcar item como listo y emitir evento WebSocket
  const handleMarcarListo = async (itemId, productoNombre, pedidoId, comanda) => {
    console.log(`🍳 Marcando item como listo: ${productoNombre} (ItemId: ${itemId}, PedidoId: ${pedidoId})`);
    
    // Obtener información del pedido para saber si es el último item
    const itemsPendientesActuales = comanda.items?.filter(i => i.estado !== 'listo') || [];
    const esUltimoItem = itemsPendientesActuales.length === 1;
    const itemsRestantes = itemsPendientesActuales.length - 1;
    
    console.log(`📊 Items pendientes actuales: ${itemsPendientesActuales.length}, es último: ${esUltimoItem}`);

    const result = await cambiarEstadoItem(itemId, 'listo');
    
    if (result.success) {
      console.log(`✅ Item marcado como listo exitosamente`);
      
      // Preparar datos para WebSocket
      const wsData = {
        itemId: itemId,
        pedidoId: pedidoId,
        pedidoNumero: comanda.numero,
        producto_nombre: productoNombre,
        estado: 'listo',
        timestamp: new Date().toISOString(),
        mesa_numero: comanda.mesa_numero,
        pedido_tipo: comanda.pedido_tipo,
        es_ultimo: esUltimoItem,
        quedan_pendientes: itemsRestantes
      };
      
      // EMITIR EVENTO A MESEROS - ¡IMPORTANTE!
      console.log(`📤 Emitiendo evento cocina:itemListo a meseros`);
      emit('cocina:itemListo', wsData);
      
      // También emitir cambio de estado
      console.log(`📤 Emitiendo evento cocina:estadoCambiado a meseros`);
      emit('cocina:estadoCambiado', wsData);
      
      // Notificación local
      toast.success(`${productoNombre} ¡LISTO! Notificado a meseros`, {
        icon: '✅',
        duration: 2000,
        style: {
          background: '#22c55e',
          color: '#fff',
          fontWeight: 'bold'
        }
      });
      
      // Si es el último item, notificación especial
      if (esUltimoItem) {
        toast.success(`🎉 ¡ÚLTIMO ITEM! Pedido ${comanda.numero} completado`, {
          icon: '🎉',
          duration: 4000,
          style: {
            background: '#3b82f6',
            color: '#fff',
            fontWeight: 'bold'
          }
        });
      }
      
      // Recargar comandas después de un pequeño delay
      setTimeout(() => {
        fetchComandas(filtroEstado);
      }, 500);
      
    } else {
      console.error(`❌ Error marcando item como listo:`, result.message);
      toast.error(result.message);
    }
  };

  // Marcar todos los items de una comanda como listos
  const handleMarcarTodoListo = async (comanda) => {
    const itemsPendientes = comanda.items?.filter(i => i.estado !== 'listo') || [];
    if (itemsPendientes.length === 0) return;

    console.log(`🍳 Marcando TODO como listo para pedido ${comanda.id}, ${itemsPendientes.length} items`);
    
    let itemsMarcados = 0;
    for (const item of itemsPendientes) {
      const result = await cambiarEstadoItem(item.id, 'listo');
      if (result.success) {
        itemsMarcados++;
        
        // Emitir evento para cada item
        const wsData = {
          itemId: item.id,
          pedidoId: comanda.id,
          pedidoNumero: comanda.numero,
          producto_nombre: item.producto_nombre,
          estado: 'listo',
          timestamp: new Date().toISOString(),
          mesa_numero: comanda.mesa_numero,
          pedido_tipo: comanda.pedido_tipo,
          es_ultimo: itemsMarcados === itemsPendientes.length,
          quedan_pendientes: itemsPendientes.length - itemsMarcados
        };
        
        emit('cocina:itemListo', wsData);
        emit('cocina:estadoCambiado', wsData);
      }
    }
    
    // Notificación de todo listo
    toast.success(`Mesa ${comanda.mesa_numero} ¡TODO LISTO! Notificado a meseros`, {
      icon: '🎉',
      duration: 3000,
      style: {
        background: '#22c55e',
        color: '#fff',
        fontWeight: 'bold'
      }
    });
    
    // Emitir evento especial de pedido completo
    emit('cocina:pedidoCompleto', {
      pedidoId: comanda.id,
      pedidoNumero: comanda.numero,
      mesa_numero: comanda.mesa_numero,
      cantidad_items: itemsPendientes.length,
      timestamp: new Date().toISOString()
    });
    
    fetchComandas(filtroEstado);
  };

  const getTiempoClasses = (minutos) => {
    if (minutos >= 15) return 'text-red-500 animate-pulse font-bold';
    if (minutos >= 10) return 'text-orange-400';
    return 'text-beige-300';
  };

  if (isLoading && comandas.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Indicador de conexión WebSocket */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white rounded-full px-3 py-1 shadow-lg">
        {isConnected ? (
          <>
            <FiWifi className="text-green-500" />
            <span className="text-xs text-green-600">WebSocket Conectado</span>
          </>
        ) : (
          <>
            <FiWifiOff className="text-red-500" />
            <span className="text-xs text-red-600">WebSocket Desconectado</span>
          </>
        )}
      </div>

      <div className="grid-cocina">
        {comandas.map((comanda) => {
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
                  <span className="text-beige-400 text-xs ml-2">
                    Pedido #{comanda.numero}
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
                    onClick={() => handleMarcarListo(item.id, item.producto_nombre, comanda.id, comanda)}
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
                    TODO LISTO ({itemsPendientes.length} items)
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {comandas.length === 0 && (
          <div className="col-span-full text-center py-16">
            <div className="text-6xl mb-4">🍳</div>
            <p className="text-beige-400 text-2xl font-medium mb-2">Sin comandas pendientes</p>
            <p className="text-beige-500">
              Las nuevas comandas aparecerán automáticamente
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
