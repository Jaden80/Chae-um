import { ButtonHTMLAttributes, forwardRef } from 'react';
import LoadingSpinner from './LoadingSpinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize    = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  ButtonVariant;
  size?:     ButtonSize;
  loading?:  boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:   'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-neutral-300 disabled:text-neutral-500',
  secondary: 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50 disabled:bg-neutral-100 disabled:text-neutral-400',
  ghost:     'bg-transparent text-neutral-600 hover:bg-neutral-100 disabled:text-neutral-400',
  danger:    'bg-red-600 text-white hover:bg-red-700 disabled:bg-neutral-300 disabled:text-neutral-500',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'h-8  px-3 text-xs gap-1.5',
  md: 'h-9  px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
};

import React from 'react';
const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = 'primary', size = 'md', loading = false, iconLeft, iconRight,
     fullWidth = false, disabled, children, className = '', ...rest }, ref) => {
    const isDisabled = disabled || loading;
    return (
      <button ref={ref} disabled={isDisabled}
        className={`inline-flex items-center justify-center font-medium rounded-md
          transition-all duration-150 cursor-pointer select-none disabled:cursor-not-allowed
          active:scale-[0.98] ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]}
          ${fullWidth ? 'w-full' : ''} ${className}`}
        {...rest}>
        {loading ? (
          <><LoadingSpinner size="sm" label="" /><span>처리 중...</span></>
        ) : (
          <>
            {iconLeft  && <span className="shrink-0">{iconLeft}</span>}
            {children}
            {iconRight && <span className="shrink-0">{iconRight}</span>}
          </>
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';
export default Button;
