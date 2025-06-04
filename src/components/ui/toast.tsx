import React, { useEffect, useState } from 'react';

export interface ToastProps {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose?: () => void;
  duration?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * CustomToast component for displaying toast notifications
 */
export const CustomToast: React.FC<ToastProps> = ({
  show,
  message,
  type = 'success',
  onClose,
  duration = 5000,
  position = 'top-right',
}) => {
  const [isVisible, setIsVisible] = useState(show);

  // Handle visibility and auto-dismiss
  useEffect(() => {
    setIsVisible(show);
    
    if (show) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!isVisible) return null;

  // Position classes
  const positionClasses = {
    'top-left': 'top-20 left-5',
    'top-right': 'top-20 right-5',
    'bottom-left': 'bottom-5 left-5',
    'bottom-right': 'bottom-5 right-5',
  };

  // Type classes
  const typeClasses = {
    success: 'bg-green-50 text-green-700 border-l-4 border-green-500 dark:bg-green-950/50 dark:text-green-300 dark:border-green-600',
    error: 'bg-red-50 text-red-700 border-l-4 border-red-500 dark:bg-red-950/50 dark:text-red-300 dark:border-red-600',
    info: 'bg-blue-50 text-blue-700 border-l-4 border-blue-500 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-600',
    warning: 'bg-amber-50 text-amber-700 border-l-4 border-amber-500 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-600',
  };

  // Icon based on type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 7a1 1 0 01-1-1v-3a1 1 0 112 0v3a1 1 0 01-1 1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} p-3 md:p-4 rounded-lg shadow-lg transition-all duration-300 transform w-[calc(100%-40px)] sm:w-auto max-w-sm ${typeClasses[type]}`}
      style={{ pointerEvents: 'auto' }}
    >
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-grow">
          <p className="text-sm font-medium truncate">{message}</p>
        </div>
        <button
          type="button"
          className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 hover:bg-muted/60 flex-shrink-0"
          onClick={() => {
            setIsVisible(false);
            onClose?.();
          }}
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            ></path>
          </svg>
        </button>
      </div>
    </div>
  );
};

// Toast container to manage multiple toasts
export const ToastContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`flex flex-col items-end w-full h-full ${className}`} style={{ pointerEvents: 'none' }}>
      {children}
    </div>
  );
};