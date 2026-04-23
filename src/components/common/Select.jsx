import { forwardRef } from 'react';
import clsx from 'clsx';

const Select = forwardRef(
  (
    {
      label,
      error,
      helperText,
      options = [],
      placeholder,
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
        <select
          ref={ref}
          className={clsx(
            'input',
            fullWidth && 'w-full',
            error && 'border-red-500 focus:ring-red-400 focus:border-red-500',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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

Select.displayName = 'Select';

export default Select;
