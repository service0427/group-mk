import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAuthContext } from '@/auth';
import { supabase } from '@/supabase';
import { CommonTemplate } from '@/components/pageTemplate';
import { useLocation } from 'react-router-dom';
import { useCustomToast } from '@/hooks/useCustomToast';
import { hasPermission, PERMISSION_GROUPS } from '@/config/roles.config';
import { getServiceTypeFromUrl } from '@/utils/serviceTypeResolver';
import { useDialog } from '@/providers';

// 타입 및 상수 가져오기
import { Campaign, Slot } from './components/types';
import { CampaignServiceType, SERVICE_TYPE_LABELS, SERVICE_TYPE_ORDER } from '@/components/campaign-modals/types';

// 슬롯 서비스 import
import { approveSlot, rejectSlot, updateSlotMemo, completeSlotByMat } from './services/slotService';

// 모달 컴포넌트 import
// ApproveModal 제거
import RejectModal from './components/RejectModal';
import ExcelExportModal, { ExcelTemplate } from './components/ExcelExportModal';

// 컴포넌트 가져오기
import SearchForm from './components/SearchForm';
import SlotList from './components/SlotList';
import LoadingState from './components/LoadingState';
import AuthRequired from './components/AuthRequired';
import SlotMemoModal from './components/SlotMemoModal';
import ApprovalConfirmModal from './components/ApprovalConfirmModal';
import SlotDetailModal from './components/SlotDetailModal';
import MonthlyStatistics, { MonthlyStatisticsRef } from './components/MonthlyStatistics';
import { USER_ROLES } from '@/config/roles.config';

// 엑셀 내보내기 서비스 import
import { exportFilteredSlotsToExcel, exportSelectedSlotsToExcel } from './services/excelExportService';

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
  const { showConfirm } = useDialog();

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

  // 엑셀 내보내기 모달 상태
  const [excelModalOpen, setExcelModalOpen] = useState<boolean>(false);


  // 슬롯 상세 모달 상태 - 하나의 객체로 관리
  const [detailModalState, setDetailModalState] = useState<{
    isOpen: boolean;
    slot: Slot | null;
  }>({
    isOpen: false,
    slot: null
  });

  // MonthlyStatistics 컴포넌트 ref
  const monthlyStatisticsRef = useRef<MonthlyStatisticsRef>(null);

  // 총판 사용자가 가진 서비스 타입들을 계산
  const availableServiceTypes = useMemo(() => {
    // 총판이 아닌 경우 전체 서비스 타입 반환 (메뉴 순서대로)
    if (!currentUser || currentUser.role !== USER_ROLES.DISTRIBUTOR) {
      return SERVICE_TYPE_ORDER;
    }

    // 총판인 경우 자신의 캠페인이 있는 서비스 타입만 반환
    const distributorCampaigns = campaigns.filter(campaign =>
      campaign.mat_id === currentUser.id
    );

    // 중복 제거하여 고유한 서비스 타입만 추출
    const uniqueServiceTypes = [...new Set(distributorCampaigns.map(c => c.service_type))];
    
    // 메뉴 순서에 맞게 정렬
    return SERVICE_TYPE_ORDER.filter(type => uniqueServiceTypes.includes(type));
  }, [campaigns, currentUser]);

  // 필터링된 슬롯들을 useMemo로 계산
  const filteredSlots = useMemo(() => {
    if (!searchTerm || !searchTerm.trim()) {
      return slots;
    }

    const normalizedSearchTerm = searchTerm.toLowerCase().trim();


    // 안전한 문자열 변환 함수
    const safeToLower = (value: any): string => {
      if (typeof value === 'string') return value.toLowerCase();
      if (value != null) return String(value).toLowerCase();
      return '';
    };

    return slots.filter((slot, index) => {
      // 사용자 이름, 이메일 검색
      if (
        safeToLower(slot.user?.full_name).includes(normalizedSearchTerm) ||
        safeToLower(slot.user?.email).includes(normalizedSearchTerm)
      ) {
        return true;
      }

      // input_data 내 검색
      if (slot.input_data) {
        const inputData = slot.input_data;

        // 상품명 검색
        if (safeToLower(inputData.productName).includes(normalizedSearchTerm)) {
          return true;
        }

        // mid 검색
        if (safeToLower(inputData.mid).includes(normalizedSearchTerm)) {
          return true;
        }

        // url 검색
        if (
          safeToLower(inputData.url).includes(normalizedSearchTerm) ||
          safeToLower(inputData.product_url).includes(normalizedSearchTerm) ||
          safeToLower(inputData.ohouse_url).includes(normalizedSearchTerm)
        ) {
          return true;
        }


        // keywords가 문자열로 저장된 경우 (JSON string)
        if (inputData.keywords && typeof inputData.keywords === 'string') {
          try {
            const parsedKeywords = JSON.parse(inputData.keywords);

            if (Array.isArray(parsedKeywords)) {
              const keywordMatch = parsedKeywords.some((keyword: any) => {
                const keywordLower = safeToLower(keyword);
                const isMatch = keywordLower.includes(normalizedSearchTerm);
                return isMatch;
              });

              if (keywordMatch) {
                return true;
              }
            }
          } catch (e) {
          }
        }

        // keywords가 배열로 저장된 경우
        if (inputData.keywords && Array.isArray(inputData.keywords)) {
          const keywordMatch = inputData.keywords.some((keyword: any) => {
            const keywordLower = safeToLower(keyword);
            const isMatch = keywordLower.includes(normalizedSearchTerm);
            return isMatch;
          });

          if (keywordMatch) {
            return true;
          }
        }

        // 다른 키워드 필드 검색
        if (
          safeToLower(inputData.keyword).includes(normalizedSearchTerm) ||
          safeToLower(inputData.search_term).includes(normalizedSearchTerm) ||
          safeToLower(inputData.place_name).includes(normalizedSearchTerm) ||
          safeToLower(inputData.mainKeyword).includes(normalizedSearchTerm) ||
          safeToLower(inputData.keyword1).includes(normalizedSearchTerm) ||
          safeToLower(inputData.keyword2).includes(normalizedSearchTerm) ||
          safeToLower(inputData.keyword3).includes(normalizedSearchTerm)
        ) {
          return true;
        }
      }

      return false;
    });
  }, [slots, searchTerm]);


  // 승인 확인 모달 상태
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvalModalData, setApprovalModalData] = useState<{
    slotId: string;
    campaignName: string;
    dailyQuantity: number;
    progress: any;
    actionType?: string;
  } | null>(null);

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
        let campaignsQuery = supabase.from('campaigns')
          .select('id, mat_id, campaign_name, service_type, status, description, logo, add_info')
          .eq('slot_type', 'standard'); // 일반형 캠페인만 필터링
        if (!isAdmin && currentUser.id) {
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
                campaign.add_info = null;
              }
            }
            return campaign;
          });

          setCampaigns(parsedCampaigns);

          // selectedServiceType이 아직 설정되지 않은 경우에만 기본값 설정
          if (!selectedServiceType) {
            // 기본값은 빈 문자열 (전체 서비스)로 설정
            setSelectedServiceType('');
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
    if (campaigns.length === 0) return;

    // 중요: 서비스 타입이 변경되면 error는 항상 초기화
    setError(null);

    let filtered;
    if (!selectedServiceType) {
      // 전체 서비스인 경우 모든 캠페인 표시
      filtered = campaigns;
    } else {
      // 특정 서비스 타입인 경우 필터링
      filtered = campaigns.filter(campaign =>
        campaign.service_type === selectedServiceType
      );
    }

    // 필터링된 캠페인 목록에 "전체" 옵션 추가
    setFilteredCampaigns([
      { id: -1, mat_id: 'all', campaign_name: '전체', service_type: selectedServiceType || 'all', status: 'active', description: '' },
      ...filtered
    ]);

    // 서비스 타입이 변경되면 캠페인은 "전체"로 초기화
    setSelectedCampaign('all');

    // 서비스 타입이 바뀌면 슬롯 목록도 다시 가져오기
    setSlots([]);
  }, [selectedServiceType, campaigns]);

  // 슬롯 데이터 가져오기
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        // 사용자 정보가 있는지 확인
        if (!currentUser) {
          return;
        }

        // 서비스 타입이 선택되지 않았으면 모든 서비스 타입 조회
        // (전체 서비스 옵션)

        // 캠페인 데이터가 아직 로드되지 않았으면 대기
        // 초기 로드 시 campaigns가 비어있을 때 -999 검색을 방지
        if (!initialized || (campaigns.length === 0 && loading)) {
          return;
        }

        setLoading(true);
        // 이전 에러 초기화 
        setError(null);



        // slots 테이블에서 필요한 필드만 선택 + users 테이블과 campaigns 테이블을 조인하여 정보를 한번에 가져옴
        let query = supabase
          .from('slots')
          .select(`
            *,
            users!user_id (
              id,
              full_name,
              email
            ),
            campaigns!product_id (
              id,
              campaign_name,
              service_type,
              unit_price,
              min_quantity,
              deadline,
              logo,
              add_info
            )
          `);



        // 사용자 역할 확인
        const isAdmin = hasPermission(currentUser.role, PERMISSION_GROUPS.ADMIN);

        // 1. 서비스 타입으로 필터링
        let relevantCampaigns = campaigns;
        
        if (selectedServiceType) {
          // 특정 서비스 타입이 선택된 경우
          relevantCampaigns = campaigns.filter(campaign =>
            campaign.service_type === selectedServiceType
          );
          
          // 서비스 타입에 해당하는 캠페인이 없으면 빈 결과 반환
          if (relevantCampaigns.length === 0) {
            const { data: emptyData, error } = await query
              .eq('product_id', -999)
              .order('created_at', { ascending: false });

            if (error) {
              setError('슬롯 정보를 가져오는데 실패했습니다.');
            } else {
              setSlots([]);
            }
            return;
          }
        }

        // 2. 사용자 역할에 따른 필터링
        if (!isAdmin) {
          // 일반 사용자: 자신의 mat_id에 해당하는 캠페인만 필터링
          const myCampaigns = relevantCampaigns.filter(campaign =>
            campaign.mat_id === currentUser.id
          );

          if (myCampaigns.length > 0) {
            // 내 캠페인의 ID들로 필터링
            const myCampaignIds = myCampaigns.map(campaign => campaign.id);
            query = query.eq('mat_id', currentUser.id).in('product_id', myCampaignIds);
          } else {
            // 내 캠페인이 없으면 빈 결과
            query = query.eq('product_id', -999);
          }
        } else {
          // ADMIN: 전체 또는 서비스 타입의 모든 캠페인 ID로 필터링
          if (relevantCampaigns.length > 0) {
            const campaignIds = relevantCampaigns.map(campaign => campaign.id);
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

        // 취소된 슬롯 및 환불 관련 상태 제외 (환불 요청 관리 페이지에서만 표시)
        query = query.neq('status', 'cancelled')
          .neq('status', 'refund_pending')
          .neq('status', 'refund_approved')
          .neq('status', 'refunded');

        // 상태 필터 적용
        if (searchStatus) {
          query = query.eq('status', searchStatus);
        }

        // 날짜 필터 적용
        if (searchDateFrom && searchDateTo) {
          // 둘 다 선택: start_date >= 시작일 AND end_date <= 종료일
          query = query
            .gte('start_date', searchDateFrom)
            .lte('end_date', searchDateTo);
        } else if (searchDateFrom) {
          // 시작일만 선택: start_date >= 검색시작일
          query = query.gte('start_date', searchDateFrom);
        } else if (searchDateTo) {
          // 종료일만 선택: end_date <= 검색종료일
          query = query.lte('end_date', searchDateTo);
        }

        // 문자열 검색 - 조인된 사용자 정보에서 필터링
        // 서버 측 필터링은 제거하고 클라이언트 측에서만 처리
        // (한글 검색어로 인한 오류 방지)

        // 정렬 적용
        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          console.error('슬롯 조회 에러:', error);
          setError('슬롯 정보를 가져오는데 실패했습니다.');
          return;
        }



        if (data) {
          // 모든 데이터에 대해 조인된 데이터 형식 변환 (빈 배열이어도 처리)
          const enrichedSlots = data.map(slot => {
            // users 처리 - 배열 또는 단일 객체일 수 있음
            let user;
            if (Array.isArray(slot.users)) {
              const usersArray = slot.users;
              user = usersArray.length > 0 ? {
                id: usersArray[0].id,
                full_name: usersArray[0].full_name,
                email: usersArray[0].email
              } : undefined;
            } else if (slot.users && typeof slot.users === 'object') {
              // 단일 객체인 경우
              user = {
                id: slot.users.id,
                full_name: slot.users.full_name,
                email: slot.users.email
              };
            }

            // campaigns 처리 - 배열 또는 단일 객체일 수 있음
            let campaign;
            if (Array.isArray(slot.campaigns)) {
              const campaignsArray = slot.campaigns;
              campaign = campaignsArray.length > 0 ? campaignsArray[0] : null;
            } else if (slot.campaigns && typeof slot.campaigns === 'object') {
              // 단일 객체인 경우
              campaign = slot.campaigns;
            }

            // 기존 users, campaigns 필드 제거하고 정리된 필드 추가
            const { users, campaigns, ...slotWithoutJoins } = slot;

            // 캠페인 정보 설정
            let campaignName = campaign?.campaign_name;
            let campaignLogo;

            if (campaign) {
              // 실제 업로드된 로고 URL 확인 (add_info.logo_url)
              if (campaign.add_info && typeof campaign.add_info === 'object' && campaign.add_info.logo_url) {
                campaignLogo = campaign.add_info.logo_url;
              } else {
                // 업로드된 로고가 없으면 동물 아이콘 사용
                campaignLogo = campaign.logo;
              }
            }

            const enrichedSlot = {
              ...slotWithoutJoins,
              user,
              campaign_name: campaignName,
              campaign_logo: campaignLogo,
              campaign // 전체 캠페인 정보도 포함
            };

            return enrichedSlot;
          });

          setSlots(enrichedSlots as Slot[]);
        } else {
          setSlots([]);
        }
        // 데이터가 없는 경우에도 error는 null 상태로 유지
        setError(null);
      } catch (err: any) {
        setError('슬롯 데이터 조회 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [currentUser, selectedCampaign, selectedServiceType, searchStatus, searchDateFrom, searchDateTo, searchRefreshCounter, campaigns]);



  // 작업 진행률 계산 함수
  const calculateWorkProgress = async (slotId: string) => {
    try {
      // slot_works_info에서 작업 내역 조회
      const { data: workData, error: workError } = await supabase
        .from('slot_works_info')
        .select('work_cnt, date')
        .eq('slot_id', slotId);

      if (workError) {
        return null;
      }

      // 해당 슬롯 정보 가져오기
      let slot = slots.find(s => s.id === slotId) || filteredSlots.find(s => s.id === slotId);

      if (!slot) {
        // 슬롯을 직접 조회
        const { data: slotInfo, error: slotError } = await supabase
          .from('slots')
          .select('id, quantity, input_data, start_date, end_date, product_id')
          .eq('id', slotId)
          .single();

        if (slotError || !slotInfo) {
          return null;
        }

        slot = slotInfo as Slot;
      }

      // 작업 기간 계산
      let dueDays = 1;

      // 1. start_date와 end_date가 있으면 이를 사용 (가장 정확)
      if (slot.start_date && slot.end_date) {
        const start = new Date(slot.start_date);
        const end = new Date(slot.end_date);
        dueDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }
      // 2. input_data의 work_days 사용 (직접입력 모드)
      else if (slot.input_data?.work_days && Number(slot.input_data.work_days) > 0) {
        dueDays = Number(slot.input_data.work_days);
      }
      // 3. input_data의 dueDays 사용
      else if (slot.input_data?.dueDays && Number(slot.input_data.dueDays) > 0) {
        dueDays = Number(slot.input_data.dueDays);
      }
      // 4. input_data의 workCount가 있으면 작업일수로 사용
      else if (slot.input_data?.workCount && Number(slot.input_data.workCount) > 0) {
        dueDays = Number(slot.input_data.workCount);
      }

      // 일일 작업량 가져오기
      let dailyQuantity = 0;

      // 1. slots 테이블의 quantity 필드 확인 (가장 우선)
      if (slot.quantity && Number(slot.quantity) > 0) {
        dailyQuantity = Number(slot.quantity);
      }
      // 2. input_data의 quantity 확인
      else if (slot.input_data?.quantity && Number(slot.input_data.quantity) > 0) {
        dailyQuantity = Number(slot.input_data.quantity);
      }
      // 3. input_data의 타수 관련 필드들 확인
      else if (slot.input_data?.타수 && Number(slot.input_data.타수) > 0) {
        dailyQuantity = Number(slot.input_data.타수);
      }
      // 4. input_data의 다른 가능한 필드들 확인
      else if (slot.input_data?.['일일 타수'] && Number(slot.input_data['일일 타수']) > 0) {
        dailyQuantity = Number(slot.input_data['일일 타수']);
      }
      else if (slot.input_data?.['작업량'] && Number(slot.input_data['작업량']) > 0) {
        dailyQuantity = Number(slot.input_data['작업량']);
      }


      // 총 요청 수량 계산
      const totalRequestedQuantity = dailyQuantity * dueDays;

      // 실제 작업량 계산
      const totalWorkedQuantity = workData?.reduce((sum, work) => sum + (work.work_cnt || 0), 0) || 0;

      // 작업 일수 계산
      const workedDays = workData?.length || 0;

      // 완료율 계산 (100% 상한)
      const completionRate = totalRequestedQuantity > 0
        ? Math.min(100, Math.round((totalWorkedQuantity / totalRequestedQuantity) * 100))
        : 0;

      return {
        totalRequestedQuantity,
        totalWorkedQuantity,
        requestedDays: dueDays,
        workedDays,
        completionRate,
        isEarlyCompletion: workedDays < dueDays && completionRate < 100
      };
    } catch (error) {
      return null;
    }
  };

  // 승인 처리 함수 (actionType 매개변수 추가)
  const handleApproveSlot = async (slotId: string | string[], actionType?: string) => {

    // 처리할 슬롯 ID 설정
    let slotIdsToProcess: string[] = [];
    if (Array.isArray(slotId)) {
      if (slotId.length === 0) {
        return; // 선택된 슬롯이 없으면 처리하지 않음
      }
      slotIdsToProcess = slotId;
    } else {
      slotIdsToProcess = [slotId];
    }

    // 단일 슬롯 처리이고 (일반 승인 또는 환불)
    if (slotIdsToProcess.length === 1) {
      try {
        // 작업 진행률 확인
        const progress = await calculateWorkProgress(slotIdsToProcess[0]);
        const slot = slots.find(s => s.id === slotIdsToProcess[0]) || filteredSlots.find(s => s.id === slotIdsToProcess[0]);

        if (!slot) {
          showError('슬롯을 찾을 수 없습니다.');
          return;
        }

        const campaignName = slot.campaign_name || slot.input_data?.productName || '캠페인';

        // 환불 처리인 경우
        if (actionType === 'refund') {
          // 환불 확인 모달 표시
          setApprovalModalData({
            slotId: slotIdsToProcess[0],
            campaignName,
            dailyQuantity: slot.quantity || 0,
            progress: progress || {
              totalRequestedQuantity: 0,
              totalWorkedQuantity: 0,
              requestedDays: 0,
              workedDays: 0,
              completionRate: 0,
              isEarlyCompletion: false
            },
            actionType: 'refund'
          });
          setApprovalModalOpen(true);
          return;
        }

        // 일반 승인인 경우 작업 진행률이 있으면 확인 다이얼로그 표시
        if (!actionType && progress && progress.totalRequestedQuantity > 0) {
          const completionRate = Math.min(100, progress.completionRate);

          let confirmMessage = `캠페인: ${campaignName}\n\n`;
          confirmMessage += `작업 현황:\n`;
          confirmMessage += `• 요청 수량: ${progress.totalRequestedQuantity.toLocaleString()}개\n`;
          confirmMessage += `• 완료 수량: ${progress.totalWorkedQuantity.toLocaleString()}개\n`;
          confirmMessage += `• 작업 일수: ${progress.workedDays}일 / ${progress.requestedDays}일\n`;
          confirmMessage += `• 진행률: ${completionRate}%\n`;

          if (progress.totalWorkedQuantity > 0 && completionRate < 100) {
            confirmMessage += `\n⚠️ 작업이 진행 중입니다. 미완료분은 추후 환불됩니다.\n`;
          } else if (progress.totalWorkedQuantity === 0) {
            confirmMessage += `\n⚠️ 아직 작업이 시작되지 않았습니다.\n`;
          }

          confirmMessage += `\n이 슬롯을 승인하시겠습니까?`;

          // showConfirm 대신 ApprovalConfirmModal 사용
          setApprovalModalData({
            slotId: slotIdsToProcess[0],
            campaignName,
            dailyQuantity: slot.quantity || 0,
            progress,
            actionType: 'approve'
          });
          setApprovalModalOpen(true);
          return;

        }
      } catch (error) {
      }
    }

    // 다중 선택이거나 진행률 확인 실패 시 바로 처리
    await processApproval(slotIdsToProcess, actionType);
  };

  // 실제 승인 처리 함수
  const processApproval = async (slotIdsToProcess: string[], actionType?: string) => {

    // 로딩 상태 표시
    setLoading(true);

    try {
      // 사용자 정보가 없으면 처리 중단
      if (!currentUser?.id) {
        setError('사용자 정보를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      // 해당 슬롯 정보 가져오기
      let slotsToProcess = slots.filter(slot => slotIdsToProcess.includes(slot.id));

      if (slotsToProcess.length === 0) {
        // filteredSlots에서도 찾아보기
        const filteredSlotsToProcess = filteredSlots.filter(slot => slotIdsToProcess.includes(slot.id));

        if (filteredSlotsToProcess.length > 0) {
          slotsToProcess = filteredSlotsToProcess;
        }
      }

      if (slotsToProcess.length === 0) {
        showError('처리할 슬롯을 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

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
        }
      }

      // 성공 메시지 표시
      const successResults = results.filter(r => r.success);
      if (successResults.length > 0) {
        showSuccess(slotsToProcess.length > 1
          ? `${successResults.length}/${slotsToProcess.length}개의 슬롯이 성공적으로 처리되었습니다.`
          : '슬롯이 성공적으로 처리되었습니다.');

        // 통계 새로고침
        if (monthlyStatisticsRef.current) {
          monthlyStatisticsRef.current.refresh();
        }
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
        }

        // 성공 메시지 표시
        showSuccess(result.message);

        // 통계 새로고침
        if (monthlyStatisticsRef.current) {
          monthlyStatisticsRef.current.refresh();
        }

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

  // 슬롯 완료 처리 함수
  const handleCompleteSlot = async (slotId: string | string[]) => {
    try {
      // 권한 확인
      if (!currentUser?.id) {
        showError('사용자 정보를 찾을 수 없습니다.');
        return;
      }

      const isSingleSlot = typeof slotId === 'string';
      const slotIds = isSingleSlot ? [slotId] : slotId;

      // 선택된 슬롯이 없는 경우
      if (slotIds.length === 0) {
        showError('처리할 슬롯이 없습니다.');
        return;
      }

      // 단일 슬롯인 경우 작업 진행률 확인 후 모달 표시
      if (isSingleSlot && slotIds.length === 1) {
        const progress = await calculateWorkProgress(slotIds[0]);

        if (progress) {
          const slot = slots.find(s => s.id === slotIds[0]) || filteredSlots.find(s => s.id === slotIds[0]);

          if (!slot) {
            showError('슬롯을 찾을 수 없습니다.');
            return;
          }

          const campaignName = slot.campaign_name || slot.input_data?.productName || '캠페인';

          // 일일 작업량 가져오기
          let dailyQuantity = 0;

          if (slot.quantity && Number(slot.quantity) > 0) {
            dailyQuantity = Number(slot.quantity);
          } else if (slot.input_data?.quantity && Number(slot.input_data.quantity) > 0) {
            dailyQuantity = Number(slot.input_data.quantity);
          } else if (slot.input_data?.타수 && Number(slot.input_data.타수) > 0) {
            dailyQuantity = Number(slot.input_data.타수);
          } else if (slot.input_data?.['일일 타수'] && Number(slot.input_data['일일 타수']) > 0) {
            dailyQuantity = Number(slot.input_data['일일 타수']);
          } else if (slot.input_data?.['작업량'] && Number(slot.input_data['작업량']) > 0) {
            dailyQuantity = Number(slot.input_data['작업량']);
          }

          // 모달 데이터 설정
          setApprovalModalData({
            slotId: slotIds[0],
            campaignName,
            dailyQuantity,
            progress,
            actionType: 'complete'
          });
          setApprovalModalOpen(true);

          return;
        }
      }

      // 다중 선택이거나 진행률 조회 실패 시 확인 다이얼로그
      const confirmMessage = isSingleSlot
        ? '이 슬롯을 완료 처리하시겠습니까? 사용자가 확인 후 정산이 진행됩니다.'
        : `선택한 ${slotIds.length}개의 슬롯을 완료 처리하시겠습니까? 사용자가 확인 후 정산이 진행됩니다.`;

      const confirmed = await new Promise<boolean>((resolve) => {
        showConfirm(
          '슬롯 완료 처리',
          confirmMessage,
          (confirmed) => resolve(confirmed),
          {
            confirmText: '완료 처리',
            cancelText: '취소'
          }
        );
      });

      if (!confirmed) return;

      await processCompleteSlot(slotIds);
    } catch (err: any) {
      showError(err.message || '슬롯 완료 처리 중 오류가 발생했습니다.');
    }
  };

  // 실제 완료 처리 함수
  const processCompleteSlot = async (slotIds: string[], workMemo?: string) => {
    setLoading(true);

    try {
      // 각 슬롯에 대해 완료 처리
      let successCount = 0;
      const errors: string[] = [];

      for (const id of slotIds) {
        try {
          const result = await completeSlotByMat(id, currentUser?.id || '', workMemo);

          if (result.success) {
            successCount++;

            // UI 업데이트
            const updateSlotStatus = (slots: Slot[]) =>
              slots.map(slot =>
                slot.id === id
                  ? {
                    ...slot,
                    status: 'pending_user_confirm',
                    updated_at: new Date().toISOString()
                  }
                  : slot
              );

            setSlots(updateSlotStatus);
          } else {
            errors.push(`슬롯 ${id}: ${result.message}`);
          }
        } catch (err: any) {
          errors.push(`슬롯 ${id}: ${err.message || '오류 발생'}`);
        }
      }

      // 결과 메시지 표시
      if (successCount > 0) {
        showSuccess(`${successCount}개의 슬롯이 완료 처리되었습니다.`);

        // 통계 새로고침
        if (monthlyStatisticsRef.current) {
          monthlyStatisticsRef.current.refresh();
        }
      }

      if (errors.length > 0) {
        showError(`완료 처리 실패:\n${errors.join('\n')}`);
      }

      // 선택 초기화
      setSelectedSlots([]);
    } finally {
      setLoading(false);
    }
  };

  // 상세 보기 모달 열기 함수
  const handleOpenDetailModal = useCallback((slotId: string) => {
    const slot = [...slots, ...filteredSlots].find(s => s.id === slotId);
    if (slot) {
      setDetailModalState({
        isOpen: true,
        slot: slot
      });
    }
  }, [slots, filteredSlots]);

  // 메모 모달 열기 함수
  const handleOpenMemoModal = useCallback((slotId: string) => {
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
  }, [slots, filteredSlots]);

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
    // 검색 버튼 클릭 시 특별한 동작 없음 (useMemo로 자동 필터링됨)
    // 필요시 검색 이벤트 로깅 등 추가 가능
  };

  // 엑셀 내보내기 처리
  const handleExcelExport = useCallback((template: ExcelTemplate) => {
    try {
      let slotsToExport = filteredSlots;
      
      // 템플릿에 저장된 상태 필터가 있으면 추가 필터링
      if (template.statusFilter && template.statusFilter !== 'all') {
        slotsToExport = filteredSlots.filter(slot => slot.status === template.statusFilter);
      }
      
      if (selectedSlots.length > 0) {
        // 선택된 슬롯만 내보내기 (상태 필터도 적용)
        const selectedAndFiltered = slotsToExport.filter(slot => selectedSlots.includes(slot.id));
        exportSelectedSlotsToExcel(slotsToExport, selectedAndFiltered.map(s => s.id), template);
        showSuccess(`${selectedAndFiltered.length}개의 슬롯이 엑셀로 내보내졌습니다.`);
      } else {
        // 필터링된 전체 슬롯 내보내기
        exportFilteredSlotsToExcel(slotsToExport, template);
        showSuccess(`${slotsToExport.length}개의 슬롯이 엑셀로 내보내졌습니다.`);
      }
    } catch (error: any) {
      showError(error.message || '엑셀 내보내기 중 오류가 발생했습니다.');
    }
  }, [filteredSlots, selectedSlots, showSuccess, showError]);

  // 초기 로딩 중에는 간소화된 템플릿 반환
  if (authLoading && !initialized) {
    return (
      <CommonTemplate
        title="일반형 슬롯 관리"
        description="일반형 캠페인의 승인 요청 및 슬롯을 관리합니다."
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
      title="일반형 슬롯 관리"
      description="일반형 캠페인의 승인 요청 및 슬롯을 관리합니다."
      showPageMenu={false}
    >

      {/* 월간 통계 */}
      <MonthlyStatistics
        ref={monthlyStatisticsRef}
        selectedServiceType={selectedServiceType}
        selectedCampaign={selectedCampaign}
      />

      {/* 작업 시작일 안내 */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-1">중요 안내사항</h4>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              승인 이후 <strong>다음날부터</strong> 작업을 시작해야 합니다.
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
              예시: 오늘 승인 시, 내일부터 작업이 시작됩니다. 작업자에게 이 사항을 반드시 안내해주세요.
            </p>
          </div>
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
        onExcelExport={() => setExcelModalOpen(true)}
        selectedCount={selectedSlots.length}
        totalCount={filteredSlots.length}
        availableServiceTypes={availableServiceTypes}
        userRole={currentUser?.role}
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
            onComplete={handleCompleteSlot}
            onMemo={handleOpenMemoModal}
            onDetail={handleOpenDetailModal}
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

          {/* 승인 확인 모달 */}
          {approvalModalData && (
            <ApprovalConfirmModal
              isOpen={approvalModalOpen}
              onClose={() => {
                setApprovalModalOpen(false);
                setApprovalModalData(null);
              }}
              onConfirm={async (workMemo?: string) => {
                setApprovalModalOpen(false);
                if (approvalModalData.actionType === 'complete') {
                  await processCompleteSlot([approvalModalData.slotId], workMemo);
                } else {
                  await processApproval([approvalModalData.slotId], approvalModalData.actionType);
                }
                setApprovalModalData(null);
              }}
              campaignName={approvalModalData.campaignName}
              dailyQuantity={approvalModalData.dailyQuantity}
              progress={approvalModalData.progress}
              actionType={approvalModalData.actionType}
            />
          )}

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

          {/* 엑셀 내보내기 모달 */}
          {excelModalOpen && (
            <ExcelExportModal
              isOpen={excelModalOpen}
              onClose={() => setExcelModalOpen(false)}
              onExport={handleExcelExport}
            />
          )}

          {/* 슬롯 상세 모달 */}
          <SlotDetailModal
            isOpen={detailModalState.isOpen}
            onClose={() => {
              setDetailModalState({
                isOpen: false,
                slot: null
              });
            }}
            slot={detailModalState.slot}
            selectedServiceType={selectedServiceType}
          />
        </>
      )}
    </CommonTemplate>
  );
};

export { ApprovePage };
