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
import { cn } from '@/lib/utils';
import { KeenIcon } from '@/components';
import { Badge } from '@/components/ui/badge';

interface GuaranteeCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (workMemo: string) => void;
  campaignName?: string;
  guaranteeCount: number;
  guaranteeUnit?: string;
  completedDays?: number;
}

const GuaranteeCompleteModal: React.FC<GuaranteeCompleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  campaignName,
  guaranteeCount,
  guaranteeUnit = 'daily',
  completedDays = 0,
}) => {
  const [workMemo, setWorkMemo] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  const isEarlyCompletion = completedDays < guaranteeCount;
  const completionRate = guaranteeCount > 0 ? Math.round((completedDays / guaranteeCount) * 100) : 0;

  const handleConfirm = () => {
    if (!workMemo.trim()) {
      setError('작업 완료 메모를 입력해주세요.');
      return;
    }

    setShowConfirm(true);
  };

  const handleFinalConfirm = () => {
    onConfirm(workMemo);
    setWorkMemo('');
    setError('');
    setShowConfirm(false);
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setWorkMemo('');
      setError('');
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col" aria-describedby={undefined}>
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <KeenIcon icon="check-circle" className="size-5 text-success" />
              보장형 슬롯 완료
            </DialogTitle>
          </DialogHeader>

          <DialogBody className="flex-1 overflow-y-auto">
            <div className="space-y-3">

              {/* 캠페인 정보 카드 */}
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
                        {completedDays}{guaranteeUnit === 'daily' ? '일' : '회'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200 dark:border-gray-700">
                      <span className="text-xs text-slate-500 dark:text-gray-500">진행률</span>
                      <Badge
                        variant="default"
                        className={cn(
                          "text-xs",
                          completionRate >= 100 ? 'bg-green-500 hover:bg-green-600' :
                          completionRate > 0 ? 'bg-amber-500 hover:bg-amber-600' :
                          'bg-red-500 hover:bg-red-600'
                        )}
                      >
                        {completionRate}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {isEarlyCompletion && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <KeenIcon icon="information-2" className="text-sm text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
                        조기 완료 경고
                      </h3>
                      <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                        <p>• 잔여 기간: {guaranteeCount - completedDays}{guaranteeUnit === 'daily' ? '일' : '회'}</p>
                        <p className="font-semibold text-red-600 dark:text-red-400 mt-1">
                          ※ 미완료분은 사용자에게 환불됩니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 작업 완료 메모 카드 */}
              <div className="card">
                <div className="card-body">
                  <label htmlFor="workMemo" className="form-label required text-sm mb-2">
                    작업 완료 메모
                  </label>
                  <Textarea
                    id="workMemo"
                    className="textarea textarea-sm resize-none"
                    rows={4}
                    placeholder="작업 완료와 관련된 메모를 입력하세요..."
                    value={workMemo}
                    onChange={(e) => {
                      setWorkMemo(e.target.value);
                      if (e.target.value.trim()) setError('');
                    }}
                  />
                  <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">
                    ※ 이 메모는 작업 완료 기록에 저장됩니다.
                  </p>
                </div>
              </div>

              {/* 확인 메시지 */}
              <div className="bg-slate-50 dark:bg-gray-900 rounded-lg p-3">
                <p className="text-sm text-slate-700 dark:text-gray-300 font-medium">
                  슬롯을 완료 처리하시겠습니까?
                </p>
                <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">
                  ※ 사용자가 확인 후 정산이 진행됩니다.
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
                className="btn btn-primary btn-sm"
              >
                완료
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
                <KeenIcon icon="shield-tick" className="size-5 text-success" />
                최종 확인
              </DialogTitle>
            </DialogHeader>
            <DialogBody>
              <div className="py-4">
                <p className="text-sm text-slate-700 dark:text-gray-300 mb-2">
                  정말로 이 보장형 슬롯을 완료 처리하시겠습니까?
                </p>
                {isEarlyCompletion && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 mt-3">
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      <strong>주의:</strong> 조기 완료로 인해 잔여 {guaranteeCount - completedDays}{guaranteeUnit === 'daily' ? '일' : '회'}분은 환불됩니다.
                    </p>
                  </div>
                )}
              </div>
            </DialogBody>
            <div className="flex justify-end items-center gap-2 p-4 border-t border-slate-200 dark:border-gray-700">
              <button
                onClick={handleFinalConfirm}
                className="btn btn-primary btn-sm"
              >
                확인
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

export default GuaranteeCompleteModal;