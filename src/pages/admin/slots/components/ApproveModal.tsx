import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';

interface ApproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
  title: string;
  description: string;
  confirmText: string;
}

const ApproveModal: React.FC<ApproveModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  count,
  title,
  description,
  confirmText
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden flex flex-col">
        <DialogHeader className="bg-background py-4 px-6 border-b sticky top-0 z-10">
          <DialogTitle className="text-lg font-medium text-foreground">{title}</DialogTitle>
        </DialogHeader>

        <div className="p-6 bg-background overflow-y-auto flex-1">
          <div className="text-center mb-6">
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{count}개의 슬롯이 선택되었습니다</p>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>
        </div>

        <div className="flex justify-end items-center gap-3 py-4 px-6 bg-gray-50 dark:bg-gray-800/50 border-t">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            취소
          </Button>
          <Button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <KeenIcon icon="check" className="mr-2 h-4 w-4" />
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApproveModal;