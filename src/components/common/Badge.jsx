import clsx from 'clsx';

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}) {
  const variants = {
    default: 'bg-beige-200 text-cafe-700',
    primary: 'bg-oliva-100 text-oliva-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    // Estados de pedido
    pendiente: 'bg-yellow-100 text-yellow-700',
    preparando: 'bg-blue-100 text-blue-700',
    listo: 'bg-green-100 text-green-700',
    entregado: 'bg-gray-100 text-gray-700',
    cancelado: 'bg-red-100 text-red-700',
    // Estados de mesa
    disponible: 'bg-green-100 text-green-700',
    ocupada: 'bg-red-100 text-red-700',
    reservada: 'bg-blue-100 text-blue-700',
    'por-limpiar': 'bg-yellow-100 text-yellow-700',
    // Roles
    admin: 'bg-purple-100 text-purple-700',
    mesero: 'bg-oliva-100 text-oliva-700',
    cocina: 'bg-orange-100 text-orange-700',
    caja: 'bg-terracota-100 text-terracota-700',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        variants[variant] || variants.default,
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
