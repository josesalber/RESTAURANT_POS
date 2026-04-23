import { useEffect, useState } from 'react';
import api from '@services/api';
import { FiPlus, FiEdit2, FiTrash2, FiMove } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AdminCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [categoriaEditar, setCategoriaEditar] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '', color: '#889E81' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/categorias');
      setCategorias(response.data.data);
    } catch (error) {
      toast.error('Error al cargar categorías');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNuevo = () => {
    setCategoriaEditar(null);
    setFormData({ nombre: '', descripcion: '', color: '#889E81' });
    setShowModal(true);
  };

  const handleEditar = (categoria) => {
    setCategoriaEditar(categoria);
    setFormData({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || '',
      color: categoria.color || '#889E81',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      toast.error('Ingrese el nombre');
      return;
    }

    setIsSubmitting(true);

    try {
      if (categoriaEditar) {
        await api.put(`/categorias/${categoriaEditar.id}`, formData);
        toast.success('Categoría actualizada');
      } else {
        await api.post('/categorias', formData);
        toast.success('Categoría creada');
      }
      setShowModal(false);
      fetchCategorias();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEliminar = async (categoria) => {
    if (!confirm(`¿Eliminar "${categoria.nombre}"? Los productos asociados quedarán sin categoría.`)) {
      return;
    }

    try {
      await api.delete(`/categorias/${categoria.id}`);
      toast.success('Categoría eliminada');
      fetchCategorias();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar');
    }
  };

  const handleMover = async (categoria, direccion) => {
    const index = categorias.findIndex((c) => c.id === categoria.id);
    if (
      (direccion === -1 && index === 0) ||
      (direccion === 1 && index === categorias.length - 1)
    ) {
      return;
    }

    const nuevoOrden = categorias.map((c, i) => {
      if (i === index) return { ...c, orden: c.orden + direccion };
      if (i === index + direccion) return { ...c, orden: c.orden - direccion };
      return c;
    });

    nuevoOrden.sort((a, b) => a.orden - b.orden);
    setCategorias(nuevoOrden);

    try {
      await api.put('/categorias/reorder', {
        orden: nuevoOrden.map((c) => c.id),
      });
    } catch (error) {
      fetchCategorias();
      toast.error('Error al reordenar');
    }
  };

  const colores = [
    { value: '#889E81', label: 'Oliva' },
    { value: '#CB6D51', label: 'Terracota' },
    { value: '#4E342E', label: 'Café' },
    { value: '#60A5FA', label: 'Azul' },
    { value: '#FBBF24', label: 'Amarillo' },
    { value: '#F87171', label: 'Rojo' },
    { value: '#A78BFA', label: 'Violeta' },
    { value: '#34D399', label: 'Verde' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-cafe-800">Categorías</h2>
          <p className="text-cafe-500">Organización del menú</p>
        </div>

        <button onClick={handleNuevo} className="btn-primary flex items-center gap-2">
          <FiPlus className="w-5 h-5" />
          Nueva Categoría
        </button>
      </div>

      {/* Lista */}
      <div className="card">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : categorias.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-cafe-500">No hay categorías</p>
          </div>
        ) : (
          <div className="space-y-2">
            {categorias.map((categoria, index) => (
              <div
                key={categoria.id}
                className="flex items-center gap-4 p-4 bg-beige-50 rounded-button"
              >
                {/* Color */}
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: categoria.color || '#889E81' }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-cafe-800">{categoria.nombre}</h4>
                  {categoria.descripcion && (
                    <p className="text-sm text-cafe-500 line-clamp-1">
                      {categoria.descripcion}
                    </p>
                  )}
                </div>

                {/* Contador de productos */}
                <span className="text-sm text-cafe-500">
                  {categoria.productos_count || 0} productos
                </span>

                {/* Acciones */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleMover(categoria, -1)}
                    disabled={index === 0}
                    className="p-2 bg-beige-200 rounded-button hover:bg-beige-300 disabled:opacity-30"
                    title="Subir"
                  >
                    <FiMove className="w-4 h-4 rotate-180" />
                  </button>
                  <button
                    onClick={() => handleMover(categoria, 1)}
                    disabled={index === categorias.length - 1}
                    className="p-2 bg-beige-200 rounded-button hover:bg-beige-300 disabled:opacity-30"
                    title="Bajar"
                  >
                    <FiMove className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditar(categoria)}
                    className="p-2 bg-beige-200 rounded-button hover:bg-beige-300"
                    title="Editar"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEliminar(categoria)}
                    className="p-2 bg-terracota-100 text-terracota-600 rounded-button hover:bg-terracota-200"
                    title="Eliminar"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-cafe-800 mb-6">
              {categoriaEditar ? 'Editar Categoría' : 'Nueva Categoría'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="label">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                  className="input resize-none"
                  rows={2}
                />
              </div>

              <div>
                <label className="label">Color</label>
                <div className="flex flex-wrap gap-2">
                  {colores.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`w-10 h-10 rounded-button border-2 transition-transform hover:scale-110 ${
                        formData.color === color.value
                          ? 'border-cafe-800 scale-110'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
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
