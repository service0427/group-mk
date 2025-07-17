import React, { useState } from 'react';
import { KeenIcon } from '@/components/keenicons';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: string;
  confirmButtonClass?: string;
  isLoading?: boolean;
  showReasonInput?: boolean;
  reasonPlaceholder?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = '확인',
  message = '이 작업을 실행하시겠습니까?',
  confirmText = '확인',
  cancelText = '취소',
  icon = 'information-3',
  confirmButtonClass = 'bg-primary hover:bg-primary/90 text-white',
  isLoading = false,
  showReasonInput = false,
  reasonPlaceholder = '사유를 입력하세요 (선택사항)'
}) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(showReasonInput ? reason : undefined);
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden" aria-describedby={undefined}>
        <DialogHeader className="bg-background py-3 px-6 border-b">
          <DialogTitle className="text-lg font-medium">{title}</DialogTitle>
        </DialogHeader>

        <div className="p-5 bg-background">
          <div className="mb-4 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <KeenIcon icon={icon} className="text-xl text-primary" />
              </div>
            </div>
            <p className="text-muted-foreground">{message}</p>
          </div>

          {/* 사유 입력 필드 */}
          {showReasonInput && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                전환 사유
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={reasonPlaceholder}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                rows={3}
                disabled={isLoading}
              />
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              className={`w-full ${confirmButtonClass}`}
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin text-sm mr-1">⊝</span>
                  처리 중...
                </>
              ) : (
                confirmText
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleClose}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmModal;