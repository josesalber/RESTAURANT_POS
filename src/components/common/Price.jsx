import { formatCurrency } from '@utils/format';

/**
 * Componente para mostrar precios formateados
 */
export default function Price({ value, className = '', ...props }) {
  return (
    <span className={className} {...props}>
      {formatCurrency(value)}
    </span>
  );
}

/**
 * Hook para usar en código JavaScript
 */
export const usePrice = () => {
  return {
    format: formatCurrency,
  };
};
