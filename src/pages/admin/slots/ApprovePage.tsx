import React, { useEffect, useState, useCallback } from 'react';
import { useAuthContext } from '@/auth';
import { supabase } from '@/supabase';
import BasicTemplate from '../components/BasicTemplate';

// 타입 및 상수 가져오기
import { Campaign, Slot } from './components/types';
import { SERVICE_TYPE_TO_CATEGORY } from './components/constants';

// 컴포넌트 가져오기
import SearchForm from './components/SearchForm';
import SlotList from './components/SlotList';
import SlotCard from './components/SlotCard';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import EmptyState from './components/EmptyState';
import AuthRequired from './components/AuthRequired';
import SearchResultCount from './components/SearchResultCount';
import SlotMemoModal from './components/SlotMemoModal';

// 화면 상태를 열거형으로 명확하게 정의
enum ViewState {
  LOADING = 'loading',
  ERROR = 'error',
  EMPTY = 'empty',
  DATA = 'data',
  AUTH_REQUIRED = 'auth_required',
}

const ApprovePage: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuthContext();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [filteredSlots, setFilteredSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedServiceType, setSelectedServiceType] = useState<string>('');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchStatus, setSearchStatus] = useState<string>('');
  const [searchDateFrom, setSearchDateFrom] = useState<string>('');
  const [searchDateTo, setSearchDateTo] = useState<string>('');
  const [searchRefreshCounter, setSearchRefreshCounter] = useState<number>(0); // 검색 버튼 클릭 카운터
  
  // 메모 모달 상태
  const [memoModalOpen, setMemoModalOpen] = useState<boolean>(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [initialMemo, setInitialMemo] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  
  // 현재 화면 상태를 저장하는 상태 변수 (특정 순간의 여러 상태를 종합해 하나의 명확한 상태로 관리)
  const [viewState, setViewState] = useState<ViewState>(ViewState.LOADING);

  // 초기 로딩 상태 관리
  useEffect(() => {
    if (!authLoading) {
      setInitialized(true);
    }
  }, [authLoading]);

  // 화면 상태 결정 함수 (모든 상태 변경 후에 호출됨)
  const determineViewState = useCallback(() => {
    if (loading || authLoading) {
      return ViewState.LOADING;
    }
    
    if (!currentUser) {
      return ViewState.AUTH_REQUIRED;
    }
    
    if (error) {
      return ViewState.ERROR;
    }
    
    if (filteredSlots.length === 0) {
      return ViewState.EMPTY;
    }
    
    return ViewState.DATA;
  }, [loading, authLoading, currentUser, error, filteredSlots.length]);

  // 화면 상태 업데이트 (의존성이 변경될 때마다 실행)
  useEffect(() => {
    const newViewState = determineViewState();
    setViewState(newViewState);
    console.log("화면 상태 변경:", newViewState, {
      loading, 
      authLoading, 
      error, 
      currentUser: !!currentUser, 
      slotsCount: filteredSlots.length,
      selectedServiceType
    });
  }, [determineViewState, loading, authLoading, error, currentUser, filteredSlots.length, selectedServiceType]);

  // 캠페인 정보 가져오기
  useEffect(() => {
    // 인증 로딩이 완료되고 초기화된 상태일 때만 실행
    if (!initialized) {
      return;
    }

    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 현재 사용자가 없다면 조용히 실행 종료 (에러 메시지 표시하지 않음)
        if (!currentUser) {
          console.log('인증된 사용자 정보가 없습니다. 캠페인 정보를 가져오지 않습니다.');
          setLoading(false);
          return;
        }

        console.log('캠페인 정보 가져오기 시작, 사용자 ID:', currentUser.id);

        // 현재 사용자 ID로 캠페인 정보 가져오기
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .eq('mat_id', currentUser.id);

        if (error) {
          console.error('캠페인 정보 가져오기 실패:', error.message);
          setError('캠페인 정보를 가져오는데 실패했습니다.');
        } else if (data) {
          console.log(`${data.length}개의 캠페인 정보를 성공적으로 가져왔습니다.`);
          setCampaigns(data);
          
          // 첫 번째 캠페인의 service_type을 기본값으로 설정
          if (data.length > 0) {
            setSelectedServiceType(data[0].service_type);
          }
        }
      } catch (err: any) {
        console.error('캠페인 조회 중 오류 발생:', err.message);
        setError('데이터 조회 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [currentUser, initialized]);

  // 선택된 서비스 타입에 따라 캠페인 필터링
  useEffect(() => {
    if (!selectedServiceType || campaigns.length === 0) return;
    
    console.log("서비스 타입 변경 감지:", selectedServiceType);
    
    // 중요: 서비스 타입이 변경되면 error는 항상 초기화
    setError(null);
    
    const filtered = campaigns.filter(campaign => 
      campaign.service_type === selectedServiceType
    );
    
    // 필터링된 캠페인 목록에 "전체" 옵션 추가
    setFilteredCampaigns([
      { id: -1, mat_id: 'all', campaign_name: '전체', service_type: selectedServiceType, status: 'active', description: '' },
      ...filtered
    ]);
    
    // 기본값으로 "전체" 선택
    setSelectedCampaign('all');
    
    // 서비스 타입이 바뀌면 슬롯 목록도 다시 가져오기
    setSlots([]);
    setFilteredSlots([]);
  }, [selectedServiceType, campaigns]);

  // 슬롯 데이터 가져오기
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        // 사용자 정보가 있는지 확인
        if (!currentUser) {
          return;
        }
        
        // 서비스 타입이 선택되지 않았으면 종료
        if (!selectedServiceType) {
          setSlots([]);
          setFilteredSlots([]);
          return;
        }

        setLoading(true);
        // 이전 에러 초기화 
        setError(null);
        
        console.log("슬롯 데이터 가져오기 시작:", selectedServiceType, selectedCampaign);
        
        // slots 테이블에서 필요한 필드만 선택 + users 테이블을 조인하여 사용자 정보를 한번에 가져옴
        let query = supabase
          .from('slots')
          .select(`
            id,
            mat_id,
            user_id,
            status,
            created_at,
            submitted_at,
            processed_at,
            input_data,
            rejection_reason,
            user_reason,
            mat_reason,
            updated_at,
            users:user_id (
              id,
              full_name,
              email
            )
          `);
        
        console.log('슬롯 데이터 전체 요청 쿼리 실행');
        
        // 서비스 타입 필터링 추가
        // 먼저 해당 서비스 타입을 가진 모든 캠페인 가져오기
        const serviceTypeCampaigns = campaigns.filter(campaign => 
          campaign.service_type === selectedServiceType
        );
        
        // 캠페인 ID 목록 생성
        const serviceTypeCampaignIds = serviceTypeCampaigns.map(campaign => campaign.mat_id);
        
        console.log(`선택된 서비스 타입(${selectedServiceType})의 캠페인 ID 목록:`, serviceTypeCampaignIds);
        
        // 서비스 타입에 해당하는 캠페인 ID들을 항상 쿼리에 포함
        if (serviceTypeCampaignIds.length > 0) {
          query = query.in('mat_id', serviceTypeCampaignIds);
        } else {
          console.log(`선택된 서비스 타입(${selectedServiceType})의 캠페인이 없습니다.`);
          // 해당하는 캠페인이 없으면 빈 결과 반환하도록 - 불가능한 조건 추가
          query = query.eq('id', currentUser.id);
        }
        
        // 특정 캠페인이 선택된 경우 추가 필터링
        if (selectedCampaign && selectedCampaign !== 'all') {
          console.log(`선택된 캠페인(${selectedCampaign})에 대한 슬롯 정보 가져오기 시작`);
          query = query.eq('mat_id', selectedCampaign);
        }
        
        // 상태 필터 적용
        if (searchStatus) {
          query = query.eq('status', searchStatus);
        }
        
        // 날짜 필터 적용 (submitted_at 필드 기준)
        if (searchDateFrom) {
          query = query.gte('submitted_at', `${searchDateFrom}T00:00:00`);
        }
        
        if (searchDateTo) {
          query = query.lte('submitted_at', `${searchDateTo}T23:59:59`);
        }
        
        // 문자열 검색 - 조인된 사용자 정보에서 필터링
        if (searchTerm) {
          // 사용자 이름, 이메일 검색 (조인된 users 테이블에서 필터링)
          query = query.or(`users.full_name.ilike.%${searchTerm}%,users.email.ilike.%${searchTerm}%`);
          
          // 나머지 input_data 내 검색은 클라이언트에서 수행 (여기서는 할 수 없음)
        }
        
        // 정렬 적용
        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          console.error("슬롯 API 에러:", error.message);
          setError('슬롯 정보를 가져오는데 실패했습니다.');
          return;
        }

        console.log(`${data?.length || 0}개의 슬롯 정보를 가져왔습니다.`);

        if (data && data.length > 0) {
          // 조인된 데이터 형식 변환 (users 객체를 user 필드로 변경)
          const enrichedSlots = data.map(slot => {
            // users 필드에서 사용자 정보 추출
            const user = slot.users;
            
            // 기존 users 필드 제거하고 user 필드 추가
            const { users, ...slotWithoutUsers } = slot;
            return { ...slotWithoutUsers, user };
          });
          
          setSlots(enrichedSlots);
          
          // 검색어로 필터링 (input_data 기반)
          if (searchTerm.trim()) {
            const filteredBySearchTerm = filterSlotsBySearchTermWithoutStateUpdate(enrichedSlots);
            setFilteredSlots(filteredBySearchTerm);
          } else {
            setFilteredSlots(enrichedSlots);
          }
        } else {
          console.log('슬롯 데이터가 없습니다.');
          setSlots(data || []);
          setFilteredSlots(data || []);
          // 데이터가 없는 경우에도 error는 null 상태로 유지
          setError(null);
        }
      } catch (err: any) {
        console.error('슬롯 조회 중 오류 발생:', err.message);
        setError('슬롯 데이터 조회 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [currentUser, selectedCampaign, selectedServiceType, searchStatus, searchDateFrom, searchDateTo, searchRefreshCounter, searchTerm, campaigns]);

  // 상태 변경없이 검색어로 슬롯 필터링 함수 (상태 업데이트 없음)
  const filterSlotsBySearchTermWithoutStateUpdate = (slotsToFilter: Slot[]): Slot[] => {
    if (!searchTerm.trim()) {
      return slotsToFilter;
    }

    const normalizedSearchTerm = searchTerm.toLowerCase().trim();
    
    return slotsToFilter.filter(slot => {
      // 사용자 이름, 이메일 검색
      if (
        slot.user?.full_name?.toLowerCase().includes(normalizedSearchTerm) ||
        slot.user?.email?.toLowerCase().includes(normalizedSearchTerm)
      ) {
        return true;
      }
      
      // input_data 내 검색
      if (slot.input_data) {
        const inputData = slot.input_data;
        
        // 상품명 검색
        if (inputData.productName?.toLowerCase().includes(normalizedSearchTerm)) {
          return true;
        }
        
        // mid 검색
        if (inputData.mid?.toLowerCase().includes(normalizedSearchTerm)) {
          return true;
        }
        
        // url 검색
        if (
          inputData.url?.toLowerCase().includes(normalizedSearchTerm) ||
          inputData.product_url?.toLowerCase().includes(normalizedSearchTerm) ||
          inputData.ohouse_url?.toLowerCase().includes(normalizedSearchTerm)
        ) {
          return true;
        }
        
        // 키워드 검색
        if (inputData.keywords && Array.isArray(inputData.keywords)) {
          if (inputData.keywords.some(keyword => 
            keyword.toLowerCase().includes(normalizedSearchTerm)
          )) {
            return true;
          }
        }
        
        // 다른 키워드 필드 검색
        if (
          inputData.keyword?.toLowerCase().includes(normalizedSearchTerm) ||
          inputData.search_term?.toLowerCase().includes(normalizedSearchTerm) ||
          inputData.place_name?.toLowerCase().includes(normalizedSearchTerm)
        ) {
          return true;
        }
      }
      
      return false;
    });
  };

  // 슬롯 상태 업데이트 공통 함수
  const handleUpdateSlotStatus = async (
    slotId: string, 
    status: 'approved' | 'rejected', 
    rejectionReason?: string
  ) => {
    try {
      const updateData: {
        status: string;
        processed_at: string;
        rejection_reason?: string;
      } = {
        status,
        processed_at: new Date().toISOString()
      };

      if (status === 'rejected' && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('slots')
        .update(updateData)
        .eq('id', slotId);

      if (error) {
        console.error(`슬롯 ${status} 실패:`, error.message);
        setError(`슬롯 ${status === 'approved' ? '승인' : '반려'}에 실패했습니다.`);
        return false;
      }

      // 슬롯 목록 업데이트 (로컬 상태)
      const updateSlotStatus = (slots: Slot[]) => 
        slots.map(slot => 
          slot.id === slotId
            ? { 
                ...slot, 
                status, 
                processed_at: updateData.processed_at,
                ...(status === 'rejected' && rejectionReason 
                  ? { rejection_reason: rejectionReason } 
                  : {})
              }
            : slot
        );

      setSlots(updateSlotStatus);
      setFilteredSlots(updateSlotStatus);

      return true;
    } catch (err: any) {
      console.error(`슬롯 ${status} 중 오류 발생:`, err.message);
      setError(`슬롯 ${status === 'approved' ? '승인' : '반려'} 처리 중 오류가 발생했습니다.`);
      return false;
    }
  };

  // 승인 처리 함수
  const handleApproveSlot = async (slotId: string) => {
    const result = await handleUpdateSlotStatus(slotId, 'approved');
    if (result) {
      // 추가적인 승인 후 처리가 필요하다면 여기에 구현
    }
  };

  // 반려 처리 함수
  const handleRejectSlot = async (slotId: string) => {
    const reason = prompt('반려 사유를 입력하세요:');
    if (reason !== null && reason.trim() !== '') {
      const result = await handleUpdateSlotStatus(slotId, 'rejected', reason);
      if (result) {
        // 추가적인 반려 후 처리가 필요하다면 여기에 구현
      }
    } else if (reason !== null) {
      alert('반려 사유를 입력해주세요.');
    }
  };
  
  // 메모 모달 열기 함수
  const handleOpenMemoModal = (slotId: string) => {
    // 현재 슬롯의 메모 정보 가져오기
    console.log('메모 모달 열기 요청 - 슬롯 ID:', slotId);
    console.log('현재 슬롯 데이터 목록:', slots);
    console.log('현재 필터링된 슬롯 데이터 목록:', filteredSlots);
    
    const slot = [...slots, ...filteredSlots].find(s => s.id === slotId);
    console.log('찾은 슬롯 데이터:', slot);
    
    if (slot) {
      const currentMemo = slot.mat_reason || '';
      console.log('현재 메모 내용:', currentMemo);
      console.log('슬롯의 input_data:', slot.input_data);
      
      // 로그에 input_data의 구조 출력
      if (slot.input_data) {
        console.log('input_data 전체 내용:', JSON.stringify(slot.input_data, null, 2));
      }
      
      setSelectedSlotId(slotId);
      setSelectedSlot(slot);
      setInitialMemo(currentMemo);
      setMemoModalOpen(true);
    } else {
      console.error('해당 ID의 슬롯을 찾을 수 없습니다:', slotId);
    }
  };
  
  // 메모 모달 닫기 함수
  const handleCloseMemoModal = () => {
    setMemoModalOpen(false);
    setSelectedSlotId(null);
    setSelectedSlot(null);
    setInitialMemo('');
  };
  
  // 메모 저장 함수
  const handleSaveMemo = async (slotId: string, memo: string) => {
    try {
      console.log('메모 저장 시작 - 슬롯 ID:', slotId);
      console.log('저장할 메모 내용:', memo);
      
      const { data, error } = await supabase
        .from('slots')
        .update({ mat_reason: memo })
        .eq('id', slotId)
        .select();

      if (error) {
        console.error('메모 저장 실패:', error.message);
        setError('메모 저장에 실패했습니다.');
        return false;
      }

      console.log('메모 저장 API 응답:', data);

      // 슬롯 목록 업데이트 (로컬 상태)
      const updateSlotMemo = (slots: Slot[]) => 
        slots.map(slot => 
          slot.id === slotId
            ? { ...slot, mat_reason: memo }
            : slot
        );

      setSlots(updateSlotMemo);
      setFilteredSlots(updateSlotMemo);
      
      console.log('메모가 성공적으로 저장되었습니다.');
      return true;
    } catch (err: any) {
      console.error('메모 저장 중 오류 발생:', err.message);
      setError('메모 저장 중 오류가 발생했습니다.');
      return false;
    }
  };

  // 검색 함수 (이벤트 핸들러)
  const handleServiceTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // 서비스 타입이 변경될 때 확실하게 상태 관리
    const newServiceType = e.target.value;
    console.log("서비스 타입 변경:", newServiceType, "이전:", selectedServiceType);
    
    // 강제로 빈 슬롯 상태로 변경
    setFilteredSlots([]);
    setSlots([]);
    
    // 오류 상태 초기화
    setError(null);
    
    // 새 서비스 타입 설정
    setSelectedServiceType(newServiceType);
    
    // 로딩 상태로 전환
    setLoading(true);
  };

  const handleCampaignChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCampaign(e.target.value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchStatus(e.target.value);
  };

  const handleSearchDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchDateFrom(e.target.value);
  };

  const handleSearchDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchDateTo(e.target.value);
  };

  const handleSearch = () => {
    // 검색 시 에러 상태 초기화
    setError(null);
    setSearchRefreshCounter(prev => prev + 1);
    setLoading(true);
    console.log('검색 조건에 맞는 슬롯 데이터를 조회합니다...');
  };

  // 초기 로딩 중에는 간소화된 템플릿 반환
  if (authLoading && !initialized) {
    return (
      <BasicTemplate 
        title="슬롯 승인 관리" 
        description="관리자 메뉴 > 슬롯 관리 > 슬롯 승인 관리"
      >
        <div className="card mb-0" style={{ width: '100%', maxWidth: '100%', margin: 0, borderRadius: 0 }}>
          <div className="card-header px-5">
            <div className="card-title">
              <h3>슬롯 승인 관리</h3>
            </div>
          </div>
          <div className="card-body py-5">
            <div className="d-flex justify-content-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">로딩 중...</span>
              </div>
            </div>
            <div className="text-center mt-3">
              <p>사용자 정보를 불러오는 중입니다...</p>
            </div>
          </div>
        </div>
      </BasicTemplate>
    );
  }
  
  return (
    <BasicTemplate 
      title="슬롯 승인 관리" 
      description="관리자 메뉴 > 슬롯 관리 > 슬롯 승인 관리"
    >
      <div className="card mb-0" style={{ width: '100%', maxWidth: '100%', margin: 0, borderRadius: 0 }}>
        <div className="card-header px-5">
          <div className="card-title">
            <h3>슬롯 승인 관리</h3>
          </div>
        </div>
        
        {/* 검색 및 필터 영역 */}
        <SearchForm
          loading={loading}
          selectedServiceType={selectedServiceType}
          selectedCampaign={selectedCampaign}
          searchTerm={searchTerm}
          searchStatus={searchStatus}
          searchDateFrom={searchDateFrom}
          searchDateTo={searchDateTo}
          filteredCampaigns={filteredCampaigns}
          onServiceTypeChange={handleServiceTypeChange}
          onCampaignChange={handleCampaignChange}
          onSearchChange={handleSearchChange}
          onSearchStatusChange={handleSearchStatusChange}
          onSearchDateFromChange={handleSearchDateFromChange}
          onSearchDateToChange={handleSearchDateToChange}
          onSearch={handleSearch}
        />
        
        <div className="card-body py-3 px-0">
          {/* 검색 결과 카운트는 항상 표시 (사용자가 로그인한 경우) */}
          {currentUser && (
            <SearchResultCount
              count={filteredSlots.length}
              searchTerm={searchTerm}
              searchStatus={searchStatus}
              searchDateFrom={searchDateFrom}
              searchDateTo={searchDateTo}
            />
          )}
          
          {/* viewState에 따라 적절한 컴포넌트 표시 */}
          {viewState === ViewState.LOADING && <LoadingState />}
          
          {viewState === ViewState.AUTH_REQUIRED && <AuthRequired />}
          
          {viewState === ViewState.ERROR && (
            <ErrorState error={error} onRetry={handleSearch} />
          )}
          
          {viewState === ViewState.EMPTY && (
            <EmptyState onRefresh={handleSearch} />
          )}
          
          {viewState === ViewState.DATA && (
            <>
              <SlotList
                slots={filteredSlots}
                selectedServiceType={selectedServiceType}
                onApprove={handleApproveSlot}
                onReject={handleRejectSlot}
                onMemo={handleOpenMemoModal}
              />
              <SlotCard
                slots={filteredSlots}
                selectedServiceType={selectedServiceType}
                onApprove={handleApproveSlot}
                onReject={handleRejectSlot}
                onMemo={handleOpenMemoModal}
              />
              
              {/* 메모 모달 */}
              <SlotMemoModal
                open={memoModalOpen}
                onClose={handleCloseMemoModal}
                slotId={selectedSlotId}
                initialMemo={initialMemo}
                onSave={handleSaveMemo}
                slot={selectedSlot}
              />
            </>
          )}
        </div>
      </div>
    </BasicTemplate>
  );
};

export { ApprovePage };
