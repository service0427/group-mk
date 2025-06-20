import React from 'react';
import { KeenIcon } from '@/components';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';

interface RefundConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: 'refund' | 'approve' | 'reject';
  loading?: boolean;
  // 환불 정보
  campaignName?: string;
  refundAmount?: number;
  refundReason?: string;
  // 환불 계산 정보
  totalAmount?: number;
  guaranteeCount?: number;
  completedDays?: number;
  requesterName?: string;
}

const RefundConfirmModal: React.FC<RefundConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  type,
  loading = false,
  campaignName,
  refundAmount = 0,
  refundReason,
  totalAmount = 0,
  guaranteeCount = 0,
  completedDays = 0,
  requesterName,
}) => {
  // 숫자를 천 단위 콤마로 포맷팅하는 함수
  const formatNumber = (num: number): string => {
    return num.toLocaleString('ko-KR');
  };

  const remainingDays = Math.max(0, guaranteeCount - completedDays);

  const getModalConfig = () => {
    switch (type) {
      case 'refund':
        return {
          title: '환불 요청 확인',
          icon: 'wallet',
          iconColor: 'text-red-600',
          confirmText: '환불 요청',
          confirmClass: 'bg-red-500 hover:bg-red-600',
          message: '다음 조건으로 환불 요청을 접수하시겠습니까?'
        };
      case 'approve':
        return {
          title: '환불 승인 확인',
          icon: 'check-circle',
          iconColor: 'text-green-600',
          confirmText: '승인',
          confirmClass: 'bg-green-500 hover:bg-green-600',
          message: '다음 환불 요청을 승인하시겠습니까?'
        };
      case 'reject':
        return {
          title: '환불 거절 확인',
          icon: 'cross-circle',
          iconColor: 'text-red-600',
          confirmText: '거절',
          confirmClass: 'bg-red-500 hover:bg-red-600',
          message: '다음 환불 요청을 거절하시겠습니까?'
        };
    }
  };

  const config = getModalConfig();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeenIcon icon={config.icon} className={`size-5 ${config.iconColor}`} />
            {config.title}
          </DialogTitle>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {config.message}
            </p>

            {/* 환불 조건 정보 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
              {campaignName && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">캠페인:</span>
                  <span className="text-sm font-medium">{campaignName}</span>
                </div>
              )}
              
              {requesterName && type !== 'refund' && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">신청자:</span>
                  <span className="text-sm font-medium">{requesterName}</span>
                </div>
              )}

              {totalAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">원래 결제금액:</span>
                  <span className="text-sm font-medium">{formatNumber(totalAmount)}원</span>
                </div>
              )}

              {guaranteeCount > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">전체 보장기간:</span>
                    <span className="text-sm font-medium">{guaranteeCount}일</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">완료 기간:</span>
                    <span className="text-sm font-medium">{completedDays}일</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">잔여 기간:</span>
                    <span className="text-sm font-medium text-orange-600">{remainingDays}일</span>
                  </div>
                </>
              )}

              <hr className="border-gray-200 dark:border-gray-700" />

              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">환불 금액:</span>
                <span className="text-sm font-bold text-red-600">{formatNumber(refundAmount)}원</span>
              </div>

              {refundReason && (
                <>
                  <hr className="border-gray-200 dark:border-gray-700" />
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">환불 사유:</span>
                    <div className="text-sm text-gray-800 dark:text-gray-200 mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                      {refundReason}
                    </div>
                  </div>
                </>
              )}
            </div>

            {type === 'refund' && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <KeenIcon icon="information-2" className="text-amber-600 text-sm mt-0.5" />
                  <div className="text-xs text-amber-700 dark:text-amber-300">
                    <div className="font-medium mb-1">환불 요청 안내</div>
                    <div>• 환불 요청 후 관리자 검토를 거쳐 처리됩니다.</div>
                    <div>• 승인 시 환불 금액이 사용자 계정으로 입금됩니다.</div>
                    <div>• 환불 처리 상태는 상태 컬럼에서 확인할 수 있습니다.</div>
                  </div>
                </div>
              </div>
            )}

            {type === 'reject' && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <KeenIcon icon="information-2" className="text-red-600 text-sm mt-0.5" />
                  <div className="text-xs text-red-700 dark:text-red-300">
                    거절 시 사용자에게 거절 사유가 전달되며, 환불이 처리되지 않습니다.
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            onClick={onConfirm}
            className={`${config.confirmClass} text-white`}
            disabled={loading}
          >
            {loading ? (
              <KeenIcon icon="loading" className="animate-spin text-base mr-2" />
            ) : (
              <KeenIcon icon={config.icon} className="text-base mr-2" />
            )}
            {config.confirmText}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            취소
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RefundConfirmModal;