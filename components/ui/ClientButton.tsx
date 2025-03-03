'use client';

import { ButtonHTMLAttributes } from 'react';

interface ClientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export default function ClientButton({ children, ...props }: ClientButtonProps) {
  return (
    <button {...props}>
      {children}
    </button>
  );
}
