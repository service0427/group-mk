import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuthContext } from '@/auth';
import { useCustomToast } from '@/hooks/useCustomToast';
import { guaranteeSlotRequestService, guaranteeSlotService } from '@/services/guaranteeSlotService';
import { supabase } from '@/supabase';
import { KeenIcon, LucideRefreshIcon } from '@/components';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GuaranteeNegotiationModal } from '@/components/campaign-modals/GuaranteeNegotiationModal';
import { GuaranteeQuotesList } from './GuaranteeQuotesList';
import GuaranteeRefundModal from '@/components/guarantee-slots/GuaranteeRefundModal';
import GuaranteeSlotDetailModal from '@/components/guarantee-slots/GuaranteeSlotDetailModal';
import GuaranteeRankCheckModal from '@/components/guarantee-slots/GuaranteeRankCheckModal';
import type { GuaranteeSlotRequestStatus } from '@/types/guarantee-slot.types';
import { USER_ROLES, hasPermission, PERMISSION_GROUPS } from '@/config/roles.config';
import { InquiryChatModal } from '@/components/inquiry';
import { smartCeil } from '@/utils/mathUtils';

// 타입 정의
interface MyGuaranteeQuoteRequest {
  id: string;
  campaign_id: number;
  user_id: string;
  distributor_id?: string;
  target_rank: number;
  guarantee_count: number;
  guarantee_period?: number;
  initial_budget?: number;
  status: GuaranteeSlotRequestStatus;
  final_daily_amount?: number;
  final_total_amount?: number;
  keyword_id?: number;
  input_data?: Record<string, any>;
  start_date?: string;
  end_date?: string;
  quantity?: number;
  user_reason?: string;
  additional_requirements?: string;
  created_at: string;
  updated_at: string;
  // 조인된 데이터
  campaigns?: {
    id: number;
    campaign_name: string;
    service_type: string;
    guarantee_unit?: string;
    logo?: string;
    status?: string;
    refund_settings?: any;
  };
  keywords?: {
    id: number;
    main_keyword: string;
    keyword1?: string;
    keyword2?: string;
    keyword3?: string;
    url?: string;
    mid?: string;
  };
  guarantee_slots?: Array<{
    id: string;
    status: 'pending' | 'active' | 'completed' | 'cancelled' | 'rejected';
    approved_at?: string;
    approved_by?: string;
    rejected_at?: string;
    rejected_by?: string;
    rejection_reason?: string;
    start_date?: string;
    end_date?: string;
    created_at: string;
    updated_at: string;
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

interface MyGuaranteeQuotesContentProps {
  selectedService?: string | null;
}

export const MyGuaranteeQuotesContent: React.FC<MyGuaranteeQuotesContentProps> = ({ selectedService }) => {
  const { currentUser, loading: authLoading, userRole } = useAuthContext();
  const { showSuccess, showError } = useCustomToast();

  const [requests, setRequests] = useState<MyGuaranteeQuoteRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchStatus, setSearchStatus] = useState<string>('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | 'all'>('all');
  const [searchDateFrom, setSearchDateFrom] = useState<string>('');
  const [searchDateTo, setSearchDateTo] = useState<string>('');
  const [negotiationModal, setNegotiationModal] = useState<{
    open: boolean;
    requestId: string;
    requestData?: MyGuaranteeQuoteRequest;
  }>({
    open: false,
    requestId: ''
  });

  // 환불 모달 상태
  const [refundModal, setRefundModal] = useState<{
    open: boolean;
    requestData?: MyGuaranteeQuoteRequest;
  }>({
    open: false
  });

  // 선택 관련 상태
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  
  // 페이지네이션 상태
  const [limit, setLimit] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // 견적 요청 목록 조회
  const fetchRequests = useCallback(async () => {
    if (!currentUser?.id || authLoading) return;

    try {
      setLoading(true);
      // 일시적으로 요청 목록을 비워 트랜지션 효과 적용
      setRequests([]);

      let query = supabase
        .from('guarantee_slot_requests')
        .select(`
          *,
          input_data,
          campaigns:campaign_id(
            id,
            campaign_name,
            service_type,
            guarantee_unit,
            logo,
            status,
            refund_settings
          ),
          keywords:keyword_id(
            id,
            main_keyword,
            keyword1,
            keyword2,
            keyword3,
            url,
            mid
          ),
          guarantee_slots(*)
        `)
        .order('created_at', { ascending: false });

      // 개발자가 아닌 경우에만 사용자 필터 적용
      if (userRole !== USER_ROLES.DEVELOPER) {
        query = query.eq('user_id', currentUser.id);
      }

      // 선택된 서비스가 있으면 해당 서비스의 캠페인만 필터링
      if (selectedService) {
        // service_type 형식 변환 (kebab-case를 PascalCase로)
        const serviceType = selectedService
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join('');


        // 캠페인 테이블에서 해당 service_type을 가진 캠페인 ID들을 먼저 조회
        const { data: campaigns, error: campaignError } = await supabase
          .from('campaigns')
          .select('id, campaign_name, logo, status, service_type')
          .eq('service_type', serviceType);

        if (campaignError) throw campaignError;

        if (campaigns && campaigns.length > 0) {
          const campaignIds = campaigns.map(c => c.id);
          query = query.in('campaign_id', campaignIds);
        } else {
          // 해당 서비스의 캠페인이 없으면 빈 배열 반환
          setRequests([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      setRequests(data || []);
    } catch (error) {
      showError('보장형 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, authLoading, showError, selectedService, userRole]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // 캠페인 목록 생성
  const campaignList = useMemo(() => {
    const uniqueCampaigns = new Map();
    requests.forEach(request => {
      if (request.campaigns) {
        uniqueCampaigns.set(request.campaigns.id, {
          id: request.campaigns.id,
          campaignName: request.campaigns.campaign_name
        });
      }
    });
    return Array.from(uniqueCampaigns.values());
  }, [requests]);

  // 보장형 견적 요청 목록을 통합 형태로 변환
  const guaranteeItems = useMemo(() => {
    return requests.map(request => ({
      ...request,
      type: 'request' as const,
      id: request.id,
      title: request.campaigns?.campaign_name || '캠페인 정보 없음',
      service_type: request.campaigns?.service_type,
      campaigns: request.campaigns, // 캠페인 정보 전체 전달
      keywords: request.keywords, // 키워드 정보 전체 전달
      input_data: request.input_data, // input_data 전달 추가
      status: request.status,
      created_at: request.created_at,
      campaign_id: request.campaign_id,
      distributor_id: request.distributor_id,
      // 견적 요청 전용 필드
      target_rank: request.target_rank,
      guarantee_count: request.guarantee_count,
      initial_budget: request.initial_budget,
      final_daily_amount: request.final_daily_amount,
      start_date: request.start_date,
      end_date: request.end_date,
      // 보장형 슬롯 정보
      guarantee_slots: request.guarantee_slots
    }));
  }, [requests]);

  // 검색 필터링
  const filteredItems = useMemo(() => {
    return guaranteeItems.filter(item => {
      const matchesSearch = !searchTerm ||
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.service_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.keywords?.main_keyword?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.keywords?.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.keywords?.mid || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !searchStatus || item.status === searchStatus;

      const matchesCampaign = selectedCampaignId === 'all' ||
        item.campaigns?.id === selectedCampaignId;

      const matchesDateFrom = !searchDateFrom ||
        new Date(item.created_at) >= new Date(searchDateFrom);

      const matchesDateTo = !searchDateTo ||
        new Date(item.created_at) <= new Date(searchDateTo + 'T23:59:59');

      return matchesSearch && matchesStatus && matchesCampaign &&
        matchesDateFrom && matchesDateTo;
    });
  }, [guaranteeItems, searchTerm, searchStatus, selectedCampaignId, searchDateFrom, searchDateTo]);

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    if (page < 1 || page > getTotalPages()) return;
    setCurrentPage(page);
  };

  // 페이지당 표시 수 변경 핸들러
  const handleChangeLimit = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(e.target.value);
    setLimit(newLimit);
    setCurrentPage(1); // 페이지당 표시 수 변경 시 첫 페이지로 이동
  };

  // 전체 페이지 수 계산
  const getTotalPages = () => {
    return Math.max(1, Math.ceil(totalItems / limit));
  };

  // 표시 범위 계산
  const getDisplayRange = () => {
    if (totalItems === 0) return "0-0 / 0";
    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, totalItems);
    return `${start}-${end} / ${totalItems}`;
  };

  // 페이지네이션이 적용된 아이템 목록
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * limit;
    const end = start + limit;
    return filteredItems.slice(start, end);
  }, [filteredItems, currentPage, limit]);

  // 필터링된 아이템 개수가 변경될 때 totalItems 업데이트
  useEffect(() => {
    setTotalItems(filteredItems.length);
  }, [filteredItems]);

  // 검색 조건이 변경될 때 페이지를 1로 재설정
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, searchStatus, selectedCampaignId, searchDateFrom, searchDateTo, selectedService]);

  // 검색 핸들러
  const handleSearch = useCallback(() => {
    // 검색 버튼 클릭 시 로직 (현재는 실시간 필터링이므로 별도 처리 불필요)
  }, []);

  // 협상 모달 열기
  const openNegotiationModal = (item: any) => {
    // GuaranteeItem 생성 시 원본 데이터를 보존하도록 수정
    const originalRequest = requests.find(req => req.id === item.id);
    if (originalRequest) {
      setNegotiationModal({
        open: true,
        requestId: item.id,
        requestData: originalRequest
      });
    }
  };

  // 협상 모달 닫기
  const closeNegotiationModal = () => {
    setNegotiationModal({
      open: false,
      requestId: ''
    });
  };

  // 상태 변경 핸들러
  const handleStatusChange = (status: GuaranteeSlotRequestStatus) => {
    // 상태 변경 시 목록 새로고침
    fetchRequests();
  };

  // 문의 모달 상태
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [inquiryData, setInquiryData] = useState<{
    slotId?: string;
    guaranteeSlotId?: string;
    campaignId?: number;
    distributorId?: string;
    title?: string;
  } | null>(null);

  // 상세 모달 상태
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailRequestId, setDetailRequestId] = useState<string | null>(null);

  // 순위 확인 모달 상태
  const [rankCheckModalOpen, setRankCheckModalOpen] = useState(false);
  const [rankCheckSlotData, setRankCheckSlotData] = useState<{
    slotId: string;
    campaignName?: string;
    targetRank?: number;
    keyword?: string;
  } | null>(null);

  // 환불 요청 핸들러
  const handleRefundRequest = (requestId: string) => {
    const request = requests.find(req => req.id === requestId);
    if (!request || !request.guarantee_slots?.[0]) {
      showError('슬롯 정보를 찾을 수 없습니다.');
      return;
    }

    setRefundModal({
      open: true,
      requestData: request
    });
  };

  // 환불 확인 핸들러
  const handleRefundConfirm = async (reason: string) => {
    if (!refundModal.requestData || !refundModal.requestData.guarantee_slots?.[0] || !currentUser?.id) return;

    try {
      const slotId = refundModal.requestData.guarantee_slots[0].id;

      // 실제 환불 신청 API 호출
      const { data, error } = await guaranteeSlotService.requestRefund(slotId, currentUser.id, reason);

      if (error) {
        throw error;
      }

      // 성공 메시지 표시
      showSuccess(data?.message || '환불 신청이 접수되었습니다.');

      // 모달 닫기 및 리프레시
      setRefundModal({ open: false });
      fetchRequests();
    } catch (error: any) {
      console.error('환불 신청 실패:', error);
      showError(error.message || '환불 신청 중 오류가 발생했습니다.');
    }
  };

  // 총판 환불 요청 확인/거절 핸들러
  const handleRefundConfirmRequest = async (slotId: string, refundRequestId: string, approve: boolean) => {
    if (!currentUser?.id) return;

    try {
      // 환불 요청 승인/거절 API 호출
      const { data, error } = await guaranteeSlotService.confirmRefundRequest(
        slotId, 
        refundRequestId, 
        currentUser.id, 
        approve
      );

      if (error) {
        throw error;
      }

      // 성공 메시지 표시
      showSuccess(data?.message || (approve ? '환불이 승인되었습니다.' : '환불이 거절되었습니다.'));

      // 리프레시
      fetchRequests();
    } catch (error: any) {
      console.error('환불 확인 실패:', error);
      showError(error.message || '환불 확인 중 오류가 발생했습니다.');
    }
  };

  if (authLoading || loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="flex items-center gap-3 text-gray-500">
              <KeenIcon icon="loading" className="animate-spin" />
              <span>견적 내역을 불러오는 중...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 선택된 서비스가 없을 때 표시
  if (!selectedService) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <KeenIcon icon="information-3" className="text-5xl text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">서비스를 선택해주세요</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 선택된 서비스의 보장형 요청이 없을 때
  if (!loading && requests.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <KeenIcon icon="information-3" className="text-5xl text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground mb-2">선택한 서비스의 보장형 견적 요청이 없습니다</p>
            <p className="text-sm text-muted-foreground">상단의 다른 서비스를 선택하거나 새로운 보장형 견적을 요청해보세요</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* 검색 카드 */}
      <Card inert={negotiationModal.open ? '' : undefined}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-sm sm:text-base font-medium">보장형 슬롯 검색</h3>
          </div>

          {/* 데스크톱 검색 폼 */}
          <div className="hidden md:block space-y-4">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-4">
                <div className="flex items-center h-9">
                  <label className="text-sm text-gray-700 dark:text-gray-300 font-medium min-w-[60px] lg:min-w-[80px]">캠페인</label>
                  <select
                    className="select select-bordered select-sm w-full"
                    value={selectedCampaignId}
                    onChange={(e) => setSelectedCampaignId(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                    disabled={negotiationModal.open}
                  >
                    <option value="all">전체</option>
                    {campaignList.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.campaignName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-span-3">
                <div className="flex items-center h-9">
                  <label className="text-sm text-gray-700 dark:text-gray-300 font-medium min-w-[60px] lg:min-w-[80px]">상태</label>
                  <select
                    className="select select-bordered select-sm w-full"
                    value={searchStatus}
                    onChange={(e) => setSearchStatus(e.target.value)}
                    disabled={negotiationModal.open}
                  >
                    <option value="">전체</option>
                    <option value="requested">견적 요청</option>
                    <option value="negotiating">협상 중</option>
                    <option value="accepted">협상 완료</option>
                    <option value="rejected">거절됨</option>
                    <option value="expired">만료됨</option>
                  </select>
                </div>
              </div>
              <div className="col-span-5">
                <div className="flex items-center h-9">
                  <label className="text-sm text-gray-700 dark:text-gray-300 font-medium min-w-[60px] lg:min-w-[80px]">검색어</label>
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full"
                    placeholder="캠페인명, 키워드, URL, MID 검색"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={negotiationModal.open}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-7">
                <div className="flex items-center h-9">
                  <label className="text-sm text-gray-700 dark:text-gray-300 font-medium min-w-[60px] lg:min-w-[80px]">등록일</label>
                  <div className="flex items-center gap-2 w-full">
                    <input
                      type="date"
                      className="input input-bordered input-sm flex-1"
                      value={searchDateFrom}
                      onChange={(e) => setSearchDateFrom(e.target.value)}
                      disabled={negotiationModal.open}
                    />
                    <span className="text-sm">~</span>
                    <input
                      type="date"
                      className="input input-bordered input-sm flex-1"
                      value={searchDateTo}
                      onChange={(e) => setSearchDateTo(e.target.value)}
                      disabled={negotiationModal.open}
                    />
                  </div>
                </div>
              </div>
              <div className="col-span-5 flex justify-end">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSearch}
                  className="btn-primary bg-primary hover:bg-primary/90"
                  disabled={negotiationModal.open}
                >
                  <KeenIcon icon="magnifier" className="size-4" />
                  검색
                </Button>
              </div>
            </div>
          </div>

          {/* 모바일 검색 폼 */}
          <div className="block md:hidden space-y-3">
            <select
              className="select select-bordered select-sm w-full"
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              disabled={negotiationModal.open}
            >
              <option value="all">전체 캠페인</option>
              {campaignList.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.campaignName}
                </option>
              ))}
            </select>

            <select
              className="select select-bordered select-sm w-full"
              value={searchStatus}
              onChange={(e) => setSearchStatus(e.target.value)}
              disabled={negotiationModal.open}
            >
              <option value="">전체 상태</option>
              <option value="requested">견적 요청</option>
              <option value="negotiating">협상 중</option>
              <option value="accepted">협상 완료</option>
              <option value="rejected">거절됨</option>
              <option value="expired">만료됨</option>
            </select>

            <input
              type="text"
              className="input input-bordered input-sm w-full"
              placeholder="캠페인명, 키워드, URL, MID 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={negotiationModal.open}
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                className="input input-bordered input-sm"
                value={searchDateFrom}
                onChange={(e) => setSearchDateFrom(e.target.value)}
                disabled={negotiationModal.open}
              />
              <input
                type="date"
                className="input input-bordered input-sm"
                value={searchDateTo}
                onChange={(e) => setSearchDateTo(e.target.value)}
                disabled={negotiationModal.open}
              />
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={handleSearch}
              className="btn-primary w-full bg-primary hover:bg-primary/90"
              disabled={negotiationModal.open}
            >
              <KeenIcon icon="magnifier" className="size-4" />
              검색
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 견적 목록 카드 */}
      <div className="card shadow-sm" inert={negotiationModal.open ? '' : undefined}>
        {/* 보장형 서비스 안내 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-800/50 rounded-full flex items-center justify-center">
              <KeenIcon icon="information-2" className="text-blue-600 dark:text-blue-400 size-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                보장형 서비스 안내
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                견적 요청 후 <span className="font-semibold">48시간 내</span>에 총판에서 응답드립니다.
                <span className="font-semibold"> 협상 완료 후 구매하면 총판 승인 후 슬롯이 활성화됩니다.</span>
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                협상 중인 견적은 협상하기 버튼을 통해 진행상황을 확인할 수 있습니다. 활성 슬롯은 환불 신청이 가능합니다.
              </p>
            </div>
          </div>
        </div>

        <div className="card-header px-4 sm:px-6 py-3 sm:py-3.5" style={{ minHeight: '60px' }}>
          <div className="flex items-center justify-between w-full h-full">
            <div className="flex items-center gap-2 sm:gap-3">
              <h3 className="card-title text-sm sm:text-base">보장형 슬롯 목록</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchRequests}
                disabled={loading}
                className="gap-2"
              >
                <LucideRefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <div className="card-toolbar">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  전체 <span className="text-primary font-medium">{filteredItems.length}</span> 건
                </span>
                {(!!searchTerm || !!searchStatus || selectedCampaignId !== 'all' || !!searchDateFrom || !!searchDateTo) && <span className="text-gray-500 text-xs">(필터 적용됨)</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="card-body px-4 sm:px-6 py-3 sm:py-4">
          <GuaranteeQuotesList
            filteredRequests={paginatedItems}
            isLoading={loading}
            error={null}
            onOpenNegotiationModal={openNegotiationModal}
            hasFilters={!!searchTerm || !!searchStatus || selectedCampaignId !== 'all' || !!searchDateFrom || !!searchDateTo}
            selectedRequests={selectedRequests}
            onSelectedRequestsChange={setSelectedRequests}
            showBulkActions={true}
            onRefundRequest={handleRefundRequest}
            onInquiry={(request) => {
              setInquiryData({
                guaranteeSlotId: request.guarantee_slots?.[0]?.id,
                campaignId: request.campaigns?.id || request.campaign_id,
                distributorId: request.distributor_id,
                title: `보장형 슬롯 문의: ${request.campaigns?.campaign_name || '캠페인'}`
              });
              setInquiryModalOpen(true);
            }}
            onDetailView={(request) => {
              setDetailRequestId(request.id);
              setDetailModalOpen(true);
            }}
            onRankCheck={(request) => {
              if (request.guarantee_slots?.[0]?.status === 'active') {
                setRankCheckSlotData({
                  slotId: request.guarantee_slots[0].id,
                  campaignName: request.campaigns?.campaign_name,
                  targetRank: request.target_rank,
                  keyword: request.keywords?.main_keyword || request.input_data?.mainKeyword
                });
                setRankCheckModalOpen(true);
              }
            }}
            onRefundConfirm={handleRefundConfirmRequest}
          />
          {/* 페이지네이션 컨트롤 */}
          {totalItems > 0 && (
            <div className="card-footer p-6 flex flex-col md:flex-row justify-between items-center gap-4">
              {/* 왼쪽: 페이지당 표시 수 선택 (데스크탑만) */}
              <div className="hidden md:flex items-center gap-3 order-2 md:order-1 min-w-[200px]">
                <span className="text-sm text-muted-foreground whitespace-nowrap">페이지당 표시:</span>
                <select 
                  className="select select-sm select-bordered flex-grow min-w-[100px]" 
                  name="perpage"
                  value={limit}
                  onChange={handleChangeLimit}
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>

              {/* 오른쪽: 페이지 정보 및 네비게이션 버튼 */}
              <div className="flex items-center gap-3 order-1 md:order-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">{getDisplayRange()}</span>
                <div className="flex">
                  <button 
                    className="btn btn-icon btn-sm btn-light rounded-r-none border-r-0"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button 
                    className="btn btn-icon btn-sm btn-light rounded-l-none"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= getTotalPages()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 협상 모달 */}
      <GuaranteeNegotiationModal
        open={negotiationModal.open}
        onClose={closeNegotiationModal}
        requestId={negotiationModal.requestId}
        requestData={negotiationModal.requestData}
        currentUserRole="user"
        onStatusChange={handleStatusChange}
        isFromDistributorPage={false}
      />

      {/* 환불 모달 */}
      <GuaranteeRefundModal
        isOpen={refundModal.open}
        onClose={() => setRefundModal({ open: false })}
        onConfirm={handleRefundConfirm}
        campaignName={refundModal.requestData?.campaigns?.campaign_name}
        campaignLogo={refundModal.requestData?.campaigns?.logo}
        serviceType={refundModal.requestData?.campaigns?.service_type}
        slotStatus={refundModal.requestData?.guarantee_slots?.[0]?.status}
        guaranteeCount={refundModal.requestData?.guarantee_count || 0}
        guaranteeUnit={refundModal.requestData?.campaigns?.guarantee_unit}
        completedDays={(() => {
          if (!refundModal.requestData?.guarantee_slots?.[0]?.start_date) return 0;
          const start = new Date(refundModal.requestData.guarantee_slots[0].start_date);
          const today = new Date();
          return Math.max(0, Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        })()}
        totalAmount={refundModal.requestData?.final_daily_amount ?
          smartCeil(refundModal.requestData.final_daily_amount * (refundModal.requestData.guarantee_count || 0) * 1.1) : 0}
        negotiatedAmount={refundModal.requestData?.final_total_amount || (refundModal.requestData?.final_daily_amount ? 
          refundModal.requestData.final_daily_amount * refundModal.requestData.guarantee_count : 0)}
        startDate={refundModal.requestData?.guarantee_slots?.[0]?.start_date}
        endDate={refundModal.requestData?.guarantee_slots?.[0]?.end_date}
        actualCompletedCount={0}
        refundSettings={refundModal.requestData?.campaigns?.refund_settings}
        currentUserRole="user"
      />

      {/* 1:1 문의 모달 */}
      <InquiryChatModal
        open={inquiryModalOpen}
        onClose={() => {
          setInquiryModalOpen(false);
          setInquiryData(null);
        }}
        slotId={inquiryData?.slotId}
        guaranteeSlotId={inquiryData?.guaranteeSlotId}
        campaignId={inquiryData?.campaignId}
        distributorId={inquiryData?.distributorId}
        initialTitle={inquiryData?.title}
      />

      {/* 상세 보기 모달 */}
      <GuaranteeSlotDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setDetailRequestId(null);
        }}
        requestId={detailRequestId || ''}
      />

      {/* 순위 확인 모달 */}
      <GuaranteeRankCheckModal
        isOpen={rankCheckModalOpen}
        onClose={() => {
          setRankCheckModalOpen(false);
          setRankCheckSlotData(null);
        }}
        slotId={rankCheckSlotData?.slotId || ''}
        campaignName={rankCheckSlotData?.campaignName}
        targetRank={rankCheckSlotData?.targetRank || 1}
        keyword={rankCheckSlotData?.keyword}
      />

      {/* 환불 모달 */}
      {refundModal.requestData && refundModal.requestData.guarantee_slots?.[0] && (
        <GuaranteeRefundModal
          isOpen={refundModal.open}
          onClose={() => setRefundModal({ open: false })}
          onConfirm={handleRefundConfirm}
          campaignName={refundModal.requestData.campaigns?.campaign_name}
          campaignLogo={refundModal.requestData.campaigns?.logo}
          serviceType={refundModal.requestData.campaigns?.service_type}
          slotStatus={refundModal.requestData.guarantee_slots[0].status}
          guaranteeCount={refundModal.requestData.guarantee_count}
          guaranteeUnit={refundModal.requestData.campaigns?.guarantee_unit}
          completedDays={0} // TODO: 실제 완료일수 계산 필요
          totalAmount={refundModal.requestData.final_daily_amount ? smartCeil(refundModal.requestData.final_daily_amount * refundModal.requestData.guarantee_count * 1.1) : 0}
          negotiatedAmount={refundModal.requestData.final_total_amount || (refundModal.requestData.final_daily_amount ? refundModal.requestData.final_daily_amount * refundModal.requestData.guarantee_count : 0)}
          startDate={refundModal.requestData.guarantee_slots[0].start_date}
          endDate={refundModal.requestData.guarantee_slots[0].end_date}
          refundSettings={refundModal.requestData.campaigns?.refund_settings}
          currentUserRole="user"
        />
      )}
    </>
  );
};