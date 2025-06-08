import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  open,
  onClose,
  title,
  message,
  type = 'info',
  confirmText = '확인'
}) => {
  // 타입별 색상 설정
  const getColorClasses = () => {
    switch (type) {
      case 'success':
        return {
          header: 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20',
          icon: 'bg-green-100 dark:bg-green-800/30',
          iconColor: 'text-green-600 dark:text-green-400',
          title: 'text-green-800 dark:text-green-300',
          button: 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'
        };
      case 'error':
        return {
          header: 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
          icon: 'bg-red-100 dark:bg-red-800/30',
          iconColor: 'text-red-600 dark:text-red-400',
          title: 'text-red-800 dark:text-red-300',
          button: 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
        };
      case 'warning':
        return {
          header: 'bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20',
          icon: 'bg-amber-100 dark:bg-amber-800/30',
          iconColor: 'text-amber-600 dark:text-amber-400',
          title: 'text-amber-800 dark:text-amber-300',
          button: 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800'
        };
      default:
        return {
          header: 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
          icon: 'bg-blue-100 dark:bg-blue-800/30',
          iconColor: 'text-blue-600 dark:text-blue-400',
          title: 'text-blue-800 dark:text-blue-300',
          button: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
        };
    }
  };

  // 타입별 아이콘 반환
  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const colors = getColorClasses();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden" aria-describedby={undefined}>
        {/* 헤더 영역 */}
        <div className={`px-6 py-4 ${colors.header}`}>
          <DialogHeader className="flex flex-row items-center gap-3">
            {/* 아이콘 */}
            <div className={`flex-shrink-0 p-3 rounded-full ${colors.icon}`}>
              <div className={colors.iconColor}>
                {getIcon()}
              </div>
            </div>
            <DialogTitle className={`text-lg font-semibold ${colors.title}`}>
              {title}
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* 내용 영역 */}
        <div className="px-6 py-4">
          <DialogDescription className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
            {message}
          </DialogDescription>
        </div>

        {/* 버튼 영역 */}
        <DialogFooter className="bg-gray-50 dark:bg-gray-800/50 px-6 py-3">
          <Button
            onClick={onClose}
            className={`w-full sm:w-auto ${colors.button} text-white font-medium transition-all duration-200 shadow-sm hover:shadow-md`}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AlertDialog;