import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { DashboardTemplate } from '@/components/pageTemplate';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KeenIcon, LucideRefreshIcon } from '@/components';
import { CAMPAIGNS } from '@/config/campaign.config';
import { useAuthContext } from '@/auth';
import { CampaignSlotWithKeywordModal } from '@/components/campaign-modals';
import { CampaignServiceType } from '@/components/campaign-modals/types';
import { ServiceSelector } from '@/components/service-selector';
import { useCustomToast } from '@/hooks/useCustomToast';
import { hasPermission, PERMISSION_GROUPS, USER_ROLES } from '@/config/roles.config';
import { supabase } from '@/supabase';
import {
  SearchForm,
  SlotList,
  MemoModal,
  useServiceCategory,
  useCampaignSlots,
  useSlotEditing,
  useEditableCellStyles,
  SERVICE_TYPE_MAP,
  SERVICE_TYPE_TO_CATEGORY,
  STATUS_OPTIONS
} from '@/pages/advertise/campaigns/components/campaign-components';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogBody,
  DialogFooter
} from '@/components/ui/dialog';
import { SlotRefundModal } from '@/components/refund/SlotRefundModal';
import { MyGuaranteeQuotesContent } from '@/pages/myinfo/components/MyGuaranteeQuotesContent';
import { MyPerUnitQuotesContent } from '@/pages/myinfo/components/MyPerUnitQuotesContent';
import { MyPerUnitSlotsContent } from '@/pages/myinfo/components/MyPerUnitSlotsContent';
import { InquiryChatModal } from '@/components/inquiry';


const MyServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'standard' | 'guarantee' | 'per-unit'>('standard'); // 뷰 모드 상태 추가
  const { currentUser, userRole } = useAuthContext();
  const { showSuccess, showError } = useCustomToast();

  // 캠페인 관련 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
  const [selectedSlotForMemo, setSelectedSlotForMemo] = useState<any>(null);
  const [memoText, setMemoText] = useState('');

  // 서비스별 슬롯 수를 저장할 상태
  const [serviceSlotCounts, setServiceSlotCounts] = useState<Record<string, number>>({});
  // 보장형 서비스별 슬롯 수를 저장할 상태
  const [guaranteeSlotCounts, setGuaranteeSlotCounts] = useState<Record<string, number>>({});
  // 단건형 서비스별 슬롯 수를 저장할 상태
  const [perUnitSlotCounts, setPerUnitSlotCounts] = useState<Record<string, number>>({});
  // 슬롯이 있는 서비스 목록 (모든 상태 포함)
  const [servicesWithSlots, setServicesWithSlots] = useState<Set<string>>(new Set());

  // 취소 확인 모달 상태
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [slotsToCancel, setSlotsToCancel] = useState<string[]>([]);
  const [isCancelling, setIsCancelling] = useState(false);
  
  // 문의 모달 상태
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [inquiryData, setInquiryData] = useState<{
    slotId?: string;
    campaignId?: number;
    distributorId?: string;
    title?: string;
  } | null>(null);
  
  // 페이지네이션 상태
  const [limit, setLimit] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // 서비스 카테고리 레이블 직접 계산
  const serviceCategoryLabel = SERVICE_TYPE_TO_CATEGORY[selectedService || ''] || selectedService?.replace(/-/g, ' ') || '';

  // 슬롯 데이터 훅
  const {
    isLoading,
    error: slotsError,
    slots: campaignSlots,
    setSlots,
    filteredSlots,
    setFilteredSlots,
    totalCount,
    campaignList,
    statusFilter,
    setStatusFilter,
    searchInput,
    setSearchInput,
    searchDateFrom: slotSearchDateFrom,
    setSearchDateFrom: setSlotSearchDateFrom,
    searchDateTo: slotSearchDateTo,
    setSearchDateTo: setSlotSearchDateTo,
    selectedCampaignId,
    setSelectedCampaignId,
    fetchSlots: loadCampaignSlots,
    handleDeleteSlot
  } = useCampaignSlots(selectedService || '', currentUser?.id, userRole);

  // 권한 체크 - 운영자 이상인지 확인
  const isOperatorOrAbove = userRole && hasPermission(userRole, PERMISSION_GROUPS.ADMIN);

  // 편집 관련 훅
  const {
    editingCell,
    editingValue,
    handleEditStart,
    handleEditChange,
    saveEdit,
    handleEditCancel
  } = useSlotEditing(campaignSlots, setSlots, filteredSlots, setFilteredSlots);

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

  // 페이지네이션이 적용된 슬롯 목록
  const paginatedSlots = useMemo(() => {
    const start = (currentPage - 1) * limit;
    const end = start + limit;
    return filteredSlots.slice(start, end);
  }, [filteredSlots, currentPage, limit]);

  // 필터링된 슬롯 개수가 변경될 때 totalItems 업데이트
  useEffect(() => {
    setTotalItems(filteredSlots.length);
  }, [filteredSlots]);

  // 검색 조건이 변경될 때 페이지를 1로 재설정
  useEffect(() => {
    setCurrentPage(1);
  }, [searchInput, statusFilter, slotSearchDateFrom, slotSearchDateTo, selectedCampaignId, selectedService]);

  // URL 파라미터 처리
  useEffect(() => {
    const serviceParam = searchParams.get('service');
    const typeParam = searchParams.get('type');
    
    if (serviceParam && serviceParam !== selectedService) {
      setSelectedService(serviceParam);
      
      // type 파라미터에 따라 뷰모드 설정
      if (typeParam === 'guarantee') {
        setViewMode('guarantee');
      } else if (typeParam === 'per-unit') {
        setViewMode('per-unit');
      } else {
        setViewMode('standard');
      }
    }
  }, [searchParams]);

  const handleServiceClick = (path: string) => {
    setSelectedService(path);
    setViewMode('standard'); // 일반형 선택 시 뷰모드 설정
    // 검색 초기화
    setSearchInput('');
    setStatusFilter('all');
    setSlotSearchDateFrom('');
    setSlotSearchDateTo('');
    
    // URL 파라미터 업데이트
    const newParams = new URLSearchParams();
    newParams.set('service', path);
    newParams.set('type', 'standard');
    navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
  };

  // 선택된 서비스가 변경될 때 데이터 로드
  useEffect(() => {
    if (selectedService && currentUser?.id) {
      loadCampaignSlots();
    }
  }, [selectedService, currentUser?.id]);

  // 서비스별 슬롯 수를 가져오는 함수 (일반형 + 보장형 + 단건형)
  const fetchAllServiceCounts = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      // 1. 일반형 active 상태의 슬롯 카운트
      let activeQuery = supabase
        .from('slots')
        .select(`
          id,
          product_id,
          status,
          user_id,
          mat_id,
          campaigns:product_id (
            service_type
          )
        `)
        .in('status', ['active', 'approved', 'pending', 'submitted', 'refund', 'refund_pending']);

      // 개발자가 아닌 경우에만 사용자 필터 적용
      if (userRole !== USER_ROLES.DEVELOPER) {
        activeQuery = activeQuery.eq('user_id', currentUser.id);
      }

      const { data: activeData, error: activeError } = await activeQuery;

      if (activeError) {
        console.error('활성 슬롯 수 조회 오류:', activeError);
        return;
      }

      // 2. 보장형 active 상태의 슬롯 카운트
      let guaranteeActiveQuery = supabase
        .from('guarantee_slot_requests')
        .select(`
          id,
          status,
          campaigns:campaign_id (
            service_type
          )
        `)
        .in('status', ['accepted', 'negotiating']);

      // 개발자가 아닌 경우에만 사용자 필터 적용
      if (userRole !== USER_ROLES.DEVELOPER) {
        guaranteeActiveQuery = guaranteeActiveQuery.eq('user_id', currentUser.id);
      }

      const { data: guaranteeActiveData, error: guaranteeActiveError } = await guaranteeActiveQuery;

      if (guaranteeActiveError) {
        console.error('보장형 활성 슬롯 수 조회 오류:', guaranteeActiveError);
      }

      // 3. 단건형 active 상태의 슬롯 카운트
      let perUnitActiveQuery = supabase
        .from('per_unit_slot_requests')
        .select(`
          id,
          status,
          per_unit_campaign:per_unit_campaign_id (
            campaign:campaign_id (
              service_type
            )
          )
        `)
        .in('status', ['accepted', 'in_progress', 'pending_payment']);

      // 개발자가 아닌 경우에만 사용자 필터 적용
      if (userRole !== USER_ROLES.DEVELOPER) {
        perUnitActiveQuery = perUnitActiveQuery.eq('user_id', currentUser.id);
      }

      const { data: perUnitActiveData, error: perUnitActiveError } = await perUnitActiveQuery;

      if (perUnitActiveError) {
        console.error('단건형 활성 슬롯 수 조회 오류:', perUnitActiveError);
      }

      // 4. 모든 상태의 슬롯 확인 (활성화 여부 판단용)
      let allQuery = supabase
        .from('slots')
        .select(`
          id,
          campaigns:product_id (
            service_type
          )
        `);

      // 개발자가 아닌 경우에만 사용자 필터 적용
      if (userRole !== USER_ROLES.DEVELOPER) {
        allQuery = allQuery.eq('user_id', currentUser.id);
      }

      const { data: allData, error: allError } = await allQuery;

      if (allError) {
        console.error('전체 슬롯 조회 오류:', allError);
      }

      // 5. 모든 보장형 요청 확인
      let allGuaranteeQuery = supabase
        .from('guarantee_slot_requests')
        .select(`
          id,
          campaigns:campaign_id (
            service_type
          )
        `);

      if (userRole !== USER_ROLES.DEVELOPER) {
        allGuaranteeQuery = allGuaranteeQuery.eq('user_id', currentUser.id);
      }

      const { data: allGuaranteeData, error: allGuaranteeError } = await allGuaranteeQuery;

      if (allGuaranteeError) {
        console.error('전체 보장형 요청 조회 오류:', allGuaranteeError);
      }

      // 일반형 active 슬롯 카운트 계산 (환불 상태 제외)
      const generalCounts: Record<string, number> = {};
      if (activeData) {
        activeData.forEach((slot: any) => {
          // 환불 관련 상태는 카운트에서 제외
          if (slot.campaigns?.service_type && !['refund', 'refund_pending'].includes(slot.status)) {
            generalCounts[slot.campaigns.service_type] = (generalCounts[slot.campaigns.service_type] || 0) + 1;
          }
        });
      }

      // 보장형 active 슬롯 카운트 계산
      const guaranteeCounts: Record<string, number> = {};
      if (guaranteeActiveData) {
        guaranteeActiveData.forEach((request: any) => {
          if (request.campaigns?.service_type) {
            guaranteeCounts[request.campaigns.service_type] = (guaranteeCounts[request.campaigns.service_type] || 0) + 1;
          }
        });
      }

      // 6. 모든 단건형 요청 확인
      let allPerUnitQuery = supabase
        .from('per_unit_slot_requests')
        .select(`
          id,
          per_unit_campaign:per_unit_campaign_id (
            campaign:campaign_id (
              service_type
            )
          )
        `);

      if (userRole !== USER_ROLES.DEVELOPER) {
        allPerUnitQuery = allPerUnitQuery.eq('user_id', currentUser.id);
      }

      const { data: allPerUnitData, error: allPerUnitError } = await allPerUnitQuery;

      if (allPerUnitError) {
        console.error('전체 단건형 요청 조회 오류:', allPerUnitError);
      }

      // 단건형 active 슬롯 카운트 계산
      const perUnitCounts: Record<string, number> = {};
      if (perUnitActiveData) {
        perUnitActiveData.forEach((request: any) => {
          if (request.per_unit_campaign?.campaign?.service_type) {
            const serviceType = request.per_unit_campaign.campaign.service_type;
            perUnitCounts[serviceType] = (perUnitCounts[serviceType] || 0) + 1;
          }
        });
      }

      // 슬롯이 있는 서비스 목록 생성 (일반형 + 보장형 + 단건형)
      const servicesSet = new Set<string>();
      if (allData) {
        allData.forEach((slot: any) => {
          if (slot.campaigns?.service_type) {
            servicesSet.add(slot.campaigns.service_type);
          }
        });
      }
      if (allGuaranteeData) {
        allGuaranteeData.forEach((request: any) => {
          if (request.campaigns?.service_type) {
            servicesSet.add(request.campaigns.service_type);
          }
        });
      }
      if (allPerUnitData) {
        allPerUnitData.forEach((request: any) => {
          if (request.per_unit_campaign?.campaign?.service_type) {
            servicesSet.add(request.per_unit_campaign.campaign.service_type);
          }
        });
      }

      setServiceSlotCounts(generalCounts);
      setGuaranteeSlotCounts(guaranteeCounts);
      setPerUnitSlotCounts(perUnitCounts);
      setServicesWithSlots(servicesSet);
    } catch (error) {
      console.error('서비스별 슬롯 수 조회 중 오류:', error);
    }
  }, [currentUser?.id, userRole]);

  // 컴포넌트 마운트 시 모든 서비스의 슬롯 수 가져오기
  useEffect(() => {
    fetchAllServiceCounts();
  }, [fetchAllServiceCounts]);

  // 메모 열기 핸들러
  const handleOpenMemoModal = useCallback((slotId: string) => {
    const slot = filteredSlots.find(s => s.id === slotId);
    if (slot) {
      setSelectedSlotForMemo(slot);
      setMemoText(slot.userReason || '');
      setIsMemoModalOpen(true);
    }
  }, [filteredSlots]);

  // 메모 저장 핸들러
  const handleSaveMemo = useCallback(async () => {
    if (!selectedSlotForMemo) return;

    try {
      const { error } = await supabase
        .from('slots')
        .update({
          user_reason: memoText,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSlotForMemo.id);

      if (error) throw error;

      showSuccess('메모가 저장되었습니다.');
      setIsMemoModalOpen(false);
      setSelectedSlotForMemo(null);
      setMemoText('');
      await loadCampaignSlots();
    } catch (error) {
      console.error('메모 저장 오류:', error);
      showError('메모 저장 중 오류가 발생했습니다.');
    }
  }, [selectedSlotForMemo, memoText, showSuccess, showError, loadCampaignSlots]);

  // 거래 확정 핸들러
  const handleConfirmTransaction = useCallback(async (slotId: string) => {
    try {
      // RPC 함수를 사용하여 거래 완료 처리 (정산 포함)
      const { data, error } = await supabase.rpc('user_confirm_slot_completion', {
        p_slot_id: slotId,
        p_user_id: currentUser?.id,
        p_notes: '사용자 거래 완료 확인'
      });

      if (error) {
        console.error('거래 완료 처리 오류:', error);
        throw error;
      }

      // RPC 함수의 반환값 확인
      if (data && typeof data === 'object' && 'success' in data) {
        if (data.success) {
          showSuccess(data.message || '거래가 완료되었습니다.');
        } else {
          showError(data.message || '거래 완료 처리 중 오류가 발생했습니다.');
          return;
        }
      } else {
        showSuccess('거래가 완료되었습니다.');
      }

      await loadCampaignSlots();
    } catch (error) {
      console.error('거래 완료 처리 오류:', error);
      showError('거래 완료 처리 중 오류가 발생했습니다.');
    }
  }, [currentUser?.id, showSuccess, showError, loadCampaignSlots]);

  // 다중 선택 상태
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  // 슬롯 취소 모달 열기
  const handleOpenCancelModal = useCallback((slotIds: string | string[]) => {
    const idsArray = Array.isArray(slotIds) ? slotIds : [slotIds];

    // 취소 가능한 슬롯만 필터링
    const cancellableSlots = idsArray.filter(id => {
      const slot = filteredSlots.find(s => s.id === id);
      return slot && (slot.status === 'pending' || slot.status === 'submitted');
    });

    if (cancellableSlots.length === 0) {
      showError('승인 대기 중인 슬롯만 취소할 수 있습니다.');
      return;
    }

    setSlotsToCancel(cancellableSlots);
    setIsCancelModalOpen(true);
  }, [filteredSlots, showError]);

  // 환불 모달 상태
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [slotsToRefund, setSlotsToRefund] = useState<string[]>([]);

  // 슬롯 환불 모달 열기
  const handleOpenRefundModal = useCallback((slotIds: string | string[]) => {
    const idsArray = Array.isArray(slotIds) ? slotIds : [slotIds];

    // 환불 가능한 슬롯만 필터링 (active 또는 approved 상태, 이미 환불 관련 상태는 제외)
    const refundableSlots = idsArray.filter(id => {
      const slot = filteredSlots.find(s => s.id === id);
      return slot && (slot.status === 'active' || slot.status === 'approved') && 
             !['refund_pending', 'refund_approved', 'refunded', 'cancelled'].includes(slot.status);
    });

    if (refundableSlots.length === 0) {
      showError('진행 중인 슬롯만 환불 신청할 수 있습니다. 이미 환불이 진행 중이거나 완료된 슬롯은 선택할 수 없습니다.');
      return;
    }

    setSlotsToRefund(refundableSlots);
    setIsRefundModalOpen(true);
  }, [filteredSlots, showError]);

  // 슬롯 취소 실행
  const handleConfirmCancel = useCallback(async () => {
    if (slotsToCancel.length === 0) return;

    setIsCancelling(true);
    try {
      // 1. 슬롯 상태를 cancelled로 업데이트
      const { error: slotError } = await supabase
        .from('slots')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .in('id', slotsToCancel);

      if (slotError) throw slotError;

      // 2. slot_pending_balances 테이블의 상태도 cancelled로 업데이트
      const { error: pendingError } = await supabase
        .from('slot_pending_balances')
        .update({
          status: 'cancelled'
        })
        .in('slot_id', slotsToCancel);

      if (pendingError) throw pendingError;

      // 3. slot_pending_balances에서 실제 결제 금액 가져오기
      // 먼저 모든 관련 pending_balances 조회 (상태 조건 제거)
      const { data: pendingBalances, error: fetchError } = await supabase
        .from('slot_pending_balances')
        .select('amount, status')
        .in('slot_id', slotsToCancel);

      if (fetchError) {
        console.error('slot_pending_balances 조회 오류:', fetchError);
        throw fetchError;
      }

      // 총 환불 금액 계산
      const totalAmount = pendingBalances?.reduce((sum, pb) => sum + Number(pb.amount), 0) || 0;

      if (totalAmount > 0 && currentUser?.id) {
        // 3-1. user_balances 테이블 업데이트
        const { data: currentBalance, error: balanceError } = await supabase
          .from('user_balances')
          .select('total_balance, paid_balance, free_balance')
          .eq('user_id', currentUser.id)
          .single();

        if (balanceError) {
          console.error('user_balances 조회 오류:', balanceError);
          // user_balances가 없으면 생성
          const { error: insertError } = await supabase
            .from('user_balances')
            .insert({
              user_id: currentUser.id,
              total_balance: totalAmount,
              paid_balance: totalAmount,
              free_balance: 0
            });

          if (insertError) {
            console.error('user_balances 생성 오류:', insertError);
            throw insertError;
          }
        } else if (currentBalance) {
          const newTotalBalance = Number(currentBalance.total_balance || 0) + totalAmount;
          const newPaidBalance = Number(currentBalance.paid_balance || 0) + totalAmount;

          const { error: updateError } = await supabase
            .from('user_balances')
            .update({
              total_balance: newTotalBalance,
              paid_balance: newPaidBalance,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', currentUser.id);

          if (updateError) {
            console.error('user_balances 업데이트 오류:', updateError);
            throw updateError;
          }
        }

        // 3-2. user_cash_history에 환불 기록 추가
        const { error: historyError } = await supabase
          .from('user_cash_history')
          .insert({
            user_id: currentUser.id,
            transaction_type: 'refund',
            amount: totalAmount,
            description: `슬롯 취소 환불 (${slotsToCancel.length}개)`,
            balance_type: 'paid'
          });

        if (historyError) {
          console.error('user_cash_history 추가 오류:', historyError);
          throw historyError;
        }

      }

      showSuccess(`${slotsToCancel.length}개의 슬롯이 취소되었습니다. 캐시가 환불되었습니다.`);
      setIsCancelModalOpen(false);
      setSlotsToCancel([]);
      setSelectedSlots([]);
      await loadCampaignSlots();
      await fetchAllServiceCounts(); // 서비스별 카운트 업데이트
    } catch (error) {
      console.error('슬롯 취소 오류:', error);
      showError('슬롯 취소 중 오류가 발생했습니다.');
    } finally {
      setIsCancelling(false);
    }
  }, [slotsToCancel, filteredSlots, currentUser?.id, showSuccess, showError, loadCampaignSlots]);

  // 검색 핸들러
  const handleSearch = useCallback(() => {
    loadCampaignSlots();
  }, [loadCampaignSlots]);

  // 툴바 액션 버튼
  const toolbarActions = (
    <div className="flex items-center gap-2">
      {/* 새 슬롯 추가 버튼 - 일반형일 때만 표시 */}
      {viewMode === 'standard' && (
        <Button
          variant="outline"
          size="sm"
          className="bg-primary-600 text-white hover:bg-primary-700"
          onClick={() => setIsAddModalOpen(true)}
          disabled={!selectedService}
        >
          <KeenIcon icon="plus" className="size-4 mr-2" />
          새 슬롯 추가
        </Button>
      )}
    </div>
  );

  return (
    <DashboardTemplate
      title="이용 중인 서비스"
      description="이용 중인 캠페인을 관리하고 상태를 확인할 수 있습니다."
      headerTextClass="text-white"
      toolbarActions={toolbarActions}
    >
      {/* 서비스 목록 */}
      <Card className="mb-4 lg:mb-6">
        <CardContent className="p-4 lg:p-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">서비스</h3>
          <ServiceSelector
            selectedService={selectedService}
            onServiceSelect={handleServiceClick}
            showDisabled={true}
            userRole={userRole}
            showCount={true}
            serviceCounts={serviceSlotCounts}
            guaranteeCounts={guaranteeSlotCounts}
            perUnitCounts={perUnitSlotCounts}
            servicesWithSlots={servicesWithSlots}
            collapsible={true}
            initialDisplayCount={6}
            expandableServices={true}
            onGuaranteeSelect={(service) => {
              // 보장형 선택 시 서비스 설정 및 컴포넌트 모드 전환
              setSelectedService(service);
              setViewMode('guarantee');
              
              // URL 파라미터 업데이트
              const newParams = new URLSearchParams();
              newParams.set('service', service);
              newParams.set('type', 'guarantee');
              navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
            }}
            onPerUnitSelect={(service) => {
              // 단건형 선택 시 서비스 설정 및 컴포넌트 모드 전환
              setSelectedService(service);
              setViewMode('per-unit');
              
              // URL 파라미터 업데이트
              const newParams = new URLSearchParams();
              newParams.set('service', service);
              newParams.set('type', 'per-unit');
              navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
            }}
            getTotalCount={(serviceType) => {
              const generalCount = serviceSlotCounts[serviceType] || 0;
              const guaranteeCount = guaranteeSlotCounts[serviceType] || 0;
              const perUnitCount = perUnitSlotCounts[serviceType] || 0;
              return generalCount + guaranteeCount + perUnitCount;
            }}
            getGeneralCount={(serviceType) => serviceSlotCounts[serviceType] || 0}
            getGuaranteeCount={(serviceType) => guaranteeSlotCounts[serviceType] || 0}
            getPerUnitCount={(serviceType) => perUnitSlotCounts[serviceType] || 0}
          />
        </CardContent>
      </Card>

      {/* 메인 콘텐츠 - 뷰 모드에 따라 다른 컴포넌트 표시 */}
      {viewMode === 'guarantee' ? (
        <MyGuaranteeQuotesContent selectedService={selectedService} />
      ) : viewMode === 'per-unit' ? (
        <>
          <MyPerUnitQuotesContent selectedService={selectedService} />
          <MyPerUnitSlotsContent selectedService={selectedService} />
        </>
      ) : (
        <>
          {/* 검색 카드 */}
          <Card>
            <CardContent className="p-6">
              {!selectedService ? (
                <div className="text-center py-8">
                  <KeenIcon icon="information-3" className="text-5xl text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground">서비스를 선택해주세요</p>
                </div>
              ) : (
                <>
                  <h3 className="text-base font-medium mb-4">일반형 슬롯 검색</h3>

              {/* 데스크톱 검색 폼 */}
              <div className="hidden md:block space-y-4">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-4">
                    <div className="flex items-center h-9">
                      <label className="text-sm text-gray-700 dark:text-gray-300 font-medium min-w-[80px]">캠페인</label>
                      <select
                        className="select select-bordered select-sm w-full"
                        value={selectedCampaignId}
                        onChange={(e) => setSelectedCampaignId(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                        disabled={isLoading}
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
                      <label className="text-sm text-gray-700 dark:text-gray-300 font-medium min-w-[80px]">상태</label>
                      <select
                        className="select select-bordered select-sm w-full"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="all">전체</option>
                        {STATUS_OPTIONS.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-span-5">
                    <div className="flex items-center h-9">
                      <label className="text-sm text-gray-700 dark:text-gray-300 font-medium min-w-[80px]">검색어</label>
                      <input
                        type="text"
                        className="input input-bordered input-sm w-full"
                        placeholder="제품명, MID, URL, 키워드 검색"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-7">
                    <div className="flex items-center h-9">
                      <label className="text-sm text-gray-700 dark:text-gray-300 font-medium min-w-[80px]">등록일</label>
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="date"
                          className="input input-bordered input-sm flex-1"
                          value={slotSearchDateFrom}
                          onChange={(e) => setSlotSearchDateFrom(e.target.value)}
                        />
                        <span className="text-sm">~</span>
                        <input
                          type="date"
                          className="input input-bordered input-sm flex-1"
                          value={slotSearchDateTo}
                          onChange={(e) => setSlotSearchDateTo(e.target.value)}
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
                  disabled={isLoading}
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
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">전체 상태</option>
                  {STATUS_OPTIONS.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  className="input input-bordered input-sm w-full"
                  placeholder="제품명, MID, URL, 키워드 검색"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    className="input input-bordered input-sm"
                    value={slotSearchDateFrom}
                    onChange={(e) => setSlotSearchDateFrom(e.target.value)}
                  />
                  <input
                    type="date"
                    className="input input-bordered input-sm"
                    value={slotSearchDateTo}
                    onChange={(e) => setSlotSearchDateTo(e.target.value)}
                  />
                </div>

                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSearch}
                  className="btn-primary w-full bg-primary hover:bg-primary/90"
                >
                  <KeenIcon icon="magnifier" className="size-4" />
                  검색
                </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 슬롯 목록 */}
        {!selectedService ? (
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">서비스를 선택하면 슬롯 목록이 표시됩니다</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <SlotList
              filteredSlots={paginatedSlots || []}
              isLoading={isLoading}
              error={slotsError}
              serviceType={selectedService}
              editingCell={editingCell}
              editingValue={editingValue}
              onEditStart={handleEditStart}
              onEditChange={handleEditChange}
              onEditSave={saveEdit}
              onEditCancel={handleEditCancel}
              onDeleteSlot={handleDeleteSlot}
              onOpenMemoModal={handleOpenMemoModal}
              onConfirmTransaction={handleConfirmTransaction}
              userRole={userRole}
              hasFilters={!!searchInput || statusFilter !== 'all' || !!slotSearchDateFrom || !!slotSearchDateTo}
              isAllData={userRole ? hasPermission(userRole, PERMISSION_GROUPS.ADMIN) : false}
              onCancelSlot={handleOpenCancelModal}
              onRefundSlot={handleOpenRefundModal}
              showBulkActions={true}
              selectedSlots={selectedSlots}
              onSelectedSlotsChange={setSelectedSlots}
              showBulkCancel={true}
              customStatusLabels={{
                approved: '진행중'
              }}
              onInquiry={(slot) => {
                setInquiryData({
                  slotId: slot.id,
                  campaignId: slot.campaign?.id,
                  distributorId: slot.campaign?.distributor_id,
                  title: `슬롯 문의: ${slot.campaign?.campaignName || '캠페인'}`
                });
                setInquiryModalOpen(true);
              }}
              onRefresh={loadCampaignSlots}
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
          </>
        )}

        {/* 모달들 */}
        <CampaignSlotWithKeywordModal
          open={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            loadCampaignSlots();
            fetchAllServiceCounts(); // 서비스별 카운트 업데이트
          }}
          onSave={() => {
            // 구매 성공 시 데이터 즉시 갱신
            loadCampaignSlots();
            fetchAllServiceCounts();
          }}
          serviceCode={selectedService || ''}
          category={serviceCategoryLabel}
        />

        <MemoModal
          isOpen={isMemoModalOpen}
          onClose={() => {
            setIsMemoModalOpen(false);
            setSelectedSlotForMemo(null);
            setMemoText('');
          }}
          memoText={memoText}
          setMemoText={setMemoText}
          onSave={handleSaveMemo}
        />

        {/* 취소 모달 */}
        <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
          <DialogContent className="sm:max-w-[425px]" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>슬롯 취소</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <p className="text-sm text-gray-700">
                선택한 {slotsToCancel.length}개의 슬롯을 취소하시겠습니까?
                <br />
                취소된 슬롯의 결제 금액은 캐시로 환불됩니다.
              </p>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCancelModalOpen(false)}>
                취소
              </Button>
              <Button onClick={handleConfirmCancel} disabled={isCancelling}>
                {isCancelling ? '처리 중...' : '확인'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 환불 모달 */}
        <SlotRefundModal
          isOpen={isRefundModalOpen}
          onClose={() => {
            setIsRefundModalOpen(false);
            setSlotsToRefund([]);
          }}
          slots={filteredSlots.filter(slot => slotsToRefund.includes(slot.id)).map(slot => ({
            id: slot.id,
            startDate: slot.startDate,
            endDate: slot.endDate,
            product_id: slot.productId,
            status: slot.status,
            campaign: slot.campaign ? {
              campaignName: slot.campaign.campaignName,
              refund_settings: (slot.campaign as any).refund_settings || (slot.campaign as any).refundSettings
            } : undefined
          }))}
          onSuccess={async () => {
            await loadCampaignSlots();
            await fetchAllServiceCounts();
            setSelectedSlots([]);
          }}
        />

        {/* 1:1 문의 모달 */}
        <InquiryChatModal
          open={inquiryModalOpen}
          onClose={() => {
            setInquiryModalOpen(false);
            setInquiryData(null);
          }}
          slotId={inquiryData?.slotId}
          campaignId={inquiryData?.campaignId}
          distributorId={inquiryData?.distributorId}
          initialTitle={inquiryData?.title}
        />
      </>
      )}
    </DashboardTemplate>
  );
};

export default MyServicesPage;