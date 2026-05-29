import { InputHTMLAttributes, forwardRef, useId } from 'react';
import React from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?:     string;
  error?:     string;
  hint?:      string;
  required?:  boolean;
  iconLeft?:  React.ReactNode;
  iconRight?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, hint, required, iconLeft, iconRight,
     className = '', id: externalId, ...rest }, ref) => {
    const autoId  = useId();
    const inputId = externalId ?? autoId;
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-neutral-700">
            {label}
            {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          {iconLeft && (
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
              {iconLeft}
            </span>
          )}
          <input ref={ref} id={inputId} aria-invalid={error ? true : undefined}
            aria-required={required}
            className={`input-base ${iconLeft ? 'pl-8' : ''} ${iconRight ? 'pr-8' : ''}
              ${error ? 'input-error' : ''} ${className}`}
            {...rest} />
          {iconRight && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400">
              {iconRight}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
        {hint && !error && <p className="text-xs text-neutral-500">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
export default Input;
