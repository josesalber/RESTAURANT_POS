import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@store/authStore';
import socketService from '@services/socket';
import {
  FiHome,
  FiPackage,
  FiGrid,
  FiUsers,
  FiLayout,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiPrinter,
  FiCalendar,
  FiMap,
  FiList,
  FiBox,
  FiDollarSign,
  FiClock,
} from 'react-icons/fi';
import clsx from 'clsx';
import { useState } from 'react';

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    socketService.connect();
  }, []);

  const handleLogout = () => {
    socketService.disconnect();
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/admin', icon: FiHome, label: 'Dashboard', end: true },
    { to: '/admin/menu', icon: FiPackage, label: 'Menú' },
    { to: '/admin/inventario', icon: FiBox, label: 'Inventario' },
    { to: '/admin/mesas', icon: FiLayout, label: 'Mesas' },
    { to: '/admin/plano', icon: FiMap, label: 'Plano del Salón' },
    { to: '/admin/usuarios', icon: FiUsers, label: 'Usuarios' },
    { to: '/admin/turnos', icon: FiClock, label: 'Turnos' },
    { to: '/admin/reportes', icon: FiBarChart2, label: 'Reportes' },
    { to: '/admin/movimientos', icon: FiList, label: 'Movimientos' },
    { to: '/admin/caja-comportamiento', icon: FiDollarSign, label: 'Comp. de Caja' },
    { to: '/admin/reservas', icon: FiCalendar, label: 'Reservas' },
    { to: '/admin/impresoras', icon: FiPrinter, label: 'Impresoras' },
    { to: '/admin/configuraciones', icon: FiSettings, label: 'Configuración' },
  ];

  const quickLinks = [
    { to: '/mesero', label: 'Ir a Mesero', color: 'bg-oliva-400' },
    { to: '/cocina', label: 'Ir a Cocina', color: 'bg-terracota-500' },
    { to: '/caja', label: 'Ir a Caja', color: 'bg-cafe-600' },
  ];

  return (
    <div className="min-h-screen bg-beige-100 flex">
      {/* Sidebar */}
      <aside
        className={clsx(
          'bg-cafe-800 text-white flex flex-col transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        {/* Header del sidebar */}
        <div className="p-4 border-b border-cafe-700">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-10 h-10 bg-cafe-700 rounded-button flex items-center justify-center hover:bg-cafe-600 transition-colors"
            >
              <FiMenu className="w-5 h-5" />
            </button>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-beige-100">Restaurant POS</h1>
                <p className="text-xs text-beige-300">Panel de Administración</p>
              </div>
            )}
          </div>
        </div>

        {/* Usuario */}
        {sidebarOpen && (
          <div className="p-4 border-b border-cafe-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-oliva-400 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">
                  {user?.nombre?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-beige-100 truncate">
                  {user?.nombre || 'Admin'}
                </h2>
                <p className="text-xs text-beige-300">Administrador</p>
              </div>
            </div>
          </div>
        )}

        {/* Navegación principal */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3 py-3 rounded-button transition-colors',
                      isActive
                        ? 'bg-oliva-400 text-white'
                        : 'text-beige-200 hover:bg-cafe-700 hover:text-white',
                      !sidebarOpen && 'justify-center'
                    )
                  }
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Accesos rápidos */}
          {sidebarOpen && (
            <div className="mt-8">
              <p className="text-xs text-beige-400 uppercase tracking-wider mb-3">
                Accesos Rápidos
              </p>
              <div className="space-y-2">
                {quickLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={clsx(
                      'block px-3 py-2 rounded-button text-sm text-center text-white transition-opacity hover:opacity-90',
                      link.color
                    )}
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-cafe-700">
          <button
            onClick={handleLogout}
            className={clsx(
              'flex items-center gap-2 px-3 py-3 bg-terracota-500 text-white rounded-button hover:bg-terracota-600 transition-colors',
              sidebarOpen ? 'w-full justify-center' : 'w-full justify-center'
            )}
            title="Cerrar Sesión"
          >
            <FiLogOut className="w-5 h-5" />
            {sidebarOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="header flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-cafe-800">Administración</h1>
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
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
