import { useEffect, useState } from 'react';
import api from '@services/api';
import { FiPlus, FiEdit2, FiTrash2, FiUsers } from 'react-icons/fi';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { handleApiError } from '@utils';

export default function AdminMesas() {
  const [mesas, setMesas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [mesaEditar, setMesaEditar] = useState(null);
  const [formData, setFormData] = useState({
    numero: '',
    capacidad: '4',
    zona: 'Principal',
    estado: 'disponible',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMesas();
  }, []);

  const fetchMesas = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/mesas');
      setMesas(response.data.data);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNuevo = () => {
    setMesaEditar(null);
    const siguienteNumero = mesas.length > 0
      ? Math.max(...mesas.map((m) => m.numero)) + 1
      : 1;
    setFormData({
      numero: siguienteNumero.toString(),
      capacidad: '4',
      zona: 'Principal',
      estado: 'disponible',
    });
    setShowModal(true);
  };

  const handleEditar = (mesa) => {
    setMesaEditar(mesa);
    setFormData({
      numero: mesa.numero.toString(),
      capacidad: mesa.capacidad.toString(),
      zona: mesa.zona || 'Principal',
      estado: mesa.estado,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.numero || !formData.capacidad) {
      toast.error('Complete los campos requeridos');
      return;
    }

    setIsSubmitting(true);

    try {
      const data = {
        ...formData,
        numero: parseInt(formData.numero),
        capacidad: parseInt(formData.capacidad),
      };

      if (mesaEditar) {
        await api.put(`/mesas/${mesaEditar.id}`, data);
        toast.success('Mesa actualizada');
      } else {
        await api.post('/mesas', data);
        toast.success('Mesa creada');
      }
      setShowModal(false);
      fetchMesas();
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEliminar = async (mesa) => {
    if (mesa.estado !== 'disponible') {
      toast.error('No se puede eliminar una mesa ocupada');
      return;
    }

    if (!confirm(`¿Eliminar Mesa ${mesa.numero}?`)) return;

    try {
      await api.delete(`/mesas/${mesa.id}`);
      toast.success('Mesa eliminada');
      fetchMesas();
    } catch (error) {
      handleApiError(error);
    }
  };

  const getEstadoClasses = (estado) => {
    const classes = {
      disponible: 'bg-estado-disponible/20 text-green-700 border-estado-disponible',
      ocupada: 'bg-estado-ocupada/20 text-yellow-700 border-estado-ocupada',
      reservada: 'bg-estado-reservada/20 text-blue-700 border-estado-reservada',
      cuenta: 'bg-estado-cuenta/20 text-red-700 border-estado-cuenta',
    };
    return classes[estado] || classes.disponible;
  };

  // Agrupar por zona
  const mesasPorZona = mesas.reduce((acc, mesa) => {
    const zona = mesa.zona || 'General';
    if (!acc[zona]) acc[zona] = [];
    acc[zona].push(mesa);
    return acc;
  }, {});

  const zonas = ['Principal', 'Terraza', 'Privado', 'Barra', 'Exterior'];
  const capacidades = [2, 4, 6, 8, 10, 12];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-cafe-800">Mesas</h2>
          <p className="text-cafe-500">Configuración del salón</p>
        </div>

        <button onClick={handleNuevo} className="btn-primary flex items-center gap-2">
          <FiPlus className="w-5 h-5" />
          Nueva Mesa
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card bg-green-50">
          <p className="text-sm text-green-600">Disponibles</p>
          <p className="text-2xl font-bold text-green-700">
            {mesas.filter((m) => m.estado === 'disponible').length}
          </p>
        </div>
        <div className="card bg-yellow-50">
          <p className="text-sm text-yellow-600">Ocupadas</p>
          <p className="text-2xl font-bold text-yellow-700">
            {mesas.filter((m) => m.estado === 'ocupada').length}
          </p>
        </div>
        <div className="card bg-blue-50">
          <p className="text-sm text-blue-600">Reservadas</p>
          <p className="text-2xl font-bold text-blue-700">
            {mesas.filter((m) => m.estado === 'reservada').length}
          </p>
        </div>
        <div className="card bg-oliva-50">
          <p className="text-sm text-oliva-600">Total mesas</p>
          <p className="text-2xl font-bold text-oliva-700">{mesas.length}</p>
        </div>
      </div>

      {/* Mesas por zona */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="spinner" />
        </div>
      ) : mesas.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-cafe-500">No hay mesas configuradas</p>
        </div>
      ) : (
        Object.entries(mesasPorZona).map(([zona, mesasZona]) => (
          <div key={zona} className="mb-6">
            <h3 className="text-lg font-semibold text-cafe-700 mb-3">{zona}</h3>
            <div className="grid grid-cols-2 tablet:grid-cols-4 desktop:grid-cols-6 gap-3">
              {mesasZona.map((mesa) => (
                <div
                  key={mesa.id}
                  className={clsx(
                    'relative p-4 rounded-card border-2 text-center',
                    getEstadoClasses(mesa.estado)
                  )}
                >
                  <div className="text-3xl font-bold mb-1">{mesa.numero}</div>
                  <div className="flex items-center justify-center gap-1 text-sm">
                    <FiUsers className="w-4 h-4" />
                    <span>{mesa.capacidad}</span>
                  </div>
                  <div className="text-xs mt-1 capitalize">{mesa.estado}</div>

                  {/* Acciones */}
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditar(mesa)}
                      className="p-1 bg-white rounded shadow hover:bg-beige-100"
                    >
                      <FiEdit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleEliminar(mesa)}
                      className="p-1 bg-white rounded shadow hover:bg-terracota-100"
                    >
                      <FiTrash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-cafe-800 mb-6">
              {mesaEditar ? 'Editar Mesa' : 'Nueva Mesa'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Número *</label>
                  <input
                    type="number"
                    value={formData.numero}
                    onChange={(e) =>
                      setFormData({ ...formData, numero: e.target.value })
                    }
                    className="input"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="label">Capacidad *</label>
                  <select
                    value={formData.capacidad}
                    onChange={(e) =>
                      setFormData({ ...formData, capacidad: e.target.value })
                    }
                    className="input"
                    required
                  >
                    {capacidades.map((cap) => (
                      <option key={cap} value={cap}>
                        {cap} personas
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Zona</label>
                <select
                  value={formData.zona}
                  onChange={(e) =>
                    setFormData({ ...formData, zona: e.target.value })
                  }
                  className="input"
                >
                  {zonas.map((zona) => (
                    <option key={zona} value={zona}>
                      {zona}
                    </option>
                  ))}
                </select>
              </div>

              {mesaEditar && (
                <div>
                  <label className="label">Estado</label>
                  <select
                    value={formData.estado}
                    onChange={(e) =>
                      setFormData({ ...formData, estado: e.target.value })
                    }
                    className="input"
                  >
                    <option value="disponible">Disponible</option>
                    <option value="ocupada">Ocupada</option>
                    <option value="reservada">Reservada</option>
                  </select>
                </div>
              )}

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
