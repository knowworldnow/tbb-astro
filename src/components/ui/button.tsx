import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'solid' | 'outline' };

export function Button({ className = '', variant = 'solid', ...rest }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors';
  const styles = variant === 'outline'
    ? 'border bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700'
    : 'bg-primary-600 text-white hover:bg-primary-700';
  return <button className={`${base} ${styles} ${className}`} {...rest} />;
}


