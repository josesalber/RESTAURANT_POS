import { useEffect, useState } from 'react';
import { useProductosStore } from '@store/productosStore';
import { formatCurrency } from '@utils/format';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiToggleLeft,
  FiToggleRight,
} from 'react-icons/fi';
import clsx from 'clsx';
import toast from 'react-hot-toast';

export default function AdminProductos() {
  const {
    productos,
    categorias,
    fetchProductos,
    fetchCategorias,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    toggleDisponible,
    isLoading,
  } = useProductosStore();

  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio_final: '',
    categoria_id: '',
    disponible: true,
    tiempo_preparacion: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProductos({ limit: 200 });
    fetchCategorias();
  }, []);

  // Calcular precio base desde precio final con IGV (más intuitivo para POS)
  const calcularPrecioBase = (precioFinal) => {
    if (!precioFinal || isNaN(precioFinal)) return 0;
    // Por ahora usamos 18% como valor por defecto, pero debería obtenerse de configuración
    const igv = 0.18;
    return parseFloat(precioFinal) / (1 + igv);
  };

  // Calcular precio final desde precio base (para mostrar en readonly)
  const calcularPrecioFinal = (precioBase) => {
    if (!precioBase || isNaN(precioBase)) return 0;
    const igv = 0.18;
    return parseFloat(precioBase) * (1 + igv);
  };

  const productosFiltrados = productos.filter((prod) => {
    const matchBusqueda = prod.nombre
      .toLowerCase()
      .includes(busqueda.toLowerCase());
    const matchCategoria =
      !filtroCategoria || prod.categoria_id === filtroCategoria;
    return matchBusqueda && matchCategoria;
  });

  const handleNuevo = () => {
    setProductoEditar(null);
    setFormData({
      nombre: '',
      descripcion: '',
      precio_final: '',
      categoria_id: categorias[0]?.id || '',
      disponible: true,
      tiempo_preparacion: '',
    });
    setShowModal(true);
  };

  const handleEditar = (producto) => {
    setProductoEditar(producto);
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio_final: producto.precio?.toString() || '',
      categoria_id: producto.categoria_id,
      disponible: producto.disponible,
      tiempo_preparacion: producto.tiempo_preparacion?.toString() || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre || !formData.precio_final || !formData.categoria_id) {
      toast.error('Complete los campos requeridos');
      return;
    }

    setIsSubmitting(true);

    const data = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      categoria_id: formData.categoria_id,
      precio: parseFloat(formData.precio_final),
      disponible: formData.disponible,
      tiempo_preparacion: formData.tiempo_preparacion
        ? parseInt(formData.tiempo_preparacion)
        : null,
    };

    let result;
    if (productoEditar) {
      result = await actualizarProducto(productoEditar.id, data);
    } else {
      result = await crearProducto(data);
    }

    if (result.success) {
      toast.success(productoEditar ? 'Producto actualizado' : 'Producto creado');
      setShowModal(false);
      // Refrescar con límite mayor para incluir el nuevo producto
      fetchProductos({ limit: 100 });
    } else {
      toast.error(result.message);
    }

    setIsSubmitting(false);
  };

  const handleEliminar = async (producto) => {
    if (!confirm(`¿Eliminar "${producto.nombre}"?`)) return;

    const result = await eliminarProducto(producto.id);
    if (result.success) {
      toast.success('Producto eliminado');
    } else {
      toast.error(result.message);
    }
  };

  const handleToggleDisponible = async (producto) => {
    const result = await toggleDisponible(producto.id);
    if (result.success) {
      toast.success(
        result.data.disponible ? 'Producto habilitado' : 'Producto deshabilitado'
      );
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-cafe-800">Productos</h2>
          <p className="text-cafe-500">Gestión del menú</p>
        </div>

        <button onClick={handleNuevo} className="btn-primary flex items-center gap-2">
          <FiPlus className="w-5 h-5" />
          Nuevo Producto
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-xs">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-cafe-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar producto..."
            className="input pl-10"
          />
        </div>

        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="input max-w-xs"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-cafe-500">No hay productos</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Tiempo</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map((producto) => (
                <tr key={producto.id}>
                  <td>
                    <div>
                      <p className="font-medium text-cafe-800">{producto.nombre}</p>
                      {producto.descripcion && (
                        <p className="text-sm text-cafe-500 line-clamp-1">
                          {producto.descripcion}
                        </p>
                      )}
                    </div>
                  </td>
                  <td>{producto.categoria_nombre || '-'}</td>
                  <td className="font-semibold">
                    {formatCurrency(parseFloat(producto.precio))}
                  </td>
                  <td>
                    {producto.tiempo_preparacion
                      ? `${producto.tiempo_preparacion} min`
                      : '-'}
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleDisponible(producto)}
                      className={clsx(
                        'flex items-center gap-2 px-3 py-1 rounded-button text-sm transition-colors',
                        producto.disponible
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      )}
                    >
                      {producto.disponible ? (
                        <>
                          <FiToggleRight className="w-4 h-4" />
                          Activo
                        </>
                      ) : (
                        <>
                          <FiToggleLeft className="w-4 h-4" />
                          Inactivo
                        </>
                      )}
                    </button>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditar(producto)}
                        className="p-2 bg-beige-200 rounded-button hover:bg-beige-300"
                        title="Editar"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEliminar(producto)}
                        className="p-2 bg-terracota-100 text-terracota-600 rounded-button hover:bg-terracota-200"
                        title="Eliminar"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-cafe-800 mb-6">
              {productoEditar ? 'Editar Producto' : 'Nuevo Producto'}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Precio Final (con IGV) *</label>
                  <input
                    type="number"
                    value={formData.precio_final}
                    onChange={(e) =>
                      setFormData({ ...formData, precio_final: e.target.value })
                    }
                    className="input"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="label">Precio Base (sin IGV)</label>
                  <input
                    type="text"
                    value={formData.precio_final ? formatCurrency(calcularPrecioBase(formData.precio_final)) : ''}
                    className="input bg-gray-50"
                    readOnly
                  />
                </div>
              </div>

              <div>
                <label className="label">Categoría *</label>
                <select
                  value={formData.categoria_id}
                  onChange={(e) =>
                    setFormData({ ...formData, categoria_id: e.target.value })
                  }
                  className="input"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Tiempo de preparación (minutos)</label>
                <input
                  type="number"
                  value={formData.tiempo_preparacion}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tiempo_preparacion: e.target.value,
                    })
                  }
                  className="input"
                  min="0"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="disponible"
                  checked={formData.disponible}
                  onChange={(e) =>
                    setFormData({ ...formData, disponible: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-beige-300 text-oliva-400 focus:ring-oliva-400"
                />
                <label htmlFor="disponible" className="text-cafe-700">
                  Disponible para venta
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
