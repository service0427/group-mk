import React, { useState, useEffect, useRef } from 'react';
import ReactDOM, { createPortal } from 'react-dom';
import { Slot, User, Campaign } from './types';
import { formatDate } from './constants';
import { supabase } from '@/supabase';
import { useAlert } from '@/hooks/useAlert';
import { Dialog, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog';
import { KeenIcon } from '@/components';

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
  onSelectedSlotsChange
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
  
  // 이미지 모달 상태 관리
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);
  
  // 이전 슬롯 ID 목록을 저장하여 변경 여부 확인
  const prevSlotIdsRef = useRef<string[]>([]);
  
  // 노출 안할 inputData
  const passItem = ['campaign_name', 'dueDays', 'expected_deadline', 'keyword1' , 'keyword2' , 'keyword3', 'keywordId', 'mainKeyword', 'mid', 'price', 'service_type', 'url', 'workCount', 'keywords'];
  
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
      return slot.campaign_logo;
    }
    
    // 없으면 서비스 타입에 따른 기본 로고 사용
    const serviceType = slot.input_data?.service_type;
    if (serviceType?.includes('Naver')) {
      return '/media/ad-brand/naver-ci.png';
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
          <h3 className="card-title">슬롯 목록</h3>
          <div className="card-toolbar">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <h3 className="card-title font-medium text-sm">
                전체 <span className="text-primary font-medium">{slots.length}</span> 건
              </h3>
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
      
      {/* 데스크탑 및 태블릿 뷰 - 중간(md) 크기 이상에서만 표시 */}
      <div className="hidden md:block overflow-x-auto">
        <table className="table align-middle text-sm w-full text-left border-separate border-spacing-0">
          <thead>
            <tr className="bg-muted dark:bg-gray-800/60">
              <th className="py-3 px-3 text-start">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="checkbox checkbox-sm checkbox-primary" 
                    checked={selectAll}
                    onChange={handleSelectAll}
                    title="전체 선택/해제"
                  />
                </div>
              </th>
              <th className="py-3 px-3 text-start font-medium">사용자</th>
              <th className="py-3 px-3 text-center font-medium">키워드</th>
              <th className="py-3 px-3 text-center font-medium hidden lg:table-cell">작업수</th>
              <th className="py-3 px-3 text-center font-medium hidden lg:table-cell">작업기간</th>
              <th className="py-3 px-3 text-center font-medium hidden xl:table-cell">캠페인</th>
              <th className="py-3 px-3 text-center font-medium">상태</th>
              <th className="py-3 px-3 text-center font-medium hidden lg:table-cell">추가정보</th>
              <th className="py-3 px-3 text-center font-medium">상세/메모</th>
              <th className="py-3 px-3 text-center font-medium">작업</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot.id} className="border-b border-border hover:bg-muted/40">
                <td className="py-3 px-3">
                  <div className="flex items-center">
                    {(slot.status === 'pending' || slot.status === 'submitted') && (
                      <input 
                        type="checkbox" 
                        className="checkbox checkbox-sm checkbox-primary"
                        checked={selectedSlots.includes(slot.id)} 
                        onChange={() => handleSlotSelect(slot.id)}
                      />
                    )}
                  </div>
                </td>
                
                {/* 사용자 정보 */}
                <td className="py-3 px-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {userMap[slot.user_id]?.full_name || slot.user?.full_name || '이름 없음'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">
                      {userMap[slot.user_id]?.email || slot.user?.email || ''}
                    </span>
                  </div>
                </td>
                
                {/* 키워드 정보 */}
                <td className="py-3 px-3 text-center">
                  <div className="flex items-center justify-center gap-1 relative">
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

                      if (allKeywords.length === 0) {
                        return <span className="text-gray-400">-</span>;
                      }

                      const mainKeyword = allKeywords.find(k => k.isMain)?.keyword || allKeywords[0].keyword;
                      const additionalCount = allKeywords.length - 1;

                      return (
                        <>
                          <span className="text-gray-900 dark:text-gray-100 font-medium">
                            {mainKeyword}
                          </span>
                          {additionalCount > 0 && (
                            <div className="inline-flex items-center gap-1">
                              <button
                                className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium bg-primary text-white rounded-full hover:bg-primary-dark transition-colors cursor-pointer min-w-[20px] h-5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setPopoverPosition({
                                    top: rect.top - 10,
                                    left: rect.left + rect.width / 2
                                  });
                                  setOpenKeywordTooltipId(openKeywordTooltipId === slot.id ? null : slot.id);
                                }}
                              >
                                +{additionalCount}
                              </button>
                              {/* Tooltip */}
                              {openKeywordTooltipId === slot.id && ReactDOM.createPortal(
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
                                      zIndex: 99999,
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
                          )}
                        </>
                      );
                    })()}
                  </div>
                </td>
                
                {/* 작업수 */}
                <td className="py-3 px-3 text-center hidden lg:table-cell">
                  <span className="text-gray-700 dark:text-gray-300">
                    {slot.quantity ? slot.quantity.toLocaleString() : 
                     slot.input_data?.quantity ? slot.input_data.quantity : 
                     slot.input_data?.workCount ? slot.input_data.workCount : '-'}
                  </span>
                </td>
                
                {/* 작업기간 */}
                <td className="py-3 px-3 text-center hidden lg:table-cell">
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
                        <span className="text-gray-400">
                          -
                        </span>
                      )
                    )
                  )}
                </td>
                
                {/* 캠페인 */}
                <td className="py-3 px-3 text-center hidden xl:table-cell">
                  <div className="flex items-center justify-center gap-2">
                    {getCampaignLogo(slot) && (
                      <img 
                        src={getCampaignLogo(slot)} 
                        alt="campaign logo" 
                        className="w-5 h-5 object-contain rounded"
                      />
                    )}
                    <span className="text-gray-700 dark:text-gray-300">
                      {slot.campaign_name || '-'}
                    </span>
                    {getCampaignStatusDot(slot)}
                  </div>
                </td>
                
                {/* 상태 */}
                <td className="py-3 px-3 text-center">
                  <div>
                    {slot.status === 'pending' && 
                      <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">대기중</span>}
                    {slot.status === 'submitted' && 
                      <span className="px-1.5 py-0.5 text-xs rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">검토중</span>}
                    {slot.status === 'approved' && 
                      <span className="px-1.5 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">승인</span>}
                    {slot.status === 'rejected' && (
                      <div className="inline-flex items-center gap-1">
                        <span className="px-1.5 py-0.5 text-xs rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">반려</span>
                        {slot.rejection_reason && (
                          <div className="relative inline-block">
                            <button
                              className="text-red-500 cursor-pointer hover:text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenRejectionId(openRejectionId === slot.id ? null : slot.id);
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                              </svg>
                            </button>
                            {openRejectionId === slot.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setOpenRejectionId(null)} />
                                <div className="absolute z-50 bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-100 text-xs rounded p-2 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 max-w-xs shadow-xl border border-gray-700 dark:border-gray-600">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="font-medium">반려 사유</div>
                                    <button 
                                      className="text-gray-400 hover:text-gray-200 transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenRejectionId(null);
                                      }}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                      </svg>
                                    </button>
                                  </div>
                                  <div className="text-gray-200 dark:text-gray-300">{slot.rejection_reason}</div>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {slot.status === 'success' && 
                      <span className="px-1.5 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">완료</span>}
                    {slot.status === 'complete' && 
                      <span className="px-1.5 py-0.5 text-xs rounded bg-gray-600 dark:bg-gray-700 text-white">종료</span>}
                    {slot.status === 'completed' && 
                      <span className="px-1.5 py-0.5 text-xs rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">완료</span>}
                    {slot.status === 'pending_user_confirm' && 
                      <span className="px-1.5 py-0.5 text-xs rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">사용자확인대기</span>}
                    {!slot.status && 
                      <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">-</span>}
                  </div>
                </td>
                
                {/* 추가정보 */}
                <td className="py-3 px-3 text-center hidden lg:table-cell">
                  {slot.input_data && (() => {
                    // passItem에 포함되지 않고, _fileName으로 끝나지 않는 필드만 필터링
                    const userInputFields = Object.entries(slot.input_data).filter(([key]) => 
                      !passItem.includes(key) && !key.endsWith('_fileName')
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
                                <span className="font-medium text-gray-100 dark:text-gray-200">추가 정보</span>
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
                                    
                                    return (
                                      <div key={key} className="flex items-start gap-2 text-left py-1 border-b border-gray-800 dark:border-gray-700 last:border-0">
                                        <span className="font-medium text-gray-300 dark:text-gray-400 min-w-[80px] shrink-0">{key}</span>
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
                      className="btn btn-icon btn-sm btn-ghost text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-900/30"
                      onClick={() => onMemo(slot.id)}
                      title="메모 추가"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
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
              <div>
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
              <span>
                <span className="text-gray-500">키워드:</span> 
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

                  if (allKeywords.length === 0) {
                    return <span className="text-gray-900 dark:text-gray-100 font-medium ml-1">-</span>;
                  }

                  const mainKeyword = allKeywords.find(k => k.isMain)?.keyword || allKeywords[0].keyword;
                  const additionalCount = allKeywords.length - 1;

                  return (
                    <>
                      <span className="text-gray-900 dark:text-gray-100 font-medium ml-1">
                        {mainKeyword}
                      </span>
                      {additionalCount > 0 && (
                        <button
                          className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium bg-primary text-white rounded-full hover:bg-primary-dark transition-colors cursor-pointer min-w-[20px] h-5 ml-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setPopoverPosition({
                              top: rect.top - 10,
                              left: rect.left + rect.width / 2
                            });
                            setOpenKeywordTooltipId(openKeywordTooltipId === `mobile-${slot.id}` ? null : `mobile-${slot.id}`);
                          }}
                        >
                          +{additionalCount}
                        </button>
                      )}
                    </>
                  );
                })()}
              </span>
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
                        slot.input_data?.dueDays ? `${slot.input_data.dueDays}일` : '-'}
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
              // passItem에 포함되지 않고, _fileName으로 끝나지 않는 필드만 필터링
              const userInputFields = Object.entries(slot.input_data).filter(([key]) => 
                !passItem.includes(key) && !key.endsWith('_fileName')
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
                        
                        return (
                          <div key={key} className="flex items-start gap-2 text-xs">
                            <span className="font-medium text-gray-600 dark:text-gray-400 min-w-[70px]">{key}</span>
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
                  className="btn btn-icon btn-sm btn-ghost text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-900/30"
                  onClick={() => onMemo(slot.id)}
                  title="메모 추가"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
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