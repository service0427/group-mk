import React from 'react';
import { KeenIcon } from '@/components/keenicons';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = '알림 삭제',
  message = '이 알림을 정말 삭제하시겠습니까?'
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden">
        <DialogHeader className="bg-background py-3 px-6 border-b">
          <DialogTitle className="text-lg font-medium text-danger">{title}</DialogTitle>
        </DialogHeader>

        <div className="p-5 bg-background">
          <div className="mb-4 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <KeenIcon icon="trash" className="text-xl text-danger" />
              </div>
            </div>
            <p className="text-muted-foreground">{message}</p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                onConfirm();
              }}
            >
              <KeenIcon icon="trash" className="mr-1" />
              삭제
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={onClose}
            >
              취소
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmModal;