import React, { useEffect, useState, useCallback } from 'react';
import { useAuthContext } from '@/auth';
import { supabase } from '@/supabase';
import { CommonTemplate } from '@/components/pageTemplate';
import { useLocation } from 'react-router-dom';
import { useCustomToast } from '@/hooks/useCustomToast';
import { Toaster } from 'sonner';

// 타입 및 상수 가져오기
import { Campaign, Slot } from './components/types';
import { SERVICE_TYPE_TO_CATEGORY } from './components/constants';

// 슬롯 서비스 import
import { approveSlot, rejectSlot, updateSlotMemo } from './services/slotService';

// 모달 컴포넌트 import
import ApproveModal from './components/ApproveModal';
import RejectModal from './components/RejectModal';

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
  const location = useLocation();
  const { showSuccess, showError } = useCustomToast();

  // URL에서 쿼리 파라미터 추출
  const queryParams = new URLSearchParams(location.search);
  const campaignFromUrl = queryParams.get('campaign');
  let serviceTypeFromUrl = queryParams.get('service_type');

  // service_type이 naver-traffic인 경우 ntraffic으로 변환
  if (serviceTypeFromUrl === 'naver-traffic') {
    serviceTypeFromUrl = 'ntraffic';
  }
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
  
  // 승인/반려 모달 상태
  const [approveModalOpen, setApproveModalOpen] = useState<boolean>(false);
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [actionSlotId, setActionSlotId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<string | undefined>(undefined);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);

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
          
          setLoading(false);
          return;
        }

        

        // 현재 사용자 ID로 캠페인 정보 가져오기
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .eq('mat_id', currentUser.id);

        if (error) {
          
          setError('캠페인 정보를 가져오는데 실패했습니다.');
        } else if (data) {
          
          setCampaigns(data);

          // 첫 번째 캠페인의 service_type을 기본값으로 설정
          if (data.length > 0) {
            setSelectedServiceType(data[0].service_type);
          }
        }
      } catch (err: any) {
        
        setError('데이터 조회 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [currentUser, initialized]);

  // URL에서 전달된 campaignId 및 serviceType 처리 (최초 한 번만 실행)
  useEffect(() => {
    if (campaigns.length === 0 || !initialized) return;

    if (serviceTypeFromUrl) {
      
      setSelectedServiceType(serviceTypeFromUrl);
    }

    // 캠페인 선택은 filteredCampaigns가 설정된 후에 처리할 것이므로 여기서는 처리하지 않음
  }, [serviceTypeFromUrl, campaigns, initialized]);

  // 선택된 서비스 타입에 따라 캠페인 필터링
  useEffect(() => {
    if (!selectedServiceType || campaigns.length === 0) return;

    

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

    // URL에서 전달된, 또는 기본값으로 "전체" 선택
    if (campaignFromUrl) {
      
      // 숫자 문자열을 숫자로 변환 (캠페인 ID는 숫자)
      setSelectedCampaign(campaignFromUrl);
    } else {
      setSelectedCampaign('all');
    }

    // 서비스 타입이 바뀌면 슬롯 목록도 다시 가져오기
    setSlots([]);
    setFilteredSlots([]);
  }, [selectedServiceType, campaigns, campaignFromUrl]);

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

        

        // slots 테이블에서 필요한 필드만 선택 + users 테이블을 조인하여 사용자 정보를 한번에 가져옴
        let query = supabase
          .from('slots')
          .select(`
            id,
            mat_id,
            user_id,
            product_id,
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

        

        // 서비스 타입 필터링 추가
        // 먼저 해당 서비스 타입을 가진 모든 캠페인 가져오기
        const serviceTypeCampaigns = campaigns.filter(campaign =>
          campaign.service_type === selectedServiceType
        );

        // 캠페인 ID 목록 생성
        const serviceTypeCampaignIds = serviceTypeCampaigns.map(campaign => campaign.mat_id);

        

        // 서비스 타입에 해당하는 캠페인 ID들을 항상 쿼리에 포함
        if (serviceTypeCampaignIds.length > 0) {
          query = query.in('mat_id', serviceTypeCampaignIds);
        } else {
          
          // 해당하는 캠페인이 없으면 빈 결과 반환하도록 - 불가능한 조건 추가
          query = query.eq('id', currentUser.id);
        }

        // 특정 캠페인이 선택된 경우 추가 필터링
        if (selectedCampaign && selectedCampaign !== 'all') {
          

          // 캠페인 ID를 숫자로 변환
          const campaignId = parseInt(selectedCampaign);

          if (!isNaN(campaignId)) {
            // product_id로 필터링 (슬롯이 속한 캠페인 ID)
            query = query.eq('product_id', campaignId);
          } else {
            
            query = query.eq('mat_id', selectedCampaign); // 기존 방식으로 fallback
          }
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
          
          setError('슬롯 정보를 가져오는데 실패했습니다.');
          return;
        }

        

        if (data && data.length > 0) {
          // 조인된 데이터 형식 변환 (users 객체를 user 필드로 변경)
          const enrichedSlots = data.map(slot => {
            // users 필드에서 사용자 정보 추출
            const usersArray = slot.users as any[];
            // 배열에서 첫 번째 사용자 정보를 user로 변환
            const user = usersArray && usersArray.length > 0 ? {
              id: usersArray[0].id,
              full_name: usersArray[0].full_name,
              email: usersArray[0].email
            } : undefined;

            // 기존 users 필드 제거하고 user 필드 추가
            const { users, ...slotWithoutUsers } = slot;

            // 캠페인 이름 설정 - 현재 선택된 캠페인 리스트에서 추출
            let campaignName;
            if (slot.product_id) {
              // 현재 캠페인 목록에서 캠페인 이름 찾기
              const campaignId = parseInt(String(slot.product_id));
              const campaign = campaigns.find(c => parseInt(String(c.id)) === campaignId);
              if (campaign) {
                campaignName = campaign.campaign_name;
              }
            }

            return {
              ...slotWithoutUsers,
              user,
              campaign_name: campaignName
            };
          });

          setSlots(enrichedSlots as Slot[]);

          // 검색어로 필터링 (input_data 기반)
          if (searchTerm.trim()) {
            const filteredBySearchTerm = filterSlotsBySearchTermWithoutStateUpdate(enrichedSlots);
            setFilteredSlots(filteredBySearchTerm as Slot[]);
          } else {
            setFilteredSlots(enrichedSlots as Slot[]);
          }
        } else {
          
          setSlots(data || [] as Slot[]);
          setFilteredSlots(data || [] as Slot[]);
          // 데이터가 없는 경우에도 error는 null 상태로 유지
          setError(null);
        }
      } catch (err: any) {
        
        setError('슬롯 데이터 조회 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [currentUser, selectedCampaign, selectedServiceType, searchStatus, searchDateFrom, searchDateTo, searchRefreshCounter, searchTerm, campaigns]);

  // 상태 변경없이 검색어로 슬롯 필터링 함수 (상태 업데이트 없음)
  const filterSlotsBySearchTermWithoutStateUpdate = (slotsToFilter: Slot[]): Slot[] => {
    if (!searchTerm) return slotsToFilter;
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
          if (inputData.keywords.some((keyword: string) =>
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


  // 승인 처리 함수 (actionType 매개변수 추가)
  const handleApproveSlot = (slotId: string | string[], actionType?: string) => {
    // 배열인 경우 (다중 승인)
    if (Array.isArray(slotId)) {
      if (slotId.length === 0) {
        return; // 선택된 슬롯이 없으면 처리하지 않음
      }
      
      // 선택된 슬롯 배열을 직접 사용 (이미 상태에 있음)
      setApproveModalOpen(true);
      setActionType(actionType);
      console.log('다중 승인 모달 열기, 선택된 슬롯:', selectedSlots);
      return;
    }
    
    // 단일 슬롯 처리
    if (!currentUser?.id) {
      setError('사용자 정보를 찾을 수 없습니다.');
      return;
    }
    
    // 단일 슬롯 처리는 해당 슬롯만 선택하도록 설정
    setSelectedSlots([slotId]);
    setActionType(actionType);
    setApproveModalOpen(true);
    console.log('단일 승인 모달 열기, 선택된 슬롯:', [slotId]);
  };

  // 반려 처리 함수
  const handleRejectSlot = (slotId: string | string[], reason?: string) => {
    // 이미 reason이 제공된 경우 (모달에서 호출)
    if (reason) {
      processRejectSlot(slotId, reason);
      return;
    }
    
    // 배열인 경우 (다중 반려)
    if (Array.isArray(slotId)) {
      if (slotId.length === 0) {
        return; // 선택된 슬롯이 없으면 처리하지 않음
      }
      
      // 모달로 대체
      setActionSlotId(null); // null로 설정하여 배열 처리임을 표시
      setRejectModalOpen(true);
      return;
    }
    
    // 단일 슬롯 처리
    if (!currentUser?.id) {
      setError('사용자 정보를 찾을 수 없습니다.');
      return;
    }

    // 모달 열기
    setActionSlotId(slotId);
    setRejectModalOpen(true);
  };
  
  // 실제 반려 처리 로직
  const processRejectSlot = async (slotId: string | string[], reason: string) => {
    if (!currentUser?.id) {
      setError('사용자 정보를 찾을 수 없습니다.');
      return false;
    }
    
    // 로딩 상태 표시
    setLoading(true);

    try {
      const result = await rejectSlot(slotId, currentUser.id, reason);

      if (result.success) {
        // 성공 시 UI 상태 업데이트
        if (Array.isArray(slotId)) {
          // 배열인 경우 (다중 반려)
          setSlots(prevSlots => {
            return prevSlots.map(slot => {
              if (slotId.includes(slot.id)) {
                return {
                  ...slot,
                  status: 'rejected',
                  processed_at: new Date().toISOString(),
                  rejection_reason: reason
                };
              }
              return slot;
            });
          });
          
          setFilteredSlots(prevSlots => {
            return prevSlots.map(slot => {
              if (slotId.includes(slot.id)) {
                return {
                  ...slot,
                  status: 'rejected',
                  processed_at: new Date().toISOString(),
                  rejection_reason: reason
                };
              }
              return slot;
            });
          });
        } else {
          // 단일 슬롯인 경우
          const updateSlotStatus = (slots: Slot[]) =>
            slots.map(slot =>
              slot.id === slotId
                ? {
                  ...slot,
                  status: 'rejected',
                  processed_at: new Date().toISOString(),
                  rejection_reason: reason
                }
                : slot
            );

          setSlots(updateSlotStatus);
          setFilteredSlots(updateSlotStatus);
        }

        // 성공 메시지 표시
        showSuccess(result.message);
        return true;
      } else {
        // 실패 시 오류 메시지 표시
        setError(result.message);
        showError('슬롯 반려 중 오류 발생: ' + result.message);
        return false;
      }
    } catch (err: any) {
      setError(err.message || '슬롯 반려 처리 중 오류가 발생했습니다.');
      showError('슬롯 반려 처리 중 오류가 발생했습니다.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 메모 모달 열기 함수
  const handleOpenMemoModal = (slotId: string) => {
    // 현재 슬롯의 메모 정보 가져오기
    
    
    

    const slot = [...slots, ...filteredSlots].find(s => s.id === slotId);
    

    if (slot) {
      const currentMemo = slot.mat_reason || '';
      
      

      // 로그에 input_data의 구조 출력
      if (slot.input_data) {
        
      }

      setSelectedSlotId(slotId);
      setSelectedSlot(slot);
      setInitialMemo(currentMemo);
      setMemoModalOpen(true);
    } else {
      
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
    if (!currentUser?.id) {
      setError('사용자 정보를 찾을 수 없습니다.');
      return false;
    }

    try {
      
      

      const result = await updateSlotMemo(slotId, memo, currentUser.id);

      if (!result.success) {
        setError(result.message);
        showError('메모 저장 중 오류가 발생했습니다: ' + result.message);
        return false;
      }

      // 성공 메시지 표시
      showSuccess('메모가 성공적으로 저장되었습니다.');
      
      // 슬롯 목록 업데이트 (로컬 상태)
      const updateSlotMemoState = (slots: Slot[]) =>
        slots.map(slot =>
          slot.id === slotId
            ? { ...slot, mat_reason: memo }
            : slot
        );

      setSlots(updateSlotMemoState);
      setFilteredSlots(updateSlotMemoState);

      
      return true;
    } catch (err: any) {
      const errorMsg = err.message || '메모 저장 중 오류가 발생했습니다.';
      setError(errorMsg);
      showError(errorMsg);
      return false;
    }
  };

  // 검색 함수 (이벤트 핸들러)
  const handleServiceTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // 서비스 타입이 변경될 때 확실하게 상태 관리
    const newServiceType = e.target.value;
    

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
    
  };

  // 초기 로딩 중에는 간소화된 템플릿 반환
  if (authLoading && !initialized) {
    return (
      <CommonTemplate
        title="슬롯 승인 관리"
        description="관리자 메뉴 > 슬롯 관리 > 슬롯 승인 관리"
        showPageMenu={false}
      >
        <div className="card mb-0 bg-card" style={{ width: '100%', maxWidth: '100%', margin: 0, borderRadius: 0 }}>
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
      </CommonTemplate>
    );
  }

  return (
    <CommonTemplate
      title="슬롯 승인 관리"
      description="관리자 메뉴 > 슬롯 관리 > 슬롯 승인 관리"
      showPageMenu={false}
    >
      <Toaster position="top-right" richColors closeButton />
      <div className="card mb-0 bg-card" style={{ width: '100%', maxWidth: '100%', margin: 0, borderRadius: 0 }}>
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
                selectedSlots={selectedSlots}
                onSelectedSlotsChange={setSelectedSlots}
              />
              <SlotCard
                slots={filteredSlots}
                selectedServiceType={selectedServiceType}
                onApprove={handleApproveSlot}
                onReject={handleRejectSlot}
                onMemo={handleOpenMemoModal}
                selectedSlots={selectedSlots}
                onSelectedSlotsChange={setSelectedSlots}
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
              
              {/* 승인 모달 */}
              <ApproveModal
                isOpen={approveModalOpen}
                onClose={() => setApproveModalOpen(false)}
                onConfirm={async () => {
                  setApproveModalOpen(false);
                  // 로딩 상태 표시
                  setLoading(true);
                  
                  try {
                    // 사용자 정보가 없으면 처리 중단
                    if (!currentUser?.id) {
                      setError('사용자 정보를 찾을 수 없습니다.');
                      setLoading(false);
                      return;
                    }
                    
                    // 명시적으로 selectedSlots를 사용하여 처리
                    const slotIdToProcess = selectedSlots;
                    console.log('일괄 승인 처리할 슬롯 ID:', slotIdToProcess);
                    const result = await approveSlot(slotIdToProcess, currentUser.id, actionType);

                    if (result.success) {
                      // 성공 시 UI 상태 업데이트
                      const newStatus = actionType === 'success' ? 'success' : 
                                      actionType === 'refund' ? 'refund' : 'approved';
                      
                      if (Array.isArray(slotIdToProcess)) {
                        // 배열인 경우 (다중 승인)
                        setSlots(prevSlots => {
                          return prevSlots.map(slot => {
                            if (slotIdToProcess.includes(slot.id)) {
                              return {
                                ...slot,
                                status: newStatus,
                                processed_at: new Date().toISOString()
                              };
                            }
                            return slot;
                          });
                        });
                        
                        setFilteredSlots(prevSlots => {
                          return prevSlots.map(slot => {
                            if (slotIdToProcess.includes(slot.id)) {
                              return {
                                ...slot,
                                status: newStatus,
                                processed_at: new Date().toISOString()
                              };
                            }
                            return slot;
                          });
                        });
                        
                        // 선택 초기화
                        // 성공 후 선택 상태 초기화
                        console.log('승인 성공 후 선택 초기화');
                        setSelectedSlots([]);
                      } else {
                        // 단일 슬롯인 경우
                        const updateSlotStatus = (slots: Slot[]) =>
                          slots.map(slot =>
                            slot.id === slotIdToProcess
                              ? {
                                ...slot,
                                status: newStatus,
                                processed_at: new Date().toISOString()
                              }
                              : slot
                          );

                        setSlots(updateSlotStatus);
                        setFilteredSlots(updateSlotStatus);
                      }

                      // 성공 메시지 표시
                      showSuccess(result.message);
                    } else {
                      // 실패 시 오류 메시지 표시
                      setError(result.message);
                      showError('처리 중 오류 발생: ' + result.message);
                    }
                  } catch (err: any) {
                    setError(err.message || '처리 중 오류가 발생했습니다.');
                    showError('처리 중 오류가 발생했습니다.');
                  } finally {
                    setLoading(false);
                    setActionSlotId(null);
                    setActionType(undefined);
                  }
                }}
                count={selectedSlots.length}
                title={actionType === 'success' ? '슬롯 완료 처리' : 
                       actionType === 'refund' ? '슬롯 환불 처리' : '슬롯 승인'}
                description={actionType === 'success' ? '이 슬롯을 완료 처리하시겠습니까? 작업이 완료됨을 의미합니다.' : 
                           actionType === 'refund' ? '이 슬롯을 환불 처리하시겠습니까? 환불 처리는 되돌릴 수 없습니다.' : 
                           '이 슬롯을 승인하시겠습니까? 승인 후에는 완료 또는 환불 처리가 필요합니다.'}
                confirmText={actionType === 'success' ? '완료 처리' : 
                           actionType === 'refund' ? '환불 처리' : '승인하기'}
              />
              
              {/* 반려 모달 */}
              <RejectModal
                isOpen={rejectModalOpen}
                onClose={() => setRejectModalOpen(false)}
                onConfirm={(reason) => {
                  // actionSlotId가 null이면 배열 처리(선택된 슬롯들), 아니면 단일 슬롯 처리
                  const slotIdToProcess = actionSlotId === null ? selectedSlots : actionSlotId;
                  processRejectSlot(slotIdToProcess, reason);
                  
                  // 모달 상태 초기화
                  setRejectModalOpen(false);
                  setActionSlotId(null);
                }}
                count={selectedSlots.length}
              />
            </>
          )}
        </div>
      </div>
    </CommonTemplate>
  );
};

export { ApprovePage };
