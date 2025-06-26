import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog';
import { KeenIcon } from '@/components';

interface GuaranteeNegotiationRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  campaignName?: string;
  isLoading?: boolean;
}

const GuaranteeNegotiationRejectModal: React.FC<GuaranteeNegotiationRejectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  campaignName,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-md"
        aria-describedby={undefined}
        style={{ zIndex: 2147483647 }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeenIcon icon="cross-circle" className="size-5 text-danger" />
            협상 거절 확인
          </DialogTitle>
        </DialogHeader>

        <DialogBody>
          <div className="mb-4">
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              {campaignName ? (
                <>
                  <span className="font-semibold">{campaignName}</span> 캠페인의 협상을 거절하시겠습니까?
                </>
              ) : (
                '이 견적 협상을 거절하시겠습니까?'
              )}
            </p>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">
                협상을 거절하시겠습니까?
              </p>
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                거절 후에도 거절 취소를 통해 협상을 다시 시작할 수 있습니다.
              </p>
            </div>
          </div>

          {/* 푸터 */}
          <div className="flex justify-end gap-3 mt-4">
            <button
              className="btn btn-danger btn-sm"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="loading loading-spinner loading-xs"></span>
                  처리 중...
                </span>
              ) : (
                '거절'
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

export default GuaranteeNegotiationRejectModal;