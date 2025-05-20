import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { CustomToast, ToastContainer } from '@/components/ui/toast';
import { ToastPortal } from '@/components/ui/ToastPortal';

export type ToastType = 'success' | 'error' | 'info' | 'warning';
export type ToastPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface ToastOptions {
  duration?: number;
  position?: ToastPosition;
}

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  options?: ToastOptions;
}

interface ToastContextProps {
  showToast: (message: string, type: ToastType, options?: ToastOptions) => void;
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const ToastProvider: React.FC<{
  children: ReactNode;
  defaultOptions?: ToastOptions;
}> = ({ children, defaultOptions = { duration: 5000, position: 'top-right' } }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Generate a unique ID for each toast
  const generateId = useCallback((): string => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 5);
  }, []);

  // Show a toast notification
  const showToast = useCallback(
    (message: string, type: ToastType, options?: ToastOptions) => {
      const id = generateId();
      const newToast: Toast = {
        id,
        message,
        type,
        options: { ...defaultOptions, ...options },
      };

      setToasts((prevToasts) => [...prevToasts, newToast]);

      // Auto-dismiss after duration
      const duration = options?.duration || defaultOptions.duration;
      if (duration) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [defaultOptions, generateId]
  );

  // Helper methods for different toast types
  const success = useCallback(
    (message: string, options?: ToastOptions) => {
      showToast(message, 'success', options);
    },
    [showToast]
  );

  const error = useCallback(
    (message: string, options?: ToastOptions) => {
      showToast(message, 'error', options);
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, options?: ToastOptions) => {
      showToast(message, 'info', options);
    },
    [showToast]
  );

  const warning = useCallback(
    (message: string, options?: ToastOptions) => {
      showToast(message, 'warning', options);
    },
    [showToast]
  );

  // Dismiss a specific toast
  const dismiss = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  // Dismiss all toasts
  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        success,
        error,
        info,
        warning,
        dismiss,
        dismissAll,
      }}
    >
      {children}
      {/* 포털을 사용하여 토스트를 document.body에 직접 렌더링 */}
      <ToastPortal>
        <ToastContainer>
          {toasts.map((toast) => (
            <CustomToast
              key={toast.id}
              show={true}
              message={toast.message}
              type={toast.type}
              position={toast.options?.position || defaultOptions.position}
              duration={toast.options?.duration || defaultOptions.duration}
              onClose={() => dismiss(toast.id)}
            />
          ))}
        </ToastContainer>
      </ToastPortal>
    </ToastContext.Provider>
  );
};

/**
 * Hook to use the toast context
 */
export const useToast = (): ToastContextProps => {
  const context = useContext(ToastContext);

  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
};