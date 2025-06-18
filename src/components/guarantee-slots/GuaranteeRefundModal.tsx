import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog';
import { KeenIcon } from '@/components';
import { Badge } from '@/components/ui/badge';

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
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  const remainingDays = Math.max(0, guaranteeCount - completedDays);
  const completionRate = guaranteeCount > 0 ? Math.round((completedDays / guaranteeCount) * 100) : 0;
  const refundRate = guaranteeCount > 0 ? Math.round((remainingDays / guaranteeCount) * 100) : 100;
  const refundAmount = Math.round(totalAmount * (refundRate / 100));

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('환불 사유를 입력해주세요.');
      return;
    }

    setShowConfirm(true);
  };

  const handleFinalConfirm = () => {
    onConfirm(reason);
    setReason('');
    setError('');
    setShowConfirm(false);
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
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col" aria-describedby={undefined}>
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <KeenIcon icon="dollar" className="size-5 text-danger" />
              보장형 슬롯 환불
            </DialogTitle>
          </DialogHeader>

          <DialogBody className="flex-1 overflow-y-auto">
            <div className="space-y-3">

              {/* 환불 정보 카드 */}
              <div className="card">
                <div className="card-body">
                  {campaignName && (
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3">
                      {campaignName}
                    </h3>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-xs text-slate-500 dark:text-gray-500">보장기간</span>
                      <span className="font-medium">
                        {guaranteeCount}{guaranteeUnit === 'daily' ? '일' : '회'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-xs text-slate-500 dark:text-gray-500">완료 기간</span>
                      <span className="font-medium">
                        {completedDays}{guaranteeUnit === 'daily' ? '일' : '회'} ({completionRate}%)
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-xs text-slate-500 dark:text-gray-500">잔여 기간</span>
                      <Badge variant="destructive" className="text-xs">
                        {remainingDays}{guaranteeUnit === 'daily' ? '일' : '회'} ({refundRate}%)
                      </Badge>
                    </div>
                    {totalAmount > 0 && (
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200 dark:border-gray-700">
                        <span className="text-xs text-slate-500 dark:text-gray-500">환불 예정액</span>
                        <span className="font-semibold text-danger">
                          {refundAmount.toLocaleString()}원
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 환불 처리 안내 */}
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <KeenIcon icon="cross-circle" className="text-sm text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                      환불 처리 안내
                    </h3>
                    <div className="text-xs text-red-700 dark:text-red-300 space-y-1">
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

              {/* 환불 사유 카드 */}
              <div className="card">
                <div className="card-body">
                  <label htmlFor="refundReason" className="form-label required text-sm mb-2">
                    환불 사유
                  </label>
                  <Textarea
                    id="refundReason"
                    className="textarea textarea-sm resize-none"
                    rows={4}
                    placeholder="환불 사유를 입력해주세요. 사용자에게 표시됩니다."
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      if (e.target.value.trim()) setError('');
                    }}
                  />
                  <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">
                    ※ 사용자에게 표시되는 내용이므로 신중히 작성해주세요.
                  </p>
                </div>
              </div>

              {/* 확인 메시지 */}
              <div className="bg-slate-50 dark:bg-gray-900 rounded-lg p-3">
                <p className="text-sm text-slate-700 dark:text-gray-300 font-medium">
                  정말로 이 보장형 슬롯을 환불 처리하시겠습니까?
                </p>
              </div>
            </div>
          </DialogBody>

          <div className="flex-shrink-0 flex justify-between items-center p-4 border-t border-slate-200 dark:border-gray-700">
            {error && (
              <div className="flex items-center gap-1 text-xs text-red-500">
                <KeenIcon icon="information-2" className="size-3" />
                <p>{error}</p>
              </div>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handleConfirm}
                className="btn btn-danger btn-sm"
              >
                환불
              </button>
              <Button
                variant="light"
                size="sm"
                onClick={onClose}
              >
                취소
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 최종 확인 모달 */}
      {showConfirm && (
        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
          <DialogContent className="max-w-sm" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeenIcon icon="shield-slash" className="size-5 text-danger" />
                최종 확인
              </DialogTitle>
            </DialogHeader>
            <DialogBody>
              <div className="py-4">
                <p className="text-sm text-slate-700 dark:text-gray-300 mb-3">
                  정말로 이 보장형 슬롯을 환불 처리하시겠습니까?
                </p>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
                  <div className="space-y-2">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      <strong>경고:</strong> 이 작업은 취소할 수 없습니다.
                    </p>
                    {refundAmount > 0 && (
                      <p className="text-sm text-red-700 dark:text-red-300">
                        <strong>환불 예정금액:</strong> {refundAmount.toLocaleString()}원
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </DialogBody>
            <div className="flex justify-end items-center gap-2 p-4 border-t border-slate-200 dark:border-gray-700">
              <button
                onClick={handleFinalConfirm}
                className="btn btn-danger btn-sm"
              >
                환불
              </button>
              <Button
                variant="light"
                size="sm"
                onClick={() => setShowConfirm(false)}
              >
                취소
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default GuaranteeRefundModal;