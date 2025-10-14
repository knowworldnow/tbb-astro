import React from 'react';

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className = '', ...rest }: LabelProps) {
  return <label className={`text-sm font-medium ${className}`} {...rest} />;
}


