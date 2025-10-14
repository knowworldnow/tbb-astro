import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = '', ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      className={`rounded-md border px-3 py-2 focus:outline-none focus:ring-2 ${className}`}
      {...rest}
    />
  );
});


