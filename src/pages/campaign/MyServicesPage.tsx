import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardTemplate } from '@/components/pageTemplate';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KeenIcon } from '@/components';
import { CAMPAIGNS } from '@/config/campaign.config';
import { useAuthContext } from '@/auth';
import { CampaignSlotWithKeywordModal } from '@/components/campaign-modals';
import { CampaignServiceType } from '@/components/campaign-modals/types';
import { ServiceSelector } from '@/components/service-selector';
import { useCustomToast } from '@/hooks/useCustomToast';
import { hasPermission, PERMISSION_GROUPS } from '@/config/roles.config';
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
  DialogFooter
} from '@/components/ui/dialog';


const MyServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const { currentUser, userRole } = useAuthContext();
  const { showSuccess, showError } = useCustomToast();

  // 캠페인 관련 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
  const [selectedSlotForMemo, setSelectedSlotForMemo] = useState<any>(null);
  const [memoText, setMemoText] = useState('');
  
  // 취소 확인 모달 상태
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [slotsToCancel, setSlotsToCancel] = useState<string[]>([]);
  const [isCancelling, setIsCancelling] = useState(false);

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


  const handleServiceClick = (path: string) => {
    setSelectedService(path);
    // 검색 초기화
    setSearchInput('');
    setStatusFilter('all');
    setSlotSearchDateFrom('');
    setSlotSearchDateTo('');
  };

  // 선택된 서비스가 변경될 때 데이터 로드
  useEffect(() => {
    if (selectedService && currentUser?.id) {
      loadCampaignSlots();
    }
  }, [selectedService, currentUser?.id]);

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

  // 거래 확정 핸들러 (필요한 경우)
  const handleConfirmTransaction = useCallback(async (slotId: string) => {
    // 거래 확정 로직 구현
    console.log('거래 확정:', slotId);
  }, []);

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

      console.log('조회된 pending_balances:', pendingBalances);

      // 총 환불 금액 계산
      const totalAmount = pendingBalances?.reduce((sum, pb) => sum + Number(pb.amount), 0) || 0;
      console.log('총 환불 금액:', totalAmount);

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

          console.log('현재 잔액:', currentBalance);
          console.log('새로운 잔액:', { total: newTotalBalance, paid: newPaidBalance });

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

        console.log('환불 처리 완료');
      } else {
        console.log('환불할 금액이 없음 또는 사용자 ID 없음');
      }

      showSuccess(`${slotsToCancel.length}개의 슬롯이 취소되었습니다. 캐시가 환불되었습니다.`);
      setIsCancelModalOpen(false);
      setSlotsToCancel([]);
      setSelectedSlots([]);
      await loadCampaignSlots();
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
  );

  return (
    <DashboardTemplate
      title="내 서비스 관리"
      description="진행 중인 캠페인을 관리하고 상태를 확인할 수 있습니다."
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
          />
        </CardContent>
      </Card>

      {/* 검색 카드 */}
      <Card className="mt-6">
        <CardContent className="p-6">
          {!selectedService ? (
            <div className="text-center py-8">
              <KeenIcon icon="information-3" className="text-5xl text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">서비스를 선택해주세요</p>
            </div>
          ) : (
            <>
              <h3 className="text-base font-medium mb-4">슬롯 검색</h3>

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
                        placeholder="제품명, MID, URL 검색"
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
                  placeholder="제품명, MID, URL 검색"
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
        <SlotList
          filteredSlots={filteredSlots || []}
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
          showBulkActions={true} // 광고주도 다중 선택해서 취소할 수 있도록
          selectedSlots={selectedSlots}
          onSelectedSlotsChange={setSelectedSlots}
          showBulkCancel={true} // 일괄 취소 버튼 표시
        />
      )}

      {/* 모달들 */}
      <CampaignSlotWithKeywordModal
        open={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          loadCampaignSlots();
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

      {/* 취소 확인 모달 */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-0">
          {/* 헤더 영역 - 경고 색상 배경 */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <KeenIcon icon="shield-cross" className="text-white size-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white mb-1">
                  슬롯 취소 확인
                </DialogTitle>
                <p className="text-white/80 text-sm">
                  정말 취소하시겠습니까?
                </p>
              </div>
            </div>
          </div>
          
          {/* 컨텐츠 영역 */}
          <div className="p-6">
            {/* 취소할 슬롯 정보 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">취소할 슬롯</span>
                <span className="text-2xl font-bold text-primary">
                  {slotsToCancel.length}개
                </span>
              </div>
              <div className="flex items-start gap-2">
                <KeenIcon icon="information-circle" className="text-amber-500 size-4 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  승인 대기 중인 슬롯만 취소됩니다. 이미 승인된 슬롯은 취소할 수 없습니다.
                </p>
              </div>
            </div>

            {/* 경고 메시지 */}
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                  <KeenIcon icon="shield-cross" className="text-red-600 dark:text-red-400 size-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-900 dark:text-red-200 mb-1">
                    주의사항
                  </h4>
                  <p className="text-xs text-red-700 dark:text-red-300">
                    이 작업은 되돌릴 수 없습니다. 취소된 슬롯은 다시 복구할 수 없으며, 
                    새로 구매하셔야 합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 푸터 영역 */}
          <DialogFooter className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex-row justify-end gap-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsCancelModalOpen(false);
                setSlotsToCancel([]);
              }}
              className="min-w-[80px]"
              disabled={isCancelling}
            >
              <KeenIcon icon="arrow-left" className="size-4 mr-1" />
              돌아가기
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmCancel}
              className="min-w-[100px] bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  처리중...
                </>
              ) : (
                <>
                  <KeenIcon icon="trash" className="size-4 mr-1" />
                  취소하기
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardTemplate>
  );
};

export default MyServicesPage;