import React, { useEffect, useState, useCallback } from 'react';
import { useAuthContext } from '@/auth';
import { supabase } from '@/supabase';
import { CommonTemplate } from '@/components/pageTemplate';
import { useLocation } from 'react-router-dom';
import { useCustomToast } from '@/hooks/useCustomToast';
import { Toaster } from 'sonner';
import { hasPermission, PERMISSION_GROUPS } from '@/config/roles.config';
import { getServiceTypeFromUrl } from '@/utils/serviceTypeResolver';

// 타입 및 상수 가져오기
import { Campaign, Slot } from './components/types';
import { CampaignServiceType, SERVICE_TYPE_LABELS } from '@/components/campaign-modals/types';

// 슬롯 서비스 import
import { approveSlot, rejectSlot, updateSlotMemo } from './services/slotService';

// 모달 컴포넌트 import
// ApproveModal 제거
import RejectModal from './components/RejectModal';

// 컴포넌트 가져오기
import SearchForm from './components/SearchForm';
import SlotList from './components/SlotList';
import LoadingState from './components/LoadingState';
import AuthRequired from './components/AuthRequired';
import SlotMemoModal from './components/SlotMemoModal';

// 화면 상태를 열거형으로 명확하게 정의
enum ViewState {
  LOADING = 'loading',
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
  const serviceTypeFromQuery = queryParams.get('service_type');

  // service_type 변환 처리
  let serviceTypeFromUrl = '';
  if (serviceTypeFromQuery) {
    // URL 패턴으로부터 표준 서비스 타입 가져오기
    const resolvedType = getServiceTypeFromUrl(`/advertise/campaigns/manage/${serviceTypeFromQuery}`);
    serviceTypeFromUrl = resolvedType || serviceTypeFromQuery;
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

  // 반려 모달 상태
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

    return ViewState.DATA;
  }, [loading, authLoading, currentUser]);

  // 화면 상태 업데이트 (의존성이 변경될 때마다 실행)
  useEffect(() => {
    const newViewState = determineViewState();
    setViewState(newViewState);
  }, [determineViewState, loading, authLoading, currentUser]);

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



        // 사용자 역할 확인
        const isAdmin = hasPermission(currentUser.role, PERMISSION_GROUPS.ADMIN);

        // ADMIN 그룹은 모든 캠페인을, 다른 사용자는 자신의 캠페인만 조회
        let campaignsQuery = supabase.from('campaigns').select('id, mat_id, campaign_name, service_type, status, description, logo, add_info');
        if (!isAdmin) {
          campaignsQuery = campaignsQuery.eq('mat_id', currentUser.id);
        }

        const { data, error } = await campaignsQuery;

        if (error) {

          setError('캠페인 정보를 가져오는데 실패했습니다.');
        } else if (data) {
          // add_info 필드가 문자열로 저장된 경우 파싱
          const parsedCampaigns = data.map(campaign => {
            if (campaign.add_info && typeof campaign.add_info === 'string') {
              try {
                campaign.add_info = JSON.parse(campaign.add_info);
              } catch (e) {
                console.error('add_info 파싱 오류:', e);
                campaign.add_info = null;
              }
            }
            return campaign;
          });
          
          setCampaigns(parsedCampaigns);
          
          // selectedServiceType이 아직 설정되지 않은 경우에만 기본값 설정
          if (!selectedServiceType && data.length > 0) {
            // SERVICE_TYPE_LABELS의 첫 번째 키를 기본값으로 사용
            const firstServiceType = Object.keys(SERVICE_TYPE_LABELS)[0];
            setSelectedServiceType(firstServiceType);
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
  }, [serviceTypeFromUrl, campaigns, initialized]);

  // URL에서 전달된 캠페인 처리 (초기 로드 시만)
  useEffect(() => {
    if (!initialized || !campaignFromUrl || filteredCampaigns.length === 0) return;

    // URL에 캠페인이 지정되어 있고, 해당 캠페인이 현재 필터링된 목록에 있는 경우만 설정
    const campaignExists = filteredCampaigns.some(c =>
      c.id.toString() === campaignFromUrl || c.mat_id === campaignFromUrl
    );

    if (campaignExists) {
      setSelectedCampaign(campaignFromUrl);
    }
  }, [campaignFromUrl, filteredCampaigns, initialized]);

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

    // 서비스 타입이 변경되면 캠페인은 "전체"로 초기화
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
            start_date,
            end_date,
            users:user_id (
              id,
              full_name,
              email
            )
          `);



        // 사용자 역할 확인
        const isAdmin = hasPermission(currentUser.role, PERMISSION_GROUPS.ADMIN);

        // 1. 먼저 서비스 타입으로 필터링
        // 해당 서비스 타입을 가진 캠페인들 찾기
        const serviceTypeCampaigns = campaigns.filter(campaign =>
          campaign.service_type === selectedServiceType
        );

        // 서비스 타입에 해당하는 캠페인이 없으면 빈 결과 반환
        if (!selectedServiceType || serviceTypeCampaigns.length === 0) {
          // 빈 결과를 위해 Supabase에서 잘 작동하는 방법 사용
          const { data: emptyData, error } = await query
            .eq('product_id', -999)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('빈 결과 쿼리 오류:', error);
            setError('슬롯 정보를 가져오는데 실패했습니다.');
          } else {
            setSlots([]);
            setFilteredSlots([]);
          }
          return; // 여기서 함수 종료
        } else {
          // 2. 사용자 역할에 따른 필터링
          if (!isAdmin) {
            // 일반 사용자: 자신의 mat_id + 서비스 타입에 해당하는 캠페인만 필터링
            const myCampaigns = serviceTypeCampaigns.filter(campaign =>
              campaign.mat_id === currentUser.id
            );

            if (myCampaigns.length > 0) {
              // 내 캠페인 중 해당 서비스 타입의 캠페인 ID들로 필터링
              const myCampaignIds = myCampaigns.map(campaign => campaign.id);
              query = query.eq('mat_id', currentUser.id).in('product_id', myCampaignIds);
            } else {
              // 내 캠페인이 없으면 빈 결과
              query = query.eq('product_id', -999);
            }
          } else {
            // ADMIN: 서비스 타입의 모든 캠페인 ID로 필터링
            const campaignIds = serviceTypeCampaigns.map(campaign => campaign.id);
            query = query.in('product_id', campaignIds);
          }

          // 3. 특정 캠페인이 선택된 경우 추가 필터링
          if (selectedCampaign && selectedCampaign !== 'all') {
            const campaignId = parseInt(selectedCampaign);

            if (!isNaN(campaignId)) {
              // 숫자 ID인 경우 product_id로 필터링
              query = query.eq('product_id', campaignId);
            } else {
              // 문자열 ID인 경우 mat_id로 필터링 (일반 사용자용)
              if (!isAdmin) {
                query = query.eq('mat_id', selectedCampaign);
              }
            }
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

            // 캠페인 정보 설정 - 현재 선택된 캠페인 리스트에서 추출
            let campaignName;
            let campaignLogo;
            if (slot.product_id) {
              // 현재 캠페인 목록에서 캠페인 정보 찾기
              const campaignId = parseInt(String(slot.product_id));
              const campaign = campaigns.find(c => parseInt(String(c.id)) === campaignId);
              if (campaign) {
                campaignName = campaign.campaign_name;
                
                // 실제 업로드된 로고 URL 확인 (add_info.logo_url)
                if (campaign.add_info && typeof campaign.add_info === 'object' && campaign.add_info.logo_url) {
                  campaignLogo = campaign.add_info.logo_url;
                } else {
                  // 업로드된 로고가 없으면 동물 아이콘 사용
                  campaignLogo = campaign.logo;
                }
              }
            }

            return {
              ...slotWithoutUsers,
              user,
              campaign_name: campaignName,
              campaign_logo: campaignLogo
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
  const handleApproveSlot = async (slotId: string | string[], actionType?: string) => {
    // 로딩 상태 표시
    setLoading(true);

    try {
      // 사용자 정보가 없으면 처리 중단
      if (!currentUser?.id) {
        setError('사용자 정보를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      // 처리할 슬롯 ID 설정
      let slotIdsToProcess: string[] = [];
      if (Array.isArray(slotId)) {
        if (slotId.length === 0) {
          setLoading(false);
          return; // 선택된 슬롯이 없으면 처리하지 않음
        }
        slotIdsToProcess = slotId;
      } else {
        slotIdsToProcess = [slotId];
      }

      // 해당 슬롯 정보 가져오기
      const slotsToProcess = slots.filter(slot => slotIdsToProcess.includes(slot.id));

      // 각 슬롯에 대해 처리
      const results = [];
      for (const slot of slotsToProcess) {
        // 시작일은 오늘로 설정
        const today = new Date();   // 현재일
        const startDateObj = new Date(today);
        startDateObj.setDate(today.getDate() + 1);
        const startDate = startDateObj.toISOString().split('T')[0];

        // 종료일 계산: 시작일 + (dueDays - 1)
        let dueDays = 0;
        if (slot.input_data?.dueDays) {
          dueDays = parseInt(String(slot.input_data.dueDays));
        }

        // dueDays가 없거나 유효하지 않은 경우 1로 설정
        if (isNaN(dueDays) || dueDays <= 0) {
          dueDays = 1;
        }

        const endDateObj = new Date(today);
        endDateObj.setDate(today.getDate() + dueDays);
        const endDate = endDateObj.toISOString().split('T')[0];

        // API 호출 처리
        const result = await approveSlot(slot.id, currentUser.id, actionType, startDate, endDate);
        results.push(result);

        if (result.success) {
          // UI 상태 업데이트
          const newStatus = actionType === 'success' ? 'success' :
            actionType === 'refund' ? 'refund' : 'approved';

          setSlots(prevSlots => {
            return prevSlots.map(s => {
              if (s.id === slot.id) {
                return {
                  ...s,
                  status: newStatus,
                  processed_at: new Date().toISOString(),
                  start_date: startDate,
                  end_date: endDate
                };
              }
              return s;
            });
          });

          setFilteredSlots(prevSlots => {
            return prevSlots.map(s => {
              if (s.id === slot.id) {
                return {
                  ...s,
                  status: newStatus,
                  processed_at: new Date().toISOString(),
                  start_date: startDate,
                  end_date: endDate
                };
              }
              return s;
            });
          });
        }
      }

      // 성공 메시지 표시
      const successResults = results.filter(r => r.success);
      if (successResults.length > 0) {
        showSuccess(slotsToProcess.length > 1
          ? `${successResults.length}/${slotsToProcess.length}개의 슬롯이 성공적으로 처리되었습니다.`
          : '슬롯이 성공적으로 처리되었습니다.');
      }

      // 실패한 결과가 있는 경우
      const failedResults = results.filter(r => !r.success);
      if (failedResults.length > 0) {
        showError(`${failedResults.length}개의 슬롯 처리 중 오류가 발생했습니다.`);
      }

      // 선택 초기화
      setSelectedSlots([]);
    } catch (err: any) {
      setError(err.message || '처리 중 오류가 발생했습니다.');
      showError('처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setActionType(undefined);
    }
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
    const newServiceType = e.target.value;

    // 서비스 타입이 실제로 변경된 경우만 처리
    if (newServiceType !== selectedServiceType) {
      // 오류 상태 초기화
      setError(null);

      // 슬롯 데이터 초기화
      setSlots([]);
      setFilteredSlots([]);

      // 새 서비스 타입 설정
      setSelectedServiceType(newServiceType);
    }
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
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="spinner-border text-primary mb-4" role="status">
              <span className="visually-hidden">로딩 중...</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">사용자 정보를 불러오는 중입니다...</p>
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


          {/* viewState에 따라 적절한 컴포넌트 표시 */}
          {viewState === ViewState.LOADING && <LoadingState />}

          {viewState === ViewState.AUTH_REQUIRED && <AuthRequired />}


          {viewState === ViewState.DATA && (
            <>
              <SlotList
                slots={filteredSlots}
                selectedServiceType={selectedServiceType}
                campaigns={campaigns}
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

              {/* 승인 모달 제거함 */}

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
    </CommonTemplate>
  );
};

export { ApprovePage };
