import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';

interface GuaranteeRankCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotId: string;
  campaignName?: string;
  targetRank: number;
  keyword?: string;
}

const GuaranteeRankCheckModal: React.FC<GuaranteeRankCheckModalProps> = ({
  isOpen,
  onClose,
  slotId,
  campaignName,
  targetRank,
  keyword
}) => {
  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-md max-h-[85vh] flex flex-col"
        aria-describedby={undefined}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <KeenIcon icon="chart-line" className="size-5 text-primary" />
            순위 확인
          </DialogTitle>
        </DialogHeader>

        <DialogBody className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-3">
              {/* 캠페인 정보 */}
              <div className="card">
                <div className="card-body">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-gray-500 block">캠페인</span>
                      <span className="text-sm font-medium mt-0.5 block truncate">
                        {campaignName || '캠페인'}
                      </span>
                    </div>
                    {keyword && (
                      <div>
                        <span className="text-xs text-slate-500 dark:text-gray-500 block">키워드</span>
                        <span className="text-sm font-medium mt-0.5 block truncate">
                          {keyword}
                        </span>
                      </div>
                    )}
                    <div className="col-span-2 flex items-center justify-between pt-2 border-t border-slate-200 dark:border-gray-700">
                      <span className="text-sm font-medium">목표 순위</span>
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary-light dark:bg-primary-dark">
                        <span className="text-base font-bold text-primary">{targetRank}위</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 차트/표 영역 - 나중에 구현 */}
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <KeenIcon icon="chart-line" className="text-3xl text-slate-300 dark:text-gray-600 mb-3" />
                      <p className="text-sm text-slate-500 dark:text-gray-500">
                        순위 추적 차트가 여기에 표시됩니다
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </DialogBody>

        <div className="flex-shrink-0 flex justify-end p-4 border-t border-slate-200 dark:border-gray-700">
          <Button
            variant="light"
            size="sm"
            onClick={handleClose}
          >
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuaranteeRankCheckModal;