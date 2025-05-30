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

// 서비스 타입 정보를 campaign.config.ts 기반으로 생성
const getServiceTypes = () => {
  // CAMPAIGNS 설정을 기반으로 서비스 타입 생성
  const campaignServices = CAMPAIGNS.map(campaign => ({
    platform: campaign.name,
    logo: campaign.logo || '',
    services: campaign.types.map(type => {
      // 서비스별 아이콘 매핑
      let icon = campaign.logo || '';
      if (type.code === CampaignServiceType.NAVER_SHOPPING_TRAFFIC ||
        type.code === CampaignServiceType.NAVER_SHOPPING_FAKESALE) {
        icon = '/media/ad-brand/naver-shopping.png';
      } else if (type.code === CampaignServiceType.NAVER_PLACE_TRAFFIC ||
        type.code === CampaignServiceType.NAVER_PLACE_SAVE) {
        icon = '/media/ad-brand/naver-place.png';
      } else if (type.code === CampaignServiceType.NAVER_PLACE_SHARE) {
        icon = '/media/ad-brand/naver-blog.png';
      }

      // URL 경로 생성 (서비스 타입 코드를 kebab-case로 변환)
      const path = type.code.replace(/([A-Z])/g, '-$1').toLowerCase().slice(1);

      return {
        name: type.name,
        path: path,
        icon: icon,
        // 가구매 서비스는 비활성화
        disabled: type.code === CampaignServiceType.NAVER_SHOPPING_FAKESALE ||
          type.code === CampaignServiceType.COUPANG_FAKESALE
      };
    })
  }));

  // 추가 플랫폼들 (미구현)
  const additionalPlatforms = [
    {
      platform: '인스타그램',
      logo: '/media/ad-brand/instagram.png',
      services: [],
      disabled: true
    },
    {
      platform: '포토&영상 제작',
      logo: '/media/brand-logos/vimeo.svg',
      services: [],
      disabled: true
    },
    {
      platform: '라이브방송',
      logo: '/media/ad-brand/youtube.png',
      services: [],
      disabled: true
    }
  ];

  return [...campaignServices, ...additionalPlatforms];
};

const MyServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const { currentUser, userRole } = useAuthContext();
  const { showSuccess, showError } = useCustomToast();

  // 서비스 타입 정보를 campaign.config.ts 기반으로 생성
  const SERVICE_TYPES = useMemo(() => getServiceTypes(), []);

  // 캠페인 관련 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
  const [selectedSlotForMemo, setSelectedSlotForMemo] = useState<any>(null);
  const [memoText, setMemoText] = useState('');

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

  // 편집 관련 훅
  const {
    editingCell,
    editingValue,
    handleEditStart,
    handleEditChange,
    saveEdit,
    handleEditCancel
  } = useSlotEditing(campaignSlots, setSlots, filteredSlots, setFilteredSlots);

  // 모든 서비스를 하나의 배열로 통합
  const allServices = useMemo(() => {
    return SERVICE_TYPES.flatMap((platform: any) =>
      platform.services.map((service: any) => ({
        ...service,
        platform: platform.platform,
        platformLogo: platform.logo
      }))
    );
  }, [SERVICE_TYPES]);

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
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-2">
            {allServices.map((service: any) => (
              <Button
                key={service.path}
                variant={selectedService === service.path ? "default" : "outline"}
                size="sm"
                onClick={() => handleServiceClick(service.path)}
                disabled={service.disabled}
                className={`relative ${selectedService === service.path
                  ? 'bg-primary hover:bg-primary/90'
                  : ''
                  }`}
              >
                {service.icon && (
                  <img
                    src={service.icon}
                    alt={service.name}
                    className="size-4 mr-2"
                  />
                )}
                {service.name}
              </Button>
            ))}
          </div>
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
    </DashboardTemplate>
  );
};

export default MyServicesPage;