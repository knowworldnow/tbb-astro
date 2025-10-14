import React from 'react';

type DivProps = React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode };

export function Card(props: DivProps) {
  const { className = '', ...rest } = props;
  return <div className={`rounded-lg border ${className}`} {...rest} />;
}

export function CardHeader(props: DivProps) {
  const { className = '', ...rest } = props;
  return <div className={`p-4 border-b ${className}`} {...rest} />;
}

export function CardTitle(props: DivProps) {
  const { className = '', ...rest } = props;
  return <h3 className={`text-lg font-semibold ${className}`} {...rest} />;
}

export function CardContent(props: DivProps) {
  const { className = '', ...rest } = props;
  return <div className={`p-4 ${className}`} {...rest} />;
}


