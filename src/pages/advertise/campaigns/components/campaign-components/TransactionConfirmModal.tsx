import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';

interface TransactionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  slotData: {
    campaignName?: string;
    productName?: string;
    workMemo?: string;
    workMemoDate?: string;
  };
}

const TransactionConfirmModal: React.FC<TransactionConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  slotData
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="bg-background py-4 px-6 border-b">
          <DialogTitle className="text-lg font-semibold text-foreground">
            거래 완료 확인
          </DialogTitle>
        </DialogHeader>
        
        <DialogBody className="p-6 bg-background">
          {/* 캠페인명 */}
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {slotData.campaignName || slotData.productName || '캠페인'}
            </h3>
          </div>

          {/* 작업 완료 메모 (있는 경우만 표시) */}
          {slotData.workMemo && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
                    총판 작업 완료 메모
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 whitespace-pre-wrap">
                    {slotData.workMemo}
                  </p>
                  {slotData.workMemoDate && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      작성일: {formatDate(slotData.workMemoDate)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 안내 메시지 */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              작업 내용을 확인하셨다면 거래를 완료해주세요.
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              ※ 거래 완료 후에는 취소할 수 없습니다.
            </p>
          </div>

          {/* 확인 문구 */}
          <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
            정말로 거래를 완료하시겠습니까?
          </div>
        </DialogBody>
        
        <DialogFooter className="bg-gray-50 dark:bg-gray-800/50 px-6 py-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="mr-2"
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="bg-success hover:bg-success/90 text-white"
          >
            거래 완료
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionConfirmModal;