import { useEffect, useState } from 'react';
import api from '@services/api';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiLock,
  FiUnlock,
  FiKey,
} from 'react-icons/fi';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { handleApiError } from '@utils';

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    usuario: '',
    password: '',
    rol: 'Mesero',
    pin: '',
    activo: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/usuarios');
      setUsuarios(response.data.data);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const searchLower = busqueda.toLowerCase();
    return (
      u.nombre.toLowerCase().includes(searchLower) ||
      u.usuario.toLowerCase().includes(searchLower) ||
      u.rol.toLowerCase().includes(searchLower)
    );
  });

  const handleNuevo = () => {
    setUsuarioEditar(null);
    setFormData({
      nombre: '',
      apellido: '',
      usuario: '',
      password: '',
      rol: 'Mesero',
      pin: '',
      activo: true,
    });
    setShowModal(true);
  };

  const handleEditar = (usuario) => {
    setUsuarioEditar(usuario);
    setFormData({
      nombre: usuario.nombre,
      apellido: usuario.apellido || '',
      usuario: usuario.username,
      password: '', // No mostrar contraseña
      rol: usuario.rol_nombre,
      pin: '', // No mostrar PIN
      activo: usuario.activo,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre || !formData.apellido || !formData.usuario || !formData.rol) {
      toast.error('Complete los campos requeridos');
      return;
    }

    if (!usuarioEditar && !formData.password) {
      toast.error('La contraseña es requerida');
      return;
    }

    // Validar PIN si se proporciona
    if (formData.pin && (formData.pin.length !== 6 || !/^\d{6}$/.test(formData.pin))) {
      toast.error('El PIN debe tener exactamente 6 dígitos numéricos');
      return;
    }

    setIsSubmitting(true);

    try {
      // Mapear campos del frontend al backend
      const data = {
        username: formData.usuario,
        password: formData.password || undefined,
        nombre: formData.nombre,
        apellido: formData.apellido || '',
        rol_id: getRolId(formData.rol),
        pin: formData.pin || undefined,
        activo: formData.activo
      };

      // Remover campos undefined
      Object.keys(data).forEach(key => {
        if (data[key] === undefined) delete data[key];
      });

      if (usuarioEditar) {
        await api.put(`/usuarios/${usuarioEditar.id}`, data);
        toast.success('Usuario actualizado');
      } else {
        await api.post('/usuarios', data);
        toast.success('Usuario creado');
      }
      setShowModal(false);
      fetchUsuarios();
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActivo = async (usuario) => {
    try {
      await api.put(`/usuarios/${usuario.id}/toggle-activo`);
      toast.success(
        usuario.activo ? 'Usuario desactivado' : 'Usuario activado'
      );
      fetchUsuarios();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleEliminar = async (usuario) => {
    if (!confirm(`¿Eliminar a "${usuario.nombre}"?`)) return;

    try {
      await api.delete(`/usuarios/${usuario.id}`);
      toast.success('Usuario eliminado');
      fetchUsuarios();
    } catch (error) {
      handleApiError(error);
    }
  };

  const generarPin = () => {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setFormData({ ...formData, pin });
  };

  const roles = [
    { value: 'Administrador', label: 'Administrador', color: 'text-purple-600 bg-purple-100' },
    { value: 'Caja', label: 'Caja', color: 'text-blue-600 bg-blue-100' },
    { value: 'Mesero', label: 'Mesero', color: 'text-green-600 bg-green-100' },
    { value: 'Cocina', label: 'Cocina', color: 'text-orange-600 bg-orange-100' },
  ];

  const getRolBadge = (rol) => {
    const config = roles.find((r) => r.value.toLowerCase() === rol?.toLowerCase());
    return config || { label: rol, color: 'text-cafe-600 bg-beige-200' };
  };

  const getRolId = (rolNombre) => {
    const rolMap = {
      'Administrador': 1,
      'Caja': 2,
      'Mesero': 3,
      'Cocina': 4
    };
    return rolMap[rolNombre] || 3; // Default a Mesero
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-cafe-800">Usuarios</h2>
          <p className="text-cafe-500">Gestión de personal</p>
        </div>

        <button onClick={handleNuevo} className="btn-primary flex items-center gap-2">
          <FiPlus className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </div>

      {/* Búsqueda */}
      <div className="mb-6">
        <div className="relative max-w-xs">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-cafe-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar usuario..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-cafe-500">No hay usuarios</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((usuario) => {
                const rolBadge = getRolBadge(usuario.rol_nombre);

                return (
                  <tr key={usuario.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-oliva-400 rounded-full flex items-center justify-center text-white font-medium">
                          {usuario.nombre.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-cafe-800">
                            {usuario.nombre} {usuario.apellido}
                          </p>
                          <p className="text-sm text-cafe-500">@{usuario.username}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={clsx(
                          'badge capitalize',
                          rolBadge.color
                        )}
                      >
                        {rolBadge.label}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleActivo(usuario)}
                        className={clsx(
                          'flex items-center gap-2 px-3 py-1 rounded-button text-sm',
                          usuario.activo
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        )}
                      >
                        {usuario.activo ? (
                          <>
                            <FiUnlock className="w-4 h-4" />
                            Activo
                          </>
                        ) : (
                          <>
                            <FiLock className="w-4 h-4" />
                            Inactivo
                          </>
                        )}
                      </button>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditar(usuario)}
                          className="p-2 bg-beige-200 rounded-button hover:bg-beige-300"
                          title="Editar"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEliminar(usuario)}
                          className="p-2 bg-terracota-100 text-terracota-600 rounded-button hover:bg-terracota-200"
                          title="Eliminar"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content p-6 max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-cafe-800 mb-6">
              {usuarioEditar ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Nombre *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">Apellido *</label>
                  <input
                    type="text"
                    value={formData.apellido}
                    onChange={(e) =>
                      setFormData({ ...formData, apellido: e.target.value })
                    }
                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Documento Identidad *</label>
                  <input
                    type="text"
                    value={formData.usuario}
                    onChange={(e) =>
                      setFormData({ ...formData, usuario: e.target.value })
                    }
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">Rol *</label>
                  <select
                    value={formData.rol}
                    onChange={(e) =>
                      setFormData({ ...formData, rol: e.target.value })
                    }
                    className="input"
                    required
                  >
                    {roles.map((rol) => (
                      <option key={rol.value} value={rol.value}>
                        {rol.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">
                  Contraseña {usuarioEditar ? '(dejar vacío para no cambiar)' : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="input"
                  {...(!usuarioEditar && { required: true })}
                />
              </div>

              <div>
                <label className="label">PIN de acceso rápido</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.pin}
                    onChange={(e) =>
                      setFormData({ ...formData, pin: e.target.value })
                    }
                    className="input"
                    maxLength={6}
                    placeholder="6 dígitos"
                  />
                  <button
                    type="button"
                    onClick={generarPin}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <FiKey className="w-4 h-4" />
                    Generar
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) =>
                    setFormData({ ...formData, activo: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-beige-300 text-oliva-400 focus:ring-oliva-400"
                />
                <label htmlFor="activo" className="text-cafe-700">
                  Usuario activo
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-1"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
