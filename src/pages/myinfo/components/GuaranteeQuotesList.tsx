import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { KeenIcon } from '@/components';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useMediaQuery } from '@/hooks';
import type { GuaranteeSlotRequestStatus } from '@/types/guarantee-slot.types';
import { smartCeil } from '@/utils/mathUtils';

// 타입 정의
interface GuaranteeItem {
  id: string;
  type: 'request' | 'slot';
  title: string;
  service_type?: string;
  status: string;
  created_at: string;
  // 견적 요청 필드
  target_rank?: number;
  guarantee_count?: number;
  initial_budget?: number;
  final_daily_amount?: number;
  start_date?: string;
  end_date?: string;
  campaign_id?: number;
  distributor_id?: string;
  // 슬롯 필드
  guarantee_type?: string;
  input_data?: {
    mid?: string;
    url?: string;
    mainKeyword?: string;
    keyword1?: string;
    keyword2?: string;
    keyword3?: string;
  };
  // 키워드 정보
  keywords?: {
    id: number;
    main_keyword: string;
    keyword1?: string;
    keyword2?: string;
    keyword3?: string;
    url?: string;
    mid?: string;
  };
  // 캠페인 정보
  campaigns?: {
    id: number;
    campaign_name: string;
    service_type: string;
    guarantee_unit?: string;
    logo?: string;
    status?: string;
    add_info?: any;
    refund_settings?: {
      type: 'immediate' | 'delayed' | 'cutoff_based';
      delay_days?: number;
      cutoff_time?: string;
    };
  };
  // 보장형 슬롯 정보
  guarantee_slots?: Array<{
    id: string;
    status: 'pending' | 'active' | 'completed' | 'cancelled' | 'rejected';
    start_date?: string;
    end_date?: string;
    refund_requests?: Array<{
      id: string;
      status: 'pending' | 'approved' | 'rejected' | 'pending_user_confirmation';
      refund_reason: string;
      approval_notes?: string;
      request_date: string;
      approval_date?: string;
      refund_amount?: number;
    }>;
  }>;
}

interface GuaranteeQuotesListProps {
  filteredRequests: GuaranteeItem[];
  isLoading: boolean;
  error: string | null;
  onOpenNegotiationModal: (request: GuaranteeItem) => void;
  hasFilters?: boolean;
  // 선택 관련 props
  selectedRequests?: string[];
  onSelectedRequestsChange?: (selected: string[]) => void;
  showBulkActions?: boolean;
  onRefundRequest?: (requestId: string) => void;
  onInquiry?: (request: GuaranteeItem) => void;
  onDetailView?: (request: GuaranteeItem) => void;
  onRankCheck?: (request: GuaranteeItem) => void;
  onRefundConfirm?: (slotId: string, refundRequestId: string, approve: boolean) => void;
}

export const GuaranteeQuotesList: React.FC<GuaranteeQuotesListProps> = ({
  filteredRequests,
  isLoading,
  error,
  onOpenNegotiationModal,
  hasFilters = false,
  selectedRequests = [],
  onSelectedRequestsChange,
  showBulkActions = false,
  onRefundRequest,
  onInquiry,
  onDetailView,
  onRankCheck,
  onRefundConfirm
}) => {
  // 화면 크기 확인
  const isMediumScreen = useMediaQuery('(min-width: 768px)');
  const isLargeScreen = useMediaQuery('(min-width: 1024px)');
  const isExtraLargeScreen = useMediaQuery('(min-width: 1280px)');

  // 키워드 툴팁 상태
  const [openKeywordTooltipId, setOpenKeywordTooltipId] = useState<string | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });

  // 환불 정보 툴팁 상태
  const [openRefundInfoId, setOpenRefundInfoId] = useState<string | null>(null);
  const [refundTooltipPosition, setRefundTooltipPosition] = useState({ top: 0, left: 0 });

  // 남은 일수 계산 함수
  const calculateRemainingDays = (endDate: string | null): number | null => {
    if (!endDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  // 남은 일수에 따른 색상 클래스 반환
  const getRemainingDaysColorClass = (days: number | null): string => {
    if (days === null) return 'text-gray-400';
    if (days < 0) return 'text-gray-500'; // 마감됨
    if (days === 0) return 'text-red-600 font-bold'; // 오늘 마감
    if (days <= 3) return 'text-orange-500 font-semibold'; // 3일 이하
    if (days <= 7) return 'text-yellow-600'; // 7일 이하
    return 'text-gray-700 dark:text-gray-300'; // 일반
  };

  // 남은 일수 표시 텍스트
  const getRemainingDaysText = (days: number | null): string => {
    if (days === null) return '-';
    if (days < 0) return '마감';
    if (days === 0) return '오늘';
    return `D-${days}`;
  };

  // 체크박스 선택 함수
  const handleRequestSelect = (requestId: string) => {
    if (!onSelectedRequestsChange) return;

    const newSelected = selectedRequests.includes(requestId)
      ? selectedRequests.filter(id => id !== requestId)
      : [...selectedRequests, requestId];

    onSelectedRequestsChange(newSelected);
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (!onSelectedRequestsChange) return;

    const cancelableRequests = filteredRequests
      .filter(item => item.status === 'requested' || item.status === 'negotiating')
      .map(item => item.id);

    const allSelected = cancelableRequests.length > 0 &&
      cancelableRequests.every(id => selectedRequests.includes(id));

    onSelectedRequestsChange(allSelected ? [] : cancelableRequests);
  };

  // 캠페인 로고 가져오기
  const getCampaignLogo = (item: GuaranteeItem): string => {
    // add_info에 저장된 실제 업로드 URL 확인
    if (item.campaigns?.add_info) {
      try {
        const addInfo = typeof item.campaigns.add_info === 'string' 
          ? JSON.parse(item.campaigns.add_info) 
          : item.campaigns.add_info;
        
        if (addInfo?.logo_url) {
          return addInfo.logo_url;
        }
      } catch (e) {
        // JSON 파싱 오류 무시
      }
    }
    
    // 기본 제공 로고 확인
    if (item.campaigns?.logo) {
      // /media/로 시작하는 기본 로고
      if (item.campaigns.logo.startsWith('/media/')) {
        return item.campaigns.logo;
      }
    }
    
    // 로고가 없으면 빈 문자열 반환
    return '';
  };

  // 캠페인 상태에 따른 닷 색상과 메시지
  const getCampaignStatusDot = (campaign?: { status?: string }) => {
    if (!campaign?.status) return null;

    const statusConfig = {
      active: { color: 'bg-green-500', text: '진행중' },
      paused: { color: 'bg-yellow-500', text: '일시중지' },
      completed: { color: 'bg-gray-500', text: '종료' },
      pending: { color: 'bg-blue-500', text: '대기중' }
    };

    const config = statusConfig[campaign.status as keyof typeof statusConfig] ||
      { color: 'bg-gray-400', text: '알 수 없음' };

    return (
      <div className="relative inline-block ml-1">
        <div className={`w-2 h-2 rounded-full ${config.color}`} title={config.text}></div>
      </div>
    );
  };

  // 환불 예정일 계산
  const calculateRefundDate = (approvalDate: string, refundSettings?: any): string => {
    if (!refundSettings) return '즉시 처리';

    const approval = new Date(approvalDate);

    switch (refundSettings.type) {
      case 'immediate':
        return '즉시 처리';

      case 'delayed':
        const delayedDate = new Date(approval);
        delayedDate.setDate(delayedDate.getDate() + (refundSettings.delay_days || 0));
        return delayedDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });

      case 'cutoff_based':
        const [hours, minutes] = (refundSettings.cutoff_time || '00:00').split(':').map(Number);
        const cutoffDate = new Date(approval);
        cutoffDate.setHours(hours, minutes, 0, 0);

        // 승인 시간이 마감시간을 지났으면 다음날로
        if (cutoffDate <= approval) {
          cutoffDate.setDate(cutoffDate.getDate() + 1);
        }

        return `${cutoffDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} ${refundSettings.cutoff_time}`;

      default:
        return '알 수 없음';
    }
  };

  // 상태별 색상 및 라벨
  const getStatusInfo = (status: string, type: 'request' | 'slot') => {
    if (type === 'request') {
      switch (status) {
        case 'requested':
          return { label: '견적 요청', color: 'badge-info', icon: 'calendar' };
        case 'negotiating':
          return { label: '협상 중', color: 'badge-warning', icon: 'message-programming' };
        case 'accepted':
          return { label: '협상 완료', color: 'badge-success', icon: 'check-circle' };
        case 'purchased':
          return { label: '구매 완료', color: 'badge-primary', icon: 'credit-card' };
        case 'rejected':
          return { label: '거절됨', color: 'badge-error', icon: 'close-circle' };
        case 'expired':
          return { label: '만료됨', color: 'badge-neutral', icon: 'time' };
        default:
          return { label: '알 수 없음', color: 'badge-neutral', icon: 'question' };
      }
    } else {
      // 슬롯 상태
      switch (status) {
        case 'pending':
          return { label: '승인 대기', color: 'badge-warning', icon: 'time' };
        case 'active':
        case 'approved':
          return { label: '진행 중', color: 'badge-primary', icon: 'check-circle' };
        case 'completed':
          return { label: '완료', color: 'badge-success', icon: 'check-circle' };
        case 'cancelled':
          return { label: '취소됨', color: 'badge-neutral', icon: 'close-circle' };
        case 'rejected':
          return { label: '거절됨', color: 'badge-error', icon: 'close-circle' };
        default:
          return { label: status, color: 'badge-neutral', icon: 'question' };
      }
    }
  };


  // 숫자 포맷팅
  const formatNumber = (number: number | undefined) => {
    if (!number) return '';
    return parseInt(number.toString()).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex items-center gap-3 text-gray-500">
          <KeenIcon icon="loading" className="animate-spin" />
          <span>슬롯 목록을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <KeenIcon icon="shield-exclamation" className="text-5xl text-red-500 mb-4" />
        <p className="text-lg text-red-600 mb-2">오류가 발생했습니다</p>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (filteredRequests.length === 0) {
    return (
      <div className="text-center py-8">
        <KeenIcon icon="information-3" className="text-5xl text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground">
          {hasFilters ? '검색 조건에 맞는 견적 요청이 없습니다' : '견적 요청 내역이 없습니다'}
        </p>
        <p className="text-sm text-gray-400 mt-2">
          {hasFilters ? '검색 조건을 변경해보세요' : '보장형 캠페인에 견적을 요청해보세요'}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* 데스크톱 테이블 */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="table table-sm w-full">
            <thead>
              <tr className="text-gray-800 border-b border-gray-200">
                {showBulkActions && (
                  <th className="w-10">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={(() => {
                        const cancelableRequests = filteredRequests
                          .filter(item => item.status === 'requested' || item.status === 'negotiating')
                          .map(item => item.id);
                        return cancelableRequests.length > 0 &&
                          cancelableRequests.every(id => selectedRequests.includes(id));
                      })()}
                      onChange={handleSelectAll}
                      title="전체 선택/해제"
                    />
                  </th>
                )}
                <th className="py-2 px-1 md:px-2 text-start font-medium">입력정보</th>
                {isLargeScreen && <th className="py-2 px-1 md:px-2 text-center font-medium"></th>}
                {isLargeScreen && <th className="py-2 px-1 md:px-2 text-center font-medium">보장</th>}
                <th className="py-2 px-1 md:px-2 text-center font-medium">캠페인</th>
                <th className="py-2 px-1 md:px-2 text-center font-medium">상태</th>
                {isExtraLargeScreen && <th className="py-2 px-1 md:px-2 text-center font-medium">신청일</th>}
                {isLargeScreen && <th className="py-2 px-1 md:px-2 text-center font-medium">기간</th>}
                {isLargeScreen && <th className="py-2 px-1 md:px-2 text-center font-medium">남은일</th>}
                <th className="py-2 px-1 md:px-2 text-center font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((item) => {
                let statusInfo;
                let refundRequest = null;
                const slot = item.guarantee_slots?.[0];

                // 보장형 슬롯 관리 페이지와 동일한 로직 적용
                if (item.status === 'purchased' && slot) {
                  // 환불 요청 상태 우선 확인
                  refundRequest = slot.refund_requests?.find(req =>
                    req.status === 'pending' ||
                    req.status === 'approved' ||
                    req.status === 'pending_user_confirmation' ||
                    (req.status === 'rejected' && slot.status !== 'active')
                  );

                  if (refundRequest) {
                    // 환불 요청 상태가 있으면 환불 상태 표시
                    switch (refundRequest.status) {
                      case 'pending':
                        statusInfo = { label: '환불 검토중', color: 'badge-danger', icon: 'clock' };
                        break;
                      case 'pending_user_confirmation':
                        statusInfo = { label: '사용자 확인중', color: 'badge-warning', icon: 'notification-status' };
                        break;
                      case 'approved':
                        statusInfo = { label: '환불승인', color: 'badge-danger', icon: 'check-circle' };
                        break;
                      case 'rejected':
                        statusInfo = { label: '환불 거절됨', color: 'badge-danger', icon: 'cross-circle' };
                        break;
                      default:
                        statusInfo = { label: '환불 요청', color: 'badge-danger', icon: 'wallet' };
                    }
                  } else {
                    // 환불 요청이 없으면 기존 슬롯 상태 표시
                    switch (slot.status) {
                      case 'pending':
                        statusInfo = { label: '대기', color: 'badge-warning', icon: 'time' };
                        break;
                      case 'active':
                        statusInfo = { label: '진행중', color: 'badge-primary', icon: 'check-circle' };
                        break;
                      case 'rejected':
                        statusInfo = { label: '반려', color: 'badge-danger', icon: 'cross-circle' };
                        break;
                      case 'completed':
                        statusInfo = { label: '완료', color: 'badge-neutral', icon: 'check-circle' };
                        break;
                      default:
                        statusInfo = { label: slot.status, color: 'badge-neutral', icon: 'question' };
                    }
                  }
                } else {
                  // 견적 요청 상태 표시
                  statusInfo = getStatusInfo(item.status, 'request');
                }

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    {/* 체크박스 */}
                    {showBulkActions && (
                      <td className="py-2 px-2">
                        {(item.status === 'requested' || item.status === 'negotiating') && (
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={selectedRequests.includes(item.id)}
                            onChange={() => handleRequestSelect(item.id)}
                          />
                        )}
                      </td>
                    )}

                    {/* 입력정보 */}
                    <td className="py-2 px-1 md:px-2 max-w-[100px] md:max-w-[120px] lg:max-w-[150px]">
                      <div className="flex items-start gap-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                            {(() => {
                              // 1. 키워드에서 mid 확인
                              if (item.keywords?.mid) return item.keywords.mid;

                              // 2. input_data 직접 확인
                              if (item.input_data?.mid) return item.input_data.mid;

                              // 3. input_data.keywords[0].input_data 확인 (중첩 구조)
                              if ((item.input_data as any)?.keywords?.[0]?.input_data) {
                                const nestedData = (item.input_data as any).keywords[0].input_data;

                                // mid 필드 찾기
                                if (nestedData.mid) return nestedData.mid;

                                // 한글 필드명 찾기
                                const midField = Object.entries(nestedData).find(([key, value]) =>
                                  (key === '나' || key.includes('나') || key.toLowerCase().includes('mid')) && value
                                );
                                if (midField) return midField[1];

                                // 첫 번째 의미있는 필드
                                const firstField = Object.entries(nestedData).find(([key, value]) =>
                                  !['is_manual_input', 'mainKeyword', 'keyword1', 'keyword2', 'keyword3'].includes(key) && value
                                );
                                if (firstField) return `${firstField[0]}: ${firstField[1]}`;
                              }

                              // 4. input_data 최상위 레벨 확인
                              if (item.input_data) {
                                const fields = Object.entries(item.input_data).find(([key, value]) =>
                                  !['keywords', 'is_manual_input', 'mainKeyword'].includes(key) &&
                                  typeof value === 'string' && value
                                );
                                if (fields) return fields[1];
                              }

                              return '-';
                            })()}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {(() => {
                              // 1. 키워드에서 url 확인
                              if (item.keywords?.url) return item.keywords.url;

                              // 2. input_data 직접 확인
                              if (item.input_data?.url) return item.input_data.url;

                              // 3. input_data.keywords[0].input_data 확인 (중첩 구조)
                              if ((item.input_data as any)?.keywords?.[0]?.input_data?.url) {
                                return (item.input_data as any).keywords[0].input_data.url;
                              }

                              return '-';
                            })()}
                          </div>
                        </div>
                        {/* 입력정보 info 아이콘 항상 표시 */}
                        <button
                          className="flex-shrink-0 text-primary hover:text-primary-dark transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setPopoverPosition({
                              top: rect.top - 10,
                              left: rect.left + rect.width / 2
                            });
                            setOpenKeywordTooltipId(openKeywordTooltipId === `info-${item.id}` ? null : `info-${item.id}`);
                          }}
                        >
                          <KeenIcon icon="information-2" className="text-base" />
                        </button>
                      </div>

                      {/* 입력정보 팝오버 */}
                      {openKeywordTooltipId === `info-${item.id}` && ReactDOM.createPortal(
                        <>
                          <div
                            className="fixed inset-0"
                            style={{ zIndex: 9998 }}
                            onClick={() => setOpenKeywordTooltipId(null)}
                          />
                          <div
                            className="fixed bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg p-3 w-72 shadow-xl border border-gray-700 dark:border-gray-600"
                            style={{
                              zIndex: 99999,
                              left: `${popoverPosition.left}px`,
                              top: `${popoverPosition.top}px`,
                              transform: 'translate(-50%, -100%)'
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-gray-100">입력 정보</div>
                              <button
                                className="text-gray-400 hover:text-gray-200 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenKeywordTooltipId(null);
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                            <div className="space-y-1.5">
                              {(() => {
                                const displayData: Record<string, any> = {};

                                // 1. input_data 직접 필드들
                                if (item.input_data) {
                                  Object.entries(item.input_data).forEach(([key, value]) => {
                                    if (!['keywords', 'is_manual_input', 'mid', 'url', 'mainKeyword', 'keyword1', 'keyword2', 'keyword3'].includes(key) && value && typeof value !== 'object') {
                                      displayData[key] = value;
                                    }
                                  });
                                }

                                // 2. 중첩된 keywords[0].input_data 필드들
                                if ((item.input_data as any)?.keywords?.[0]?.input_data) {
                                  Object.entries((item.input_data as any).keywords[0].input_data).forEach(([key, value]) => {
                                    if (!['is_manual_input', 'mid', 'url', 'mainKeyword', 'keyword1', 'keyword2', 'keyword3'].includes(key) && value) {
                                      displayData[key] = value;
                                    }
                                  });
                                }

                                // 3. 표시할 데이터가 없으면 기본 메시지
                                if (Object.keys(displayData).length === 0) {
                                  return <div className="text-gray-400 text-center py-2">입력 필드 데이터가 없습니다.</div>;
                                }

                                // 4. 데이터 표시
                                // 필드명 한글 변환 맵
                                const fieldNameMap: Record<string, string> = {
                                  // 기본 필드
                                  'work_days': '작업일',
                                  'minimum_purchase': '최소 구매수',
                                  'url': 'URL',
                                  'mid': 'MID',
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

                                return Object.entries(displayData).map(([key, value]) => {
                                  const displayKey = fieldNameMap[key] || key;
                                  return (
                                    <div key={key} className="flex items-start gap-2">
                                      <span className="text-gray-400 min-w-[60px]">{displayKey}:</span>
                                      <span className="text-gray-100 break-all">{String(value)}</span>
                                    </div>
                                  );
                                });
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
                    </td>

                    {/* 키워드 */}
                    {isLargeScreen && (
                      <td className="py-2 px-1 md:px-2 text-center max-w-[100px]">
                        <div className="flex items-center justify-center gap-1 relative">
                          {(() => {
                            // 키워드 배열 생성
                            const keywordArray = [];
                            if (item.keywords?.main_keyword || item.input_data?.mainKeyword) {
                              keywordArray.push(item.keywords?.main_keyword || item.input_data?.mainKeyword);
                            }
                            if (item.keywords?.keyword1 || item.input_data?.keyword1) keywordArray.push(item.keywords?.keyword1 || item.input_data?.keyword1);
                            if (item.keywords?.keyword2 || item.input_data?.keyword2) keywordArray.push(item.keywords?.keyword2 || item.input_data?.keyword2);
                            if (item.keywords?.keyword3 || item.input_data?.keyword3) keywordArray.push(item.keywords?.keyword3 || item.input_data?.keyword3);

                            if (keywordArray.length === 0) {
                              return <span className="text-gray-400 text-sm">-</span>;
                            }

                            const mainKeyword = keywordArray[0];
                            const additionalCount = keywordArray.length - 1;

                            return (
                              <>
                                <span className="text-gray-900 dark:text-gray-100 font-medium text-sm truncate" title={mainKeyword}>
                                  {mainKeyword}
                                </span>
                                {additionalCount > 0 && (
                                  <>
                                    <button
                                      className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium bg-primary text-white rounded-full hover:bg-primary-dark transition-colors cursor-pointer min-w-[20px] h-5"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setPopoverPosition({
                                          top: rect.top - 10,
                                          left: rect.left + rect.width / 2
                                        });
                                        setOpenKeywordTooltipId(openKeywordTooltipId === item.id ? null : item.id);
                                      }}
                                    >
                                      +{additionalCount}
                                    </button>
                                    {/* Tooltip */}
                                    {openKeywordTooltipId === item.id && ReactDOM.createPortal(
                                      <>
                                        {/* 배경 클릭 시 닫기 */}
                                        <div
                                          className="fixed inset-0"
                                          style={{ zIndex: 9998 }}
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
                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                              </svg>
                                            </button>
                                          </div>
                                          <div className="space-y-2">
                                            {/* 메인 키워드 */}
                                            <div>
                                              <div className="text-xs text-gray-400 mb-1">메인 키워드</div>
                                              <div className="flex flex-wrap gap-1">
                                                <span className="px-2 py-0.5 text-xs rounded-md inline-block bg-blue-500/20 text-blue-200 font-medium">
                                                  {mainKeyword}
                                                </span>
                                              </div>
                                            </div>

                                            {/* 서브 키워드 */}
                                            {additionalCount > 0 && (
                                              <>
                                                <div className="border-t border-gray-700 dark:border-gray-600"></div>
                                                <div>
                                                  <div className="text-xs text-gray-400 mb-1">서브 키워드</div>
                                                  <div className="flex flex-wrap gap-1">
                                                    {keywordArray.slice(1).map((keyword, index) => (
                                                      <span
                                                        key={index}
                                                        className={`px-2 py-0.5 text-xs rounded-md inline-block ${index % 4 === 0
                                                            ? 'bg-green-500/20 text-green-200'
                                                            : index % 4 === 1
                                                              ? 'bg-purple-500/20 text-purple-200'
                                                              : index % 4 === 2
                                                                ? 'bg-orange-500/20 text-orange-200'
                                                                : 'bg-pink-500/20 text-pink-200'
                                                          }`}
                                                      >
                                                        {keyword}
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
                                  </>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </td>
                    )}

                    {/* 보장 */}
                    {isLargeScreen && (
                      <td className="py-2 px-1 md:px-2 text-center">
                        <div className="text-xs font-medium">
                          <span className={item.campaigns?.guarantee_unit === '회' ? 'text-purple-600' : 'text-blue-600'}>
                            {item.guarantee_count}{item.campaigns?.guarantee_unit || '일'}
                          </span>
                        </div>
                      </td>
                    )}

                    {/* 캠페인 */}
                    <td className="py-2 px-1 md:px-2 text-center max-w-[90px] md:max-w-[110px] lg:max-w-[120px]">
                      <div className="flex items-center justify-center gap-1">
                        {getCampaignLogo(item) && (
                          <img
                            src={getCampaignLogo(item)}
                            alt="campaign logo"
                            className="w-4 h-4 object-contain rounded flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <span className="text-xs text-gray-700 truncate" title={item.campaigns?.campaign_name || '-'}>
                          {item.campaigns?.campaign_name || '-'}
                        </span>
                        {getCampaignStatusDot(item.campaigns)}
                      </div>
                    </td>

                    {/* 상태 */}
                    <td className="py-2 px-1 md:px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className={`badge badge-sm ${statusInfo.color} whitespace-nowrap`}>
                          {statusInfo.label}
                        </span>
                        {/* 환불 관련 정보 아이콘 표시 */}
                        {item.status === 'purchased' && item.guarantee_slots?.[0] && (() => {
                          const slot = item.guarantee_slots[0];
                          const refundRequest = slot.refund_requests?.find(req =>
                            req.status === 'pending' ||
                            req.status === 'approved' ||
                            req.status === 'pending_user_confirmation' ||
                            (req.status === 'rejected' && slot.status !== 'active')
                          );
                          return refundRequest && (refundRequest.status === 'pending' || refundRequest.status === 'pending_user_confirmation' || refundRequest.status === 'approved');
                        })() && (
                            <div className="relative">
                              <button
                                className="text-danger hover:text-danger-dark transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const tooltipWidth = 288; // w-72 = 18rem = 288px
                                  const tooltipHeight = 200; // 대략적인 툴팁 높이

                                  // 가로 위치 계산 (화면 밖으로 나가지 않도록)
                                  let left = rect.left + rect.width / 2;
                                  if (left - tooltipWidth / 2 < 10) {
                                    left = tooltipWidth / 2 + 10;
                                  } else if (left + tooltipWidth / 2 > window.innerWidth - 10) {
                                    left = window.innerWidth - tooltipWidth / 2 - 10;
                                  }

                                  // 세로 위치 계산 (위쪽 공간이 부족하면 아래쪽에 표시)
                                  let top = rect.top - 10;
                                  let transform = 'translate(-50%, -100%)';
                                  if (rect.top - tooltipHeight - 10 < 10) {
                                    top = rect.bottom + 10;
                                    transform = 'translate(-50%, 0%)';
                                  }

                                  setRefundTooltipPosition({ top, left });
                                  setOpenRefundInfoId(openRefundInfoId === item.id ? null : item.id);
                                }}
                                title="환불 정보"
                              >
                                <KeenIcon icon="information-2" className="text-sm" />
                              </button>
                              {openRefundInfoId === item.id && ReactDOM.createPortal(
                                <>
                                  <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setOpenRefundInfoId(null)}
                                  />
                                  {(() => {
                                    const slot = item.guarantee_slots?.[0];
                                    const refundRequest = slot?.refund_requests?.find(req =>
                                      req.status === 'pending' ||
                                      req.status === 'approved' ||
                                      req.status === 'pending_user_confirmation' ||
                                      (req.status === 'rejected' && slot?.status !== 'active')
                                    );

                                    if (!slot || !refundRequest) return null;

                                    return (
                                      <div
                                        className="fixed z-50 bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-100 text-xs rounded p-3 w-72 max-w-xs shadow-xl border border-gray-700 dark:border-gray-600"
                                        style={{
                                          left: `${refundTooltipPosition.left}px`,
                                          top: `${refundTooltipPosition.top}px`,
                                          transform: 'translate(-50%, -100%)'
                                        }}
                                      >
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="font-medium text-sm flex items-center gap-2">
                                            {refundRequest?.status === 'pending' ? (
                                              <>
                                                <KeenIcon icon="clock" className="text-orange-400" />
                                                환불 검토 중
                                              </>
                                            ) : refundRequest?.status === 'pending_user_confirmation' ? (
                                              <>
                                                <KeenIcon icon="notification-status" className="text-yellow-400" />
                                                환불 확인 요청
                                              </>
                                            ) : (
                                              <>
                                                <KeenIcon icon="check-circle" className="text-green-400" />
                                                환불 승인됨
                                              </>
                                            )}
                                          </div>
                                          <button
                                            className="text-gray-400 hover:text-gray-200 transition-colors"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setOpenRefundInfoId(null);
                                            }}
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                        </div>
                                        <div className="space-y-2">
                                          {refundRequest?.status === 'pending' ? (
                                            <>
                                              <div className="flex items-center gap-2 text-orange-400 mb-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                  <circle cx="12" cy="12" r="10" />
                                                  <polyline points="12 6 12 12 16 14" />
                                                </svg>
                                                <span className="font-medium">총판 검토 대기 중</span>
                                              </div>
                                              <div>
                                                <span className="text-gray-400">환불 사유:</span>
                                                <div className="text-gray-200 mt-1">{refundRequest.refund_reason || '사유 없음'}</div>
                                              </div>
                                              <div className="text-gray-400 text-xs">
                                                신청일: {new Date(refundRequest.request_date).toLocaleDateString('ko-KR')}
                                              </div>
                                              <div className="bg-orange-900/30 border border-orange-700/50 rounded-md p-2 mt-2">
                                                <div className="text-orange-300 text-xs">
                                                  💡 총판이 검토 중입니다. 처리까지 시간이 소요될 수 있습니다.
                                                </div>
                                              </div>
                                            </>
                                          ) : refundRequest?.status === 'pending_user_confirmation' ? (
                                            <>
                                              <div className="flex items-center gap-2 text-yellow-400 mb-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                                  <line x1="12" y1="9" x2="12" y2="13" />
                                                  <line x1="12" y1="17" x2="12.01" y2="17" />
                                                </svg>
                                                <span className="font-medium">환불 확인이 필요합니다</span>
                                              </div>
                                              <div>
                                                <span className="text-gray-400">환불 사유:</span>
                                                <div className="text-gray-200 mt-1">{refundRequest.refund_reason || '사유 없음'}</div>
                                              </div>
                                              <div>
                                                <span className="text-gray-400">환불 예정 금액:</span>
                                                <div className="text-gray-200 font-medium">
                                                  {(() => {
                                                    // 환불 금액이 있으면 사용, 없으면 직접 계산
                                                    if (refundRequest.refund_amount && refundRequest.refund_amount > 0) {
                                                      return Math.floor(refundRequest.refund_amount).toLocaleString();
                                                    }
                                                    // 직접 계산: 일별 단가 * 보장 일수 * 1.1 (VAT)
                                                    const totalAmount = item.final_daily_amount && item.guarantee_count
                                                      ? smartCeil(item.final_daily_amount * item.guarantee_count * 1.1)
                                                      : 0;
                                                    
                                                    // 완료된 일수 계산
                                                    const completedDays = (() => {
                                                      if (!slot.start_date) return 0;
                                                      const start = new Date(slot.start_date);
                                                      const today = new Date();
                                                      const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                                                      return Math.max(0, diffDays);
                                                    })();
                                                    
                                                    // 완료된 금액 계산
                                                    const completedAmount = item.final_daily_amount 
                                                      ? smartCeil(item.final_daily_amount * completedDays * 1.1)
                                                      : 0;
                                                    
                                                    // 환불 금액 = 총 금액 - 완료된 금액
                                                    const refundAmount = Math.max(0, totalAmount - completedAmount);
                                                    return refundAmount.toLocaleString();
                                                  })()}원
                                                </div>
                                              </div>
                                              <div className="text-gray-400 text-xs">
                                                요청일: {new Date(refundRequest.request_date).toLocaleDateString('ko-KR')}
                                              </div>
                                              <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-md p-2 mt-2">
                                                <div className="text-yellow-300 text-xs mb-2">
                                                  ⚠️ 총판이 환불을 요청했습니다. 확인 후 진행해 주세요.
                                                </div>
                                                <div className="flex gap-2">
                                                  <button
                                                    className="flex-1 btn btn-xs btn-success"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      if (onRefundConfirm) {
                                                        onRefundConfirm(slot.id, refundRequest.id, true);
                                                      }
                                                      setOpenRefundInfoId(null);
                                                    }}
                                                  >
                                                    승인
                                                  </button>
                                                  <button
                                                    className="flex-1 btn btn-xs btn-error"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      if (onRefundConfirm) {
                                                        onRefundConfirm(slot.id, refundRequest.id, false);
                                                      }
                                                      setOpenRefundInfoId(null);
                                                    }}
                                                  >
                                                    거절
                                                  </button>
                                                </div>
                                              </div>
                                            </>
                                          ) : (
                                            <>
                                              <div className="flex items-center gap-2 text-green-400 mb-1">
                                                <KeenIcon icon="wallet" className="text-base" />
                                                <span className="font-medium">환불 완료</span>
                                              </div>
                                              <div>
                                                <span className="text-gray-400">환불 사유:</span>
                                                <div className="text-gray-200 mt-1">{refundRequest.refund_reason || '사유 없음'}</div>
                                              </div>
                                              {refundRequest.refund_amount && (
                                                <div>
                                                  <span className="text-gray-400">환불 금액:</span>
                                                  <div className="text-green-400 font-medium mt-1">
                                                    {refundRequest.refund_amount.toLocaleString()}원
                                                  </div>
                                                </div>
                                              )}
                                              <div className="text-gray-400 text-xs">
                                                신청일: {new Date(refundRequest.request_date).toLocaleDateString('ko-KR')}
                                              </div>
                                              {refundRequest.approval_date && (
                                                <div className="text-gray-400 text-xs">
                                                  승인일: {new Date(refundRequest.approval_date).toLocaleDateString('ko-KR')}
                                                </div>
                                              )}
                                              {refundRequest.approval_notes && (
                                                <div className="mt-2">
                                                  <span className="text-gray-400 text-xs">승인 메시지:</span>
                                                  <div className="bg-green-900/30 border border-green-700/50 rounded-md p-2 mt-1">
                                                    <div className="text-green-300 text-xs">
                                                      {refundRequest.approval_notes}
                                                    </div>
                                                  </div>
                                                </div>
                                              )}
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </>,
                                document.body
                              )}
                            </div>
                          )}
                      </div>
                    </td>

                    {/* 신청일 */}
                    {isExtraLargeScreen && (
                      <td className="py-2 px-1 md:px-2 text-center">
                        <span className="text-xs text-gray-500">
                          {new Date(item.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        </span>
                      </td>
                    )}

                    {/* 기간 */}
                    {isLargeScreen && (
                      <td className="py-2 px-1 md:px-2 text-center">
                        <div className="text-xs">
                          {item.status === 'purchased' && item.guarantee_slots?.[0]?.status === 'active' && item.guarantee_slots[0].start_date ? (
                            <>
                              <div className="text-green-600">{new Date(item.guarantee_slots[0].start_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</div>
                              <div className="text-[10px] text-red-600">~{item.guarantee_slots[0].end_date ? new Date(item.guarantee_slots[0].end_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '-'}</div>
                            </>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </div>
                      </td>
                    )}

                    {/* 남은일 */}
                    {isLargeScreen && (
                      <td className="py-2 px-1 md:px-2 text-center">
                        {(() => {
                          // 활성 슬롯의 경우 종료일 기준으로 계산
                          if (item.status === 'purchased' && item.guarantee_slots?.[0]?.status === 'active' && item.guarantee_slots[0].end_date) {
                            const days = calculateRemainingDays(item.guarantee_slots[0].end_date);
                            const colorClass = getRemainingDaysColorClass(days);
                            const text = getRemainingDaysText(days);

                            return (
                              <span className={`text-xs ${colorClass}`}>
                                {text}
                              </span>
                            );
                          }
                          return <span className="text-xs text-gray-500">-</span>;
                        })()}
                      </td>
                    )}

                    {/* 관리 */}
                    <td className="py-2 px-1 md:px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* 상세보기 버튼 - 모든 상태에서 표시 */}
                        {onDetailView && (
                          <button
                            className="btn btn-sm btn-icon btn-clear btn-primary"
                            onClick={() => onDetailView(item)}
                            title="상세보기"
                          >
                            <KeenIcon icon="information-2" />
                          </button>
                        )}

                        {(item.status === 'requested' || item.status === 'negotiating') && (
                          <button
                            className="btn btn-sm btn-icon btn-clear btn-warning"
                            onClick={() => onOpenNegotiationModal(item)}
                            title="협상"
                          >
                            <KeenIcon icon="message-programming" />
                          </button>
                        )}
                        {item.status === 'accepted' && (
                          <button
                            className="btn btn-sm btn-icon btn-clear btn-primary"
                            onClick={() => onOpenNegotiationModal(item)}
                            title="구매"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect width="20" height="14" x="2" y="5" rx="2" />
                              <line x1="2" x2="22" y1="10" y2="10" />
                            </svg>
                          </button>
                        )}
                        {item.status === 'purchased' && (
                          <>
                            {/* 환불승인 상태일 때 */}
                            {refundRequest?.status === 'approved' ? (
                              <>
                                {/* 협상 내용 확인 (이전 내역) */}
                                <button
                                  className="btn btn-sm btn-icon btn-clear btn-secondary"
                                  onClick={() => onOpenNegotiationModal(item)}
                                  title="협상 내용 확인"
                                >
                                  <KeenIcon icon="message-programming" />
                                </button>
                                {/* 1:1 문의 확인 (이전 내역) */}
                                {onInquiry && (
                                  <button
                                    className="btn btn-sm btn-icon btn-clear btn-secondary"
                                    onClick={() => onInquiry(item)}
                                    title="문의 내용 확인"
                                  >
                                    <KeenIcon icon="messages" />
                                  </button>
                                )}
                              </>
                            ) : item.guarantee_slots?.[0]?.status === 'active' ? (
                              <>
                                {/* 진행중 상태일 때 */}
                                {/* 순위 확인 버튼 */}
                                {onRankCheck && (
                                  <button
                                    className="btn btn-sm btn-icon btn-clear btn-success"
                                    onClick={() => onRankCheck(item)}
                                    title="순위 확인"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                                    </svg>
                                  </button>
                                )}
                                {/* 협상 내용 확인 (이전 내역) */}
                                <button
                                  className="btn btn-sm btn-icon btn-clear btn-secondary"
                                  onClick={() => onOpenNegotiationModal(item)}
                                  title="협상 내용 확인"
                                >
                                  <KeenIcon icon="message-programming" />
                                </button>
                                {/* 환불 요청이 없을 때만 환불 버튼 표시 */}
                                {!refundRequest && onRefundRequest && (
                                  <button
                                    className="btn btn-sm btn-icon btn-clear btn-danger"
                                    onClick={() => onRefundRequest(item.id)}
                                    title="환불"
                                  >
                                    <KeenIcon icon="wallet" />
                                  </button>
                                )}
                                {/* 1:1 문의 */}
                                {onInquiry && (
                                  <button
                                    className="btn btn-sm btn-icon btn-clear btn-primary"
                                    onClick={() => onInquiry(item)}
                                    title="1:1 문의"
                                  >
                                    <KeenIcon icon="messages" />
                                  </button>
                                )}
                              </>
                            ) : (
                              // 기타 구매완료 상태 (pending, 슬롯 없음 등)
                              <>
                                {/* 협상 내용 확인 (이전 내역) */}
                                <button
                                  className="btn btn-sm btn-icon btn-clear btn-secondary"
                                  onClick={() => onOpenNegotiationModal(item)}
                                  title="협상 내용 확인"
                                >
                                  <KeenIcon icon="message-programming" />
                                </button>
                                {/* 1:1 문의 - 슬롯이 있을 때만 표시 */}
                                {onInquiry && item.guarantee_slots?.[0] && (
                                  <button
                                    className="btn btn-sm btn-icon btn-clear btn-primary"
                                    onClick={() => onInquiry(item)}
                                    title="1:1 문의"
                                  >
                                    <KeenIcon icon="messages" />
                                  </button>
                                )}
                              </>
                            )}
                          </>
                        )}
                        {item.status === 'rejected' && (
                          <span className="text-xs text-red-500">거절됨</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 모바일 카드 뷰 */}
      <div className="block md:hidden space-y-3">
        {filteredRequests.map((item) => {
          // 환불 요청 상태 우선 확인 (모바일용)
          const refundRequest = item.guarantee_slots?.[0]?.refund_requests?.find(r => r.status === 'pending' || r.status === 'approved' || r.status === 'rejected');

          let statusInfo;
          if (refundRequest) {
            // 환불 요청 상태가 있으면 환불 상태 표시 (모든 환불 관련은 danger 색상)
            switch (refundRequest.status) {
              case 'pending':
                statusInfo = { label: '환불 검토중', color: 'badge-danger', icon: 'clock' };
                break;
              case 'approved':
                statusInfo = { label: '환불승인', color: 'badge-danger' };
                break;
              case 'rejected':
                statusInfo = { label: '환불 거절됨', color: 'badge-danger', icon: 'cross-circle' };
                break;
              default:
                statusInfo = { label: '환불 요청', color: 'badge-danger', icon: 'wallet' };
            }
          } else {
            // 환불 요청이 없으면 기존 로직
            const isSlotActive = item.status === 'purchased' && item.guarantee_slots?.[0]?.status === 'active';
            statusInfo = isSlotActive
              ? { label: '진행 중', color: 'badge-primary', icon: 'check-circle' }
              : getStatusInfo(item.status, item.type);
          }

          return (
            <div key={item.id} className="border border-border rounded-lg bg-card p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1 text-card-foreground">
                    {item.keywords?.mid || '-'}
                  </h4>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    {getCampaignLogo(item) && (
                      <img
                        src={getCampaignLogo(item)}
                        alt="캠페인 로고"
                        className="w-4 h-4 rounded object-contain bg-gray-50"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <span>{item.campaigns?.campaign_name || '-'}</span>
                    {getCampaignStatusDot(item.campaigns)}
                  </div>
                  <div className="text-xs text-gray-400 mb-1">
                    {item.keywords?.url || '-'}
                  </div>
                  {/* 키워드 정보 표시 */}
                  <div className="flex flex-wrap gap-1">
                    {(() => {
                      const keywordArray = [];
                      if (item.keywords?.main_keyword) {
                        keywordArray.push(item.keywords.main_keyword);
                      }
                      if (item.keywords?.keyword1) keywordArray.push(item.keywords.keyword1);
                      if (item.keywords?.keyword2) keywordArray.push(item.keywords.keyword2);
                      if (item.keywords?.keyword3) keywordArray.push(item.keywords.keyword3);

                      // 모바일에서는 최대 3개만 표시
                      const displayKeywords = keywordArray.slice(0, 3);

                      if (displayKeywords.length === 0) {
                        return <span className="text-xs text-muted-foreground">보장형</span>;
                      }

                      return displayKeywords.map((keyword, index) => (
                        <span key={index} className="inline-flex items-center px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded">
                          {keyword}
                        </span>
                      ));
                    })()}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`badge badge-sm ${statusInfo.color} whitespace-nowrap`}>
                    {statusInfo.icon && (
                      <KeenIcon icon={statusInfo.icon} className="mr-1 text-xs" />
                    )}
                    {statusInfo.label}
                  </span>
                  {/* 환불 검토중일 때 정보 아이콘 표시 (모바일) */}
                  {refundRequest?.status === 'pending' && (
                    <div className="relative">
                      <button
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setRefundTooltipPosition({
                            top: rect.top - 10,
                            left: rect.left + rect.width / 2
                          });
                          setOpenRefundInfoId(openRefundInfoId === item.id ? null : item.id);
                        }}
                        title="환불 정보"
                      >
                        <KeenIcon icon="information-2" className="text-sm" />
                      </button>
                      {openRefundInfoId === item.id && ReactDOM.createPortal(
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setOpenRefundInfoId(null)}
                          />
                          <div
                            className="fixed z-50 bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-100 text-xs rounded p-3 w-72 max-w-xs shadow-xl border border-gray-700 dark:border-gray-600"
                            style={{
                              left: `${refundTooltipPosition.left}px`,
                              top: `${refundTooltipPosition.top}px`,
                              transform: 'translate(-50%, -100%)'
                            }}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="font-medium text-sm flex items-center gap-2">
                                <KeenIcon icon="clock" className="text-orange-400" />
                                환불 검토 중
                              </div>
                              <button
                                className="text-gray-400 hover:text-gray-200 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenRefundInfoId(null);
                                }}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-orange-400 mb-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10" />
                                  <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <span className="font-medium">총판 검토 대기 중</span>
                              </div>
                              <div>
                                <span className="text-gray-400">환불 사유:</span>
                                <div className="text-gray-200 mt-1">{refundRequest.refund_reason || '사유 없음'}</div>
                              </div>
                              <div className="text-gray-400 text-xs">
                                신청일: {new Date(refundRequest.request_date).toLocaleDateString('ko-KR')}
                              </div>
                              <div className="bg-orange-900/30 border border-orange-700/50 rounded-md p-2 mt-2">
                                <div className="text-orange-300 text-xs">
                                  💡 총판이 검토 중입니다. 처리까지 시간이 소요될 수 있습니다.
                                </div>
                              </div>
                            </div>
                          </div>
                        </>,
                        document.body
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mb-2">
                <div>
                  <span className="text-muted-foreground">보장:</span>
                  <span className={`ml-1 font-medium ${item.campaigns?.guarantee_unit === '회' ? 'text-purple-600' : 'text-blue-600'}`}>
                    {item.guarantee_count}{item.campaigns?.guarantee_unit || '일'}
                  </span>
                </div>
                <div>
                  {item.status === 'purchased' && item.guarantee_slots?.[0]?.status === 'active' && item.guarantee_slots[0].end_date ? (
                    <>
                      <span className="text-muted-foreground">남은일:</span>
                      <span className={`ml-1 ${getRemainingDaysColorClass(calculateRemainingDays(item.guarantee_slots[0].end_date))}`}>
                        {getRemainingDaysText(calculateRemainingDays(item.guarantee_slots[0].end_date))}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-muted-foreground">상태:</span>
                      <span className="ml-1 text-card-foreground">-</span>
                    </>
                  )}
                </div>
              </div>

              {/* 기간 정보 */}
              {item.status === 'purchased' && item.guarantee_slots?.[0]?.status === 'active' && item.guarantee_slots[0].start_date && (
                <div className="text-xs mb-3">
                  <span className="text-muted-foreground">기간:</span>
                  <span className="ml-1">
                    <span className="text-green-600">{new Date(item.guarantee_slots[0].start_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                    <span className="text-muted-foreground mx-1">~</span>
                    <span className="text-red-600">{item.guarantee_slots[0].end_date ? new Date(item.guarantee_slots[0].end_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '-'}</span>
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-border">
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(item.created_at), {
                    addSuffix: true,
                    locale: ko
                  })}
                </div>
                <div className="flex gap-1">
                  {/* 상세보기 버튼 - 모든 상태에서 표시 */}
                  {onDetailView && (
                    <button
                      className="btn btn-sm btn-icon btn-clear btn-primary"
                      onClick={() => onDetailView(item)}
                      title="상세보기"
                    >
                      <KeenIcon icon="information-2" />
                    </button>
                  )}

                  {(item.status === 'requested' || item.status === 'negotiating') && (
                    <button
                      className="btn btn-sm btn-icon btn-clear btn-warning"
                      onClick={() => onOpenNegotiationModal(item)}
                      title="협상"
                    >
                      <KeenIcon icon="message-programming" />
                    </button>
                  )}
                  {item.status === 'accepted' && (
                    <button
                      className="btn btn-sm btn-icon btn-clear btn-primary"
                      onClick={() => onOpenNegotiationModal(item)}
                      title="구매"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="20" height="14" x="2" y="5" rx="2" />
                        <line x1="2" x2="22" y1="10" y2="10" />
                      </svg>
                    </button>
                  )}
                  {item.status === 'purchased' && (
                    <>
                      {item.guarantee_slots?.[0]?.status === 'active' ? (
                        <>
                          {/* 순위 확인 버튼 */}
                          {onRankCheck && (
                            <button
                              className="btn btn-sm btn-icon btn-clear btn-success"
                              onClick={() => onRankCheck(item)}
                              title="순위 확인"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                              </svg>
                            </button>
                          )}
                          {/* 환불 요청이 없을 때만 환불 버튼 표시 (모바일) */}
                          {!refundRequest && onRefundRequest && (
                            <button
                              className="btn btn-sm btn-icon btn-clear btn-danger"
                              onClick={() => onRefundRequest(item.id)}
                              title="환불"
                            >
                              <KeenIcon icon="wallet" />
                            </button>
                          )}
                          {onInquiry && (
                            <button
                              className="btn btn-sm btn-icon btn-clear btn-primary"
                              onClick={() => onInquiry(item)}
                              title="1:1 문의"
                            >
                              <KeenIcon icon="messages" />
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-green-600 font-medium">구매완료</span>
                      )}
                    </>
                  )}
                  {item.status === 'rejected' && (
                    <span className="text-xs text-red-500">거절됨</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};