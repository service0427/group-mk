import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';

interface ApproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startDate?: string, endDate?: string) => void;
  count: number;
  title: string;
  description: string;
  confirmText: string;
}

const ApproveModal: React.FC<ApproveModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  count,
  title,
  description,
  confirmText
}) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // 모달이 열릴 때마다 기본 날짜 설정
  useEffect(() => {
    if (isOpen) {
      // 오늘 날짜를 기본값으로 설정 (YYYY-MM-DD 형식)
      const today = new Date();
      const formattedToday = today.toISOString().split('T')[0];
      
      // 종료일은 1개월 후로 설정
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);
      const formattedNextMonth = nextMonth.toISOString().split('T')[0];
      
      setStartDate(formattedToday);
      setEndDate(formattedNextMonth);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden flex flex-col">
        <DialogHeader className="bg-background py-4 px-6 border-b sticky top-0 z-10">
          <DialogTitle className="text-lg font-medium text-foreground">{title}</DialogTitle>
        </DialogHeader>

        <div className="p-6 bg-background overflow-y-auto flex-1">
          <div className="text-center mb-6">
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{count}개의 슬롯이 선택되었습니다</p>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>
          
          {/* 작업 기간 입력 필드 */}
          <div className="space-y-4 mt-6">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">작업 기간 설정</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  시작일
                </label>
                <input 
                  type="date" 
                  id="start-date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-gray-100 shadow-sm sm:text-sm bg-transparent"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  종료일
                </label>
                <input 
                  type="date" 
                  id="end-date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-gray-100 shadow-sm sm:text-sm bg-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end items-center gap-3 py-4 px-6 bg-gray-50 dark:bg-gray-800/50 border-t">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            취소
          </Button>
          <Button 
            onClick={() => {
              onConfirm(startDate, endDate);
              onClose();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <KeenIcon icon="check" className="mr-2 h-4 w-4" />
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApproveModal;