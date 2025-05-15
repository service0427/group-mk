import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  count: number;
}

const RejectModal: React.FC<RejectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  count
}) => {
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('반려 사유를 입력해주세요.');
      return;
    }
    
    onConfirm(reason);
    setReason('');
    setError('');
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setReason('');
      setError('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden flex flex-col">
        <DialogHeader className="bg-background py-4 px-6 border-b sticky top-0 z-10">
          <DialogTitle className="text-lg font-medium text-foreground">슬롯 반려</DialogTitle>
        </DialogHeader>

        <div className="p-6 bg-background overflow-y-auto flex-1">
          <div className="text-center mb-6">
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{count}개의 슬롯이 선택되었습니다</p>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-4">
            선택한 슬롯을 반려하시겠습니까? 반려 시 사용자에게 캐시가 환불됩니다.
          </p>

          <div className="space-y-2 mb-2">
            <label htmlFor="rejectionReason" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              반려 사유 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="rejectionReason"
              className={`w-full px-3 py-2 border rounded-md ${
                error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
              } bg-white dark:bg-gray-800 shadow-sm focus:outline-none focus:ring-2 transition duration-150 ease-in-out`}
              rows={4}
              placeholder="반려 사유를 입력해주세요. 사용자에게 표시됩니다."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim()) setError('');
              }}
            ></textarea>
            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
          </div>
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
            onClick={handleConfirm}
            className="bg-red-500 hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-white"
          >
            <KeenIcon icon="cross" className="mr-2 h-4 w-4" />
            반려하기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RejectModal;