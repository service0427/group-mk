import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface GuaranteeApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  campaignName?: string;
  guaranteeCount: number;
  guaranteeUnit?: string;
  startDate?: string;
  endDate?: string;
}

const GuaranteeApprovalModal: React.FC<GuaranteeApprovalModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  campaignName,
  guaranteeCount,
  guaranteeUnit = 'daily',
  startDate,
  endDate,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden flex flex-col">
        <DialogHeader className="bg-background py-4 px-6 border-b sticky top-0 z-10">
          <DialogTitle className="text-lg font-medium text-foreground">보장형 슬롯 승인</DialogTitle>
          <DialogDescription className="sr-only">
            보장형 슬롯을 승인하는 모달입니다.
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
              보장 정보
            </h4>
            <div className="space-y-2 pl-2">
              <div className="flex items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400 w-24">보장기간:</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {guaranteeCount}{guaranteeUnit === 'daily' ? '일' : '회'}
                </span>
              </div>
              {startDate && endDate && (
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400 w-24">작업기간:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {startDate} ~ {endDate}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                  승인 안내
                </h3>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <p>• 승인 즉시 보장형 슬롯이 활성화됩니다</p>
                  <p>• 사용자에게 승인 알림이 발송됩니다</p>
                  <p>• 작업 시작일부터 보장 순위가 적용됩니다</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
            이 보장형 슬롯을 승인하시겠습니까?
          </div>
        </div>

        <div className="flex justify-end items-center gap-3 py-4 px-6 bg-gray-50 dark:bg-gray-800/50 border-t">
          <Button
            onClick={onConfirm}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            승인
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

export default GuaranteeApprovalModal;