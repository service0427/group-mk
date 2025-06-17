import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface GuaranteeRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  campaignName?: string;
  guaranteeCount: number;
  guaranteeUnit?: string;
  completedDays?: number;
  totalAmount?: number;
}

const GuaranteeRefundModal: React.FC<GuaranteeRefundModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  campaignName,
  guaranteeCount,
  guaranteeUnit = 'daily',
  completedDays = 0,
  totalAmount = 0,
}) => {
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string>('');

  const remainingDays = Math.max(0, guaranteeCount - completedDays);
  const completionRate = guaranteeCount > 0 ? Math.round((completedDays / guaranteeCount) * 100) : 0;
  const refundRate = guaranteeCount > 0 ? Math.round((remainingDays / guaranteeCount) * 100) : 100;
  const refundAmount = Math.round(totalAmount * (refundRate / 100));

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('환불 사유를 입력해주세요.');
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
          <DialogTitle className="text-lg font-medium text-foreground">보장형 슬롯 환불</DialogTitle>
          <DialogDescription className="sr-only">
            보장형 슬롯을 환불 처리하는 모달입니다.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 bg-background overflow-y-auto flex-1">
          {campaignName && (
            <div className="mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {campaignName}
              </h3>
            </div>
          )}

          <div className="space-y-3 mb-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              환불 정보
            </h4>
            <div className="space-y-2 pl-2">
              <div className="flex items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400 w-24">보장기간:</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {guaranteeCount}{guaranteeUnit === 'daily' ? '일' : '회'}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400 w-24">완료 기간:</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {completedDays}{guaranteeUnit === 'daily' ? '일' : '회'} ({completionRate}%)
                </span>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400 w-24">잔여 기간:</span>
                <span className="text-gray-900 dark:text-gray-100 font-semibold text-red-600 dark:text-red-400">
                  {remainingDays}{guaranteeUnit === 'daily' ? '일' : '회'} ({refundRate}%)
                </span>
              </div>
              {totalAmount > 0 && (
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400 w-24">환불 예정액:</span>
                  <span className="text-gray-900 dark:text-gray-100 font-semibold">
                    {refundAmount.toLocaleString()}원
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
                  환불 처리 안내
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300 space-y-1">
                  <p>환불 처리 시 다음 사항이 적용됩니다:</p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>작업이 완료된 기간을 제외한 나머지 금액이 환불됩니다</li>
                    <li>슬롯 상태가 '환불'로 변경됩니다</li>
                    <li>사용자에게 환불 알림이 발송됩니다</li>
                    <li className="font-semibold">이 작업은 취소할 수 없습니다</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-2">
            <label htmlFor="refundReason" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              환불 사유 <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="refundReason"
              className={`w-full px-3 py-2 border rounded-md ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                } bg-white dark:bg-gray-800 shadow-sm focus:outline-none focus:ring-2 transition duration-150 ease-in-out`}
              rows={4}
              placeholder="환불 사유를 입력해주세요. 사용자에게 표시됩니다."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim()) setError('');
              }}
            />
            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
          </div>

          <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
            정말로 이 보장형 슬롯을 환불 처리하시겠습니까?
          </div>
        </div>

        <div className="flex justify-end items-center gap-3 py-4 px-6 bg-gray-50 dark:bg-gray-800/50 border-t">
          <Button
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            환불
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            취소
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuaranteeRefundModal;