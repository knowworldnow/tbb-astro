import React, { createContext, useContext } from 'react';

type SelectContextValue = {
  value?: string;
  onValueChange?: (v: string) => void;
};

const SelectCtx = createContext<SelectContextValue>({});

type SelectProps = {
  value?: string;
  onValueChange?: (v: string) => void;
  children: React.ReactNode;
};

export function Select({ value, onValueChange, children }: SelectProps) {
  return <SelectCtx.Provider value={{ value, onValueChange }}>{children}</SelectCtx.Provider>;
}

export function SelectTrigger({ className = '', ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-md border ${className}`} {...rest} />;
}

export function SelectValue() {
  const { value } = useContext(SelectCtx);
  return <span>{value || ''}</span>;
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md border mt-2 bg-white dark:bg-gray-800">{children}</div>;
}

export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  const { onValueChange } = useContext(SelectCtx);
  return (
    <div
      className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
      onClick={() => onValueChange?.(value)}
      role="option"
      aria-selected="false"
    >
      {children}
    </div>
  );
}


