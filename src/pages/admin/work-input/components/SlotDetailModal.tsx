import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slot, SlotWorkInfo } from '../types';
import { getSlotWorks } from '../services/workInputService';
import { toast } from 'sonner';
import { formatDate } from '../utils/dateUtils';

interface SlotDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: Slot | null;
}

const SlotDetailModal: React.FC<SlotDetailModalProps> = ({
  isOpen,
  onClose,
  slot
}) => {
  const [workRecords, setWorkRecords] = useState<SlotWorkInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 슬롯의 작업 기록 가져오기
  const fetchWorkRecords = async () => {
    if (!slot?.id) return;
    
    setIsLoading(true);
    try {
      const records = await getSlotWorks(slot.id);
      setWorkRecords(records);
    } catch (error: any) {
      toast.error('작업 기록을 불러오는 중 오류가 발생했습니다.');
      console.error('작업 기록 조회 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 모달이 열릴 때 작업 기록 가져오기
  useEffect(() => {
    if (isOpen && slot) {
      fetchWorkRecords();
    }
  }, [isOpen, slot]);

  // 날짜 범위 생성 (시작일부터 종료일까지)
  const generateDateRange = () => {
    if (!slot?.start_date || !slot?.end_date) return [];
    
    const startDate = new Date(slot.start_date);
    const endDate = new Date(slot.end_date);
    const dates: Date[] = [];
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  // 작업 기록을 날짜별로 매핑
  const getWorkByDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return workRecords.find(record => record.date === dateString);
  };

  // 통계 계산
  const calculateStats = () => {
    const totalWorkCount = workRecords.reduce((sum, record) => sum + record.work_cnt, 0);
    const workDays = workRecords.length;
    const avgWorkCount = workDays > 0 ? Math.round(totalWorkCount / workDays) : 0;
    
    // 작업 완료일 (마지막 작업 기록 날짜)
    const lastWorkDate = workRecords.length > 0 
      ? new Date(Math.max(...workRecords.map(r => new Date(r.date).getTime())))
      : null;
    
    // 작업 요청일 (시작일)
    const requestDate = slot?.start_date ? new Date(slot.start_date) : null;
    
    // 작업 기간 계산 (시작일부터 종료일까지 일수)
    const totalWorkDays = slot?.start_date && slot?.end_date 
      ? Math.ceil((new Date(slot.end_date).getTime() - new Date(slot.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 0;
    
    // 총 목표 작업량 (quantity)
    const quantity = slot?.quantity || 0;
    const totalTargetWorkCount = quantity  * totalWorkDays || 0;
    
    // 일 목표 작업량 (총 목표 작업량 ÷ 작업일수)
    const dailyTargetWorkCount = totalWorkDays > 0 ? Math.round(totalTargetWorkCount / totalWorkDays) : 0;
    
    return {
      totalWorkCount,
      workDays,
      avgWorkCount,
      lastWorkDate,
      requestDate,
      totalWorkDays,
      totalTargetWorkCount,
      dailyTargetWorkCount
    };
  };

  const dateRange = generateDateRange();
  const stats = calculateStats();

  if (!slot) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-4xl p-0 overflow-hidden flex flex-col h-[85vh] sm:h-[80vh]">
        <DialogHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 py-3 sm:py-4 px-4 sm:px-6 border-b sticky top-0 z-10 shrink-0">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full mr-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                슬롯 상세보기
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {slot.campaign_name || `캠페인 #${slot.id.substring(0, 8)}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 sm:p-6 bg-background overflow-y-auto flex-1">
          {/* 슬롯 기본 정보 */}
          <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              기본 정보
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">캠페인:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {slot.campaign_name || `#${slot.id.substring(0, 8)}`}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">작업 기간:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {stats.totalWorkDays > 0 ? `${stats.totalWorkDays}일` : '미지정'}
                </span>
              </div>
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
              <div>
                <span className="text-gray-500 dark:text-gray-400">사용자:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {slot.user_name || '-'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">MID:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {slot.mid || '-'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">총 목표 작업량:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {stats.totalTargetWorkCount ? `${stats.totalTargetWorkCount.toLocaleString()} 타` : '미지정'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">일 목표 작업량:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {stats.dailyTargetWorkCount ? `${stats.dailyTargetWorkCount.toLocaleString()} 타` : '미지정'}
                </span>
              </div>
            </div>

            {/* 키워드 정보 */}
            {slot.keywords && (
              <div className="mt-4">
                <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center text-sm">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                  </svg>
                  키워드
                </span>
                <div className="mt-1 p-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded text-gray-900 dark:text-gray-100 whitespace-pre-line text-xs sm:text-sm">
                  {slot.keywords}
                </div>
              </div>
            )}

            {/* URL 정보 */}
            {slot.url && (
              <div className="mt-4">
                <span className="text-gray-500 dark:text-gray-400 text-sm">URL:</span>
                <a 
                  href={slot.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 dark:text-blue-400 hover:underline text-xs sm:text-sm break-all"
                  title={slot.url}
                >
                  {slot.url}
                </a>
              </div>
            )}
          </div>

          {/* 일별 작업 현황 */}
          <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              일별 작업 현황
            </h4>

            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
              </div>
            ) : dateRange.length > 0 ? (
              <div className="max-h-60 overflow-y-auto">
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  <div>날짜</div>
                  <div>요일</div>
                  <div>작업량</div>
                  <div className="hidden sm:block sm:col-span-4">비고</div>
                  <div className="sm:hidden">비고</div>
                </div>
                {dateRange.map((date, index) => {
                  const work = getWorkByDate(date);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
                  
                  // 오늘 날짜와 비교
                  const today = new Date();
                  today.setHours(0, 0, 0, 0); // 시간 부분 제거
                  const compareDate = new Date(date);
                  compareDate.setHours(0, 0, 0, 0); // 시간 부분 제거
                  const isPastDate = compareDate < today;
                  const isMissedWork = isPastDate && !work;
                  
                  return (
                    <div 
                      key={index}
                      className={`grid grid-cols-4 sm:grid-cols-7 gap-1 py-2 text-xs sm:text-sm border-b border-gray-100 dark:border-gray-700 ${
                        isWeekend ? 'bg-gray-50 dark:bg-gray-800/30' : ''
                      }`}
                    >
                      <div className="text-gray-900 dark:text-white">
                        {formatDate(date)}
                      </div>
                      <div className={`${isWeekend ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {dayNames[date.getDay()]}
                      </div>
                      <div className={`font-medium ${isMissedWork ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                        {work ? (
                          `${work.work_cnt.toLocaleString()}타`
                        ) : isMissedWork ? (
                          <span className="flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                            </svg>
                            누락
                          </span>
                        ) : (
                          '-'
                        )}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 sm:col-span-4 truncate sm:truncate-none" title={work?.notes || '-'}>
                        {work?.notes || '-'}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                작업 기간 정보가 없습니다.
              </div>
            )}
          </div>

          {/* 통계 정보 */}
          <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg p-3 sm:p-4">
            <h4 className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              작업 통계
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">총 작업량:</span>
                <span className="ml-2 text-gray-900 dark:text-white font-medium">
                  {stats.totalWorkCount.toLocaleString()}타
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">작업 일수:</span>
                <span className="ml-2 text-gray-900 dark:text-white font-medium">
                  {stats.workDays}일
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">일평균 작업량:</span>
                <span className="ml-2 text-gray-900 dark:text-white font-medium">
                  {stats.avgWorkCount.toLocaleString()}타
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">작업 진행률:</span>
                <span className="ml-2 text-gray-900 dark:text-white font-medium">
                  {stats.totalTargetWorkCount ? `${Math.round((stats.totalWorkCount / stats.totalTargetWorkCount) * 100)}%` : '-'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">작업 요청일:</span>
                <span className="ml-2 text-gray-900 dark:text-white font-medium">
                  {formatDate(stats.requestDate)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">최근 작업 완료일:</span>
                <span className="ml-2 text-gray-900 dark:text-white font-medium">
                  {formatDate(stats.lastWorkDate)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="flex justify-end items-center gap-3 py-3 sm:py-4 px-4 sm:px-6 bg-gray-50 dark:bg-gray-800/50 border-t shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
          >
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SlotDetailModal;