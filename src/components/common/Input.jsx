import { forwardRef } from 'react';
import clsx from 'clsx';

const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = true,
      className,
      containerClassName,
      ...props
    },
    ref
  ) => {
    return (
      <div className={clsx(fullWidth && 'w-full', containerClassName)}>
        {label && (
          <label className="block text-sm font-medium text-cafe-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cafe-400">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            className={clsx(
              'input',
              fullWidth && 'w-full',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-red-500 focus:ring-red-400 focus:border-red-500',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-cafe-400">
              {rightIcon}
            </span>
          )}
        </div>
        {(error || helperText) && (
          <p
            className={clsx(
              'text-xs mt-1',
              error ? 'text-red-500' : 'text-cafe-400'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
