import React, { Fragment, useState } from 'react';
import { CampaignData } from '@/data/advertiseServices';
import { useLocation } from 'react-router-dom';
import { CommonTemplate } from '@/components/pageTemplate';
import { AdMiscFaq } from '@/partials/misc';
import { CampaignSlotInsertModal, CampaignSlotWithKeywordModal } from './campaign-modals';
import { useAuthContext } from '@/auth';
import { KeenIcon } from '@/components';
import {
  SERVICE_TYPE_MAP,
  useServiceCategory,
  useCampaignSlots,
  useSlotEditing,
  useEditableCellStyles,
  SearchForm,
  SlotList,
  MemoModal
} from './campaign-components';

// 캠페인 모달에 필요한 데이터 타입 정의
interface CampaignModalData {
  id: string | number;
  campaign_name: string;
  status: string;
  service_type: string;
}
import { supabase } from '@/supabase';

interface CampaignTemplateProps {
  campaignData: CampaignData;
}

const CampaignTemplate: React.FC<CampaignTemplateProps> = ({ campaignData }) => {
  const { pathname } = useLocation();
  const { currentUser } = useAuthContext();

  // URL 기반으로 서비스 카테고리 결정
  const serviceCategory = useServiceCategory(pathname);

  // ntraffic 직접 경로에 대한 특별 처리
  const serviceType = pathname === '/advertise/ntraffic/campaign'
    ? 'ntraffic'
    : (SERVICE_TYPE_MAP[serviceCategory as keyof typeof SERVICE_TYPE_MAP] || '');

  const [modalOpen, setModalOpen] = useState(false);
  const [memoModalOpen, setMemoModalOpen] = useState(false);
  const [currentMemoSlotId, setCurrentMemoSlotId] = useState<string>('');
  const [memoText, setMemoText] = useState<string>('');

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
  } = useCampaignSlots(serviceType, currentUser?.id);

  // 슬롯 편집 관련 기능
  const {
    editingCell,
    editingValue,
    handleEditStart,
    handleEditChange,
    saveEdit
  } = useSlotEditing(slots, setSlots, filteredSlots, setFilteredSlots);

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

      // Supabase 업데이트
      const { data, error } = await supabase
        .from('slots')
        .update({
          user_reason: memoText,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentMemoSlotId)
        .select();

      if (error) {
        throw error;
      }


      // 로컬 상태 업데이트
      setSlots((prevSlots) => {
        return prevSlots.map(item => {
          if (item.id === currentMemoSlotId) {
            return {
              ...item,
              userReason: memoText,
              updatedAt: new Date().toISOString()
            };
          }
          return item;
        });
      });

      setFilteredSlots((prevFiltered) => {
        return prevFiltered.map(item => {
          if (item.id === currentMemoSlotId) {
            return {
              ...item,
              userReason: memoText,
              updatedAt: new Date().toISOString()
            };
          }
          return item;
        });
      });

      // 성공 메시지
      alert('메모가 저장되었습니다.');
    } catch (err) {

      alert('메모 저장 중 오류가 발생했습니다.');
    }
  };

  // 인라인 편집 스타일 적용
  useEditableCellStyles();

  // 툴바 액션 버튼
  const toolbarActions = (
    <>
      <button className="btn btn-sm btn-light"
        onClick={() => setModalOpen(true)}
      >
        <span className="hidden md:inline">추가</span>
        <span className="md:hidden"><KeenIcon icon="plus" /></span>
      </button>
      <div className="dropdown">
        <button className="btn btn-sm btn-light dropdown-toggle md:hidden" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
          <KeenIcon icon="document" />
        </button>
        <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton">
          <li><a className="dropdown-item" href="#">양식 엑셀 다운로드</a></li>
          <li><a className="dropdown-item" href="#">엑셀 업로드</a></li>
        </ul>
      </div>
      <a href="#" className="hidden md:inline-flex btn btn-sm btn-light">
        양식 엑셀 다운로드
      </a>
      <a href="#" className="hidden md:inline-flex btn btn-sm btn-primary">
        엑셀 업로드
      </a>
    </>
  );

  return (
    <CommonTemplate
      title="캠페인 리스트"
      description={`캠페인 관리 > ${serviceCategory}`}
      toolbarActions={toolbarActions}
      showPageMenu={false}
    >
      <div className="grid gap-5 lg:gap-7.5">
        {/* 검색 영역 */}
        <SearchForm
          loading={isLoading}
          campaignList={campaignList}
          selectedCampaignId={selectedCampaignId}
          statusFilter={statusFilter}
          searchInput={searchInput}
          searchDateFrom={searchDateFrom}
          searchDateTo={searchDateTo}
          onCampaignChange={setSelectedCampaignId}
          onStatusChange={setStatusFilter}
          onSearchChange={setSearchInput}
          onDateFromChange={setSearchDateFrom}
          onDateToChange={setSearchDateTo}
          onSearch={fetchSlots}
        />

        {/* 데이터 표시 영역 */}
        <div className="card">
          <div className="card-header border-b-0 px-5">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <h3 className="card-title font-medium text-sm">전체 {filteredSlots.length} 건</h3>

              {/* 모바일에서는 검색 콜랩스 버튼 추가 */}
              <button className="btn btn-sm btn-light md:hidden" type="button" data-bs-toggle="collapse" data-bs-target="#searchCollapse" aria-expanded="false" aria-controls="searchCollapse">
                <KeenIcon icon="magnifier" className="me-1" /> 검색
              </button>
            </div>

            {/* 모바일용 접을 수 있는 간편 검색 영역 */}
            <div className="collapse mt-3 md:hidden" id="searchCollapse">
              <div className="p-3 bg-light rounded">
                <div className="mb-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="빠른 검색"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
                <div className="mb-2">
                  <select
                    className="form-select form-select-sm w-100"
                    value={selectedCampaignId.toString()}
                    onChange={(e) => setSelectedCampaignId(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                  >
                    <option value="all">전체 캠페인</option>
                    {campaignList.map(campaign => (
                      <option key={campaign.id} value={campaign.id.toString()}>
                        {campaign.campaignName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="d-flex gap-2">
                  <select
                    className="form-select form-select-sm flex-grow-1"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">전체</option>
                    <option value="submitted">승인요청</option>
                    <option value="approved">승인완료</option>
                    <option value="rejected">반려</option>
                    <option value="draft">임시저장</option>
                  </select>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => fetchSlots()}
                  >
                    검색
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="card-body">
            <SlotList
              filteredSlots={filteredSlots}
              isLoading={isLoading}
              error={error}
              serviceType={serviceType}
              editingCell={editingCell}
              editingValue={editingValue}
              onEditStart={handleEditStart}
              onEditChange={handleEditChange}
              onEditSave={saveEdit}
              onDeleteSlot={handleDeleteSlot}
              onOpenMemoModal={handleOpenMemoModal}
            />
          </div>
          <div className="card-footer">
            {/* 페이지네이션 컴포넌트는 나중에 추가 가능 */}
            <div className="d-flex justify-content-center">
              {/* 페이지네이션 */}
            </div>
          </div>
        </div>
      </div>

      {/* 슬롯 추가 모달 */}
      <CampaignSlotWithKeywordModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        category={serviceCategory}
        campaign={{
          id: campaignData?.campaigns[0]?.id || '',
          campaign_name: campaignData?.campaigns[0]?.name || '',
          status: campaignData?.campaigns[0]?.status || '',
          service_type: serviceType
        } as CampaignModalData}
        onSave={() => fetchSlots()} // 저장 후 데이터 다시 가져오기
        serviceCode={SERVICE_TYPE_MAP[serviceCategory as keyof typeof SERVICE_TYPE_MAP] === 'ntraffic' ? 'NaverShopTraffic' : 'NaverBlogPosting'}
      />

      {/* 메모 관리 모달 */}
      <MemoModal
        isOpen={memoModalOpen}
        onClose={() => setMemoModalOpen(false)}
        memoText={memoText}
        setMemoText={setMemoText}
        onSave={handleSaveMemo}
      />
    </CommonTemplate>
  );
};

export { CampaignTemplate };