import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMesasStore } from '@store/mesasStore';
import { usePedidosStore } from '@store/pedidosStore';
import { useProductosStore } from '@store/productosStore';
import { useCocinaStore } from '@store/cocinaStore';
import { formatCurrency } from '@utils/format';
import { handleApiError } from '@utils';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import {
  FiArrowLeft,
  FiPlus,
  FiMinus,
  FiTrash2,
  FiSend,
  FiFileText,
  FiX,
  FiCheck,
  FiEdit3,
  FiShoppingBag,
  FiClock,
  FiCheckCircle,
  FiLoader,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';

export default function MeseroPedido() {
  const { mesaId } = useParams();
  console.log('MeseroPedido - Componente montado, mesaId:', mesaId);
  const navigate = useNavigate();
  const { fetchMesa, mesaActual, cambiarEstado } = useMesasStore();
  const {
    pedidoActual,
    crearPedido,
    agregarItems,
    solicitarCuenta,
    fetchPedidosActivos,
    fetchPedido,
    pedidosActivos,
    cambiarEstadoPedido,
  } = usePedidosStore();
  const { menu, fetchMenu, categoriaSeleccionada, setCategoriaSeleccionada } =
    useProductosStore();
  const { cambiarEstadoItem } = useCocinaStore();

  // Determinar si es un pedido de delivery (sin mesaId)
  const isDelivery = !mesaId;

  const [carrito, setCarrito] = useState([]);
  const [notaItem, setNotaItem] = useState({ id: null, nota: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [pedidoMesa, setPedidoMesa] = useState(null);
  const [pedidoDetalle, setPedidoDetalle] = useState(null);
  const [mostrarPedidoExistente, setMostrarPedidoExistente] = useState(true);
  const [categoriasScrollRef, setCategoriasScrollRef] = useState(null);

  useEffect(() => {
    loadData();
  }, [mesaId]);

  const loadData = async () => {
    console.log('MeseroPedido - loadData called, isDelivery:', isDelivery, 'mesaId:', mesaId);
    if (!isDelivery) {
      console.log('MeseroPedido - Fetching mesa:', mesaId);
      await fetchMesa(mesaId); 
    }
    console.log('MeseroPedido - Fetching menu');
    await fetchMenu();
    console.log('MeseroPedido - Fetching pedidos activos');
    await fetchPedidosActivos();
    console.log('MeseroPedido - loadData completed');
  };

  useEffect(() => {
    // Para delivery, no hay pedido de mesa específico
    if (isDelivery) {
      setPedidoMesa(null);
      setPedidoDetalle(null);
      return;
    }

    // Buscar si hay un pedido activo para esta mesa
    if (pedidosActivos.length > 0 && mesaActual) {
      const pedido = pedidosActivos.find(
        (p) => p.mesa_id === mesaActual.id && !['pagado', 'cancelado'].includes(p.estado)
      );
      setPedidoMesa(pedido || null);
      
      // Si hay pedido activo, obtener su detalle completo
      if (pedido) {
        fetchPedido(pedido.id).then((detalle) => {
          if (detalle) {
            setPedidoDetalle(detalle);
          }
        });
      } else {
        setPedidoDetalle(null);
      }
    }
  }, [pedidosActivos, mesaActual, isDelivery]);

  // Calcular total del pedido existente
  const totalPedidoExistente = pedidoDetalle?.total ? parseFloat(pedidoDetalle.total) : 0;

  // Obtener estado del item para mostrar icono
  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'pendiente':
        return <FiClock className="w-4 h-4 text-yellow-500" />;
      case 'preparando':
        return <FiLoader className="w-4 h-4 text-orange-500 animate-spin" />;
      case 'listo':
        return <FiCheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <FiClock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getEstadoLabel = (estado) => {
    const labels = {
      pendiente: 'Pendiente',
      preparando: 'Preparando',
      listo: 'Listo',
      entregado: 'Entregado',
    };
    return labels[estado] || estado;
  };

  const handleBack = () => {
    navigate(isDelivery ? '/caja' : '/mesero');
  };

  const handleAgregarProducto = (producto) => {
    const existente = carrito.find((item) => item.producto_id === producto.id);

    if (existente) {
      setCarrito(
        carrito.map((item) =>
          item.producto_id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      );
    } else {
      setCarrito([
        ...carrito,
        {
          producto_id: producto.id,
          nombre: producto.nombre,
          precio: parseFloat(producto.precio),
          cantidad: 1,
          notas: '',
        },
      ]);
    }

    toast.success(`${producto.nombre} agregado`, { duration: 1000 });
  };

  const handleCantidad = (productoId, delta) => {
    setCarrito(
      carrito
        .map((item) =>
          item.producto_id === productoId
            ? { ...item, cantidad: Math.max(0, item.cantidad + delta) }
            : item
        )
        .filter((item) => item.cantidad > 0)
    );
  };

  const handleEliminar = (productoId) => {
    setCarrito(carrito.filter((item) => item.producto_id !== productoId));
  };

  const handleNotaItem = (item) => {
    setNotaItem({ id: item.producto_id, nota: item.notas || '' });
  };

  const guardarNotaItem = () => {
    setCarrito(
      carrito.map((item) =>
        item.producto_id === notaItem.id ? { ...item, notas: notaItem.nota } : item
      )
    );
    setNotaItem({ id: null, nota: '' });
  };

  const calcularTotal = () => {
    return carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  };

  const scrollCategorias = (direction) => {
    if (categoriasScrollRef) {
      const scrollAmount = 200; // Cantidad de píxeles a desplazar
      const newScrollLeft = categoriasScrollRef.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      categoriasScrollRef.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const handleEnviarPedido = async () => {
    if (carrito.length === 0) {
      toast.error('Agregue productos al pedido');
      return;
    }

    setIsLoading(true);

    try {
      const items = carrito.map((item) => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        notas: item.notas,
        precio_unitario: item.precio,
      }));

      if (pedidoMesa) {
        // Agregar items a pedido existente
        const result = await agregarItems(pedidoMesa.id, items);
        if (result.success) {
          toast.success('Items agregados al pedido');
          setCarrito([]);
          // Recargar el detalle del pedido actualizado
          const detalleActualizado = await fetchPedido(pedidoMesa.id);
          if (detalleActualizado) {
            setPedidoDetalle(detalleActualizado);
          }
          // Volver a la vista del pedido existente
          setMostrarPedidoExistente(true);
          // Recargar pedidos activos para actualizar totales
          await fetchPedidosActivos();
        } else {
          toast.error(result.message);
        }
      } else {
        // Crear nuevo pedido
        const result = await crearPedido({
          mesa_id: isDelivery ? null : mesaActual.id,
          tipo: isDelivery ? 'domicilio' : 'mesa',
          items,
        });

        if (result.success) {
          toast.success(isDelivery ? 'Pedido de delivery enviado a cocina' : 'Pedido enviado a cocina');
          setCarrito([]);
          if (!isDelivery) {
            // Actualizar estado de mesa solo si no es delivery
            await cambiarEstado(mesaActual.id, 'ocupada');
          }
          // El pedido creado se convierte en el pedido activo
          setPedidoMesa(result.data);
          setPedidoDetalle(result.data);
          setMostrarPedidoExistente(true);
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSolicitarCuenta = async () => {
    if (!pedidoMesa) {
      toast.error('No hay pedido activo');
      return;
    }

    const result = await solicitarCuenta(pedidoMesa.id);
    if (result.success) {
      toast.success('Cuenta solicitada');
      // Actualizar el pedido local
      setPedidoMesa({ ...pedidoMesa, estado: 'cuenta' });
      await fetchPedidosActivos();
    } else {
      toast.error(result.message);
    }
  };

  const handleItemClick = async (item) => {
    if (!pedidoMesa) {
      toast.error('No hay pedido activo');
      return;
    }

    // Solo permitir cambiar de pendiente a listo
    if (item.estado !== 'pendiente') {
      return;
    }

    setIsLoading(true);
    try {
      const result = await cambiarEstadoItem(item.id, 'listo');
      if (result.success) {
        toast.success(`${item.producto_nombre} marcado como listo`);
        // Refrescar el detalle del pedido
        const detalleActualizado = await fetchPedido(pedidoMesa.id);
        setPedidoDetalle(detalleActualizado);
        await fetchPedidosActivos();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTerminarPedido = async () => {
    if (!pedidoMesa) {
      toast.error('No hay pedido activo');
      return;
    }

    // Cambiar el estado del pedido a 'entregado' (NO a 'pagado')
    // La mesa solo se libera cuando el pedido se paga en caja
    const result = await cambiarEstadoPedido(pedidoMesa.id, 'entregado');
    if (result.success) {
      toast.success('Pedido entregado - Esperando pago en caja');
      // NO liberar la mesa aquí - se libera automáticamente cuando se paga
      // Regresar al mapa de mesas
      navigate('/mesero/mesas');
    } else {
      toast.error(result.message);
    }
  };

  if (!isDelivery && !mesaActual) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full -m-4">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-beige-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="btn-touch bg-beige-200 rounded-button hover:bg-beige-300"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-cafe-800">
              {isDelivery ? 'Pedido Delivery' : `Mesa ${mesaActual.numero}`}
            </h2>
            <p className="text-sm text-cafe-500">
              {pedidoMesa ? `Pedido #${pedidoMesa.id}` : 'Nuevo pedido'}
            </p>
          </div>
        </div>

        {pedidoMesa && pedidoMesa.estado === 'listo' && (
          <button
            onClick={handleSolicitarCuenta}
            className="btn-secondary flex items-center gap-2"
          >
            <FiFileText className="w-5 h-5" />
            <span>Pedir Cuenta</span>
          </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Panel izquierdo: Categorías y productos */}
        <div className="flex-1 flex flex-col overflow-hidden bg-beige-50">
          {/* Categorías */}
          <div className="p-3 bg-white border-b border-beige-200">
            <div className="flex items-center gap-2">
              {/* Botón flecha izquierda */}
              <button
                onClick={() => scrollCategorias('left')}
                className="btn-touch bg-beige-200 hover:bg-beige-300 rounded-button flex-shrink-0"
                aria-label="Desplazar categorías a la izquierda"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>

              {/* Contenedor de categorías con scroll */}
              <div
                ref={setCategoriasScrollRef}
                className="flex gap-2 overflow-x-auto scrollbar-hide flex-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {menu.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoriaSeleccionada(cat.id)}
                    className={clsx(
                      'px-4 py-2 rounded-button whitespace-nowrap text-sm font-medium transition-colors flex-shrink-0',
                      categoriaSeleccionada === cat.id
                        ? 'bg-oliva-400 text-white'
                        : 'bg-beige-200 text-cafe-700 hover:bg-beige-300'
                    )}
                  >
                    {cat.nombre}
                  </button>
                ))}
              </div>

              {/* Botón flecha derecha */}
              <button
                onClick={() => scrollCategorias('right')}
                className="btn-touch bg-beige-200 hover:bg-beige-300 rounded-button flex-shrink-0"
                aria-label="Desplazar categorías a la derecha"
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Productos */}
          <div className="flex-1 overflow-auto p-3">
            <div className="grid-productos">
              {(
                menu.find((c) => c.id === categoriaSeleccionada)?.productos ||
                menu[0]?.productos ||
                []
              ).map((producto) => (
                <button
                  key={producto.id}
                  onClick={() => handleAgregarProducto(producto)}
                  disabled={!producto.disponible}
                  className={clsx(
                    'card text-left transition-all active:scale-95',
                    producto.disponible
                      ? 'hover:shadow-card-hover'
                      : 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <h4 className="font-medium text-cafe-800 line-clamp-2 mb-1">
                    {producto.nombre}
                  </h4>
                  <p className="text-oliva-500 font-bold">
                    {formatCurrency(parseFloat(producto.precio))}
                  </p>
                  {!producto.disponible && (
                    <span className="text-xs text-terracota-500">Agotado</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Panel derecho: Carrito y Pedido Existente */}
        <div className="w-80 tablet-lg:w-96 bg-white border-l border-beige-200 flex flex-col">
          {/* Tabs si hay pedido existente */}
          {pedidoMesa && (
            <div className="flex border-b border-beige-200">
              <button
                onClick={() => setMostrarPedidoExistente(true)}
                className={clsx(
                  'flex-1 py-3 text-sm font-medium transition-colors',
                  mostrarPedidoExistente
                    ? 'bg-oliva-50 text-oliva-700 border-b-2 border-oliva-500'
                    : 'text-cafe-500 hover:bg-beige-50'
                )}
              >
                <FiShoppingBag className="w-4 h-4 inline mr-1" />
                Pedido Actual
              </button>
              <button
                onClick={() => setMostrarPedidoExistente(false)}
                className={clsx(
                  'flex-1 py-3 text-sm font-medium transition-colors relative',
                  !mostrarPedidoExistente
                    ? 'bg-oliva-50 text-oliva-700 border-b-2 border-oliva-500'
                    : 'text-cafe-500 hover:bg-beige-50'
                )}
              >
                <FiPlus className="w-4 h-4 inline mr-1" />
                Agregar
                {carrito.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-terracota-500 text-white text-xs rounded-full flex items-center justify-center">
                    {carrito.length}
                  </span>
                )}
              </button>
            </div>
          )}

          <div className="p-4 border-b border-beige-200">
            <h3 className="font-semibold text-cafe-800">
              {pedidoMesa 
                ? (mostrarPedidoExistente ? `Pedido #${pedidoMesa.id}` : 'Agregar más items')
                : 'Nuevo pedido'}
            </h3>
            {pedidoMesa && mostrarPedidoExistente && (
              <p className="text-sm text-cafe-500">
                Estado: <span className="font-medium capitalize">{pedidoMesa.estado}</span>
              </p>
            )}
          </div>

          {/* Contenido: Pedido existente o Carrito nuevo */}
          <div className="flex-1 overflow-auto p-4">
            {pedidoMesa && mostrarPedidoExistente ? (
              // Mostrar items del pedido existente
              <div>
                {pedidoDetalle?.detalle && pedidoDetalle.detalle.length > 0 ? (
                  <div className="space-y-3">
                    {pedidoDetalle.detalle.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className={clsx(
                          "rounded-button p-3 transition-all cursor-pointer",
                          item.estado === 'pendiente' 
                            ? "bg-yellow-50 hover:bg-yellow-100 border-2 border-yellow-200 hover:border-yellow-300" 
                            : "bg-beige-50",
                          isLoading && "opacity-50 cursor-wait"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {getEstadoIcon(item.estado)}
                              <h4 className={clsx(
                                "font-medium line-clamp-1",
                                item.estado === 'pendiente' ? "text-cafe-800" : "text-cafe-600"
                              )}>
                                {item.producto_nombre}
                              </h4>
                              
                            </div>
                            <p className="text-sm text-cafe-500 ml-6">
                              {item.cantidad} x {formatCurrency(parseFloat(item.precio_unitario))}
                            </p>
                            {item.notas && (
                              <p className="text-xs text-oliva-600 ml-6 mt-1 italic">
                                {item.notas}
                              </p>
                            )}
                            <p className="text-xs text-cafe-400 ml-6 mt-1">
                              {getEstadoLabel(item.estado)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-cafe-800">
                              {formatCurrency(parseFloat(item.subtotal))}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-cafe-400">
                    <p>Cargando detalle...</p>
                  </div>
                )}

                {/* Resumen del pedido existente */}
                {pedidoDetalle && (
                  <div className="mt-4 pt-4 border-t border-beige-200 space-y-2">
                    <div className="flex justify-between text-sm text-cafe-600">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(parseFloat(pedidoDetalle.subtotal || 0))}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg text-cafe-800">
                      <span>Total:</span>
                      <span>{formatCurrency(parseFloat(pedidoDetalle.total || 0))}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Carrito para nuevo pedido o agregar items
              carrito.length === 0 ? (
                <div className="text-center py-8 text-cafe-400">
                  <FiPlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Seleccione productos</p>
                  <p className="text-sm">para {pedidoMesa ? 'agregar al pedido' : 'crear el pedido'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {carrito.map((item) => (
                    <div
                      key={item.producto_id}
                      className="bg-beige-50 rounded-button p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-cafe-800 line-clamp-1">
                            {item.nombre}
                          </h4>
                          <p className="text-sm text-cafe-500">
                            {formatCurrency(item.precio)} c/u
                          </p>
                          {item.notas && (
                            <p className="text-xs text-oliva-600 mt-1 italic">
                              {item.notas}
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-cafe-800">
                            {formatCurrency(item.precio * item.cantidad)}
                          </p>
                        </div>
                      </div>

                      {/* Controles */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCantidad(item.producto_id, -1)}
                            className="w-8 h-8 bg-beige-200 rounded-full flex items-center justify-center hover:bg-beige-300"
                          >
                            <FiMinus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-semibold">
                            {item.cantidad}
                          </span>
                          <button
                            onClick={() => handleCantidad(item.producto_id, 1)}
                            className="w-8 h-8 bg-oliva-400 text-white rounded-full flex items-center justify-center hover:bg-oliva-500"
                          >
                            <FiPlus className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleNotaItem(item)}
                            className="w-8 h-8 bg-beige-200 rounded-full flex items-center justify-center hover:bg-beige-300"
                            title="Agregar nota"
                          >
                            <FiEdit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEliminar(item.producto_id)}
                            className="w-8 h-8 bg-terracota-100 text-terracota-600 rounded-full flex items-center justify-center hover:bg-terracota-200"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Footer con total y botones */}
          <div className="p-4 border-t border-beige-200 bg-beige-50">
            {pedidoMesa && mostrarPedidoExistente ? (
              // Botones para pedido existente
              <div className="space-y-3">
                <div className="flex items-center justify-between text-lg">
                  <span className="text-cafe-600">Total cuenta:</span>
                  <span className="text-2xl font-bold text-cafe-800">
                    {formatCurrency(totalPedidoExistente)}
                  </span>
                </div>
                
                {/* Mostrar estado actual del pedido */}
                {pedidoMesa.estado === 'listo' && (
                  <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-center font-medium">
                    Todos los platillos listos
                  </div>
                )}
                
                {pedidoMesa.estado === 'cuenta' && (
                  <div className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg text-center font-medium">
                    Cuenta solicitada - Esperando pago
                  </div>
                )}

                {pedidoMesa.estado === 'entregado' && (
                  <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-center font-medium">
                    Pedido entregado - Pendiente de cobro en caja
                  </div>
                )}

                {/* Botones según estado */}
                {pedidoMesa.estado !== 'cuenta' && pedidoMesa.estado !== 'entregado' && (
                  <>
                    <button
                      onClick={() => setMostrarPedidoExistente(false)}
                      className="btn-primary w-full py-3"
                    >
                      <FiPlus className="w-5 h-5 inline mr-2" />
                      Agregar más productos
                    </button>
                    {pedidoMesa.estado === 'listo' ? (
                      <button
                        onClick={handleSolicitarCuenta}
                        className="btn-secondary w-full py-3"
                      >
                        <FiFileText className="w-5 h-5 inline mr-2" />
                        Solicitar Cuenta
                      </button>
                    ) : (
                      <div className="bg-amber-50 text-amber-700 px-4 py-3 rounded-lg text-center text-sm font-medium border border-amber-200">
                        ⏳ Items en preparación - La cuenta estará disponible cuando estén listos
                      </div>
                    )}
                  </>
                )}
                
                {pedidoMesa.estado === 'cuenta' && (
                  <button
                    onClick={handleTerminarPedido}
                    className="btn-primary w-full py-3 bg-green-600 hover:bg-green-700"
                  >
                    <FiCheck className="w-5 h-5 inline mr-2" />
                    Marcar como Entregado
                  </button>
                )}
              </div>
            ) : (
              // Botón para enviar carrito
              <>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-cafe-600">
                    {pedidoMesa ? 'Total a agregar:' : 'Total:'}
                  </span>
                  <span className="text-2xl font-bold text-cafe-800">
                    {formatCurrency(calcularTotal())}
                  </span>
                </div>
                {pedidoMesa && (
                  <div className="flex items-center justify-between mb-4 text-sm text-cafe-500">
                    <span>Nuevo total cuenta:</span>
                    <span className="font-semibold text-cafe-700">
                      {formatCurrency(totalPedidoExistente + calcularTotal())}
                    </span>
                  </div>
                )}
                <button
                  onClick={handleEnviarPedido}
                  disabled={carrito.length === 0 || isLoading}
                  className="btn-primary w-full py-4 text-lg disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Enviando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <FiSend className="w-5 h-5" />
                      {pedidoMesa ? 'Agregar al Pedido' : 'Enviar a Cocina'}
                    </span>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de nota de item */}
      {notaItem.id && (
        <div className="modal-overlay" onClick={() => setNotaItem({ id: null, nota: '' })}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-cafe-800 mb-4">
              Nota para el producto
            </h3>
            <textarea
              value={notaItem.nota}
              onChange={(e) => setNotaItem({ ...notaItem, nota: e.target.value })}
              placeholder="Ej: Sin cebolla, extra queso..."
              className="input resize-none mb-4"
              rows={3}
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setNotaItem({ id: null, nota: '' })}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button onClick={guardarNotaItem} className="btn-primary flex-1">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
