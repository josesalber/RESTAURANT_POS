import { useState, useEffect } from 'react';
import api from '@services/api';
import {
  FiPrinter,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiWifi,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AdminImpresoras() {
  const [impresoras, setImpresoras] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingImpresora, setEditingImpresora] = useState(null);
  const [testingId, setTestingId] = useState(null);

  const [form, setForm] = useState({
    nombre: '',
    tipo: 'ticket',
    conexion: 'usb',
    ip: '',
    puerto: '',
    ubicacion: '',
    activa: true,
  });

  useEffect(() => {
    fetchImpresoras();
  }, []);

  const fetchImpresoras = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/impresoras');
      setImpresoras(response.data.data || []);
    } catch (error) {
      // Simular datos si el endpoint no existe
      setImpresoras([
        {
          id: 1,
          nombre: 'Ticket Caja',
          tipo: 'ticket',
          conexion: 'usb',
          ubicacion: 'Caja Principal',
          activa: true,
          estado: 'online',
        },
        {
          id: 2,
          nombre: 'Cocina Principal',
          tipo: 'comanda',
          conexion: 'red',
          ip: '192.168.1.100',
          puerto: '9100',
          ubicacion: 'Cocina',
          activa: true,
          estado: 'online',
        },
        {
          id: 3,
          nombre: 'Bar',
          tipo: 'comanda',
          conexion: 'red',
          ip: '192.168.1.101',
          puerto: '9100',
          ubicacion: 'Barra',
          activa: false,
          estado: 'offline',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (impresora = null) => {
    if (impresora) {
      setEditingImpresora(impresora);
      setForm({
        nombre: impresora.nombre,
        tipo: impresora.tipo,
        conexion: impresora.conexion,
        ip: impresora.ip || '',
        puerto: impresora.puerto || '',
        ubicacion: impresora.ubicacion,
        activa: impresora.activa,
      });
    } else {
      setEditingImpresora(null);
      setForm({
        nombre: '',
        tipo: 'ticket',
        conexion: 'usb',
        ip: '',
        puerto: '',
        ubicacion: '',
        activa: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingImpresora(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nombre || !form.ubicacion) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    if (form.conexion === 'red' && (!form.ip || !form.puerto)) {
      toast.error('Complete IP y puerto para conexión de red');
      return;
    }

    try {
      if (editingImpresora) {
        await api.put(`/impresoras/${editingImpresora.id}`, form);
        toast.success('Impresora actualizada');
      } else {
        await api.post('/impresoras', form);
        toast.success('Impresora agregada');
      }
      fetchImpresoras();
      handleCloseModal();
    } catch (error) {
      toast.error('Error al guardar impresora');
    }
  };

  const handleDelete = async (impresora) => {
    if (!confirm(`¿Eliminar impresora "${impresora.nombre}"?`)) return;

    try {
      await api.delete(`/impresoras/${impresora.id}`);
      toast.success('Impresora eliminada');
      fetchImpresoras();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const handleTestPrint = async (impresora) => {
    try {
      setTestingId(impresora.id);
      await api.post(`/impresoras/${impresora.id}/test`);
      toast.success('Impresión de prueba enviada');
    } catch (error) {
      toast.error('Error en prueba de impresión');
    } finally {
      setTestingId(null);
    }
  };

  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case 'ticket':
        return 'Ticket (Caja)';
      case 'comanda':
        return 'Comanda (Cocina)';
      case 'factura':
        return 'Factura';
      default:
        return tipo;
    }
  };

  const getConexionLabel = (conexion) => {
    switch (conexion) {
      case 'usb':
        return 'USB';
      case 'red':
        return 'Red';
      case 'bluetooth':
        return 'Bluetooth';
      default:
        return conexion;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-cafe-800">Impresoras</h2>
          <p className="text-cafe-500">Gestión de impresoras del sistema</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchImpresoras}
            className="btn-secondary flex items-center gap-2"
          >
            <FiRefreshCw className="w-5 h-5" />
            Actualizar
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus className="w-5 h-5" />
            Agregar
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="spinner" />
        </div>
      ) : impresoras.length === 0 ? (
        <div className="card text-center py-12">
          <FiPrinter className="w-16 h-16 mx-auto text-cafe-300 mb-4" />
          <p className="text-cafe-500 mb-2">No hay impresoras configuradas</p>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary mt-4"
          >
            Agregar Impresora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-4">
          {impresoras.map((impresora) => (
            <div
              key={impresora.id}
              className={`card border-l-4 ${
                impresora.activa
                  ? impresora.estado === 'online'
                    ? 'border-l-green-500'
                    : 'border-l-yellow-500'
                  : 'border-l-gray-400'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      impresora.activa ? 'bg-oliva-100' : 'bg-gray-100'
                    }`}
                  >
                    <FiPrinter
                      className={`w-6 h-6 ${
                        impresora.activa ? 'text-oliva-600' : 'text-gray-400'
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-cafe-800">
                      {impresora.nombre}
                    </h3>
                    <p className="text-sm text-cafe-500">{impresora.ubicacion}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {impresora.estado === 'online' ? (
                    <FiCheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <FiXCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-cafe-500">Tipo</span>
                  <span className="text-cafe-700">
                    {getTipoLabel(impresora.tipo)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-cafe-500">Conexión</span>
                  <span className="text-cafe-700 flex items-center gap-1">
                    {impresora.conexion === 'red' && (
                      <FiWifi className="w-4 h-4" />
                    )}
                    {getConexionLabel(impresora.conexion)}
                  </span>
                </div>
                {impresora.ip && (
                  <div className="flex justify-between text-sm">
                    <span className="text-cafe-500">IP</span>
                    <span className="text-cafe-700 font-mono">
                      {impresora.ip}:{impresora.puerto}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-cafe-500">Estado</span>
                  <span
                    className={`font-medium ${
                      impresora.activa ? 'text-green-600' : 'text-gray-500'
                    }`}
                  >
                    {impresora.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-beige-200">
                <button
                  onClick={() => handleTestPrint(impresora)}
                  disabled={!impresora.activa || testingId === impresora.id}
                  className="btn-secondary text-sm flex-1 flex items-center justify-center gap-1"
                >
                  {testingId === impresora.id ? (
                    <div className="spinner w-4 h-4" />
                  ) : (
                    <FiPrinter className="w-4 h-4" />
                  )}
                  Probar
                </button>
                <button
                  onClick={() => handleOpenModal(impresora)}
                  className="p-2 text-cafe-500 hover:text-oliva-600 hover:bg-beige-200 rounded-button"
                >
                  <FiEdit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(impresora)}
                  className="p-2 text-cafe-500 hover:text-red-600 hover:bg-red-50 rounded-button"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-card w-full max-w-md shadow-xl">
            <div className="p-6 border-b border-beige-200">
              <h3 className="text-lg font-semibold text-cafe-800">
                {editingImpresora ? 'Editar Impresora' : 'Nueva Impresora'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-cafe-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) =>
                    setForm({ ...form, nombre: e.target.value })
                  }
                  className="input w-full"
                  placeholder="Ej: Ticket Caja"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-cafe-700 mb-1">
                  Tipo
                </label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="input w-full"
                >
                  <option value="ticket">Ticket (Caja)</option>
                  <option value="comanda">Comanda (Cocina)</option>
                  <option value="factura">Factura</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-cafe-700 mb-1">
                  Ubicación *
                </label>
                <input
                  type="text"
                  value={form.ubicacion}
                  onChange={(e) =>
                    setForm({ ...form, ubicacion: e.target.value })
                  }
                  className="input w-full"
                  placeholder="Ej: Caja Principal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-cafe-700 mb-1">
                  Conexión
                </label>
                <select
                  value={form.conexion}
                  onChange={(e) =>
                    setForm({ ...form, conexion: e.target.value })
                  }
                  className="input w-full"
                >
                  <option value="usb">USB</option>
                  <option value="red">Red (TCP/IP)</option>
                  <option value="bluetooth">Bluetooth</option>
                </select>
              </div>

              {form.conexion === 'red' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-cafe-700 mb-1">
                      IP *
                    </label>
                    <input
                      type="text"
                      value={form.ip}
                      onChange={(e) => setForm({ ...form, ip: e.target.value })}
                      className="input w-full font-mono"
                      placeholder="192.168.1.100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cafe-700 mb-1">
                      Puerto *
                    </label>
                    <input
                      type="text"
                      value={form.puerto}
                      onChange={(e) =>
                        setForm({ ...form, puerto: e.target.value })
                      }
                      className="input w-full font-mono"
                      placeholder="9100"
                    />
                  </div>
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.activa}
                  onChange={(e) =>
                    setForm({ ...form, activa: e.target.checked })
                  }
                  className="w-5 h-5 text-oliva-500 rounded focus:ring-oliva-400"
                />
                <span className="text-cafe-700">Impresora activa</span>
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingImpresora ? 'Guardar' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
