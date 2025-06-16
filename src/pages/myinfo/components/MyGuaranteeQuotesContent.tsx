import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuthContext } from '@/auth';
import { useCustomToast } from '@/hooks/useCustomToast';
import { guaranteeSlotRequestService } from '@/services/guaranteeSlotService';
import { supabase } from '@/supabase';
import { KeenIcon } from '@/components';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GuaranteeNegotiationModal } from '@/components/campaign-modals/GuaranteeNegotiationModal';
import { GuaranteeQuotesList } from './GuaranteeQuotesList';
import type { GuaranteeSlotRequestStatus } from '@/types/guarantee-slot.types';

// 타입 정의
interface MyGuaranteeQuoteRequest {
  id: string;
  campaign_id: number;
  user_id: string;
  distributor_id?: string;
  target_rank: number;
  guarantee_count: number;
  initial_budget?: number;
  status: GuaranteeSlotRequestStatus;
  final_daily_amount?: number;
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
}

export const MyGuaranteeQuotesContent: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuthContext();
  const { showSuccess, showError } = useCustomToast();

  const [requests, setRequests] = useState<MyGuaranteeQuoteRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchStatus, setSearchStatus] = useState<string>('');
  const [negotiationModal, setNegotiationModal] = useState<{
    open: boolean;
    requestId: string;
    requestData?: MyGuaranteeQuoteRequest;
  }>({
    open: false,
    requestId: ''
  });
  
  // 선택 관련 상태
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);

  // 견적 요청 목록 조회
  const fetchRequests = useCallback(async () => {
    if (!currentUser?.id || authLoading) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('guarantee_slot_requests')
        .select(`
          *,
          campaigns:campaign_id(
            id,
            campaign_name,
            service_type,
            guarantee_unit,
            logo
          ),
          keywords:keyword_id(
            id,
            main_keyword,
            keyword1,
            keyword2,
            keyword3,
            url,
            mid
          )
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests(data || []);
    } catch (error) {
      console.error('보장형 데이터 조회 실패:', error);
      showError('보장형 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, authLoading, showError]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

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
      status: request.status,
      created_at: request.created_at,
      // 견적 요청 전용 필드
      target_rank: request.target_rank,
      guarantee_count: request.guarantee_count,
      initial_budget: request.initial_budget,
      final_daily_amount: request.final_daily_amount,
      start_date: request.start_date,
      end_date: request.end_date
    }));
  }, [requests]);

  // 검색 필터링
  const filteredItems = useMemo(() => {
    return guaranteeItems.filter(item => {
      const matchesSearch = !searchTerm || 
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.service_type?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !searchStatus || item.status === searchStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [guaranteeItems, searchTerm, searchStatus]);

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

  return (
    <>
      {/* 검색 카드 */}
      <Card inert={negotiationModal.open ? '' : undefined}>
        <CardContent className="p-6">
          <h3 className="text-base font-medium mb-4">견적 검색</h3>
          
          {/* 데스크톱 검색 폼 */}
          <div className="hidden md:block space-y-4">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-7">
                <div className="flex items-center h-9">
                  <label className="text-sm text-gray-700 dark:text-gray-300 font-medium min-w-[80px]">검색어</label>
                  <div className="relative w-full">
                    <KeenIcon icon="magnifier" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
                    <input
                      type="text"
                      className="input input-bordered input-sm w-full pl-10"
                      placeholder="캠페인명 또는 서비스 타입으로 검색"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      disabled={negotiationModal.open}
                      inert={negotiationModal.open ? '' : undefined}
                    />
                  </div>
                </div>
              </div>
              <div className="col-span-3">
                <div className="flex items-center h-9">
                  <label className="text-sm text-gray-700 dark:text-gray-300 font-medium min-w-[80px]">상태</label>
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
              <div className="col-span-2 flex justify-end">
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
            <div className="relative">
              <KeenIcon icon="magnifier" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
              <input
                type="text"
                className="input input-bordered input-sm w-full pl-10"
                placeholder="캠페인명 또는 서비스 타입으로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={negotiationModal.open}
                inert={negotiationModal.open ? '' : undefined}
              />
            </div>

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
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-6 py-4">
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
                <span className="font-semibold"> 협상 완료 후 승인된 슬롯은 자동으로 진행됩니다.</span>
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                협상 중인 견적은 협상하기 버튼을 통해 진행상황을 확인할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        <div className="card-header px-6 py-3.5" style={{ minHeight: '60px' }}>
          <div className="flex items-center justify-between w-full h-full">
            <div className="flex items-center gap-3">
              <h3 className="card-title text-base">보장형 목록</h3>
            </div>
            <div className="card-toolbar">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  전체 <span className="text-primary font-medium">{filteredItems.length}</span> 건
                </span>
                {(!!searchTerm || !!searchStatus) && <span className="text-gray-500 text-xs">(필터 적용됨)</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="card-body px-6 py-4">
          <GuaranteeQuotesList
            filteredRequests={filteredItems}
            isLoading={loading}
            error={null}
            onOpenNegotiationModal={openNegotiationModal}
            hasFilters={!!searchTerm || !!searchStatus}
            selectedRequests={selectedRequests}
            onSelectedRequestsChange={setSelectedRequests}
            showBulkActions={true}
          />
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
      />
    </>
  );
};