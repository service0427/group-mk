import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog';
import { KeenIcon } from '@/components';

interface GuaranteeNegotiationCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  campaignName?: string;
  proposedAmount: number;
  guaranteeCount: number;
  guaranteeUnit?: string;
  targetRank: number;
  isLoading?: boolean;
}

const GuaranteeNegotiationCompleteModal: React.FC<GuaranteeNegotiationCompleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  campaignName,
  proposedAmount,
  guaranteeCount,
  guaranteeUnit = '일',
  targetRank,
  isLoading = false
}) => {
  if (!isOpen) return null;

  const totalAmount = proposedAmount * guaranteeCount;
  const totalAmountWithVAT = Math.floor(totalAmount * 1.1);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-md" 
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeenIcon icon="check-circle" className="size-5 text-success" />
            협상 완료 확인
          </DialogTitle>
        </DialogHeader>
        
        <DialogBody>
          <div className="mb-4">
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              다음 조건으로 협상을 완료하시겠습니까?
            </p>
              
              {/* 협상 조건 요약 */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-2 text-sm">
                  {campaignName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">캠페인:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{campaignName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">목표 순위:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{targetRank}위</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{guaranteeUnit === '일' ? '일' : '회'}당 금액:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{proposedAmount.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">보장 기간:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{guaranteeCount}{guaranteeUnit}</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">총 금액:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{totalAmount.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">VAT 포함:</span>
                      <span className="text-gray-700 dark:text-gray-300">{totalAmountWithVAT.toLocaleString()}원</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-green-600 dark:text-green-400 mt-3">
                  협상 완료 후 사용자는 해당 조건으로 구매를 진행할 수 있습니다.
                </p>
              </div>
          
          {/* 푸터 */}
          <div className="flex justify-end gap-3 mt-4">
            <button
              className="btn btn-success btn-sm"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="loading loading-spinner loading-xs"></span>
                  처리 중...
                </span>
              ) : (
                '협상 완료'
              )}
            </button>
            <button
              className="btn btn-light btn-sm"
              onClick={onClose}
              disabled={isLoading}
            >
              취소
            </button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

export default GuaranteeNegotiationCompleteModal;