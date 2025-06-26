import { ReactNode, createContext, useContext, useState, useMemo, useCallback } from 'react';
import { ContentLoader, ProgressBarLoader, ScreenLoader } from '@/components/loaders';
import { IMenuItemConfig, TMenuConfig } from '@/components/menu';
import { getData, setData } from '../utils';
import { CustomToast, ToastContainer } from '@/components/ui/toast';
import { ToastPortal } from '@/components/ui/ToastPortal';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';

export interface ILayoutConfig {
  name: string;
  options: any;
}

// Toast 관련 타입
export type ToastType = 'success' | 'error' | 'info' | 'warning';
export type ToastPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface ToastOptions {
  duration?: number;
  position?: ToastPosition;
}

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  options?: ToastOptions;
}

// Dialog 관련 타입
export interface DialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  variant?: 'default' | 'destructive' | 'warning';
}

// 분할된 컨텍스트 타입들
interface LoaderContextType {
  contentLoader: boolean;
  setContentLoader: (state: boolean) => void;
  progressBarLoader: boolean;
  setProgressBarLoader: (state: boolean) => void;
  screenLoader: boolean;
  setScreenLoader: (state: boolean) => void;
}

interface LayoutContextType {
  getLayout: (name: string) => Partial<ILayoutConfig> | undefined;
  hasLayout: (name: string) => boolean;
  updateLayout: (name: string, config: Partial<ILayoutConfig>) => void;
  currentLayout: any;
  setCurrentLayout: (layoutProvider: any) => void;
}

interface MenuContextType {
  menuConfigs: Map<string, TMenuConfig | null>;
  setMenuConfig: (name: string, config: TMenuConfig | null) => void;
  getMenuConfig: (name: string) => TMenuConfig | null;
  setCurrentMenuItem: (config: IMenuItemConfig | null) => void;
  getCurrentMenuItem: () => IMenuItemConfig | null;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType, options?: ToastOptions) => void;
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

interface DialogContextType {
  showDialog: (options: DialogOptions) => void;
  hideDialog: () => void;
  isOpen: boolean;
  options: DialogOptions | null;
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

// 레이아웃 설정 로컬 스토리지 키
const LAYOUTS_CONFIGS_KEY = 'layouts-configs';

// 레이아웃 설정 가져오기 유틸리티 함수
const getLayouts = (): Map<string, Partial<ILayoutConfig>> => {
  const storedLayouts = (getData(LAYOUTS_CONFIGS_KEY) as object) || {};
  return new Map(Object.entries(storedLayouts));
};

// 분할된 컨텍스트 생성
const LoaderContext = createContext<LoaderContextType | null>(null);
const LayoutContext = createContext<LayoutContextType | null>(null);
const MenuContext = createContext<MenuContextType | null>(null);
const ToastContext = createContext<ToastContextType | null>(null);
const DialogContext = createContext<DialogContextType | null>(null);

// 기본 Toast 옵션
const DEFAULT_TOAST_OPTIONS: ToastOptions = { duration: 5000, position: 'top-right' };

// UIProvider 컴포넌트
export const UIProvider = ({ children }: { children: ReactNode }) => {
  // 로더 상태
  const [contentLoader, setContentLoader] = useState(false);
  const [progressBarLoader, setProgressBarLoader] = useState(false);
  const [screenLoader, setScreenLoader] = useState(false);

  // 레이아웃 상태
  const [currentLayout, setCurrentLayout] = useState<any>(null);

  // 메뉴 상태
  const [currentMenuItem, setCurrentMenuItem] = useState<IMenuItemConfig | null>(null);
  const [menuConfigs] = useState(() => new Map<string, TMenuConfig | null>());

  // Toast 상태
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Dialog 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogOptions, setDialogOptions] = useState<DialogOptions | null>(null);

  // 레이아웃 관련 함수
  const getLayout = useCallback((name: string): Partial<ILayoutConfig> | undefined => {
    const storedLayouts = getLayouts();
    return storedLayouts.get(name);
  }, []);

  const hasLayout = useCallback((name: string): boolean => {
    const storedLayouts = getLayouts();
    return storedLayouts && storedLayouts.has(name);
  }, []);

  const updateLayout = useCallback((name: string, config: Partial<ILayoutConfig>) => {
    const storedLayouts = getLayouts();

    if (storedLayouts.has(name)) {
      storedLayouts.delete(name);
    }

    storedLayouts.set(name, config);
    setData(LAYOUTS_CONFIGS_KEY, Object.fromEntries(storedLayouts));
  }, []);

  // 메뉴 관련 함수
  const setMenuConfig = useCallback((name: string, config: TMenuConfig | null) => {
    menuConfigs.set(name, config);
  }, []);

  const getMenuConfig = useCallback((name: string): TMenuConfig | null => {
    return menuConfigs.get(name) ?? null;
  }, []);

  const getCurrentMenuItem = useCallback((): IMenuItemConfig | null => {
    return currentMenuItem;
  }, [currentMenuItem]);

  // Toast 관련 함수
  const generateToastId = useCallback((): string => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 5);
  }, []);

  const showToast = useCallback((message: string, type: ToastType, options?: ToastOptions) => {
    const id = generateToastId();
    const newToast: Toast = {
      id,
      message,
      type,
      options: { ...DEFAULT_TOAST_OPTIONS, ...options },
    };

    setToasts((prevToasts) => {
      // 최대 5개까지만 표시, 오래된 것부터 제거
      const maxToasts = 5;
      const updatedToasts = [...prevToasts, newToast];
      
      if (updatedToasts.length > maxToasts) {
        return updatedToasts.slice(updatedToasts.length - maxToasts);
      }
      
      return updatedToasts;
    });

    const duration = options?.duration || DEFAULT_TOAST_OPTIONS.duration;
    if (duration) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }
  }, [generateToastId]);

  const success = useCallback((message: string, options?: ToastOptions) => {
    showToast(message, 'success', options);
  }, [showToast]);

  const error = useCallback((message: string, options?: ToastOptions) => {
    showToast(message, 'error', options);
  }, [showToast]);

  const info = useCallback((message: string, options?: ToastOptions) => {
    showToast(message, 'info', options);
  }, [showToast]);

  const warning = useCallback((message: string, options?: ToastOptions) => {
    showToast(message, 'warning', options);
  }, [showToast]);

  const dismiss = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Dialog 관련 함수
  const showDialog = useCallback((options: DialogOptions) => {
    setDialogOptions(options);
    setDialogOpen(true);
  }, []);

  const hideDialog = useCallback(() => {
    setDialogOpen(false);
    setTimeout(() => {
      setDialogOptions(null);
    }, 200);
  }, []);

  const showAlert = useCallback((title: string, message: string, onConfirm?: () => void) => {
    showDialog({
      title,
      message,
      confirmText: '확인',
      cancelText: undefined,
      onConfirm,
      variant: 'default'
    });
  }, [showDialog]);

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

  // 메모이제이션된 컨텍스트 값들
  const loaderValue = useMemo(() => ({
    contentLoader,
    setContentLoader,
    progressBarLoader,
    setProgressBarLoader,
    screenLoader,
    setScreenLoader,
  }), [contentLoader, progressBarLoader, screenLoader]);

  const layoutValue = useMemo(() => ({
    getLayout,
    hasLayout,
    updateLayout,
    currentLayout,
    setCurrentLayout,
  }), [getLayout, hasLayout, updateLayout, currentLayout]);

  const menuValue = useMemo(() => ({
    menuConfigs,
    setMenuConfig,
    getMenuConfig,
    setCurrentMenuItem,
    getCurrentMenuItem,
  }), [setMenuConfig, getMenuConfig, getCurrentMenuItem]);

  const toastValue = useMemo(() => ({
    showToast,
    success,
    error,
    info,
    warning,
    dismiss,
    dismissAll,
  }), [showToast, success, error, info, warning, dismiss, dismissAll]);

  const dialogValue = useMemo(() => ({
    showDialog,
    hideDialog,
    isOpen: dialogOpen,
    options: dialogOptions,
    showAlert,
    showConfirm,
  }), [showDialog, hideDialog, dialogOpen, dialogOptions, showAlert, showConfirm]);

  return (
    <LoaderContext.Provider value={loaderValue}>
      <LayoutContext.Provider value={layoutValue}>
        <MenuContext.Provider value={menuValue}>
          <ToastContext.Provider value={toastValue}>
            <DialogContext.Provider value={dialogValue}>
              {children}
              {/* 로더는 하나만 표시되도록 조건부 렌더링 */}
              {screenLoader ? (
                <ScreenLoader />
              ) : progressBarLoader ? (
                <ProgressBarLoader />
              ) : null}
              {/* Toast 컴포넌트들 */}
              <ToastPortal>
                <ToastContainer>
                  {toasts.map((toast, index) => (
                    <CustomToast
                      key={toast.id}
                      show={true}
                      message={toast.message}
                      type={toast.type}
                      position={toast.options?.position || DEFAULT_TOAST_OPTIONS.position}
                      duration={toast.options?.duration || DEFAULT_TOAST_OPTIONS.duration}
                      onClose={() => dismiss(toast.id)}
                      offset={index}
                    />
                  ))}
                </ToastContainer>
              </ToastPortal>
              {/* Dialog 컴포넌트 */}
              {dialogOptions && (
                <Dialog open={dialogOpen} onOpenChange={hideDialog}>
                  <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden" aria-describedby={undefined}>
                    {dialogOptions.title && (
                      <DialogHeader className="bg-background py-3 px-6">
                        <DialogTitle className="text-lg font-medium text-foreground">
                          {dialogOptions.title}
                        </DialogTitle>
                      </DialogHeader>
                    )}
                    <DialogBody className="p-6 bg-background">
                      <DialogDescription className="text-foreground">
                        {dialogOptions.message}
                      </DialogDescription>
                    </DialogBody>
                    <DialogFooter className="bg-background space-x-2">
                      {dialogOptions.cancelText && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            dialogOptions.onCancel?.();
                            hideDialog();
                          }}
                          className="px-4 order-last"
                        >
                          {dialogOptions.cancelText}
                        </Button>
                      )}
                      <Button
                        type="button"
                        className={`px-4 ${dialogOptions.variant === 'destructive'
                          ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                          : dialogOptions.variant === 'warning'
                            ? 'bg-warning hover:bg-warning/90 text-warning-foreground'
                            : 'bg-primary hover:bg-primary/90 text-white'
                          }`}
                        onClick={() => {
                          dialogOptions.onConfirm?.();
                          hideDialog();
                        }}
                      >
                        {dialogOptions.confirmText || '확인'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </DialogContext.Provider>
          </ToastContext.Provider>
        </MenuContext.Provider>
      </LayoutContext.Provider>
    </LoaderContext.Provider>
  );
};

// 개별 컨텍스트 사용을 위한 훅들
export const useLoaders = () => {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error('useLoaders must be used within UIProvider');
  }
  return context;
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within UIProvider');
  }
  return context;
};

export const useMenus = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenus must be used within UIProvider');
  }
  return context;
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within UIProvider');
  }
  return context;
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within UIProvider');
  }
  return context;
};

// 전체 UI 컨텍스트를 사용하는 훅 (하위 호환성을 위해 유지)
export const useUI = () => {
  const loaders = useLoaders();
  const layout = useLayout();
  const menus = useMenus();

  return {
    ...loaders,
    ...layout,
    ...menus,
    configs: menus.menuConfigs,
  };
};

// 타입은 이미 위에서 export되어 있으므로 중복 제거