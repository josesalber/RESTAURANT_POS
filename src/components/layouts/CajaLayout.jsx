import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@store/authStore';
import { useCajaStore } from '@store/cajaStore';
import { formatCurrency } from '@utils/format';
import socketService from '@services/socket';
import {
  FiShoppingBag,
  FiCreditCard,
  FiList,
  FiDollarSign,
  FiLogOut,
  FiAlertCircle,
  FiPlus,
  FiCalendar,
} from 'react-icons/fi';
import clsx from 'clsx';

export default function CajaLayout() {
  const { user, logout } = useAuthStore();
  const { estadoCaja, fetchEstadoCaja } = useCajaStore();
  const navigate = useNavigate();

  useEffect(() => {
    socketService.connect();
    fetchEstadoCaja();
  }, []);

  const handleLogout = () => {
    socketService.disconnect();
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/caja', icon: FiShoppingBag, label: 'Pedidos', end: true },
    { to: '/caja/pedido-nuevo', icon: FiPlus, label: 'Nuevo Pedido' },
    { to: '/caja/pagos', icon: FiCreditCard, label: 'Cobrar' },
    { to: '/caja/movimientos', icon: FiList, label: 'Movimientos' },
    { to: '/caja/reservas', icon: FiCalendar, label: 'Reservas' },
    { to: '/caja/cierre', icon: FiDollarSign, label: 'Cierre' },
  ];

  return (
    <div className="min-h-screen bg-beige-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-cafe-800 text-white flex flex-col">
        {/* Logo y usuario */}
        <div className="p-4 border-b border-cafe-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-oliva-400 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">
                {user?.nombre?.charAt(0) || 'C'}
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-beige-100">{user?.nombre || 'Caja'}</h2>
              <p className="text-sm text-beige-300">Caja</p>
            </div>
          </div>

          {/* Estado de caja */}
          {estadoCaja?.abierta ? (
            <div className="bg-oliva-400/20 rounded-button p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-beige-300 text-sm">Caja abierta</span>
                <span className="w-2 h-2 bg-estado-disponible rounded-full animate-pulse" />
              </div>
              <p className="text-beige-100 font-bold text-lg">
                {formatCurrency(parseFloat(estadoCaja.saldoActual || 0))}
              </p>
            </div>
          ) : (
            <div className="bg-terracota-500/20 rounded-button p-3 flex items-center gap-2">
              <FiAlertCircle className="text-terracota-400" />
              <span className="text-beige-300 text-sm">Caja cerrada</span>
            </div>
          )}
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-4 py-3 rounded-button transition-colors',
                      isActive
                        ? 'bg-oliva-400 text-white'
                        : 'text-beige-200 hover:bg-cafe-700 hover:text-white'
                    )
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-cafe-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-terracota-500 text-white rounded-button hover:bg-terracota-600 transition-colors"
          >
            <FiLogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-auto">
        {/* Header del contenido */}
        <header className="header flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-cafe-800">Panel de Caja</h1>
            <p className="text-cafe-500 text-sm">
              {new Date().toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          {/* Hora actual */}
          <div className="text-right">
            <p className="text-2xl font-bold text-cafe-800">
              {new Date().toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </header>

        {/* Contenido */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
