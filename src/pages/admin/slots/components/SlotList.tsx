import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM, { createPortal } from 'react-dom';
import { Slot, User, Campaign } from './types';
import { formatDate } from './constants';
import { supabase } from '@/supabase';
import { useAlert } from '@/hooks/useAlert';
import { Dialog, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog';
import { KeenIcon, LucideRefreshIcon } from '@/components';
import { getBulkSlotRankingData } from '@/services/rankingService';
import { getSlotWorkProgress } from '../services/slotService';

// CSS for campaign status dot tooltip
const campaignStatusStyles = `
  <style>
    .campaign-status-dot {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    
    .campaign-status-tooltip {
      visibility: hidden;
      opacity: 0;
      position: absolute;
      z-index: 50;
      background-color: #1f2937;
      color: white;
      font-size: 0.75rem;
      border-radius: 0.375rem;
      padding: 0.5rem;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-bottom: 0.5rem;
      white-space: nowrap;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      border: 1px solid #374151;
      transition: opacity 0.2s, visibility 0.2s;
    }
    
    .campaign-status-dot:hover .campaign-status-tooltip {
      visibility: visible;
      opacity: 1;
    }
    
    .campaign-status-arrow {
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid #1f2937;
    }
  </style>
`;

interface RankingData {
  keyword_id: string;
  product_id: string;
  title: string;
  link: string;
  rank: number;
  prev_rank?: number;
  yesterday_rank?: number;
  lprice?: number;
  mall_name?: string;
  brand?: string;
  image?: string;
  status?: 'checked' | 'no-rank' | 'not-target' | 'not-checked';
  [key: string]: any;
}

interface SlotListProps {
  slots: Slot[];
  selectedServiceType: string;
  campaigns?: Campaign[]; // 캠페인 목록 추가
  onApprove: (slotId: string | string[], actionType?: string) => void;
  onReject: (slotId: string | string[], reason?: string) => void;
  onComplete?: (slotId: string | string[]) => void; // 완료 처리 함수 추가
  onMemo: (slotId: string) => void;
  onDetail: (slotId: string) => void; // 상세 보기 함수 추가
  selectedSlots?: string[]; // 부모로부터 전달받을 선택된 슬롯 ID 배열 (옵션)
  onSelectedSlotsChange?: (selectedSlots: string[]) => void; // 선택된 슬롯 상태가 변경될 때 호출될 콜백
  onRefresh?: () => void; // 새로고침 콜백
  isLoading?: boolean; // 로딩 상태
}

const SlotList: React.FC<SlotListProps> = ({ 
  slots, 
  selectedServiceType,
  campaigns,
  onApprove, 
  onReject,
  onComplete,
  onMemo,
  onDetail,
  selectedSlots: externalSelectedSlots,
  onSelectedSlotsChange,
  onRefresh,
  isLoading = false
}) => {
  const { showWarning } = useAlert();
  const [userMap, setUserMap] = useState<Record<string, User>>({});
  // 외부에서 관리되는 selectedSlots가 있으면 사용, 없으면 내부 상태로 관리
  const [internalSelectedSlots, setInternalSelectedSlots] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  // 추가정보 팝오버 상태 관리
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  // 반려사유 팝오버 상태 관리
  const [openRejectionId, setOpenRejectionId] = useState<string | null>(null);
  // 키워드 툴팁 상태 관리
  const [openKeywordTooltipId, setOpenKeywordTooltipId] = useState<string | null>(null);
  // 순위 데이터 상태 관리
  const [rankingDataMap, setRankingDataMap] = useState<Map<string, RankingData>>(new Map());
  
  // 작업 진행률 상태 관리
  const [workProgressMap, setWorkProgressMap] = useState<Record<string, any>>({});
  
  // 내키워드 지원 여부 확인 - 모든 슬롯이 내키워드 미지원인지 체크
  const isKeywordUnsupportedService = useMemo(() => {
    if (slots.length === 0) return false;
    return slots.every(slot => slot.keyword_id === 0 || slot.input_data?.is_manual_input === true);
  }, [slots]);
  
  // 이미지 모달 상태 관리
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);
  
  // 이전 슬롯 ID 목록을 저장하여 변경 여부 확인
  const prevSlotIdsRef = useRef<string[]>([]);
  
  // 노출 안할 inputData
  const passItem = ['campaign_name', 'dueDays', 'expected_deadline', 'keyword1' , 'keyword2' , 'keyword3', 'keywordId', 'mainKeyword', 'mid', 'price', 'service_type', 'url', 'workCount', 'keywords', 'main_keyword', 'minimum_purchase', 'work_days', 'is_manual_input'];
  
  // 슬롯이 변경될 때 모든 팝오버와 모달 닫기
  useEffect(() => {
    // 첫 렌더링이 아니고, 실제로 슬롯이 변경되었을 때만 실행
    if (prevSlotIdsRef.current.length > 0) {
      const currentSlotIds = slots.map(s => s.id);
      const hasChanged = 
        prevSlotIdsRef.current.length !== currentSlotIds.length ||
        !prevSlotIdsRef.current.every((id, index) => id === currentSlotIds[index]);
      
      if (hasChanged) {
        setOpenPopoverId(null);
        setOpenRejectionId(null);
        setOpenKeywordTooltipId(null);
        setImageModalOpen(false);
        setSelectedImage(null);
      }
    }
    
    // 현재 슬롯 ID 목록 저장
    prevSlotIdsRef.current = slots.map(s => s.id);
  }, [slots]);
  
  // ESC 키로 이미지 모달 닫기
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && imageModalOpen) {
        setImageModalOpen(false);
        setSelectedImage(null);
      }
    };
    
    if (imageModalOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [imageModalOpen]);
  
  
  // 실제 사용할 selectedSlots와 업데이트 함수 결정
  const selectedSlots = externalSelectedSlots !== undefined ? externalSelectedSlots : internalSelectedSlots;
  const updateSelectedSlots = (newSelectedSlots: string[]) => {
    if (onSelectedSlotsChange) {
      // 외부에서 관리되는 경우 콜백 호출
      onSelectedSlotsChange(newSelectedSlots);
    } else {
      // 내부에서 관리되는 경우 상태 업데이트
      setInternalSelectedSlots(newSelectedSlots);
    }
  };
  
  // 모달 상태 제거 - 부모 컴포넌트에서 모달을 관리함
  
  // 슬롯 선택 처리
  const handleSlotSelect = (slotId: string) => {
    if (selectedSlots.includes(slotId)) {
      updateSelectedSlots(selectedSlots.filter(id => id !== slotId));
    } else {
      updateSelectedSlots([...selectedSlots, slotId]);
    }
  };
  
  // 전체 선택/해제 처리
  const handleSelectAll = () => {
    if (selectAll) {
      updateSelectedSlots([]);
    } else {
      // 선택 가능한 슬롯만 필터링 (pending 또는 submitted 상태)
      const selectableSlots = slots
        .filter(slot => slot.status === 'pending' || slot.status === 'submitted')
        .map(slot => slot.id);
      updateSelectedSlots(selectableSlots);
    }
    setSelectAll(!selectAll);
  };
  
  // 선택된 슬롯들에 대한 일괄 처리
  const handleBulkApprove = () => {
    if (selectedSlots.length > 0) {
      // 직접 onApprove 호출하여 부모에서 모달을 표시하도록 함
      onApprove(selectedSlots);
    }
  };
  
  const handleBulkReject = () => {
    if (selectedSlots.length > 0) {
      // 직접 onReject 호출하여 부모에서 모달을 표시하도록 함
      onReject(selectedSlots);
    }
  };
  
  const handleBulkComplete = () => {
    if (selectedSlots.length > 0 && onComplete) {
      // approved 상태인 슬롯만 필터링
      const approvedSlots = selectedSlots.filter(slotId => 
        slots.find(slot => slot.id === slotId && slot.status === 'approved')
      );
      
      if (approvedSlots.length === 0) {
        showWarning('승인된 슬롯만 완료 처리할 수 있습니다.');
        return;
      }
      
      onComplete(approvedSlots);
    }
  };
  
  // 순위 데이터 로드
  useEffect(() => {
    const loadRankingData = async () => {
      if (!slots || slots.length === 0 || !campaigns) return;
      
      // 캠페인별로 슬롯 그룹화
      const slotsByMatProductId = slots.map(slot => ({
        id: slot.id,
        campaignId: slot.product_id || 0,
        inputData: slot.input_data,
        keywordId: slot.keyword_id?.toString()
      }));
      
      const rankingMap = await getBulkSlotRankingData(slotsByMatProductId);
      setRankingDataMap(rankingMap);
    };
    
    loadRankingData();
  }, [slots, campaigns]);

  // 작업 진행률 로드
  useEffect(() => {
    const loadWorkProgress = async () => {
      if (!slots || slots.length === 0) return;
      
      // approved 상태인 슬롯만 필터링
      const approvedSlotIds = slots
        .filter(slot => slot.status === 'approved')
        .map(slot => slot.id);
      
      if (approvedSlotIds.length === 0) return;
      
      const progressMap = await getSlotWorkProgress(approvedSlotIds);
      setWorkProgressMap(progressMap);
    };
    
    loadWorkProgress();
  }, [slots]);

  // 슬롯들의 사용자 정보를 한 번에 로드하는 함수
  useEffect(() => {
    const loadUserInfo = async () => {
      if (!slots || slots.length === 0) {
        // 슬롯이 없으면 userMap도 초기화
        if (Object.keys(userMap).length > 0) {
          setUserMap({});
        }
        return;
      }
      
      // 현재 슬롯 ID 목록
      const currentSlotIds = slots.map(slot => slot.id).sort();
      const prevSlotIds = prevSlotIdsRef.current;
      
      // 슬롯 목록이 변경되지 않았으면 종료
      if (prevSlotIds.length === currentSlotIds.length && 
          prevSlotIds.every((id, index) => id === currentSlotIds[index])) {
        return;
      }
      
      // 현재 슬롯 ID 목록 저장
      prevSlotIdsRef.current = currentSlotIds;
      
      // 모든 슬롯에서 고유한 user_id 목록 추출
      const userIds = [...new Set(slots.map(slot => slot.user_id).filter(Boolean))];
      
      if (userIds.length === 0) return;
      
      // 이미 모든 사용자 정보가 있는지 확인
      const needsUpdate = slots.some(slot => 
        slot.user_id && !slot.user?.full_name && !userMap[slot.user_id]?.full_name
      );
      
      // 업데이트가 필요 없으면 종료
      if (!needsUpdate) return;
      
      try {
        // Supabase에서 users 테이블 조회
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', userIds);
          
        if (error) {
          console.error('사용자 정보 로드 중 오류:', error);
          return;
        }
        
        // user_id를 키로 하는 맵 생성
        const newUserMap: Record<string, User> = {};
        data.forEach(user => {
          newUserMap[user.id] = {
            id: user.id,
            full_name: user.full_name,
            email: user.email
          };
        });
        
        setUserMap(newUserMap);
      } catch (error) {
        console.error('사용자 정보 로드 중 예외 발생:', error);
      }
    };
    
    loadUserInfo();
  }, [slots]); // userMap을 의존성에서 제거하여 무한 루프 방지
  
  // 캠페인 상태에 따른 닷 색상과 메시지
  const getCampaignStatusDot = (slot: Slot) => {
    if (!campaigns || !slot.product_id) return null;
    
    const campaign = campaigns.find(c => c.id === slot.product_id);
    if (!campaign) return null;
    
    const statusConfig = {
      active: { color: 'bg-green-500', text: '진행중' },
      paused: { color: 'bg-yellow-500', text: '일시중지' },
      completed: { color: 'bg-gray-500', text: '종료' },
      pending: { color: 'bg-blue-500', text: '대기중' }
    };
    
    const config = statusConfig[campaign.status as keyof typeof statusConfig] || 
                  { color: 'bg-gray-400', text: '알 수 없음' };
    
    return (
      <div className="campaign-status-dot">
        <div className={`w-2 h-2 rounded-full ${config.color}`}></div>
        <div className="campaign-status-tooltip">
          {config.text}
          <div className="campaign-status-arrow"></div>
        </div>
      </div>
    );
  };
  
  // 캠페인 로고 또는 기본 서비스 로고 반환 함수
  const getCampaignLogo = (slot: Slot): string | undefined => {
    // 캠페인 로고가 있으면 우선 사용
    if (slot.campaign_logo) {
      // animal/svg/ 형태의 경로면 /media/ 추가
      if (slot.campaign_logo.includes('animal/svg/') && !slot.campaign_logo.startsWith('/media/')) {
        return `/media/${slot.campaign_logo}`;
      }
      // http로 시작하거나 /로 시작하면 그대로 사용
      if (slot.campaign_logo.startsWith('http') || slot.campaign_logo.startsWith('/')) {
        return slot.campaign_logo;
      }
      // 단순 동물 이름이면 경로 구성
      if (!slot.campaign_logo.includes('/')) {
        return `/media/animal/svg/${slot.campaign_logo}.svg`;
      }
      return slot.campaign_logo;
    }
    
    // 없으면 서비스 타입에 따른 기본 로고 사용
    const serviceType = slot.input_data?.service_type;
    if (serviceType?.includes('Naver')) {
      return '/media/ad-brand/naver.png';
    } else if (serviceType?.includes('Coupang')) {
      return '/media/ad-brand/coupang-app.png';
    }
    return undefined;
  };

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: campaignStatusStyles }} />
      <div className="card shadow-sm">
        <div className="card-header px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <h3 className="card-title">일반형 슬롯 관리</h3>
              {onRefresh && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={onRefresh}
                  disabled={isLoading}
                  title="새로고침"
                >
                  <LucideRefreshIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-4">
              {/* 전체 건수 */}
              <div className="text-sm">
                전체 <span className="text-primary font-semibold">{slots.length}</span> 건
              </div>
              {/* 메모 색상 안내 */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500">메모:</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <span className="text-gray-600 dark:text-gray-400">총판</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                  <span className="text-gray-600 dark:text-gray-400">사용자</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                  <span className="text-gray-600 dark:text-gray-400">모두</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      <div className="card-body px-6 py-4">
      {/* 선택된 슬롯에 대한 일괄 작업 버튼 */}
      {selectedSlots.length > 0 && (
        <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">{selectedSlots.length}개 선택</span>
          <div className="flex gap-1.5">
            <button 
              className="px-2.5 py-1 text-xs font-medium rounded bg-green-500 hover:bg-green-600 text-white transition-colors" 
              onClick={handleBulkApprove}
            >
              일괄 승인
            </button>
            {onComplete && (
              <button 
                className="px-2.5 py-1 text-xs font-medium rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors" 
                onClick={handleBulkComplete}
              >
                일괄 완료
              </button>
            )}
            <button 
              className="px-2.5 py-1 text-xs font-medium rounded bg-red-500 hover:bg-red-600 text-white transition-colors" 
              onClick={handleBulkReject}
            >
              일괄 반려
            </button>
            <button 
              className="px-2.5 py-1 text-xs font-medium rounded bg-gray-300 hover:bg-gray-400 text-gray-700 transition-colors" 
              onClick={() => {
                updateSelectedSlots([]);
                setSelectAll(false);
              }}
            >
              취소
            </button>
          </div>
        </div>
      )}
      
      {/* 데스크탑 테이블 뷰 */}
      <div className="hidden md:block overflow-x-auto">
        <table className="table table-sm w-full">
          <thead>
            <tr className="text-gray-800 border-b border-gray-200">
              <th className="w-10">
                <input 
                  type="checkbox" 
                  className="checkbox checkbox-sm" 
                  checked={selectAll}
                  onChange={handleSelectAll}
                  title="전체 선택/해제"
                />
              </th>
              <th className="py-2 px-2 text-start font-medium">사용자</th>
              <th className="py-2 px-2 text-center font-medium">입력필드</th>
              <th className="py-2 px-2 text-center font-medium">순위</th>
              <th className="py-2 px-2 text-center font-medium">작업수</th>
              <th className="py-2 px-2 text-center font-medium">작업량</th>
              <th className="py-2 px-2 text-center font-medium">작업기간</th>
              <th className="py-2 px-2 text-center font-medium">캠페인</th>
              <th className="py-2 px-2 text-center font-medium">상태</th>
              <th className="py-2 px-2 text-center font-medium">상세</th>
              <th className="py-2 px-2 text-center font-medium">작업</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot.id} className="hover:bg-gray-50">
                <td className="py-2 px-2">
                  {(slot.status === 'pending' || slot.status === 'submitted') && (
                    <input 
                      type="checkbox" 
                      className="checkbox checkbox-sm"
                      checked={selectedSlots.includes(slot.id)} 
                      onChange={() => handleSlotSelect(slot.id)}
                    />
                  )}
                </td>
                
                {/* 사용자 정보 */}
                <td className="py-2 px-2 max-w-[120px]">
                  <div className="text-sm font-medium text-gray-900 truncate" title={userMap[slot.user_id]?.full_name || slot.user?.full_name || '사용자'}>
                    {userMap[slot.user_id]?.full_name || slot.user?.full_name || '사용자'}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {(() => {
                      const email = userMap[slot.user_id]?.email || slot.user?.email || '';
                      if (!email) return '';
                      
                      // @ 기준으로 분리
                      const [localPart] = email.split('@');
                      if (!localPart) return '';
                      
                      // 3자리만 보이고 나머지는 * 처리
                      if (localPart.length <= 3) {
                        return localPart + '***';
                      } else {
                        return localPart.substring(0, 3) + '*'.repeat(localPart.length - 3);
                      }
                    })()}
                  </div>
                </td>
                
                {/* 입력필드 */}
                <td className="py-2 px-2 text-center">
                  {slot.input_data && (() => {
                    // passItem에 포함되지 않고, _fileName 또는 _file로 끝나지 않는 필드만 필터링
                    const userInputFields = Object.entries(slot.input_data).filter(([key]) => 
                      !passItem.includes(key) && !key.endsWith('_fileName') && !key.endsWith('_file')
                    );
                    
                    if (userInputFields.length === 0) 
                      return <span className="text-xs text-gray-400">-</span>;
                    
                    return (
                      <div className="relative inline-block">
                        <button 
                          className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setPopoverPosition({
                              top: rect.top - 10,
                              left: rect.left + rect.width / 2
                            });
                            setOpenPopoverId(openPopoverId === slot.id ? null : slot.id);
                          }}
                        >
                          {userInputFields.length}개 필드
                        </button>
                        {/* 클릭 시 표시되는 팝오버 */}
                        {openPopoverId === slot.id && ReactDOM.createPortal(
                          <>
                            {/* 배경 클릭 시 닫기 */}
                            <div 
                              className="fixed inset-0" 
                              style={{zIndex: 9998}}
                              onClick={() => setOpenPopoverId(null)}
                            />
                            <div 
                              className="fixed bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-100 text-xs rounded p-2 w-80 max-h-64 shadow-xl border border-gray-700 dark:border-gray-600" 
                              style={{
                                zIndex: 9999,
                                left: `${popoverPosition.left}px`,
                                top: `${popoverPosition.top}px`,
                                transform: 'translate(-50%, -100%)'
                              }}>
                              <div className="flex items-center justify-between mb-2 border-b border-gray-700 dark:border-gray-600 pb-1">
                                <span className="font-medium text-gray-100 dark:text-gray-200">입력 필드</span>
                                <button
                                  className="text-gray-400 hover:text-gray-200 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenPopoverId(null);
                                  }}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                              <div 
                                className="overflow-y-auto max-h-48 pr-2"
                                style={{
                                  scrollbarWidth: 'thin',
                                  scrollbarColor: 'rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.1)'
                                }}
                              >
                                <div className="space-y-1">
                                  {userInputFields.map(([key, value]) => {
                                    // 파일 URL인지 확인
                                    const isFileUrl = value && typeof value === 'string' && 
                                      (value.includes('supabase.co/storage/') || value.includes('/storage/v1/object/'));
                                    
                                    // 이미지 파일인지 확인
                                    const isImage = isFileUrl && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(value);
                                    
                                    // 파일명 추출 - _fileName 필드가 있으면 그 값을 사용
                                    const fileNameKey = `${key}_fileName`;
                                    const fileName = slot.input_data[fileNameKey] || (isFileUrl ? value.split('/').pop() || '파일' : '');
                                    
                                    // 필드명 한글 변환
                                    const fieldNameMap: Record<string, string> = {
                                      // 기본 필드
                                      'work_days': '작업일',
                                      'minimum_purchase': '최소 구매수',
                                      'url': 'URL',
                                      'mid': '상점 ID',
                                      'productName': '상품명',
                                      'mainKeyword': '메인 키워드',
                                      'main_keyword': '메인 키워드',
                                      'keywords': '서브 키워드',
                                      'keyword1': '키워드1',
                                      'keyword2': '키워드2', 
                                      'keyword3': '키워드3',
                                      'quantity': '작업량',
                                      'dueDays': '작업기간',
                                      'due_days': '작업기간',
                                      'workCount': '작업수',
                                      'work_count': '작업수',
                                      'start_date': '시작일',
                                      'end_date': '종료일',
                                      
                                      // 가격 관련
                                      'price': '가격',
                                      'total_price': '총 가격',
                                      'unit_price': '단가',
                                      'daily_price': '일별 가격',
                                      
                                      // 보장 관련
                                      'guarantee_days': '보장일수',
                                      'guarantee_rank': '보장순위',
                                      'target_rank': '목표순위',
                                      'guarantee_info': '보장정보',
                                      
                                      // 캐시/포인트 관련
                                      'cash_amount': '캐시 지급액',
                                      'cash_info': '캐시 지급 안내',
                                      'point_amount': '포인트 금액',
                                      
                                      // 기타 정보
                                      'note': '비고',
                                      'description': '설명',
                                      'requirements': '요구사항',
                                      'additional_info': '추가정보',
                                      'work_period': '작업기간',
                                      'company_name': '회사명',
                                      'business_number': '사업자번호',
                                      'contact': '연락처',
                                      'email': '이메일',
                                      'phone': '전화번호',
                                      'mobile': '휴대폰번호',
                                      'address': '주소',
                                      'bank_name': '은행명',
                                      'account_number': '계좌번호',
                                      'account_holder': '예금주',
                                      
                                      // 상태 관련
                                      'status': '상태',
                                      'is_active': '활성화',
                                      'is_manual': '수동입력',
                                      'is_manual_input': '수동입력',
                                      
                                      // 날짜 관련
                                      'created_at': '생성일',
                                      'updated_at': '수정일',
                                      'completed_at': '완료일',
                                      'canceled_at': '취소일'
                                    };
                                    const displayKey = fieldNameMap[key] || key;
                                    
                                    return (
                                      <div key={key} className="flex items-start gap-2 text-left py-1 border-b border-gray-800 dark:border-gray-700 last:border-0">
                                        <span className="font-medium text-gray-300 dark:text-gray-400 min-w-[80px] shrink-0">{displayKey}</span>
                                        <span className="text-gray-400 dark:text-gray-500">:</span>
                                        <span className="text-gray-100 dark:text-gray-200 flex-1 break-words">
                                          {isFileUrl ? (
                                            isImage ? (
                                              <button
                                                className="text-blue-400 hover:text-blue-300 underline cursor-pointer"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setSelectedImage({ url: value, title: key });
                                                  setImageModalOpen(true);
                                                }}
                                              >
                                                {fileName}
                                              </button>
                                            ) : (
                                              <a
                                                href={value}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-400 hover:text-blue-300 underline"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                {fileName}
                                              </a>
                                            )
                                          ) : (
                                            value ? String(value) : '-'
                                          )}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </>,
                          document.body
                        )}
                      </div>
                    );
                  })()}
                </td>
                
                {/* 순위 */}
                <td className="py-2 px-2 text-center">
                  <div className="flex items-center justify-center">
                    {(() => {
                      // approved, pending_user_confirm 상태일 때만 표시
                      if (slot.status === 'approved' || slot.status === 'pending_user_confirm') {
                        // 순위 데이터 체크
                      } else {
                        return <span className="text-gray-400 text-sm">-</span>;
                      }
                      
                      const rankingData = rankingDataMap.get(slot.id);
                      if (!rankingData) {
                        return <span className="text-gray-400 text-sm">-</span>;
                      }
                      
                      // 상태에 따른 표시
                      if (rankingData.status === 'not-target') {
                        return <span className="text-yellow-400 text-sm">매칭안됨</span>;
                      }
                      
                      if (rankingData.status === 'no-rank') {
                        return <span className="text-gray-500 text-sm">순위없음</span>;
                      }
                      
                      if (!rankingData.status || rankingData.status === 'not-checked') {
                        return <span className="text-gray-400 text-sm">-</span>;
                      }
                      
                      // 순위가 있는 경우
                      const dailyChange = rankingData.yesterday_rank ? rankingData.yesterday_rank - rankingData.rank : null;
                      
                      return (
                        <div className="flex items-center justify-center gap-1">
                          <span className={`font-semibold text-sm ${
                            rankingData.rank <= 10 ? 'text-blue-600' : 'text-gray-700'
                          }`}>
                            {rankingData.rank}위
                          </span>
                          
                          {rankingData.yesterday_rank ? (
                            dailyChange !== null && dailyChange !== 0 ? (
                              <span className={`text-xs font-medium ${
                                dailyChange > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {dailyChange > 0 ? '▲' : '▼'}{Math.abs(dailyChange)}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )
                          ) : (
                            <span className="text-xs text-blue-500 font-medium">NEW</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </td>
                
                {/* 작업수 */}
                <td className="py-2 px-2 text-center">
                  <div className="text-sm text-gray-700">
                    {slot.quantity ? slot.quantity.toLocaleString() : 
                     slot.input_data?.quantity ? slot.input_data.quantity : 
                     slot.input_data?.workCount ? slot.input_data.workCount : '-'}
                  </div>
                </td>
                
                {/* 작업량 */}
                <td className="py-2 px-2 text-center">
                  {(() => {
                    const dailyQuantity = slot.quantity || 0;
                    const progress = workProgressMap[slot.id];
                    
                    if (!progress || slot.status !== 'approved') {
                      return <span className="text-sm text-gray-400">-</span>;
                    }
                    
                    // 작업일수 계산
                    let workDays = 1;
                    if (slot.start_date && slot.end_date) {
                      const start = new Date(slot.start_date);
                      const end = new Date(slot.end_date);
                      workDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    }
                    
                    // 총 작업량 = 일일 작업량 × 작업일수
                    const totalQuantity = dailyQuantity * workDays;
                    const totalWorked = progress.totalWorked || 0;
                    const percentage = totalQuantity > 0 ? Math.round((totalWorked / totalQuantity) * 100) : 0;
                    
                    return (
                      <div className="flex flex-col items-center">
                        <div className="text-sm text-gray-700">
                          {totalWorked.toLocaleString()}/{totalQuantity.toLocaleString()}
                        </div>
                        <div className={`text-xs font-medium ${
                          percentage >= 100 ? 'text-green-600' : 
                          percentage >= 50 ? 'text-blue-600' : 
                          'text-gray-600'
                        }`}>
                          ({percentage}%)
                        </div>
                      </div>
                    );
                  })()}
                </td>
                
                {/* 작업기간 */}
                <td className="py-2 px-2 text-center">
                  {slot.start_date && slot.end_date ? (
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs text-gray-600 dark:text-gray-400">시작:</span>
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                          {new Date(slot.start_date).toLocaleDateString('ko-KR', {
                            year: 'numeric', month: '2-digit', day: '2-digit'
                          }).replace(/\. /g, '-').replace('.', '')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-600 dark:text-gray-400">종료:</span>
                        <span className="text-xs font-medium text-red-600 dark:text-red-400">
                          {new Date(slot.end_date).toLocaleDateString('ko-KR', {
                            year: 'numeric', month: '2-digit', day: '2-digit'
                          }).replace(/\. /g, '-').replace('.', '')}
                        </span>
                      </div>
                    </div>
                  ) : slot.deadline ? (
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {new Date(slot.deadline).toLocaleDateString('ko-KR', {
                        year: 'numeric', month: '2-digit', day: '2-digit'
                      }).replace(/\. /g, '-').replace('.', '')}
                    </span>
                  ) : (
                    slot.input_data?.due_date ? (
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {new Date(slot.input_data.due_date).toLocaleDateString('ko-KR', {
                          year: 'numeric', month: '2-digit', day: '2-digit'
                        }).replace(/\. /g, '-').replace('.', '')}
                      </span>
                    ) : (
                      slot.input_data?.dueDays ? (
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            작업기간: <span className="font-medium text-gray-900 dark:text-gray-100">{slot.input_data.dueDays}일</span>
                          </span>
                        </div>
                      ) : (
                        // 직접입력 모드에서 work_days 표시
                        slot.input_data?.work_days ? (
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              작업기간: <span className="font-medium text-gray-900 dark:text-gray-100">{slot.input_data.work_days}일</span>
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">
                            -
                          </span>
                        )
                      )
                    )
                  )}
                </td>
                
                {/* 캠페인 */}
                <td className="py-2 px-2 text-center max-w-[120px]">
                  <div className="flex items-center justify-center gap-1">
                    {getCampaignLogo(slot) && (
                      <img 
                        src={getCampaignLogo(slot)} 
                        alt="campaign logo" 
                        className="w-4 h-4 object-contain rounded flex-shrink-0"
                      />
                    )}
                    <span className="text-xs text-gray-700 truncate" title={slot.campaign_name || '-'}>
                      {slot.campaign_name || '-'}
                    </span>
                    {getCampaignStatusDot(slot)}
                  </div>
                </td>
                
                {/* 상태 */}
                <td className="py-2 px-2 text-center">
                  <div className="flex items-center justify-center gap-1 flex-wrap">
                    {slot.status === 'pending' && 
                      <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-600">대기중</span>}
                    {slot.status === 'submitted' && 
                      <span className="px-1.5 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700">검토중</span>}
                    {slot.status === 'approved' && 
                      <span className="px-1.5 py-0.5 text-xs rounded bg-blue-100 text-blue-700">승인</span>}
                    {slot.status === 'rejected' && (
                      <>
                        <span className="px-1.5 py-0.5 text-xs rounded bg-red-100 text-red-700">반려</span>
                        {slot.rejection_reason && (
                          <button 
                            className="inline-flex items-center justify-center ml-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setPopoverPosition({
                                top: rect.top - 10,
                                left: rect.left + rect.width / 2
                              });
                              setOpenRejectionId(openRejectionId === slot.id ? null : slot.id);
                            }}
                            title="반려 사유 보기"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                      </>
                    )}
                    {slot.status === 'success' && 
                      <span className="px-1.5 py-0.5 text-xs rounded bg-blue-100 text-blue-700">완료</span>}
                    {slot.status === 'complete' && 
                      <span className="px-1.5 py-0.5 text-xs rounded bg-gray-600 text-white">종료</span>}
                    {slot.status === 'completed' && 
                      <span className="px-1.5 py-0.5 text-xs rounded bg-green-100 text-green-700">완료</span>}
                    {slot.status === 'pending_user_confirm' && 
                      <span className="px-1.5 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700">사용자확인대기</span>}
                    {slot.status === 'refund' && 
                      <span className="px-1.5 py-0.5 text-xs rounded bg-amber-100 text-amber-700">환불</span>}
                    {!slot.status && 
                      <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-500">-</span>}
                  </div>
                  {/* 반려 사유 팝오버 */}
                  {openRejectionId === slot.id && slot.rejection_reason && ReactDOM.createPortal(
                    <>
                      {/* 배경 클릭 시 닫기 */}
                      <div 
                        className="fixed inset-0" 
                        style={{zIndex: 9998}}
                        onClick={() => setOpenRejectionId(null)}
                      />
                      <div 
                        className="fixed bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-100 text-xs rounded p-2 w-80 max-h-64 shadow-xl border border-gray-700 dark:border-gray-600" 
                        style={{
                          zIndex: 9999,
                          left: `${popoverPosition.left}px`,
                          top: `${popoverPosition.top}px`,
                          transform: 'translate(-50%, -100%)'
                        }}>
                        <div className="flex items-center justify-between mb-2 border-b border-gray-700 dark:border-gray-600 pb-1">
                          <span className="font-medium text-gray-100 dark:text-gray-200">반려 사유</span>
                          <button
                            className="text-gray-400 hover:text-gray-200 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenRejectionId(null);
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="text-gray-100 dark:text-gray-200">{slot.rejection_reason}</div>
                      </div>
                    </>,
                    document.body
                  )}
                </td>
                
                {/* 상세/메모 버튼 */}
                <td className="py-3 px-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {/* 상세 버튼 */}
                    <button
                      className="btn btn-icon btn-sm btn-ghost text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDetail(slot.id);
                      }}
                      title="상세 보기"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </button>
                    
                    {/* 메모 버튼 */}
                    <button
                      className={`btn btn-icon btn-sm btn-ghost text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-900/30 relative ${
                        slot.mat_reason ? 'ring-2 ring-blue-400' : ''
                      } ${slot.user_reason ? 'ring-2 ring-yellow-400' : ''} ${
                        slot.mat_reason && slot.user_reason ? 'ring-2 ring-purple-400' : ''
                      }`}
                      onClick={() => onMemo(slot.id)}
                      title={
                        slot.mat_reason && slot.user_reason ? "메모 (총판/사용자 모두 작성됨)" :
                        slot.mat_reason ? "메모 (총판 작성됨)" :
                        slot.user_reason ? "메모 (사용자 작성됨)" :
                        "메모 추가"
                      }
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      {(slot.mat_reason || slot.user_reason) && (
                        <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                          slot.mat_reason && slot.user_reason ? 'bg-purple-400' :
                          slot.mat_reason ? 'bg-blue-400' :
                          'bg-yellow-400'
                        }`}></span>
                      )}
                    </button>
                  </div>
                </td>
                
                {/* 작업 버튼 */}
                <td className="py-3 px-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {/* 상태별 액션 버튼 */}
                    {(slot.status === 'pending' || slot.status === 'submitted') && (
                      <>
                        <button
                          className="px-2 py-0.5 text-xs font-medium rounded bg-green-500 hover:bg-green-600 text-white transition-colors"
                          onClick={() => onApprove(slot.id)}
                          title="승인"
                        >
                          승인
                        </button>
                        <button
                          className="px-2 py-0.5 text-xs font-medium rounded bg-red-500 hover:bg-red-600 text-white transition-colors"
                          onClick={() => onReject(slot.id)}
                          title="반려"
                        >
                          반려
                        </button>
                      </>
                    )}
                    
                    {/* 승인된 상태일 때 액션 버튼 */}
                    {slot.status === 'approved' && (
                      <>
                        {onComplete && (
                          <button
                            className="px-2 py-0.5 text-xs font-medium rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                            onClick={() => onComplete(slot.id)}
                            title="작업 완료 처리"
                          >
                            완료
                          </button>
                        )}
                        <button
                          className="px-2 py-0.5 text-xs font-medium rounded bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                          onClick={() => onApprove(slot.id, 'refund')}
                          title="환불 처리"
                        >
                          환불
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 형식 - 중간(md) 크기 미만에서만 표시 */}
      <div className="md:hidden space-y-2">
        {slots.map((slot) => (
          <div key={slot.id} className="bg-card border border-border rounded-lg p-4">
            {/* 상단 - 사용자 정보 및 상태 */}
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                {(slot.status === 'pending' || slot.status === 'submitted') && (
                  <input 
                    type="checkbox" 
                    className="checkbox checkbox-sm checkbox-primary"
                    checked={selectedSlots.includes(slot.id)} 
                    onChange={() => handleSlotSelect(slot.id)}
                  />
                )}
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {userMap[slot.user_id]?.full_name || slot.user?.full_name || '이름 없음'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {slot.status === 'pending' && 
                  <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">대기중</span>}
                {slot.status === 'submitted' && 
                  <span className="px-1.5 py-0.5 text-xs rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">검토중</span>}
                {slot.status === 'approved' && 
                  <span className="px-1.5 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">승인</span>}
                {slot.status === 'rejected' && 
                  <span className="px-1.5 py-0.5 text-xs rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">반려</span>}
                {slot.status === 'success' && 
                  <span className="px-1.5 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">완료</span>}
                {slot.status === 'complete' && 
                  <span className="px-1.5 py-0.5 text-xs rounded bg-gray-600 dark:bg-gray-700 text-white">종료</span>}
                {slot.status === 'completed' && 
                  <span className="px-1.5 py-0.5 text-xs rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">완료</span>}
                {slot.status === 'pending_user_confirm' && 
                  <span className="px-1.5 py-0.5 text-xs rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">사용자확인대기</span>}
                {slot.status === 'refund' && 
                  <span className="px-1.5 py-0.5 text-xs rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">환불</span>}
                
                {/* 메모 표시 */}
                {(slot.mat_reason || slot.user_reason) && (
                  <span className={`px-1.5 py-0.5 text-xs rounded ${
                    slot.mat_reason && slot.user_reason ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
                    slot.mat_reason ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                    'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                  }`}>
                    {slot.mat_reason && slot.user_reason ? '메모(모두)' :
                     slot.mat_reason ? '메모(총판)' :
                     '메모(사용자)'}
                  </span>
                )}
              </div>
            </div>
            
            {/* 반려 사유 */}
            {slot.status === 'rejected' && slot.rejection_reason && (
              <div className="mb-2 text-xs text-red-600 dark:text-red-400">
                반려: {slot.rejection_reason}
              </div>
            )}
            
            {/* 요약 정보 */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600 dark:text-gray-400 mb-2">
              {/* 입력필드 정보 */}
              {slot.input_data && (() => {
                const userInputFields = Object.entries(slot.input_data).filter(([key]) => 
                  !passItem.includes(key) && !key.endsWith('_fileName') && !key.endsWith('_file')
                );
                
                if (userInputFields.length > 0) {
                  return (
                    <span>
                      <span className="text-gray-500">입력필드:</span> 
                      <span className="ml-1 font-medium text-gray-700 dark:text-gray-300">
                        {userInputFields.length}개
                      </span>
                    </span>
                  );
                }
                return null;
              })()}
              <span>
                <span className="text-gray-500">작업수:</span> 
                <span className="text-gray-900 dark:text-gray-100 font-medium ml-1">
                  {slot.quantity ? slot.quantity.toLocaleString() : 
                   slot.input_data?.quantity || slot.input_data?.workCount || '-'}
                </span>
              </span>
              {slot.start_date && slot.end_date ? (
                <span className="flex items-center gap-1">
                  <span className="text-gray-500">기간:</span>
                  <span className="text-xs">
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      {new Date(slot.start_date).toLocaleDateString('ko-KR', {
                        month: '2-digit', day: '2-digit'
                      }).replace(/\. /g, '-').replace('.', '')}
                    </span>
                    <span className="text-gray-500 mx-1">~</span>
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      {new Date(slot.end_date).toLocaleDateString('ko-KR', {
                        month: '2-digit', day: '2-digit'
                      }).replace(/\. /g, '-').replace('.', '')}
                    </span>
                  </span>
                </span>
              ) : (
                <span>
                  <span className="text-gray-500">기간:</span> 
                  <span className="text-gray-900 dark:text-gray-100 ml-1">
                    {slot.deadline ? 
                      new Date(slot.deadline).toLocaleDateString('ko-KR', {
                        year: 'numeric', month: '2-digit', day: '2-digit'
                      }).replace(/\. /g, '-').replace('.', '') : 
                      slot.input_data?.due_date ? 
                        new Date(slot.input_data.due_date).toLocaleDateString('ko-KR', {
                          year: 'numeric', month: '2-digit', day: '2-digit'
                        }).replace(/\. /g, '-').replace('.', '') : 
                        slot.input_data?.dueDays ? `${slot.input_data.dueDays}일` : 
                        slot.input_data?.work_days ? `${slot.input_data.work_days}일` : '-'}
                  </span>
                </span>
              )}
              {slot.campaign_name && (
                <span>
                  <span className="text-gray-500">캠페인:</span> 
                  <span className="text-gray-900 dark:text-gray-100 ml-1">{slot.campaign_name}</span>
                </span>
              )}
            </div>
            
            {/* 사용자 입력 필드 (접을 수 있는 섹션) */}
            {slot.input_data && (() => {
              // passItem에 포함되지 않고, _fileName 또는 _file로 끝나지 않는 필드만 필터링
              const userInputFields = Object.entries(slot.input_data).filter(([key]) => 
                !passItem.includes(key) && !key.endsWith('_fileName') && !key.endsWith('_file')
              );
              
              if (userInputFields.length === 0) return null;
              
              return (
                <details className="mb-2">
                  <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer font-medium">
                    추가정보 ({userInputFields.length}개 항목)
                  </summary>
                  <div className="mt-2 bg-gray-50 dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-700">
                    <div className="space-y-1.5">
                      {userInputFields.map(([key, value]) => {
                        // 파일 URL인지 확인
                        const isFileUrl = value && typeof value === 'string' && 
                          (value.includes('supabase.co/storage/') || value.includes('/storage/v1/object/'));
                        
                        // 이미지 파일인지 확인
                        const isImage = isFileUrl && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(value);
                        
                        // 파일명 추출 - _fileName 필드가 있으면 그 값을 사용
                        const fileNameKey = `${key}_fileName`;
                        const fileName = slot.input_data[fileNameKey] || (isFileUrl ? value.split('/').pop() || '파일' : '');
                        
                        // 필드명 한글 변환
                        const fieldNameMap: Record<string, string> = {
                          'work_days': '작업일',
                          'minimum_purchase': '최소 구매수',
                          'url': 'URL',
                          'mid': '상점 ID',
                          'productName': '상품명',
                          'mainKeyword': '메인 키워드',
                          'keywords': '서브 키워드',
                          'keyword1': '키워드1',
                          'keyword2': '키워드2', 
                          'keyword3': '키워드3',
                          'quantity': '작업량',
                          'dueDays': '작업기간',
                          'workCount': '작업수',
                          'start_date': '시작일',
                          'end_date': '종료일'
                        };
                        const displayKey = fieldNameMap[key] || key;
                        
                        return (
                          <div key={key} className="flex items-start gap-2 text-xs">
                            <span className="font-medium text-gray-600 dark:text-gray-400 min-w-[70px]">{displayKey}</span>
                            <span className="text-gray-500 dark:text-gray-500">:</span>
                            <span className="text-gray-800 dark:text-gray-200 flex-1">
                              {isFileUrl ? (
                                isImage ? (
                                  <button
                                    className="text-blue-600 hover:text-blue-700 underline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      setSelectedImage({ url: value, title: key });
                                      setImageModalOpen(true);
                                    }}
                                  >
                                    {fileName}
                                  </button>
                                ) : (
                                  <a
                                    href={value}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-700 underline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {fileName}
                                  </a>
                                )
                              ) : (
                                value ? String(value) : '-'
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </details>
              );
            })()}
            
            {/* 버튼 그룹 */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1">
                {/* 상세 버튼 */}
                <button
                  className="btn btn-icon btn-sm btn-ghost text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDetail(slot.id);
                  }}
                  title="상세 보기"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
                
                {/* 메모 버튼 */}
                <button
                  className={`btn btn-icon btn-sm btn-ghost text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-900/30 relative ${
                    slot.mat_reason ? 'ring-2 ring-blue-400' : ''
                  } ${slot.user_reason ? 'ring-2 ring-yellow-400' : ''} ${
                    slot.mat_reason && slot.user_reason ? 'ring-2 ring-purple-400' : ''
                  }`}
                  onClick={() => onMemo(slot.id)}
                  title={
                    slot.mat_reason && slot.user_reason ? "메모 (총판/사용자 모두 작성됨)" :
                    slot.mat_reason ? "메모 (총판 작성됨)" :
                    slot.user_reason ? "메모 (사용자 작성됨)" :
                    "메모 추가"
                  }
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  {(slot.mat_reason || slot.user_reason) && (
                    <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                      slot.mat_reason && slot.user_reason ? 'bg-purple-400' :
                      slot.mat_reason ? 'bg-blue-400' :
                      'bg-yellow-400'
                    }`}></span>
                  )}
                </button>
              </div>
              
              {/* 상태별 액션 버튼 */}
              <div className="flex items-center gap-1.5">
                {(slot.status === 'pending' || slot.status === 'submitted') && (
                  <>
                    <button
                      className="px-2 py-0.5 text-xs font-medium rounded bg-green-500 hover:bg-green-600 text-white transition-colors"
                      onClick={() => onApprove(slot.id)}
                    >
                      승인
                    </button>
                    <button
                      className="px-2 py-0.5 text-xs font-medium rounded bg-red-500 hover:bg-red-600 text-white transition-colors"
                      onClick={() => onReject(slot.id)}
                    >
                      반려
                    </button>
                  </>
                )}
                
                {/* 승인된 상태일 때 액션 버튼 */}
                {slot.status === 'approved' && (
                  <>
                    {onComplete && (
                      <button
                        className="px-2 py-0.5 text-xs font-medium rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                        onClick={() => onComplete(slot.id)}
                      >
                        완료
                      </button>
                    )}
                    <button
                      className="px-2 py-0.5 text-xs font-medium rounded bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                      onClick={() => onApprove(slot.id, 'refund')}
                    >
                      환불
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* 모바일 키워드 툴팁 */}
            {openKeywordTooltipId === `mobile-${slot.id}` && ReactDOM.createPortal(
              <>
                {/* 배경 클릭 시 닫기 */}
                <div 
                  className="fixed inset-0" 
                  style={{zIndex: 9998}}
                  onClick={() => setOpenKeywordTooltipId(null)}
                />
                <div 
                  className="fixed bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg p-3 w-64 shadow-xl border border-gray-700 dark:border-gray-600"
                  style={{
                    zIndex: 9999,
                    left: `${popoverPosition.left}px`,
                    top: `${popoverPosition.top}px`,
                    transform: 'translate(-50%, -100%)'
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-100">전체 키워드</div>
                    <button
                      className="text-gray-400 hover:text-gray-200 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenKeywordTooltipId(null);
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(() => {
                      // 모든 키워드 수집
                      const allKeywords = [];
                      if (slot.input_data?.mainKeyword) {
                        allKeywords.push({ keyword: slot.input_data.mainKeyword, isMain: true });
                      }
                      if (slot.input_data?.keyword1) {
                        allKeywords.push({ keyword: slot.input_data.keyword1, isMain: false });
                      }
                      if (slot.input_data?.keyword2) {
                        allKeywords.push({ keyword: slot.input_data.keyword2, isMain: false });
                      }
                      if (slot.input_data?.keyword3) {
                        allKeywords.push({ keyword: slot.input_data.keyword3, isMain: false });
                      }
                      if (slot.input_data?.keywords && Array.isArray(slot.input_data.keywords)) {
                        slot.input_data.keywords.forEach((kw: string) => {
                          allKeywords.push({ keyword: kw, isMain: false });
                        });
                      }
                      
                      return (
                        <>
                          {/* 메인 키워드 */}
                          <div>
                            <div className="text-xs text-gray-400 mb-1">메인 키워드</div>
                            <div className="flex flex-wrap gap-1">
                              {allKeywords.filter(item => item.isMain).map((item, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-0.5 text-xs rounded-md inline-block bg-blue-500/20 text-blue-200 font-medium"
                                >
                                  {item.keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          {/* 서브 키워드 */}
                          {allKeywords.filter(item => !item.isMain).length > 0 && (
                            <>
                              <div className="border-t border-gray-700 dark:border-gray-600"></div>
                              <div>
                                <div className="text-xs text-gray-400 mb-1">서브 키워드</div>
                                <div className="flex flex-wrap gap-1">
                                  {allKeywords.filter(item => !item.isMain).map((item, index) => (
                                    <span
                                      key={index}
                                      className={`px-2 py-0.5 text-xs rounded-md inline-block ${
                                        index % 4 === 0
                                        ? 'bg-green-500/20 text-green-200'
                                        : index % 4 === 1
                                        ? 'bg-purple-500/20 text-purple-200'
                                        : index % 4 === 2
                                        ? 'bg-orange-500/20 text-orange-200'
                                        : 'bg-pink-500/20 text-pink-200'
                                      }`}
                                    >
                                      {item.keyword}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  {/* Arrow */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 bottom-0 translate-y-full">
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900 dark:border-t-gray-800"></div>
                  </div>
                </div>
              </>,
              document.body
            )}
          </div>
        ))}
        
        {/* 모바일에서 슬롯이 없는 경우 표시 */}
        {slots.length === 0 && (
          <div className="md:hidden border border-gray-200 dark:border-gray-700 rounded p-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">표시할 슬롯이 없습니다.</p>
          </div>
        )}
      </div>
      
      {/* 데스크탑에서 슬롯이 없는 경우 표시 */}
      {slots.length === 0 && (
        <div className="hidden md:block border border-gray-200 dark:border-gray-700 rounded p-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">표시할 슬롯이 없습니다.</p>
        </div>
      )}
      </div>
    </div>
    
    {/* 이미지 모달 - search-shop 스타일 */}
    {imageModalOpen && selectedImage && createPortal(
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
        onClick={() => {
          setImageModalOpen(false);
          setSelectedImage(null);
        }}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <div className="relative max-w-4xl max-h-[90vh]">
          <img
            src={selectedImage.url}
            alt={selectedImage.title}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-2 right-2 btn btn-sm btn-light shadow-lg"
            onClick={() => {
              setImageModalOpen(false);
              setSelectedImage(null);
            }}
          >
            <KeenIcon icon="cross" className="text-lg" />
          </button>
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <p className="text-white bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg inline-block shadow-lg">
              {selectedImage.title}
            </p>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
};

export default React.memo(SlotList, (prevProps, nextProps) => {
  // props가 실제로 변경되었을 때만 리렌더링
  return (
    prevProps.slots === nextProps.slots &&
    prevProps.selectedServiceType === nextProps.selectedServiceType &&
    prevProps.campaigns === nextProps.campaigns &&
    prevProps.selectedSlots === nextProps.selectedSlots &&
    prevProps.onApprove === nextProps.onApprove &&
    prevProps.onReject === nextProps.onReject &&
    prevProps.onComplete === nextProps.onComplete &&
    prevProps.onMemo === nextProps.onMemo &&
    prevProps.onDetail === nextProps.onDetail &&
    prevProps.onSelectedSlotsChange === nextProps.onSelectedSlotsChange
  );
});