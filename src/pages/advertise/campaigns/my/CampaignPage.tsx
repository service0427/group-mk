import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/auth';
import { CommonTemplate } from '@/components/pageTemplate';
import { CampaignSlotWithKeywordModal } from '@/components/campaign-modals';
import { KeenIcon } from '@/components';
import { useCustomToast } from '@/hooks/useCustomToast';
import { Toaster } from 'sonner';
import { hasPermission, PERMISSION_GROUPS } from '@/config/roles.config';

// 컴포넌트 import
import {
  SearchForm,
  SlotList,
  MemoModal,
  useServiceCategory,
  useCampaignSlots,
  useSlotEditing,
  useEditableCellStyles,
  SERVICE_TYPE_MAP,
  SERVICE_TYPE_TO_CATEGORY
} from '../components/campaign-components';

// 화면 상태를 열거형으로 명확하게 정의
enum ViewState {
  LOADING = 'loading',
  DATA = 'data',
  AUTH_REQUIRED = 'auth_required',
}

// 검색 결과 카운트 컴포넌트
const SearchResultCount: React.FC<{
  count: number;
  searchTerm: string;
  searchStatus: string;
  searchDateFrom: string;
  searchDateTo: string;
  isAllData?: boolean;
}> = ({ count, searchTerm, searchStatus, searchDateFrom, searchDateTo, isAllData }) => {
  const hasFilters = searchTerm || searchStatus || searchDateFrom || searchDateTo;

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h3 className="text-base font-medium">
            검색 결과: <span className="text-primary">{count}</span>건
            {hasFilters && <span className="text-sm text-gray-500 ml-2">(필터 적용됨)</span>}
            {isAllData && <span className="text-sm text-info ml-2">(전체 데이터)</span>}
          </h3>
        </div>
      </div>
    </div>
  );
};

// 로딩 상태 컴포넌트
const LoadingState: React.FC = () => (
  <div className="card">
    <div className="card-body">
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    </div>
  </div>
);

// 인증 필요 컴포넌트
const AuthRequired: React.FC = () => (
  <div className="card">
    <div className="card-body">
      <div className="text-center py-10">
        <h3 className="text-lg font-semibold mb-2">로그인이 필요합니다</h3>
        <p className="text-gray-600 dark:text-gray-400">이 페이지를 보려면 로그인해주세요.</p>
      </div>
    </div>
  </div>
);

interface CampaignPageProps {
  serviceType?: string;
  embedded?: boolean;
}

const CampaignPage: React.FC<CampaignPageProps> = ({ serviceType: propServiceType, embedded = false }) => {
  const { serviceType: urlServiceType } = useParams<{ serviceType: string }>();
  const serviceType = propServiceType || urlServiceType;
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  const { currentUser, userRole, loading: authLoading } = useAuthContext();
  const { showSuccess, showError } = useCustomToast();

  // URL에서 쿼리 파라미터 추출
  const queryParams = new URLSearchParams(location.search);
  const campaignFromUrl = queryParams.get('campaign');

  const [initialized, setInitialized] = useState<boolean>(false);
  const [viewState, setViewState] = useState<ViewState>(ViewState.LOADING);

  // 모달 상태 관리
  const [modalOpen, setModalOpen] = useState(false);
  const [memoModalOpen, setMemoModalOpen] = useState(false);
  const [currentMemoSlotId, setCurrentMemoSlotId] = useState<string>('');
  const [memoText, setMemoText] = useState<string>('');

  // URL 기반으로 서비스 카테고리 결정
  const serviceCategory = useServiceCategory(pathname);

  // 슬롯 데이터 가져오기 및 필터링
  const {
    isLoading,
    error,
    slots,
    setSlots,
    filteredSlots,
    setFilteredSlots,
    totalCount,
    campaignList,
    statusFilter,
    setStatusFilter,
    searchInput,
    setSearchInput,
    searchDateFrom,
    setSearchDateFrom,
    searchDateTo,
    setSearchDateTo,
    selectedCampaignId,
    setSelectedCampaignId,
    fetchSlots,
    handleDeleteSlot
  } = useCampaignSlots(serviceType || '', currentUser?.id, userRole);

  // 슬롯 편집 관련 기능
  const {
    editingCell,
    editingValue,
    handleEditStart,
    handleEditChange,
    saveEdit,
    handleEditCancel
  } = useSlotEditing(slots, setSlots, filteredSlots, setFilteredSlots);

  // 초기 로딩 상태 관리
  useEffect(() => {
    if (!authLoading) {
      setInitialized(true);
    }
  }, [authLoading]);

  // 화면 상태 결정 함수
  const determineViewState = useCallback(() => {
    if (!initialized || authLoading || isLoading) {
      return ViewState.LOADING;
    }

    if (!currentUser) {
      return ViewState.AUTH_REQUIRED;
    }

    return ViewState.DATA;
  }, [initialized, authLoading, currentUser, isLoading]);

  // 화면 상태 업데이트
  useEffect(() => {
    const newViewState = determineViewState();
    setViewState(newViewState);
  }, [determineViewState]);

  // URL 파라미터 처리
  useEffect(() => {
    if (!initialized) return;

    if (!serviceType) {
      navigate('/advertise/campaigns/my/naver-traffic', { replace: true });
      return;
    }
  }, [serviceType, navigate, initialized]);

  // URL에서 전달된 캠페인 처리
  useEffect(() => {
    if (!initialized || !campaignFromUrl || campaignList.length === 0) return;

    const campaignExists = campaignList.some(c =>
      c.id.toString() === campaignFromUrl
    );

    if (campaignExists) {
      setSelectedCampaignId(parseInt(campaignFromUrl));
    }
  }, [campaignFromUrl, campaignList, initialized]);

  // 메모 모달 열기
  const handleOpenMemoModal = (slotId: string) => {
    const slot = slots.find(item => item.id === slotId);
    if (slot) {
      setCurrentMemoSlotId(slotId);
      setMemoText(slot.userReason || '');
      setMemoModalOpen(true);
    }
  };

  // 메모 저장
  const handleSaveMemo = async () => {
    if (!currentMemoSlotId) return;

    try {
      // 여기에 메모 저장 로직 구현
      // 기존 CampaignTemplate의 handleSaveMemo 로직 사용

      showSuccess('메모가 저장되었습니다.');
      setMemoModalOpen(false);
    } catch (err) {
      showError('메모 저장 중 오류가 발생했습니다.');
    }
  };

  // 검색 함수
  const handleSearch = () => {
    fetchSlots();
  };

  // 거래완료 처리 함수
  const handleConfirmTransaction = async (slotId: string) => {
    if (!currentUser) {
      showError('로그인이 필요합니다.');
      return;
    }

    if (!confirm('정말로 거래를 완료하시겠습니까? 이 작업은 취소할 수 없습니다.')) {
      return;
    }

    try {
      // user_confirm_slot_completion RPC 호출
      const { confirmSlotByUser } = await import('@/pages/admin/slots/services/slotService');
      const result = await confirmSlotByUser(slotId, currentUser?.id || '');

      if (result.success) {
        showSuccess('거래가 성공적으로 완료되었습니다.');
        fetchSlots(); // 슬롯 목록 새로고침
      } else {
        showError(result.message || '거래 완료 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('거래 완료 처리 오류:', error);
      showError('거래 완료 처리 중 오류가 발생했습니다.');
    }
  };

  // 인라인 편집 스타일 적용
  useEditableCellStyles();

  // 서비스 카테고리 라벨 생성
  let serviceCategoryLabel = '';
  if (serviceType) {
    // constants.tsx의 SERVICE_TYPE_TO_CATEGORY 매핑 사용
    serviceCategoryLabel = SERVICE_TYPE_TO_CATEGORY[serviceType] || serviceType.replace(/-/g, ' ');
  }

  // 툴바 액션 버튼
  const toolbarActions = (
    <>
      <button
        className="btn btn-sm btn-light"
        onClick={() => setModalOpen(true)}
        disabled={viewState !== ViewState.DATA}
      >
        <span className="hidden md:inline">추가</span>
        <span className="md:hidden"><KeenIcon icon="plus" /></span>
      </button>
      <a href="#" className="hidden md:inline-flex btn btn-sm btn-light">
        양식 엑셀 다운로드
      </a>
      <a href="#" className="hidden md:inline-flex btn btn-sm btn-primary">
        엑셀 업로드
      </a>
    </>
  );

  // 메인 콘텐츠 렌더링 함수
  const renderContent = () => (
    <>

      <div className="grid gap-5 lg:gap-7.5">
        {/* 검색 및 필터 영역 */}
        <SearchForm
          loading={isLoading}
          campaignList={campaignList}
          selectedCampaignId={selectedCampaignId}
          statusFilter={statusFilter}
          searchInput={searchInput}
          searchDateFrom={searchDateFrom}
          searchDateTo={searchDateTo}
          onCampaignChange={(value) => setSelectedCampaignId(value === 'all' ? 'all' : parseInt(value))}
          onStatusChange={setStatusFilter}
          onSearchChange={setSearchInput}
          onDateFromChange={setSearchDateFrom}
          onDateToChange={setSearchDateTo}
          onSearch={handleSearch}
        />


        {/* viewState에 따라 적절한 컴포넌트 표시 */}
        {viewState === ViewState.LOADING && <LoadingState />}

        {viewState === ViewState.AUTH_REQUIRED && <AuthRequired />}

        {viewState === ViewState.DATA && (
          <>
            <SlotList
              filteredSlots={filteredSlots}
              isLoading={isLoading}
              error={error}
              serviceType={serviceType || ''}
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
              hasFilters={!!searchInput || statusFilter !== 'all' || !!searchDateFrom || !!searchDateTo}
              isAllData={userRole ? hasPermission(userRole, PERMISSION_GROUPS.ADMIN) : false}
            />

            {/* 메모 모달 */}
            <MemoModal
              isOpen={memoModalOpen}
              onClose={() => setMemoModalOpen(false)}
              memoText={memoText}
              setMemoText={setMemoText}
              onSave={handleSaveMemo}
            />
          </>
        )}
      </div>
    </>
  );

  // 초기 로딩 중
  if (authLoading && !initialized) {
    const loadingContent = <LoadingState />;
    
    return embedded ? (
      <>
        {loadingContent}
        {/* 슬롯 추가 모달 */}
        <CampaignSlotWithKeywordModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          category={serviceCategoryLabel}
          campaign={campaignList.length > 0 ? {
            id: campaignList[0]?.id || '',
            campaign_name: campaignList[0]?.campaignName || '',
            status: campaignList[0]?.status || '',
            service_type: serviceType
          } : null}
          serviceCode={serviceType}
          onSave={() => fetchSlots()}
        />
      </>
    ) : (
      <>
        <CommonTemplate
          title={`${serviceCategoryLabel} 캠페인 관리`}
          description={`내 정보 관리 > 내 서비스 관리 > ${serviceCategoryLabel}`}
          showPageMenu={false}
          showBreadcrumb={true}
          toolbarActions={toolbarActions}
        >
          {loadingContent}
        </CommonTemplate>
        {/* 슬롯 추가 모달 */}
        <CampaignSlotWithKeywordModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          category={serviceCategoryLabel}
          campaign={campaignList.length > 0 ? {
            id: campaignList[0]?.id || '',
            campaign_name: campaignList[0]?.campaignName || '',
            status: campaignList[0]?.status || '',
            service_type: serviceType
          } : null}
          serviceCode={serviceType}
          onSave={() => fetchSlots()}
        />
      </>
    );
  }

  // 메인 렌더링
  return (
    <>
      {embedded ? (
        renderContent()
      ) : (
        <CommonTemplate
          title={`${serviceCategoryLabel} 캠페인 관리`}
          description={`내 정보 관리 > 내 서비스 관리 > ${serviceCategoryLabel}`}
          showPageMenu={false}
          showBreadcrumb={true}
          toolbarActions={toolbarActions}
        >
          {renderContent()}
        </CommonTemplate>
      )}

      {/* 슬롯 추가 모달 - 항상 CommonTemplate 밖에 위치 */}
      <CampaignSlotWithKeywordModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        category={serviceCategoryLabel}
        campaign={campaignList.length > 0 ? {
          id: campaignList[0]?.id || '',
          campaign_name: campaignList[0]?.campaignName || '',
          status: campaignList[0]?.status || '',
          service_type: serviceType
        } : null}
        serviceCode={serviceType}
        onSave={() => fetchSlots()}
      />
    </>
  );
};

export { CampaignPage };