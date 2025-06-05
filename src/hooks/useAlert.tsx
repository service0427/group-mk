import React, { useState, createContext, useContext, useCallback } from 'react';
import AlertDialog, { AlertType } from '@/components/dialogs/AlertDialog';

interface AlertOptions {
  type?: AlertType;
  confirmText?: string;
}

interface AlertContextType {
  showAlert: (title: string, message: string, options?: AlertOptions) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alertState, setAlertState] = useState<{
    open: boolean;
    title: string;
    message: string;
    type: AlertType;
    confirmText: string;
  }>({
    open: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: '확인'
  });

  const showAlert = useCallback((title: string, message: string, options?: AlertOptions) => {
    setAlertState({
      open: true,
      title,
      message,
      type: options?.type || 'info',
      confirmText: options?.confirmText || '확인'
    });
  }, []);

  const showSuccess = useCallback((message: string, title: string = '성공') => {
    showAlert(title, message, { type: 'success' });
  }, [showAlert]);

  const showError = useCallback((message: string, title: string = '오류') => {
    showAlert(title, message, { type: 'error' });
  }, [showAlert]);

  const showWarning = useCallback((message: string, title: string = '경고') => {
    showAlert(title, message, { type: 'warning' });
  }, [showAlert]);

  const showInfo = useCallback((message: string, title: string = '알림') => {
    showAlert(title, message, { type: 'info' });
  }, [showAlert]);

  const handleClose = useCallback(() => {
    setAlertState(prev => ({ ...prev, open: false }));
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, showSuccess, showError, showWarning, showInfo }}>
      {children}
      <AlertDialog
        open={alertState.open}
        onClose={handleClose}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        confirmText={alertState.confirmText}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};