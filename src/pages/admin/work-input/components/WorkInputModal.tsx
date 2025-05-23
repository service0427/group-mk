import React, { useState } from 'react';
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
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // 오늘 날짜를 기본값으로
    work_cnt: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      toast.error(error.message || '작업 입력 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 모달 닫기
  const handleClose = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
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
          <form onSubmit={handleSubmit} className="space-y-6">
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
                <input
                  id="work-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  max={new Date().toISOString().split('T')[0]} // 오늘까지만 선택 가능
                  min={slot.start_date || undefined} // 시작일 이후만 선택 가능
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-gray-100 shadow-sm sm:text-sm bg-transparent"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  오늘 날짜 이전의 작업 날짜만 선택 가능합니다.
                </p>
              </div>

              {/* 작업 타수 입력 */}
              <div>
                <label htmlFor="work-count" className="block text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                  작업 타수 *
                </label>
                <input
                  id="work-count"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.work_cnt}
                  onChange={(e) => handleInputChange('work_cnt', e.target.value)}
                  placeholder="예: 100"
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-gray-100 shadow-sm sm:text-sm bg-transparent"
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
            onClick={handleSubmit}
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