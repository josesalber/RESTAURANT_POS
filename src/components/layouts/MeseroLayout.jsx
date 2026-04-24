import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@store/authStore';
import { useSocket } from '@hooks/useSocket';
import { FiGrid, FiClock, FiLogOut, FiUser, FiCalendar, FiWifi, FiWifiOff } from 'react-icons/fi';

export default function MeseroLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { isConnected, connect, disconnect } = useSocket();
  const [showReconnect, setShowReconnect] = useState(false);

  useEffect(() => {
    // Conectar socket al montar el layout
    if (!isConnected) {
      console.log('🔌 MeseroLayout: Conectando WebSocket...');
      connect();
    }

    // Mostrar indicador de reconexión después de 5 segundos sin conexión
    let timeout;
    if (!isConnected) {
      timeout = setTimeout(() => {
        setShowReconnect(true);
      }, 5000);
    } else {
      setShowReconnect(false);
    }

    return () => {
      clearTimeout(timeout);
      // No desconectar al desmontar para mantener la conexión entre navegaciones
      // solo desconectar al hacer logout
    };
  }, [isConnected, connect]);

  const handleLogout = () => {
    disconnect(); // Desconectar WebSocket
    logout();
    navigate('/login');
  };

  const handleReconnect = () => {
    setShowReconnect(false);
    connect();
  };

  return (
    <div className="min-h-screen bg-beige-100 flex flex-col">
      {/* Header para tablets */}
      <header className="header flex items-center justify-between safe-top">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-oliva-400 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {user?.nombre?.charAt(0) || 'M'}
            </span>
          </div>
          <div>
            <h1 className="font-semibold text-cafe-800">Mesero</h1>
            <p className="text-sm text-cafe-500">{user?.nombre || 'Usuario'}</p>
          </div>
        </div>

        {/* Indicador de conexión WebSocket */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-1 bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs">
              <FiWifi className="w-3 h-3" />
              <span className="hidden md:inline">Tiempo Real</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs">
              <FiWifiOff className="w-3 h-3" />
              <span className="hidden md:inline">Sin conexión</span>
            </div>
          )}
        </div>

        {/* Navegación */}
        <nav className="flex items-center gap-2">
          <NavLink
            to="/mesero"
            end
            className={({ isActive }) =>
              `btn-touch flex flex-col items-center justify-center px-4 rounded-button transition-colors ${
                isActive
                  ? 'bg-oliva-400 text-white'
                  : 'bg-beige-200 text-cafe-700 hover:bg-beige-300'
              }`
            }
          >
            <FiGrid className="w-5 h-5" />
            <span className="text-xs mt-1">Mesas</span>
          </NavLink>

          <NavLink
            to="/mesero/historial"
            className={({ isActive }) =>
              `btn-touch flex flex-col items-center justify-center px-4 rounded-button transition-colors ${
                isActive
                  ? 'bg-oliva-400 text-white'
                  : 'bg-beige-200 text-cafe-700 hover:bg-beige-300'
              }`
            }
          >
            <FiClock className="w-5 h-5" />
            <span className="text-xs mt-1">Historial</span>
          </NavLink>

          <NavLink
            to="/mesero/reservas"
            className={({ isActive }) =>
              `btn-touch flex flex-col items-center justify-center px-4 rounded-button transition-colors ${
                isActive
                  ? 'bg-oliva-400 text-white'
                  : 'bg-beige-200 text-cafe-700 hover:bg-beige-300'
              }`
            }
          >
            <FiCalendar className="w-5 h-5" />
            <span className="text-xs mt-1">Reservas</span>
          </NavLink>
        </nav>

        {/* Botón logout */}
        <button
          onClick={handleLogout}
          className="btn-touch flex items-center gap-2 px-4 bg-terracota-100 text-terracota-600 rounded-button hover:bg-terracota-200"
        >
          <FiLogOut className="w-5 h-5" />
          <span className="hidden tablet:inline">Salir</span>
        </button>
      </header>

      {/* Banner de reconexión si está desconectado */}
      {showReconnect && !isConnected && (
        <div className="bg-red-500 text-white px-4 py-2 text-center text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FiWifiOff className="w-4 h-4" />
            Sin conexión en tiempo real. Las notificaciones pueden retrasarse.
          </span>
          <button
            onClick={handleReconnect}
            className="bg-white text-red-500 px-3 py-1 rounded-full text-xs font-medium hover:bg-red-50"
          >
            Reconectar
          </button>
        </div>
      )}

      {/* Contenido principal */}
      <main className="flex-1 overflow-auto p-4 safe-bottom">
        <Outlet />
      </main>
    </div>
  );
}
