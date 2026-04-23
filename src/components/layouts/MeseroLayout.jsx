import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@store/authStore';
import socketService from '@services/socket';
import { FiGrid, FiClock, FiLogOut, FiUser, FiCalendar } from 'react-icons/fi';

export default function MeseroLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Conectar socket al montar
    socketService.connect();

    return () => {
      // Desconectar al desmontar si es necesario
    };
  }, []);

  const handleLogout = () => {
    socketService.disconnect();
    logout();
    navigate('/login');
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

      {/* Contenido principal */}
      <main className="flex-1 overflow-auto p-4 safe-bottom">
        <Outlet />
      </main>
    </div>
  );
}
