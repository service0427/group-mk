import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slot, WorkInputFormData } from '../types';
import { toast } from 'sonner';

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
        toast.error(`작업 날짜는 시작일(${new Date(slot.start_date).toLocaleDateString()}) 이후여야 합니다.`);
        return;
      }
    }

    // 종료일 체크
    if (slot && slot.end_date) {
      const endDate = new Date(slot.end_date);
      endDate.setHours(0, 0, 0, 0);
      if (workDate > endDate) {
        toast.error(`이미 종료된 슬롯입니다. 종료일: ${new Date(slot.end_date).toLocaleDateString()}`);
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
      <DialogContent className="sm:max-w-md p-0 overflow-hidden flex flex-col">
        <DialogHeader className="bg-background py-4 px-6 border-b sticky top-0 z-10">
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
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {slot.campaign_name || `캠페인 #${slot.id.substring(0, 8)}`}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 bg-background overflow-y-auto flex-1">
          <form id="work-input-form" onSubmit={handleSubmit} className="space-y-6">
            {/* 슬롯 정보 요약 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                슬롯 정보
              </h4>
              <div className="space-y-3">
                {/* 첫 번째 행: 캠페인, 작업량 */}
                <div className="grid grid-cols-2 gap-4 text-sm">
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
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">시작일:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {slot.start_date ? new Date(slot.start_date).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">종료일:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {slot.end_date ? new Date(slot.end_date).toLocaleDateString() : '-'}
                    </span>
                  </div>
                </div>

                {/* 세 번째 행: 사용자, MID */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">사용자:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {slot.user_name || '-'}
                    </span>
                    {slot.user_email && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {slot.user_email}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">MID:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {slot.mid || '-'}
                    </span>
                  </div>
                </div>

                {/* 네 번째 행: 키워드 (전체 너비) */}
                {slot.keywords && (
                  <div className="text-sm">
                    <span className="text-blue-600 dark:text-blue-400 font-medium flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                      </svg>
                      키워드
                    </span>
                    <div className="mt-1 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded text-yellow-900 dark:text-yellow-100 whitespace-pre-line text-xs">
                      {slot.keywords}
                    </div>
                  </div>
                )}

                {/* 다섯 번째 행: URL (전체 너비) */}
                {slot.url && (
                  <div className="text-sm">
                    <span className="text-purple-600 dark:text-purple-400 font-medium flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                      </svg>
                      URL
                    </span>
                    <div className="mt-1 p-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50 rounded">
                      <a 
                        href={slot.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-purple-700 dark:text-purple-300 hover:underline text-xs break-all"
                        title={slot.url}
                      >
                        {slot.url}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 작업 입력 폼 */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-900 dark:text-green-300 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                작업 입력
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {/* 날짜 입력 */}
                <div>
                  <label htmlFor="work-date" className="block text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                    작업 날짜 *
                  </label>
                  <Input
                    id="work-date"
                    type="text"
                    value={formatDateKorean(formData.date)}
                    readOnly
                    className="block w-full bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    오늘 날짜({formatDateKorean(getLocalDateString())})로 자동 설정됩니다.
                  </p>
                </div>

                {/* 작업 타수 입력 */}
                <div>
                  <label htmlFor="work-count" className="block text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                    작업 타수 *
                  </label>
                  <Input
                    id="work-count"
                    type="number"
                    min="1"
                    step="1"
                    value={formData.work_cnt}
                    onChange={(e) => handleInputChange('work_cnt', e.target.value)}
                    placeholder="예: 100"
                    className="block w-full"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    실제로 작업한 타수를 입력해주세요.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* 버튼 영역 */}
        <div className="flex justify-end items-center gap-3 py-4 px-6 bg-gray-50 dark:bg-gray-800/50 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            취소
          </Button>
          <Button
            type="submit"
            form="work-input-form"
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                입력 중...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                작업 입력
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkInputModal;