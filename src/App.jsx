import { useEffect, useState, memo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';
import { useConfigStore } from '@store/configStore';

// Layouts
import AuthLayout from '@components/layouts/AuthLayout';
import MeseroLayout from '@components/layouts/MeseroLayout';
import CocinaLayout from '@components/layouts/CocinaLayout';
import CajaLayout from '@components/layouts/CajaLayout';
import AdminLayout from '@components/layouts/AdminLayout';

// Auth Pages
import Login from '@pages/auth/Login';
import LoginPin from '@pages/auth/LoginPin';

// Mesero Pages
import MeseroMesas from '@pages/mesero/MesasPlano';
import MeseroPedido from '@pages/mesero/Pedido';
import MeseroHistorial from '@pages/mesero/Historial';
import MeseroReservas from '@pages/mesero/Reservas';

// Cocina Pages
import CocinaComandas from '@pages/cocina/Comandas';

// Caja Pages
import CajaPedidos from '@pages/caja/Pedidos';
import CajaPagos from '@pages/caja/Pagos';
import CajaMovimientos from '@pages/caja/Movimientos';
import CajaCierre from '@pages/caja/Cierre';
import CajaReservas from '@pages/caja/Reservas';

// Admin Pages
import AdminDashboard from '@pages/admin/Dashboard';
import AdminProductos from '@pages/admin/Productos';
import AdminCategorias from '@pages/admin/Categorias';
import AdminMesas from '@pages/admin/Mesas';
import AdminUsuarios from '@pages/admin/Usuarios';
import AdminReportes from '@pages/admin/Reportes';
import AdminConfiguraciones from '@pages/admin/Configuraciones';
import AdminImpresoras from '@pages/admin/Impresoras';
import AdminReservas from '@pages/admin/Reservas';
import AdminPlanoMesas from '@pages/admin/PlanoMesas';
import AdminInventario from '@pages/admin/Inventario';
import AdminMenuConfig from '@pages/admin/MenuConfig';
import AdminCajaComportamiento from '@pages/admin/CajaComportamiento';
import AdminTurnos from '@pages/admin/Turnos';

// Protected Route Component
const ProtectedRoute = memo(({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
});

// Public Route (solo accesible si NO está autenticado)
const PublicRoute = memo(({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    // Redirigir según el rol del usuario
    console.log('PublicRoute - Usuario autenticado:', user);
    console.log('PublicRoute - Rol del usuario:', user.rol);
    
    const rolRoutes = {
      'Administrador': '/admin',
      'Caja': '/caja',
      'Mesero': '/mesero',
      'Cocina': '/cocina'
    };

    const redirectPath = rolRoutes[user.rol] || '/admin';
    console.log('PublicRoute - Redirigiendo a:', redirectPath);
    
    return <Navigate to={redirectPath} replace />;
  }

  return children;
});;

function App() {
  const { loadConfig } = useConfigStore();
  const { initializeAuth } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicializar la aplicación
  useEffect(() => {
    const init = async () => {
      await loadConfig();
      await initializeAuth();
      setIsInitialized(true);
    };
    init();
  }, []);

  if (!isInitialized) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-oliva-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-cafe-600">Cargando...</p>
      </div>
    </div>;
  }

  return <AppContent />;
}

function AppContent() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthLayout>
              <Login />
            </AuthLayout>
          </PublicRoute>
        }
      />
      <Route
        path="/pin"
        element={<Navigate to="/login" replace />}
      />

      {/* Mesero Routes */}
      <Route
        path="/mesero"
        element={
          <ProtectedRoute>
            <MeseroLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<MeseroMesas />} />
        <Route path="pedido/:mesaId" element={<MeseroPedido />} />
        <Route path="historial" element={<MeseroHistorial />} />
        <Route path="reservas" element={<MeseroReservas />} />
      </Route>

      {/* Cocina Routes */}
      <Route
        path="/cocina"
        element={
          <ProtectedRoute>
            <CocinaLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CocinaComandas />} />
      </Route>

      {/* Caja Routes */}
      <Route
        path="/caja"
        element={
          <ProtectedRoute>
            <CajaLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CajaPedidos />} />
        <Route path="pedido-nuevo" element={<MeseroPedido />} />
        <Route path="pagos" element={<CajaPagos />} />
        <Route path="movimientos" element={<CajaMovimientos />} />
        <Route path="cierre" element={<CajaCierre />} />
        <Route path="reservas" element={<CajaReservas />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="productos" element={<AdminProductos />} />
        <Route path="categorias" element={<AdminCategorias />} />
        <Route path="menu" element={<AdminMenuConfig />} />
        <Route path="caja-comportamiento" element={<AdminCajaComportamiento />} />
        <Route path="mesas" element={<AdminMesas />} />
        <Route path="plano" element={<AdminPlanoMesas />} />
        <Route path="usuarios" element={<AdminUsuarios />} />
        <Route path="turnos" element={<AdminTurnos />} />
        <Route path="reportes" element={<AdminReportes />} />
        <Route path="movimientos" element={<CajaMovimientos />} />
        <Route path="configuraciones" element={<AdminConfiguraciones />} />
        <Route path="impresoras" element={<AdminImpresoras />} />
        <Route path="reservas" element={<AdminReservas />} />
        <Route path="inventario" element={<AdminInventario />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
