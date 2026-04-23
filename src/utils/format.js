/**
 * Utilidades de formateo
 */

// Cache para la configuración de moneda
let cachedMoneda = 'PEN';
let cachedFormatoMoneda = 'es-PE';

/**
 * Actualizar configuración de moneda (llamar desde el store)
 */
export const setMonedaConfig = (moneda, formato) => {
  cachedMoneda = moneda || 'PEN';
  cachedFormatoMoneda = formato || 'es-PE';
};

/**
 * Formatear precio con la moneda configurada
 */
export const formatCurrency = (value, options = {}) => {
  const num = parseFloat(value) || 0;
  
  const formatter = new Intl.NumberFormat(cachedFormatoMoneda, {
    style: 'currency',
    currency: cachedMoneda,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  });
  
  return formatter.format(num);
};

/**
 * Formatear número sin símbolo de moneda
 */
export const formatNumber = (value, decimals = 2) => {
  const num = parseFloat(value) || 0;
  return num.toFixed(decimals);
};

/**
 * Formatear fecha
 */
export const formatDate = (date, format = 'short') => {
  const d = new Date(date);
  
  if (format === 'short') {
    return d.toLocaleDateString('es-PE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }
  
  if (format === 'long') {
    return d.toLocaleDateString('es-PE', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }
  
  if (format === 'datetime') {
    return d.toLocaleString('es-PE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return d.toLocaleDateString('es-PE');
};

/**
 * Formatear tiempo (minutos a formato legible)
 */
export const formatTime = (minutes) => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};
