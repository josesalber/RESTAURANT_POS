import clsx from 'clsx';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}) {
  return (
    <div className={clsx('text-center py-12', className)}>
      {Icon && (
        <Icon className="w-16 h-16 mx-auto text-cafe-300 mb-4" />
      )}
      {title && (
        <h3 className="text-lg font-medium text-cafe-700 mb-2">{title}</h3>
      )}
      {description && (
        <p className="text-cafe-500 mb-4 max-w-md mx-auto">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
