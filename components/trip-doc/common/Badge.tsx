export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

interface Props {
  variant?: BadgeVariant;
  children: React.ReactNode;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  default: 'bg-neutral-100 text-neutral-700',
  primary: 'bg-blue-100   text-blue-700',
  success: 'bg-green-100  text-green-700',
  warning: 'bg-amber-100  text-amber-700',
  danger:  'bg-red-100    text-red-700',
  info:    'bg-sky-100    text-sky-700',
};

const DOT_STYLES: Record<BadgeVariant, string> = {
  default: 'bg-neutral-400', primary: 'bg-blue-500', success: 'bg-green-500',
  warning: 'bg-amber-500',  danger:  'bg-red-500',   info:    'bg-sky-500',
};

import React from 'react';
export default function Badge({ variant = 'default', children, size = 'md', dot = false, className = '' }: Props) {
  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded
      ${size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-xs'}
      ${VARIANT_STYLES[variant]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${DOT_STYLES[variant]}`} aria-hidden="true" />}
      {children}
    </span>
  );
}
