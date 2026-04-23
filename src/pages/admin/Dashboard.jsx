import { useEffect, useRef, useState } from 'react';
import { useDashboardStore } from '@store/dashboardStore';
import { useSocket } from '@hooks/useSocket';
import {
  FiDollarSign,
  FiShoppingBag,
  FiUsers,
  FiTrendingUp,
  FiClock,
  FiAlertTriangle,
  FiRefreshCw,
} from 'react-icons/fi';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '@utils/format';

export default function AdminDashboard() {
  const {
    dashboard,
    ventasHora,
    ventasHoraPedido,
    ventasHoraPago,
    topProductos,
    personalActivo,
    tiempoPreparacion,
    mesas,
    isLoading,
    error,
    isRealTimeEnabled,
    fetchDashboard,
    updateDashboard,
    updateVentasHora,
    updateVentasHoraPedido,
    updateVentasHoraPago,
    updateTopProductos,
    updatePersonalActivo,
    updateTiempoPreparacion,
    updateMesas,
    setRealTimeEnabled,
  } = useDashboardStore();

  const { socket, isConnected } = useSocket();
  const listenersConfigured = useRef(false);
  const [chartType, setChartType] = useState('pagos'); // 'pagos' o 'pedidos'

  // Debug: log cuando el componente se renderiza
  console.log('🔄 Dashboard render - ventasHora length:', ventasHora?.length, 'isConnected:', isConnected);

  useEffect(() => {
    console.log('Dashboard useEffect - socket:', socket?.id, 'isConnected:', isConnected);
    console.log('Dashboard useEffect - current location:', window.location.pathname);
    
    // Cargar datos iniciales del dashboard SIEMPRE al montar
    console.log('Cargando datos iniciales del dashboard...');
    fetchDashboard();

    // Conectar socket si no está conectado
    
    if (!isConnected) {
      console.log('Conectando socket desde Dashboard...');
      socket?.connect();
    }
  }, []); // Solo ejecutar una vez al montar el componente

  // Efecto separado para manejar la conexión del socket
  useEffect(() => {
    if (isConnected && socket) {
      console.log('Socket conectado, habilitando modo tiempo real...');
      setRealTimeEnabled(true);
      
      // Solicitar estado actual inmediatamente cuando se conecta
      console.log('Solicitando estado actual del dashboard...');
      socket.emit('dashboard:requestState');
      
      // Si los listeners no están configurados, configurarlos
      if (!listenersConfigured.current) {
        console.log('Configurando listeners de WebSocket después de conexión...');
        listenersConfigured.current = true;
        
        // Listener para actualizaciones de estadísticas del dashboard
        socket.on('dashboard:stats', (data) => {
          console.log('Dashboard stats update:', data);
          updateDashboard(data);
        });

        // Listener para actualizaciones de ventas por hora
        socket.on('dashboard:ventasHora', (data) => {
          console.log('Ventas por hora update:', data);
          updateVentasHora(data);
        });

        // Listener para actualizaciones de pedidos por hora
        socket.on('dashboard:ventasHoraPedido', (data) => {
          console.log('Pedidos por hora update:', data);
          updateVentasHoraPedido(data);
        });

        // Listener para actualizaciones de pagos por hora
        socket.on('dashboard:ventasHoraPago', (data) => {
          console.log('Pagos por hora update:', data);
          updateVentasHoraPago(data);
        });

        // Listener para actualizaciones de top productos
        socket.on('dashboard:topProductos', (data) => {
          console.log('Top productos update:', data);
          updateTopProductos(data);
        });

        // Listener para actualizaciones de personal activo
        socket.on('dashboard:personalActivo', (data) => {
          console.log('Personal activo update:', data);
          updatePersonalActivo(data);
        });

        // Listener para actualizaciones de mesas
        socket.on('mesa:estadoCambiado', (data) => {
          console.log('Estado de mesa cambiado:', data);
          // Cuando cambia el estado de una mesa, refrescamos los datos del dashboard
          fetchDashboard();
        });
      }
    } else if (!isConnected) {
      console.log('Socket desconectado, deshabilitando modo tiempo real...');
      setRealTimeEnabled(false);
      // Resetear flag para permitir reconfiguración en reconexión
      listenersConfigured.current = false;
    }
  }, [isConnected, socket, setRealTimeEnabled, updateDashboard, updateVentasHora, updateVentasHoraPedido, updateVentasHoraPago, updateTopProductos, updatePersonalActivo, updateMesas, fetchDashboard]);

  // Cleanup cuando el componente se desmonta
  useEffect(() => {
    console.log('Dashboard useEffect cleanup - componente se está desmontando');
    return () => {
      console.log('Dashboard desmontado, limpiando listeners...');
      if (socket) {
        socket.off('dashboard:stats');
        socket.off('dashboard:ventasHora');
        socket.off('dashboard:ventasHoraPedido');
        socket.off('dashboard:ventasHoraPago');
        socket.off('dashboard:topProductos');
        socket.off('dashboard:personalActivo');
        socket.off('mesa:estadoCambiado');
      }
      listenersConfigured.current = false;
    };
  }, [socket]);

  const handleRefresh = () => {
    fetchDashboard();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center py-12">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="card border-red-200 bg-red-50">
          <div className="flex items-center gap-3">
            <FiAlertTriangle className="w-6 h-6 text-red-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800">Error al cargar el dashboard</h3>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
            <button
              onClick={handleRefresh}
              className="btn btn-primary"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Ventas Hoy',
      value: formatCurrency(dashboard?.ventasHoy || 0),
      icon: FiDollarSign,
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'Pedidos Hoy',
      value: dashboard?.pedidosHoy || 0,
      icon: FiShoppingBag,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Ticket Promedio',
      value: formatCurrency(dashboard?.ticketPromedio || 0),
      icon: FiTrendingUp,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'Pedidos Activos',
      value: (dashboard?.pedidos_activos?.pendientes || 0) + 
             (dashboard?.pedidos_activos?.en_proceso || 0) + 
             (dashboard?.pedidos_activos?.listos || 0) + 
             (dashboard?.pedidos_activos?.esperando_cuenta || 0),
      icon: FiClock,
      color: 'bg-orange-100 text-orange-600',
    },
    {
      label: 'Tiempo Preparación',
      value: tiempoPreparacion ? `${tiempoPreparacion.tiempo_promedio_minutos} min` : 'N/A',
      icon: FiClock,
      color: 'bg-indigo-100 text-indigo-600',
    },
    {
      label: 'Mesas Disponibles',
      value: mesas ? `${mesas.disponibles}/${mesas.disponibles + mesas.total_ocupadas}` : 'N/A',
      icon: FiUsers,
      color: 'bg-teal-100 text-teal-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-cafe-800">Dashboard</h2>
          <p className="text-cafe-500">
            Resumen del {format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isRealTimeEnabled
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isRealTimeEnabled ? 'bg-green-500' : 'bg-gray-400'
            }`} />
            {isRealTimeEnabled ? 'Tiempo Real' : 'Actualización Manual'}
          </div>
          <button
            onClick={handleRefresh}
            className={`btn flex items-center gap-2 ${
              isRealTimeEnabled ? 'btn-secondary opacity-50' : 'btn-secondary'
            }`}
            disabled={isLoading || isRealTimeEnabled}
            title={isRealTimeEnabled ? 'Los datos se actualizan automáticamente' : 'Actualizar datos manualmente'}
          >
            <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isRealTimeEnabled ? 'Auto-actualización' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-6 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-cafe-500">{stat.label}</p>
                <p className="text-2xl font-bold text-cafe-800 mt-1">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {/* Ventas por hora con filtro */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-cafe-800">
              {chartType === 'pedidos' ? 'Pedidos por Hora' : 'Pagos por Hora'}
            </h3>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="px-3 py-1 border border-cafe-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-oliva-500"
            >
              <option value="pagos">Pagos</option>
              <option value="pedidos">Pedidos</option>
            </select>
          </div>
          <div className="h-64">
            {(chartType === 'pedidos' ? ventasHoraPedido : ventasHoraPago) && (chartType === 'pedidos' ? ventasHoraPedido : ventasHoraPago).length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartType === 'pedidos' ? ventasHoraPedido : ventasHoraPago}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E6C8" />
                  <XAxis dataKey="hora" stroke="#7F6A5F" />
                  <YAxis stroke="#7F6A5F" domain={[0, 'dataMax + 10']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E8E6C8',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [formatCurrency(value), chartType === 'pedidos' ? 'Pedidos' : 'Pagos']}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke={chartType === 'pedidos' ? "#2D5F3D" : "#8B4513"}
                    fill={chartType === 'pedidos' ? "#2D5F3D" : "#8B4513"}
                    fillOpacity={0.7}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-cafe-500">
                <div className="text-center">
                  <p>No hay datos de {chartType === 'pedidos' ? 'pedidos' : 'pagos'} por hora</p>
                  <p className="text-sm mt-2">
                    {chartType === 'pedidos' 
                      ? `ventasHoraPedido: ${JSON.stringify(ventasHoraPedido)}` 
                      : `ventasHoraPago: ${JSON.stringify(ventasHoraPago)}`
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top productos */}
        <div className="card">
          <h3 className="font-semibold text-cafe-800 mb-4">Productos Más Vendidos</h3>
          <div className="h-64">
            {topProductos.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E6C8" />
                  <XAxis type="number" stroke="#7F6A5F" />
                  <YAxis dataKey="nombre" type="category" width={120} stroke="#7F6A5F" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E8E6C8',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [value, 'Cantidad']}
                  />
                  <Bar dataKey="cantidad_vendida" fill="#8B4513" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-cafe-500">
                <div className="text-center">
                  <p>No hay datos de productos vendidos</p>
                  <p className="text-sm mt-2">Verifica que haya pedidos registrados</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alertas y pendientes */}
      <div className="grid grid-cols-1 desktop:grid-cols-2 gap-6">
        {/* Estado de mesas */}
        <div className="card">
          <h3 className="font-semibold text-cafe-800 mb-4 flex items-center gap-2">
            <FiShoppingBag className="w-5 h-5 text-oliva-500" />
            Estado de Mesas
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-cafe-600">Mesas Ocupadas</span>
              <span className="font-bold text-cafe-800">
                {dashboard?.mesas?.ocupadas || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-cafe-600">Esperando Cuenta</span>
              <span className="font-bold text-orange-600">
                {dashboard?.mesas?.esperando_cuenta || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-cafe-600">Mesas Libres</span>
              <span className="font-bold text-green-600">
                {dashboard?.mesas?.disponibles || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Usuarios activos */}
        <div className="card">
          <h3 className="font-semibold text-cafe-800 mb-4 flex items-center gap-2">
            <FiUsers className="w-5 h-5 text-blue-500" />
            Personal Activo en Tiempo Real
          </h3>
          <div className="space-y-3">
            {personalActivo && personalActivo.length > 0 ? (
              personalActivo.map((usuario, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-oliva-400 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {usuario.nombre_completo?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-cafe-800 font-medium">{usuario.nombre_completo}</p>
                    <p className="text-xs text-cafe-500 capitalize">{usuario.rol}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-cafe-500 text-sm">No hay usuarios conectados</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
