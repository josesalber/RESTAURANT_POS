export * from './date';
export * from './currency';
export * from './validators';
export * from './constants';

// Función helper para manejar errores de API
export const handleApiError = (error, showToast = true) => {
  // Si el error es marcado como silent, no mostrar toast
  if (error.silent) {
    return null;
  }

  if (showToast) {
    // Importar toast dinámicamente para evitar dependencias circulares
    import('react-hot-toast').then(({ toast }) => {
      const message = error.response?.data?.message || 'Ha ocurrido un error';
      toast.error(message);
    });
  }

  return error.response?.data?.message || 'Ha ocurrido un error';
};
