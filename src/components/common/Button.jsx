import { forwardRef } from 'react';
import clsx from 'clsx';

const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      className,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary:
        'bg-oliva-500 text-white hover:bg-oliva-600 focus:ring-oliva-400',
      secondary:
        'bg-beige-200 text-cafe-700 hover:bg-beige-300 focus:ring-beige-400',
      danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400',
      success: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-400',
      warning:
        'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-400',
      ghost: 'text-cafe-600 hover:bg-beige-200 focus:ring-beige-400',
      outline:
        'border-2 border-oliva-500 text-oliva-600 hover:bg-oliva-50 focus:ring-oliva-400',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-button',
      md: 'px-4 py-2 text-sm rounded-button min-h-touch',
      lg: 'px-6 py-3 text-base rounded-button min-h-touch-lg',
      xl: 'px-8 py-4 text-lg rounded-button',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="spinner w-5 h-5" />
        ) : (
          <>
            {leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
