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
  onConfirm: () => void;
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
  const remainingQuantity = Math.max(0, progress.totalRequestedQuantity - progress.totalWorkedQuantity);
  const remainingDays = Math.max(0, progress.requestedDays - progress.workedDays);
  const displayCompletionRate = Math.min(100, progress.completionRate); // 100% 상한
  const isComplete = actionType === 'complete';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="bg-background py-4 px-6 border-b">
          <DialogTitle className="text-lg font-semibold text-foreground">
            {isComplete ? '슬롯 완료 확인' : '슬롯 승인 확인'}
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
                  <span className={`font-semibold ${
                    displayCompletionRate >= 100 
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

          {/* 확인 문구 */}
          <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
            {isComplete ? '슬롯을 완료 처리하시겠습니까?' : '슬롯을 승인하시겠습니까?'}
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
            onClick={onClose}
            className="mr-2"
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className={progress.isEarlyCompletion 
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
              : 'bg-primary hover:bg-primary/90 text-white'
            }
          >
            {isComplete ? '완료' : '승인'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApprovalConfirmModal;