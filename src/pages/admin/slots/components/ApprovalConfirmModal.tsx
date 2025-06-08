import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';

interface WorkProgress {
  totalRequestedQuantity: number;
  totalWorkedQuantity: number;
  requestedDays: number;
  workedDays: number;
  completionRate: number;
  isEarlyCompletion: boolean;
}

interface ApprovalConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (workMemo?: string) => void;
  campaignName: string;
  dailyQuantity: number;
  progress: WorkProgress;
  actionType?: string;
}

const ApprovalConfirmModal: React.FC<ApprovalConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  campaignName,
  dailyQuantity,
  progress,
  actionType,
}) => {
  const [workMemo, setWorkMemo] = useState('');
  const remainingQuantity = Math.max(0, progress.totalRequestedQuantity - progress.totalWorkedQuantity);
  const remainingDays = Math.max(0, progress.requestedDays - progress.workedDays);
  const displayCompletionRate = Math.min(100, progress.completionRate); // 100% 상한
  const isComplete = actionType === 'complete';
  const isRefund = actionType === 'refund';

  // 모달이 닫힐 때 workMemo 초기화
  const handleClose = () => {
    setWorkMemo('');
    onClose();
  };

  // 제목 설정
  const getTitle = () => {
    if (isComplete) return '슬롯 완료 확인';
    if (isRefund) return '슬롯 환불 확인';
    return '슬롯 승인 확인';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden" aria-describedby={undefined}>
        <DialogHeader className="bg-background py-4 px-6 border-b">
          <DialogTitle className="text-lg font-semibold text-foreground">
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <DialogBody className="p-6 bg-background">
          {/* 캠페인명 */}
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {campaignName}
            </h3>
          </div>

          {/* 작업 진행 현황 */}
          <div className="space-y-3 mb-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              작업 진행 현황
            </h4>

            {progress.totalRequestedQuantity > 0 ? (
              <div className="space-y-2 pl-2">
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400 w-24">요청 수량:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {progress.totalRequestedQuantity.toLocaleString()}개
                    {dailyQuantity > 0 && progress.requestedDays > 0 && (
                      <span className="text-gray-500 ml-1">
                        (일 {dailyQuantity.toLocaleString()}개 × {progress.requestedDays}일)
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400 w-24">완료 수량:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {progress.totalWorkedQuantity.toLocaleString()}개
                  </span>
                </div>

                <div className="flex items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400 w-24">작업 일수:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {progress.workedDays}일 / {progress.requestedDays}일
                  </span>
                </div>

                <div className="flex items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400 w-24">진행률:</span>
                  <span className={`font-semibold ${displayCompletionRate >= 100
                    ? 'text-green-600 dark:text-green-400'
                    : displayCompletionRate > 0
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                    }`}>
                    {displayCompletionRate}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 pl-2">
                작업 수량 정보가 없습니다.
              </div>
            )}
          </div>

          {/* 미완료 작업 경고 */}
          {progress.isEarlyCompletion && progress.totalRequestedQuantity > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                    미완료 작업 경고
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <p>• 잔여 수량: {remainingQuantity.toLocaleString()}개</p>
                    <p>• 잔여 일수: {remainingDays}일</p>
                    <p className="font-semibold text-red-600 dark:text-red-400 mt-2">
                      ※ 미완료분은 사용자에게 환불됩니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 환불 경고 메시지 (환불인 경우만 표시) */}
          {isRefund && (
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
                      <li>작업이 완료된 수량을 제외한 나머지 금액이 환불됩니다</li>
                      <li>환불 금액: {remainingQuantity > 0 ? `${remainingQuantity.toLocaleString()}개분` : '전액'}</li>
                      <li>슬롯 상태가 '환불'로 변경됩니다</li>
                      <li>이 작업은 취소할 수 없습니다</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 작업 완료 메모 (완료 처리 시에만 표시) */}
          {isComplete && (
            <div className="space-y-2 mb-4">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                작업 완료 메모 (선택사항)
              </label>
              <Textarea
                value={workMemo}
                onChange={(e) => setWorkMemo(e.target.value)}
                placeholder="작업 완료와 관련된 메모를 입력하세요..."
                className="w-full min-h-[80px] resize-none"
                rows={3}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ※ 이 메모는 작업 완료 기록에 저장됩니다.
              </p>
            </div>
          )}

          {/* 확인 문구 */}
          <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
            {isComplete && '슬롯을 완료 처리하시겠습니까?'}
            {isRefund && '정말로 이 슬롯을 환불 처리하시겠습니까?'}
            {!isComplete && !isRefund && '슬롯을 승인하시겠습니까?'}
            {isComplete && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                ※ 사용자가 확인 후 정산이 진행됩니다.
              </div>
            )}
          </div>
        </DialogBody>

        <DialogFooter className="bg-gray-50 dark:bg-gray-800/50 px-6 py-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="mr-2"
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={() => {
              onConfirm(isComplete ? workMemo : undefined);
              handleClose();
            }}
            className={
              isRefund
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : progress.isEarlyCompletion
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-primary hover:bg-primary/90 text-white'
            }
          >
            {isComplete ? '완료' : isRefund ? '환불' : '승인'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApprovalConfirmModal;