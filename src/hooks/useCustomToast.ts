import { useState, useCallback, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';
export type ToastPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface ToastOptions {
  duration?: number;
  position?: ToastPosition;
}

export interface ToastState {
  show: boolean;
  message: string;
  type: ToastType;
}

/**
 * Custom hook for managing toast notifications
 */
export const useCustomToast = (defaultOptions?: ToastOptions) => {
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success',
  });

  // Auto-hide the toast after duration
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, defaultOptions?.duration || 5000);

      return () => clearTimeout(timer);
    }
  }, [toast.show, defaultOptions?.duration]);

  // Show toast notification
  const showToast = useCallback(
    (message: string, type: ToastType = 'success', options?: ToastOptions) => {
      setToast({
        show: true,
        message,
        type,
      });
    },
    []
  );

  // Show success toast
  const showSuccess = useCallback(
    (message: string, options?: ToastOptions) => {
      showToast(message, 'success', options);
    },
    [showToast]
  );

  // Show error toast
  const showError = useCallback(
    (message: string, options?: ToastOptions) => {
      showToast(message, 'error', options);
    },
    [showToast]
  );

  // Show info toast
  const showInfo = useCallback(
    (message: string, options?: ToastOptions) => {
      showToast(message, 'info', options);
    },
    [showToast]
  );

  // Show warning toast
  const showWarning = useCallback(
    (message: string, options?: ToastOptions) => {
      showToast(message, 'warning', options);
    },
    [showToast]
  );

  // Hide toast
  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  return {
    toast,
    setToast,
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    hideToast,
    defaultOptions,
  };
};