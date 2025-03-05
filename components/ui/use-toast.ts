'use client';

import { useState, useCallback } from 'react';

type ToastType = {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const toast = useCallback(
    ({ title, description, variant = 'default' }: Omit<ToastType, 'id'>) => {
      const id = Math.random().toString(36).slice(2);
      const newToast = { id, title, description, variant };
      
      setToasts((currentToasts) => [...currentToasts, newToast]);

      // Auto dismiss after 5 seconds
      setTimeout(() => {
        setToasts((currentToasts) =>
          currentToasts.filter((toast) => toast.id !== id)
        );
      }, 5000);

      return id;
    },
    []
  );

  const dismiss = useCallback((toastId: string) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== toastId)
    );
  }, []);

  return {
    toasts,
    toast,
    dismiss,
  };
}
