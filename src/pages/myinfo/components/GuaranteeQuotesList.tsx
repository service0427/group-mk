import React, { useState } from 'react';
import { KeenIcon } from '@/components';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { GuaranteeSlotRequestStatus } from '@/types/guarantee-slot.types';

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
  // 슬롯 필드
  guarantee_type?: string;
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
  };
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
}

export const GuaranteeQuotesList: React.FC<GuaranteeQuotesListProps> = ({
  filteredRequests,
  isLoading,
  error,
  onOpenNegotiationModal,
  hasFilters = false,
  selectedRequests = [],
  onSelectedRequestsChange,
  showBulkActions = false
}) => {
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
    // 캠페인 로고가 있으면 우선 사용
    if (item.campaigns?.logo) {
      if (!item.campaigns.logo.startsWith('http') && !item.campaigns.logo.startsWith('/')) {
        return `/media/${item.campaigns.logo}`;
      }
      return item.campaigns.logo;
    }

    // 없으면 서비스 타입에 따른 기본 로고 사용
    const service = item.service_type || '';
    if (service.includes('naver') || service.includes('Naver')) {
      return '/media/ad-brand/naver-ci.png';
    } else if (service.includes('coupang') || service.includes('Coupang')) {
      return '/media/ad-brand/coupang-app.png';
    } else if (service.includes('ohouse')) {
      return '/media/ad-brand/ohouse.png';
    }

    return '/media/app/mini-logo-circle-gray.svg';
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
          return { label: '진행 중', color: 'badge-success', icon: 'check-circle' };
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

  // 남은 일수 계산
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

  // 남은 일수 표시
  const getRemainingDaysText = (days: number | null): string => {
    if (days === null) return '-';
    if (days < 0) return '마감';
    if (days === 0) return '오늘';
    return `${days}일`;
  };

  // 남은 일수 색상
  const getRemainingDaysColor = (days: number | null): string => {
    if (days === null) return 'text-gray-400';
    if (days < 0) return 'text-gray-500';
    if (days === 0) return 'text-red-600 font-bold';
    if (days <= 3) return 'text-orange-500 font-semibold';
    if (days <= 7) return 'text-yellow-600';
    return 'text-gray-700 dark:text-gray-300';
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
          <span>견적 내역을 불러오는 중...</span>
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
          <table className="table align-middle text-sm w-full text-left border-separate border-spacing-0 table-fixed">
            <thead>
              <tr className="bg-muted dark:bg-gray-800/60">
                {showBulkActions && (
                  <th className="py-2 px-3 text-center font-medium text-xs w-[8%]">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm checkbox-primary"
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
                    </div>
                  </th>
                )}
                <th className="py-2 px-3 text-start font-medium text-xs w-[15%]">상품명</th>
                <th className="py-2 px-3 text-center font-medium text-xs w-[12%]">키워드</th>
                <th className="py-2 px-3 text-center font-medium text-xs w-[10%]">캠페인</th>
                <th className="py-2 px-3 text-center font-medium text-xs w-[8%]">상태</th>
                <th className="py-2 px-3 text-center font-medium text-xs w-[8%]">협상신청일</th>
                <th className="py-2 px-3 text-center font-medium text-xs w-[8%]">마감일</th>
                <th className="py-2 px-3 text-center font-medium text-xs w-[6%]">남은일</th>
                <th className="py-2 px-3 text-center font-medium text-xs w-[8%]">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((item) => {
                const statusInfo = getStatusInfo(item.status, item.type);
                
                return (
                  <tr key={item.id} className="border-b border-border hover:bg-muted/40">
                    {/* 체크박스 */}
                    {showBulkActions && (
                      <td className="py-2 px-3 text-center w-[8%]">
                        <div className="flex items-center justify-center">
                          {(item.status === 'requested' || item.status === 'negotiating') && (
                            <input
                              type="checkbox"
                              className="checkbox checkbox-sm checkbox-primary"
                              checked={selectedRequests.includes(item.id)}
                              onChange={() => handleRequestSelect(item.id)}
                            />
                          )}
                        </div>
                      </td>
                    )}
                    
                    {/* 상품명 */}
                    <td className="py-2 px-3 w-[15%]">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                          {item.keywords?.mid || '-'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {item.keywords?.url || '-'}
                        </div>
                      </div>
                    </td>
                    
                    {/* 키워드 */}
                    <td className="py-2 px-3 text-center w-[12%]">
                      <div className="flex items-center justify-center gap-1 relative">
                        {(() => {
                          // 사용자가 신청한 키워드 정보 가져오기
                          const keywordArray = [];
                          if (item.keywords?.main_keyword) {
                            keywordArray.push(item.keywords.main_keyword);
                          }
                          if (item.keywords?.keyword1) keywordArray.push(item.keywords.keyword1);
                          if (item.keywords?.keyword2) keywordArray.push(item.keywords.keyword2);
                          if (item.keywords?.keyword3) keywordArray.push(item.keywords.keyword3);

                          if (keywordArray.length === 0) {
                            return <span className="text-gray-400 text-sm">보장형</span>;
                          }

                          const mainKeyword = keywordArray[0];
                          const additionalCount = keywordArray.length - 1;

                          return (
                            <>
                              <span className="text-gray-900 dark:text-gray-100 font-medium text-sm">
                                {mainKeyword}
                              </span>
                              {additionalCount > 0 && (
                                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium bg-primary text-white rounded-full min-w-[20px] h-5">
                                  +{additionalCount}
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </td>
                    
                    {/* 캠페인 */}
                    <td className="py-2 px-3 text-center w-[10%]">
                      <div className="flex items-center justify-center gap-1 min-w-0">
                        <img
                          src={getCampaignLogo(item)}
                          alt="campaign logo"
                          className="w-4 h-4 object-contain rounded flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/media/app/mini-logo-circle-gray.svg';
                          }}
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                          {item.campaigns?.campaign_name || '-'}
                        </span>
                      </div>
                    </td>
                    
                    {/* 상태 */}
                    <td className="py-2 px-3 text-center w-[8%]">
                      <span className={`badge badge-sm ${statusInfo.color} whitespace-nowrap`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    
                    {/* 협상신청일 */}
                    <td className="py-2 px-3 text-center w-[8%]">
                      <span className="text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </span>
                    </td>
                    
                    {/* 마감일 */}
                    <td className="py-2 px-3 text-center w-[8%]">
                      <span className="text-xs text-gray-500">
                        {item.end_date ? 
                          new Date(item.end_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) :
                          '-'
                        }
                      </span>
                    </td>
                    
                    {/* 남은일 */}
                    <td className="py-2 px-3 text-center w-[6%]">
                      <span className="text-xs text-gray-500">
                        {(() => {
                          if (!item.end_date) return '-';
                          const today = new Date();
                          const endDate = new Date(item.end_date);
                          const diffTime = endDate.getTime() - today.getTime();
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          
                          if (diffDays < 0) return '마감';
                          if (diffDays === 0) return '오늘';
                          return `${diffDays}일`;
                        })()}
                      </span>
                    </td>
                    
                    {/* 관리 */}
                    <td className="py-2 px-3 text-center w-[8%]">
                      <div className="flex items-center justify-center gap-2">
                        {item.status === 'negotiating' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenNegotiationModal(item)}
                            className="text-xs"
                          >
                            <KeenIcon icon="message-programming" className="size-3 mr-1" />
                            협상
                          </Button>
                        )}
                        {item.status === 'accepted' && (
                          <Button
                            size="sm"
                            onClick={() => onOpenNegotiationModal(item)}
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                              <rect width="20" height="14" x="2" y="5" rx="2"/>
                              <line x1="2" x2="22" y1="10" y2="10"/>
                            </svg>
                            구매
                          </Button>
                        )}
                        {item.status === 'purchased' && (
                          <span className="text-xs text-green-600 font-medium">구매완료</span>
                        )}
                        {item.status === 'rejected' && (
                          <span className="text-xs text-red-500">거절됨</span>
                        )}
                        {item.status === 'requested' && (
                          <span className="text-xs text-gray-500">대기중</span>
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
      <div className="block md:hidden space-y-4">
        {filteredRequests.map((item) => {
          const statusInfo = getStatusInfo(item.status, item.type);
          
          return (
            <div key={item.id} className="border border-border rounded-lg bg-card p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1 text-card-foreground">
                    {item.keywords?.mid || '-'}
                  </h4>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <img
                      src={getCampaignLogo(item)}
                      alt="캠페인 로고"
                      className="w-4 h-4 rounded object-contain bg-gray-50"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/media/app/mini-logo-circle-gray.svg';
                      }}
                    />
                    <span>{item.campaigns?.campaign_name || '-'}</span>
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
                <span className={`badge badge-sm ${statusInfo.color} whitespace-nowrap`}>
                  <KeenIcon icon={statusInfo.icon} className="mr-1 text-xs" />
                  {statusInfo.label}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                <div>
                  <span className="text-muted-foreground">목표순위:</span>
                  <span className="ml-1 font-medium text-card-foreground">{item.target_rank}위</span>
                </div>
                <div>
                  <span className="text-muted-foreground">보장일수:</span>
                  <span className="ml-1 text-card-foreground">{item.guarantee_count}일</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t border-border">
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(item.created_at), { 
                    addSuffix: true, 
                    locale: ko 
                  })}
                </div>
                <div>
                  {item.status === 'negotiating' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenNegotiationModal(item)}
                      className="text-xs"
                    >
                      <KeenIcon icon="message-programming" className="size-3 mr-1" />
                      협상
                    </Button>
                  )}
                  {item.status === 'accepted' && (
                    <Button
                      size="sm"
                      onClick={() => onOpenNegotiationModal(item)}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                        <rect width="20" height="14" x="2" y="5" rx="2"/>
                        <line x1="2" x2="22" y1="10" y2="10"/>
                      </svg>
                      구매
                    </Button>
                  )}
                  {item.status === 'purchased' && (
                    <span className="text-xs text-green-600 font-medium">구매완료</span>
                  )}
                  {item.status === 'rejected' && (
                    <span className="text-xs text-red-500">거절됨</span>
                  )}
                  {item.status === 'requested' && (
                    <span className="text-xs text-muted-foreground">대기중</span>
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