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

  const isEarlyCompletion = completedDays < guaranteeCount;
  const completionRate = guaranteeCount > 0 ? Math.round((completedDays / guaranteeCount) * 100) : 0;

  const handleConfirm = () => {
    if (!workMemo.trim()) {
      setError('작업 완료 메모를 입력해주세요.');
      return;
    }

    onConfirm(workMemo);
    setWorkMemo('');
    setError('');
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
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden flex flex-col">
        <DialogHeader className="bg-background py-4 px-6 border-b sticky top-0 z-10">
          <DialogTitle className="text-lg font-medium text-foreground">보장형 슬롯 완료</DialogTitle>
          <DialogDescription className="sr-only">
            보장형 슬롯을 완료 처리하는 모달입니다.
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
              작업 진행 현황
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
                  {completedDays}{guaranteeUnit === 'daily' ? '일' : '회'}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400 w-24">진행률:</span>
                <span className={`font-semibold ${completionRate >= 100
                    ? 'text-green-600 dark:text-green-400'
                    : completionRate > 0
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                  {completionRate}%
                </span>
              </div>
            </div>
          </div>

          {isEarlyCompletion && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                    조기 완료 경고
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <p>• 잔여 기간: {guaranteeCount - completedDays}{guaranteeUnit === 'daily' ? '일' : '회'}</p>
                    <p className="font-semibold text-red-600 dark:text-red-400 mt-2">
                      ※ 미완료분은 사용자에게 환불됩니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2 mb-2">
            <label htmlFor="workMemo" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              작업 완료 메모 <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="workMemo"
              className={`w-full px-3 py-2 border rounded-md ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                } bg-white dark:bg-gray-800 shadow-sm focus:outline-none focus:ring-2 transition duration-150 ease-in-out`}
              rows={4}
              placeholder="작업 완료와 관련된 메모를 입력하세요..."
              value={workMemo}
              onChange={(e) => {
                setWorkMemo(e.target.value);
                if (e.target.value.trim()) setError('');
              }}
            />
            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ※ 이 메모는 작업 완료 기록에 저장됩니다.
            </p>
          </div>

          <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
            슬롯을 완료 처리하시겠습니까?
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              ※ 사용자가 확인 후 정산이 진행됩니다.
            </div>
          </div>
        </div>

        <div className="flex justify-end items-center gap-3 py-4 px-6 bg-gray-50 dark:bg-gray-800/50 border-t">
          <Button
            onClick={handleConfirm}
            className={isEarlyCompletion
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
              : 'bg-primary hover:bg-primary/90 text-white'
            }
          >
            완료
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

export default GuaranteeCompleteModal;