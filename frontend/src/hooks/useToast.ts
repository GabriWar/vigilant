/**
 * Hook for managing toast notifications
 */
import { useState, useCallback } from 'react';
import { ToastData } from '@components/atoms';

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastData = {
      ...toast,
      id,
      timestamp: new Date().toISOString(),
      duration: toast.duration || 5000, // Default 5 seconds
    };
    
    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showSuccess = useCallback((title: string, message: string, duration?: number) => {
    addToast({ type: 'success', title, message, duration });
  }, [addToast]);

  const showError = useCallback((title: string, message: string, duration?: number) => {
    addToast({ type: 'error', title, message, duration });
  }, [addToast]);

  const showInfo = useCallback((title: string, message: string, duration?: number) => {
    addToast({ type: 'info', title, message, duration });
  }, [addToast]);

  const showWarning = useCallback((title: string, message: string, duration?: number) => {
    addToast({ type: 'warning', title, message, duration });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
};
