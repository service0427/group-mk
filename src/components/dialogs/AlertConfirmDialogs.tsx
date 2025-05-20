import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/providers/ToastProvider';

// 기본 다이얼로그 상태 인터페이스
interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
}

// 알림 다이얼로그 상태
interface AlertDialogState extends DialogState {
  onConfirm?: () => void;
}

// 확인 다이얼로그 상태
interface ConfirmDialogState extends DialogState {
  onConfirm?: (confirmed: boolean) => void;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
}

// Context 인터페이스
interface DialogContextProps {
  showAlert: (title: string, message: string, onConfirm?: () => void) => void;
  showConfirm: (
    title: string, 
    message: string, 
    onConfirm?: (confirmed: boolean) => void,
    options?: {
      confirmText?: string;
      cancelText?: string;
      confirmButtonClass?: string;
    }
  ) => void;
  closeAlert: () => void;
  closeConfirm: () => void;
  // 경고 다이얼로그 없이 토스트 메시지 직접 표시
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

// Context 생성
const DialogContext = createContext<DialogContextProps | undefined>(undefined);

// AlertDialog 컴포넌트
const AlertDialog: React.FC<AlertDialogState & { onClose: () => void }> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onClose,
}) => {
  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden">
        <DialogHeader className="bg-background py-3 px-6">
          <DialogTitle className="text-lg font-medium text-foreground">{title}</DialogTitle>
        </DialogHeader>
        <DialogBody className="p-6 bg-background">
          <p className="text-foreground">{message}</p>
        </DialogBody>
        <DialogFooter className="bg-background">
          <Button
            type="button"
            className="px-4 bg-primary hover:bg-primary/90 text-white"
            onClick={handleConfirm}
          >
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ConfirmDialog 컴포넌트
const ConfirmDialog: React.FC<ConfirmDialogState & { onClose: () => void }> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onClose,
  confirmText = '확인',
  cancelText = '취소',
  confirmButtonClass = 'bg-primary hover:bg-primary/90 text-white',
}) => {
  const handleConfirm = () => {
    if (onConfirm) onConfirm(true);
    onClose();
  };

  const handleCancel = () => {
    if (onConfirm) onConfirm(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden">
        <DialogHeader className="bg-background py-3 px-6">
          <DialogTitle className="text-lg font-medium text-foreground">{title}</DialogTitle>
        </DialogHeader>
        <DialogBody className="p-6 bg-background">
          <p className="text-foreground">{message}</p>
        </DialogBody>
        <DialogFooter className="bg-background space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="px-4 order-last"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            className={`px-4 ${confirmButtonClass}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Provider 컴포넌트
export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const toast = useToast();
  
  // 알림 다이얼로그 상태
  const [alertState, setAlertState] = useState<AlertDialogState>({
    isOpen: false,
    title: '',
    message: '',
  });
  
  // 확인 다이얼로그 상태
  const [confirmState, setConfirmState] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
  });

  // 알림 다이얼로그 표시
  const showAlert = useCallback((title: string, message: string, onConfirm?: () => void) => {
    setAlertState({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  }, []);

  // 확인 다이얼로그 표시
  const showConfirm = useCallback((
    title: string, 
    message: string, 
    onConfirm?: (confirmed: boolean) => void,
    options?: {
      confirmText?: string;
      cancelText?: string;
      confirmButtonClass?: string;
    }
  ) => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
      confirmButtonClass: options?.confirmButtonClass,
    });
  }, []);

  // 알림 다이얼로그 닫기
  const closeAlert = useCallback(() => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // 확인 다이얼로그 닫기
  const closeConfirm = useCallback(() => {
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // 토스트 메시지 직접 표시 (경고 다이얼로그 대신)
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    if (type === 'success') toast.success(message);
    else if (type === 'error') toast.error(message);
    else if (type === 'info') toast.info(message);
    else if (type === 'warning') toast.warning(message);
  }, [toast]);

  return (
    <DialogContext.Provider
      value={{
        showAlert,
        showConfirm,
        closeAlert,
        closeConfirm,
        showToast,
      }}
    >
      {children}
      
      {/* 알림 다이얼로그 렌더링 */}
      <AlertDialog
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        onConfirm={alertState.onConfirm}
        onClose={closeAlert}
      />
      
      {/* 확인 다이얼로그 렌더링 */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onClose={closeConfirm}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        confirmButtonClass={confirmState.confirmButtonClass}
      />
    </DialogContext.Provider>
  );
};

// 훅
export const useDialog = (): DialogContextProps => {
  const context = useContext(DialogContext);
  
  if (context === undefined) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  
  return context;
};