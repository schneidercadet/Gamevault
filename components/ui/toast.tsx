'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastProps {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive';
  onClose: () => void;
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(({
  title,
  description,
  action,
  variant = 'default',
  onClose,
}: ToastProps, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all',
        'animate-in slide-in-from-right-full',
        variant === 'default'
          ? 'border-background-lighter bg-background text-foreground'
          : 'border-red-500 bg-red-500 text-white'
      )}
    >
      <div className="grid gap-1">
        {title && <div className="text-sm font-semibold">{title}</div>}
        {description && (
          <div className="text-sm text-foreground-muted">{description}</div>
        )}
      </div>
      {action}
      <button
        onClick={onClose}
        className="absolute right-1 top-1 rounded-md p-1 text-foreground-muted opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none group-hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
});

Toast.displayName = 'Toast';

export const ToastContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
      className
    )}
    {...props}
  />
));

ToastContainer.displayName = 'ToastContainer';
