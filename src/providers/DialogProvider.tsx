import { ReactNode, createContext, useCallback, useContext, useState } from 'react';

// 다이얼로그 타입 정의
interface DialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  variant?: 'default' | 'destructive' | 'warning';
}

// 다이얼로그 컨텍스트 인터페이스
interface DialogContextType {
  showDialog: (options: DialogOptions) => void;
  hideDialog: () => void;
  isOpen: boolean;
  options: DialogOptions | null;

  // AlertConfirmDialogs와 호환성을 위한 추가 함수들
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
}

// 기본값으로 컨텍스트 생성
const DialogContext = createContext<DialogContextType>({
  showDialog: () => { },
  hideDialog: () => { },
  isOpen: false,
  options: null,
  showAlert: () => { },
  showConfirm: () => { }
});

// 다이얼로그 컨텍스트를 사용하기 위한 훅
export const useDialog = () => useContext(DialogContext);

// 다이얼로그 프로바이더 props
interface DialogProviderProps {
  children: ReactNode;
}

// 다이얼로그 프로바이더 컴포넌트
export const DialogProvider = ({ children }: DialogProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<DialogOptions | null>(null);

  // 다이얼로그 표시 함수
  const showDialog = useCallback((options: DialogOptions) => {
    setOptions(options);
    setIsOpen(true);
  }, []);

  // 다이얼로그 숨김 함수
  const hideDialog = useCallback(() => {
    setIsOpen(false);
    // 다이얼로그가 닫힌 후에 옵션 초기화를 위한 짧은 지연
    setTimeout(() => {
      setOptions(null);
    }, 200);
  }, []);

  // 알림 다이얼로그 (AlertConfirmDialogs 호환용)
  const showAlert = useCallback((title: string, message: string, onConfirm?: () => void) => {
    showDialog({
      title,
      message,
      confirmText: '확인',
      cancelText: undefined, // 취소 버튼 없음
      onConfirm,
      variant: 'default'
    });
  }, [showDialog]);

  // 확인 다이얼로그 (AlertConfirmDialogs 호환용)
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
    showDialog({
      title,
      message,
      confirmText: options?.confirmText || '확인',
      cancelText: options?.cancelText || '취소',
      onConfirm: () => onConfirm?.(true),
      onCancel: () => onConfirm?.(false),
      variant: options?.confirmButtonClass?.includes('destructive') ? 'destructive' :
        options?.confirmButtonClass?.includes('warning') ? 'warning' : 'default'
    });
  }, [showDialog]);

  return (
    <DialogContext.Provider value={{
      showDialog,
      hideDialog,
      isOpen,
      options,
      showAlert,
      showConfirm
    }}>
      {children}
    </DialogContext.Provider>
  );
};