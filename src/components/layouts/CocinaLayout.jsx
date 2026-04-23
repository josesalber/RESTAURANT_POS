import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@store/authStore';
import { useCocinaStore } from '@store/cocinaStore';
import { useInventarioStore } from '@store/inventarioStore';
import socketService from '@services/socket';
import { FiRefreshCw, FiLogOut, FiGrid, FiList, FiAlertTriangle, FiX, FiSearch } from 'react-icons/fi';
import clsx from 'clsx';
import toast from 'react-hot-toast';

export default function CocinaLayout() {
  const { user, logout } = useAuthStore();
  const { vistaAgrupada, toggleVistaAgrupada, filtroEstado, setFiltroEstado, fetchComandas, fetchEstadisticas, estadisticas } = useCocinaStore();
  const { crearAlerta, fetchIngredientesParaAlerta } = useInventarioStore();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAlertPanel, setShowAlertPanel] = useState(false);
  const [ingredientesAlerta, setIngredientesAlerta] = useState([]);
  const [busquedaAlerta, setBusquedaAlerta] = useState('');
  const [enviandoAlerta, setEnviandoAlerta] = useState(null);

  useEffect(() => {
    socketService.connect();
    fetchComandas();
    fetchEstadisticas();

    const interval = setInterval(() => {
      fetchComandas(filtroEstado);
    }, 30000);

    return () => clearInterval(interval);
  }, [filtroEstado]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchComandas(filtroEstado);
    await fetchEstadisticas();
    setIsRefreshing(false);
  };

  const handleLogout = () => {
    socketService.disconnect();
    logout();
    navigate('/login');
  };

  const handleOpenAlertPanel = async () => {
    const data = await fetchIngredientesParaAlerta();
    setIngredientesAlerta(data || []);
    setBusquedaAlerta('');
    setShowAlertPanel(true);
  };

  const handleEnviarAlerta = async (ingrediente) => {
    setEnviandoAlerta(ingrediente.id);

    const result = await crearAlerta({
      ingrediente_id: ingrediente.id,
      tipo: 'solicitud_cocina',
      mensaje: `Cocina solicita reposición de ${ingrediente.nombre} - Stock actual: ${parseFloat(ingrediente.stock_actual).toFixed(2)} ${ingrediente.unidad_medida}`,
    });

    if (result.success) {
      // Enviar por WebSocket
      socketService.emit('inventario:alerta', {
        ingrediente_id: ingrediente.id,
        ingrediente_nombre: ingrediente.nombre,
        stock_actual: ingrediente.stock_actual,
        unidad_medida: ingrediente.unidad_medida,
        mensaje: result.data.mensaje,
        tipo: 'solicitud_cocina',
      });

      toast.success(`Alerta enviada: ${ingrediente.nombre}`, {
        duration: 3000,
        style: { background: '#22c55e', color: '#fff', fontWeight: 'bold' },
      });
    } else {
      toast.error('Error al enviar alerta');
    }

    setEnviandoAlerta(null);
  };

  const ingredientesFiltrados = ingredientesAlerta.filter((ing) =>
    ing.nombre.toLowerCase().includes(busquedaAlerta.toLowerCase()) ||
    ing.categoria.toLowerCase().includes(busquedaAlerta.toLowerCase())
  );

  // Agrupar por categoría
  const categorias = {};
  ingredientesFiltrados.forEach((ing) => {
    if (!categorias[ing.categoria]) categorias[ing.categoria] = [];
    categorias[ing.categoria].push(ing);
  });

  const estados = [
    { value: null, label: 'Todos', color: 'bg-cafe-200' },
    { value: 'pendiente', label: 'Pendientes', color: 'bg-estado-pendiente' },
    { value: 'preparando', label: 'Preparando', color: 'bg-estado-preparando' },
    { value: 'listo', label: 'Listos', color: 'bg-estado-listo' },
  ];

  return (
    <div className="min-h-screen bg-cafe-900 flex flex-col relative">
      {/* Header */}
      <header className="bg-cafe-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-2xl font-bold text-beige-100">Cocina</h1>
            <p className="text-beige-300 text-sm">
              {new Date().toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>

          {estadisticas && (
            <div className="hidden tablet-lg:flex items-center gap-4">
              <div className="bg-estado-pendiente/20 px-4 py-2 rounded-button">
                <span className="text-estado-pendiente font-bold text-lg">
                  {estadisticas.pendientes || 0}
                </span>
                <span className="text-beige-300 text-sm ml-2">Pendientes</span>
              </div>
              <div className="bg-estado-preparando/20 px-4 py-2 rounded-button">
                <span className="text-estado-preparando font-bold text-lg">
                  {estadisticas.preparando || 0}
                </span>
                <span className="text-beige-300 text-sm ml-2">Preparando</span>
              </div>
              <div className="bg-estado-listo/20 px-4 py-2 rounded-button">
                <span className="text-estado-listo font-bold text-lg">
                  {estadisticas.listos || 0}
                </span>
                <span className="text-beige-300 text-sm ml-2">Listos</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-cafe-700 p-1 rounded-button">
            {estados.map((estado) => (
              <button
                key={estado.value || 'todos'}
                onClick={() => setFiltroEstado(estado.value)}
                className={clsx(
                  'px-3 py-2 rounded-button text-sm font-medium transition-colors',
                  filtroEstado === estado.value
                    ? `${estado.color} text-cafe-900`
                    : 'text-beige-300 hover:text-beige-100'
                )}
              >
                {estado.label}
              </button>
            ))}
          </div>

          <button
            onClick={toggleVistaAgrupada}
            className={clsx(
              'btn-touch rounded-button',
              vistaAgrupada
                ? 'bg-oliva-400 text-white'
                : 'bg-cafe-700 text-beige-300'
            )}
            title={vistaAgrupada ? 'Vista por pedido' : 'Vista agrupada'}
          >
            {vistaAgrupada ? <FiList className="w-5 h-5" /> : <FiGrid className="w-5 h-5" />}
          </button>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn-touch bg-oliva-400 text-white rounded-button hover:bg-oliva-500 disabled:opacity-50"
          >
            <FiRefreshCw className={clsx('w-5 h-5', isRefreshing && 'animate-spin')} />
          </button>

          <button
            onClick={handleLogout}
            className="btn-touch bg-terracota-500 text-white rounded-button hover:bg-terracota-600"
          >
            <FiLogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 overflow-auto p-4">
        <Outlet />
      </main>

      {/* BOTÓN ROJO FLOTANTE - ALERTA DE INGREDIENTES */}
      <button
        onClick={handleOpenAlertPanel}
        className="fixed right-6 bottom-6 w-16 h-16 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-full shadow-xl flex items-center justify-center transition-all z-40 hover:scale-110 active:scale-95"
        style={{ boxShadow: '0 4px 20px rgba(220, 38, 38, 0.5)' }}
        title="Alertar falta de ingrediente"
      >
        <FiAlertTriangle className="w-8 h-8" />
      </button>

      {/* PANEL DE ALERTA DE INGREDIENTES */}
      {showAlertPanel && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowAlertPanel(false)} />

          {/* Panel lateral derecho */}
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-cafe-800 shadow-2xl flex flex-col animate-slide-in">
            {/* Header del panel */}
            <div className="bg-red-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiAlertTriangle className="w-6 h-6 text-white" />
                <div>
                  <h2 className="text-lg font-bold text-white">Alerta de Ingredientes</h2>
                  <p className="text-red-100 text-sm">Toque un ingrediente para alertar</p>
                </div>
              </div>
              <button
                onClick={() => setShowAlertPanel(false)}
                className="w-10 h-10 bg-red-700 hover:bg-red-800 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Buscador */}
            <div className="px-4 py-3 border-b border-cafe-700">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-cafe-400" />
                <input
                  type="text"
                  value={busquedaAlerta}
                  onChange={(e) => setBusquedaAlerta(e.target.value)}
                  placeholder="Buscar ingrediente..."
                  className="w-full bg-cafe-700 text-white placeholder-cafe-400 border-none rounded-button pl-10 pr-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-red-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Lista de ingredientes */}
            <div className="flex-1 overflow-y-auto">
              {Object.keys(categorias).length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-cafe-400">No hay ingredientes registrados</p>
                </div>
              ) : (
                Object.entries(categorias).map(([categoria, items]) => (
                  <div key={categoria}>
                    <div className="px-4 py-2 bg-cafe-900 sticky top-0">
                      <span className="text-xs font-bold text-cafe-300 uppercase tracking-wider">{categoria}</span>
                    </div>
                    <div className="divide-y divide-cafe-700">
                      {items.map((ing) => {
                        const stockBajo = ing.stock_minimo > 0 && parseFloat(ing.stock_actual) <= parseFloat(ing.stock_minimo);
                        return (
                          <button
                            key={ing.id}
                            onClick={() => handleEnviarAlerta(ing)}
                            disabled={enviandoAlerta === ing.id}
                            className={clsx(
                              'w-full text-left px-4 py-4 flex items-center gap-3 transition-colors active:scale-[0.98]',
                              stockBajo
                                ? 'bg-red-900/30 hover:bg-red-900/50'
                                : 'hover:bg-cafe-700',
                              enviandoAlerta === ing.id && 'opacity-50'
                            )}
                          >
                            {/* Indicador visual */}
                            <div className={clsx(
                              'w-3 h-3 rounded-full flex-shrink-0',
                              stockBajo ? 'bg-red-500 animate-pulse' : 'bg-green-500'
                            )} />

                            {/* Info del ingrediente */}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium text-base truncate">{ing.nombre}</p>
                              <p className={clsx(
                                'text-sm',
                                stockBajo ? 'text-red-400 font-semibold' : 'text-cafe-300'
                              )}>
                                Stock: {parseFloat(ing.stock_actual).toFixed(2)} {ing.unidad_medida}
                                {ing.stock_minimo > 0 && (
                                  <span className="text-cafe-400"> / mín: {parseFloat(ing.stock_minimo).toFixed(2)}</span>
                                )}
                              </p>
                            </div>

                            {/* Indicador de stock bajo */}
                            {stockBajo && (
                              <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded flex-shrink-0">
                                BAJO
                              </span>
                            )}

                            {/* Feedback de envío */}
                            {enviandoAlerta === ing.id && (
                              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer del panel */}
            <div className="px-4 py-3 bg-cafe-900 border-t border-cafe-700">
              <p className="text-cafe-400 text-xs text-center">
                Al presionar, se enviará una alerta a Administración
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
