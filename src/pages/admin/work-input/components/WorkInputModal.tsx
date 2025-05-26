import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slot, WorkInputFormData } from '../types';
import { toast } from 'sonner';
import { formatDate } from '../utils/dateUtils';

interface WorkInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: Slot | null;
  onSubmit: (data: WorkInputFormData) => Promise<void>;
}

const WorkInputModal: React.FC<WorkInputModalProps> = ({
  isOpen,
  onClose,
  slot,
  onSubmit
}) => {
  // 로컬 날짜를 YYYY-MM-DD 형식으로 가져오는 함수
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    date: getLocalDateString(), // 오늘 날짜를 기본값으로
    work_cnt: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 날짜 포맷팅 함수
  const formatDateKorean = (dateString: string) => {
    // dateString이 'YYYY-MM-DD' 형식이므로 직접 파싱
    const [year, month, day] = dateString.split('-');
    return `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`;
  };

  // 모달이 열릴 때마다 폼 데이터 초기화
  useEffect(() => {
    if (isOpen) {
      setFormData({
        date: getLocalDateString(),
        work_cnt: ''
      });
    }
  }, [isOpen]);

  // 폼 데이터 변경 핸들러
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 유효성 검사
    if (!formData.date) {
      toast.error('날짜를 입력해주세요.');
      return;
    }
    
    const workCount = parseInt(formData.work_cnt);
    if (!formData.work_cnt || isNaN(workCount) || workCount <= 0) {
      toast.error('올바른 작업 타수를 입력해주세요.');
      return;
    }

    // 추가 유효성 검사
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const workDate = new Date(formData.date);
    workDate.setHours(0, 0, 0, 0);

    // 미래 날짜 체크
    if (workDate > today) {
      toast.error('미래 날짜에는 작업을 입력할 수 없습니다.');
      return;
    }

    // 시작일 체크
    if (slot && slot.start_date) {
      const startDate = new Date(slot.start_date);
      startDate.setHours(0, 0, 0, 0);
      if (workDate < startDate) {
        toast.error(`작업 날짜는 시작일(${formatDate(slot.start_date)}) 이후여야 합니다.`);
        return;
      }
    }

    // 종료일 체크
    if (slot && slot.end_date) {
      const endDate = new Date(slot.end_date);
      endDate.setHours(0, 0, 0, 0);
      if (workDate > endDate) {
        toast.error(`이미 종료된 슬롯입니다. 종료일: ${formatDate(slot.end_date)}`);
        return;
      }
    }

    // 작업량 상한 체크
    if (workCount > 10000) {
      toast.error('작업량이 너무 큽니다. 10,000 이하로 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!slot) return;
      
      await onSubmit({
        slot_id: slot.id,
        date: formData.date,
        work_cnt: workCount
      });
      
      toast.success('작업이 성공적으로 입력되었습니다.');
      handleClose();
    } catch (error: any) {
      // 서버 에러 메시지 파싱
      if (error.message?.includes('duplicate key')) {
        toast.error('해당 날짜에 이미 작업이 입력되어 있습니다.');
      } else if (error.message?.includes('exceeds quantity')) {
        toast.error('총 작업량이 슬롯 수량을 초과합니다.');
      } else {
        toast.error(error.message || '작업 입력 중 오류가 발생했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 모달 닫기
  const handleClose = () => {
    setFormData({
      date: getLocalDateString(),
      work_cnt: ''
    });
    onClose();
  };

  if (!slot) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] sm:max-w-md p-0 overflow-hidden flex flex-col h-[75vh] sm:h-[70vh]">
        <DialogHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800 py-3 sm:py-4 px-4 sm:px-6 border-b sticky top-0 z-10 shrink-0">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full mr-3">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                작업 입력
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {slot.campaign_name || `캠페인 #${slot.id.substring(0, 8)}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 sm:p-6 bg-background overflow-y-auto flex-1">
          <form id="work-input-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* 슬롯 정보 요약 */}
            <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg p-3 sm:p-4">
              <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                슬롯 정보
              </h4>
              <div className="space-y-3">
                {/* 첫 번째 행: 캠페인, 작업량 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">캠페인:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {slot.campaign_name || `#${slot.id.substring(0, 8)}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">작업량:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {slot.quantity ? `${slot.quantity.toLocaleString()} 타` : '미지정'}
                    </span>
                  </div>
                </div>

                {/* 두 번째 행: 시작일, 종료일 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">시작일:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {formatDate(slot.start_date)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">종료일:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {formatDate(slot.end_date)}
                    </span>
                  </div>
                </div>

                {/* 키워드 */}
                {slot.keywords && (
                  <div>
                    <div className="text-emerald-600 dark:text-emerald-400 text-sm mb-1">키워드:</div>
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded text-gray-900 dark:text-gray-100 whitespace-pre-line text-xs sm:text-sm">
                      {slot.keywords}
                    </div>
                  </div>
                )}

                {/* MID/URL */}
                {(slot.mid || slot.url) && (
                  <div className="text-sm">
                    {slot.mid && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">MID:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">{slot.mid}</span>
                      </div>
                    )}
                    {slot.url && (
                      <div className="mt-1">
                        <span className="text-gray-500 dark:text-gray-400">URL:</span>
                        <a 
                          href={slot.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-600 dark:text-blue-400 hover:underline text-xs sm:text-sm break-all"
                        >
                          {slot.url}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 작업 입력 폼 */}
            <div className="space-y-4">
              {/* 작업 날짜 */}
              <div>
                <label htmlFor="work-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  작업 날짜 <span className="text-red-500">*</span>
                </label>
                <Input
                  id="work-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  max={getLocalDateString()}
                  min={slot.start_date ? slot.start_date.split('T')[0] : undefined}
                  className="w-full"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  선택한 날짜: {formatDateKorean(formData.date)}
                </p>
              </div>

              {/* 작업 타수 */}
              <div>
                <label htmlFor="work-count" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  작업 타수 <span className="text-red-500">*</span>
                </label>
                <Input
                  id="work-count"
                  type="number"
                  value={formData.work_cnt}
                  onChange={(e) => handleInputChange('work_cnt', e.target.value)}
                  placeholder="예: 100"
                  min="1"
                  max="10000"
                  className="w-full"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  해당 날짜에 완료한 작업 타수를 입력하세요.
                </p>
              </div>

              {/* 작업 안내 */}
              <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800/50 rounded-lg p-2.5 sm:p-3">
                <h5 className="text-sm font-medium text-sky-900 dark:text-sky-300 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  작업 입력 안내
                </h5>
                <ul className="text-xs sm:text-sm text-sky-700 dark:text-sky-200 space-y-1">
                  <li>• 하루에 한 번만 작업을 입력할 수 있습니다.</li>
                  <li>• 이미 입력한 날짜는 수정할 수 없습니다.</li>
                  <li>• 작업량은 1 이상 10,000 이하로 입력해주세요.</li>
                  <li>• 미래 날짜에는 작업을 입력할 수 없습니다.</li>
                </ul>
              </div>
            </div>
          </form>
        </div>

        {/* 버튼 영역 */}
        <div className="flex justify-end items-center gap-3 py-3 sm:py-4 px-4 sm:px-6 bg-gray-50 dark:bg-gray-800/50 border-t shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
          >
            취소
          </Button>
          <Button
            type="submit"
            form="work-input-form"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
          >
            {isSubmitting ? '처리 중...' : '작업 입력'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkInputModal;