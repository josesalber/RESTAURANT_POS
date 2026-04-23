import clsx from 'clsx';

export default function Card({
  children,
  className,
  onClick,
  hover = false,
  padding = 'normal',
  ...props
}) {
  const paddingStyles = {
    none: '',
    small: 'p-3',
    normal: 'p-4',
    large: 'p-6',
  };

  return (
    <div
      className={clsx(
        'bg-white rounded-card shadow-card',
        paddingStyles[padding],
        hover && 'cursor-pointer hover:shadow-lg transition-shadow',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

Card.Header = function CardHeader({ children, className }) {
  return (
    <div
      className={clsx(
        'pb-4 mb-4 border-b border-beige-200',
        className
      )}
    >
      {children}
    </div>
  );
};

Card.Title = function CardTitle({ children, className }) {
  return (
    <h3 className={clsx('font-semibold text-cafe-800', className)}>
      {children}
    </h3>
  );
};

Card.Subtitle = function CardSubtitle({ children, className }) {
  return (
    <p className={clsx('text-sm text-cafe-500', className)}>{children}</p>
  );
};

Card.Body = function CardBody({ children, className }) {
  return <div className={className}>{children}</div>;
};

Card.Footer = function CardFooter({ children, className }) {
  return (
    <div
      className={clsx(
        'pt-4 mt-4 border-t border-beige-200',
        className
      )}
    >
      {children}
    </div>
  );
};
