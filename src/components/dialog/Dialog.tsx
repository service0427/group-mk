import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { useDialog } from "@/providers/DialogProvider";

/**
 * Dialog 컴포넌트 - DialogProvider에서 관리하는 상태를 기반으로 다이얼로그를 렌더링합니다.
 * 
 * 사용 방법:
 * 1. useDialog 훅을 통해 showDialog, showAlert, showConfirm 함수 사용
 * 2. <Dialog /> 컴포넌트는 앱 루트에 한 번만 렌더링
 */
export const Dialog = () => {
  const { isOpen, hideDialog, options } = useDialog();

  // 다이얼로그가 열려있지 않거나 옵션이 없으면 렌더링하지 않음
  if (!isOpen || !options) return null;

  const { 
    title = "확인", 
    message, 
    confirmText = "확인", 
    cancelText = "취소",
    onConfirm, 
    onCancel,
    variant = "default"
  } = options;

  // 확인 버튼 핸들러
  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    hideDialog();
  };

  // 취소 버튼 핸들러
  const handleCancel = () => {
    if (onCancel) onCancel();
    hideDialog();
  };

  // variant에 따른 확인 버튼 스타일 클래스
  const getConfirmButtonClass = () => {
    switch (variant) {
      case "destructive":
        return "bg-destructive text-destructive-foreground hover:bg-destructive/90";
      case "warning":
        return "bg-orange-500 text-white hover:bg-orange-600";
      default:
        return "bg-primary text-primary-foreground hover:bg-primary/90";
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={hideDialog}>
      <AlertDialogContent className="sm:max-w-[400px]">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction 
            onClick={handleConfirm}
            className={getConfirmButtonClass()}
          >
            {confirmText}
          </AlertDialogAction>
          {cancelText && (
            <AlertDialogCancel onClick={handleCancel}>
              {cancelText}
            </AlertDialogCancel>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// export default Dialog와 함께 showAlert 및 showConfirm 함수도 내보냅니다.
export default Dialog;