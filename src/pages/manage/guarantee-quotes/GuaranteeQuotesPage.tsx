import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useAuthContext } from '@/auth';
import { CommonTemplate } from '@/components/pageTemplate';
import { useCustomToast } from '@/hooks/useCustomToast';
import { useMediaQuery } from '@/hooks';
import { hasPermission, PERMISSION_GROUPS, USER_ROLES } from '@/config/roles.config';
import { guaranteeSlotRequestService, guaranteeSlotService } from '@/services/guaranteeSlotService';
import { createRefundApprovedNotification } from '@/utils/notificationActions';
import { supabase } from '@/supabase';
import { smartCeil } from '@/utils/mathUtils';
import { KeenIcon } from '@/components';
import { formatDistanceToNow, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { GuaranteeNegotiationModal } from '@/components/campaign-modals/GuaranteeNegotiationModal';
import GuaranteeRejectModal from '@/components/guarantee-slots/GuaranteeRejectModal';
import GuaranteeApprovalModal from '@/components/guarantee-slots/GuaranteeApprovalModal';
import GuaranteeCompleteModal from '@/components/guarantee-slots/GuaranteeCompleteModal';
import GuaranteeRefundModal from '@/components/guarantee-slots/GuaranteeRefundModal';
import GuaranteeSlotDetailModal from '@/components/guarantee-slots/GuaranteeSlotDetailModal';
import GuaranteeRankCheckModal from '@/components/guarantee-slots/GuaranteeRankCheckModal';
import GuaranteeExcelExportModal from '@/components/guarantee-slots/GuaranteeExcelExportModal';
import GuaranteeRefundRequestModal from '@/components/guarantee-slots/GuaranteeRefundRequestModal';
import GuaranteeMonthlyStatistics, { GuaranteeMonthlyStatisticsRef } from './components/GuaranteeMonthlyStatistics';
import GuaranteeRequestApprovalModal from '@/components/guarantee-slots/GuaranteeRequestApprovalModal';
import GuaranteeRequestRejectModal from '@/components/guarantee-slots/GuaranteeRequestRejectModal';
import GuaranteeRequestCancelRejectModal from '@/components/guarantee-slots/GuaranteeRequestCancelRejectModal';
import * as XLSX from 'xlsx';
import { SERVICE_TYPE_LABELS, SERVICE_TYPE_ORDER } from '@/components/campaign-modals/types';
import type { ExcelColumn } from '@/components/guarantee-slots/GuaranteeExcelExportModal';
import { InquiryChatModal } from '@/components/inquiry';

// 타입 정의
interface GuaranteeQuoteRequest {
  id: string;
  campaign_id: number;
  user_id: string;
  distributor_id?: string;
  target_rank: number;
  guarantee_count: number;
  guarantee_period?: number;
  initial_budget?: number;
  status: 'requested' | 'negotiating' | 'accepted' | 'rejected' | 'expired' | 'purchased';
  final_daily_amount?: number;
  final_budget_type?: 'daily' | 'total';
  final_total_amount?: number;
  start_date?: string;
  end_date?: string;
  keyword_id?: number;
  input_data?: {
    mid?: string;
    url?: string;
    mainKeyword?: string;
    keyword1?: string;
    keyword2?: string;
    keyword3?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
  // 조인된 데이터
  campaigns?: {
    id: number;
    campaign_name: string;
    service_type: string;
    mat_id: string;
    min_guarantee_price?: number;
    max_guarantee_price?: number;
    guarantee_unit?: string;
    logo?: string;
    status?: string;
    refund_settings?: any;
  };
  users?: {
    id: string;
    email: string;
    full_name: string;
  };
  keywords?: {
    id: number;
    main_keyword?: string;
    keyword1?: string;
    keyword2?: string;
    keyword3?: string;
    url?: string;
    mid?: string;
  };
  guarantee_slots?: Array<{
    id: string;
    status: 'pending' | 'active' | 'completed' | 'cancelled' | 'rejected';
    approved_at?: string;
    approved_by?: string;
    rejected_at?: string;
    rejected_by?: string;
    rejection_reason?: string;
    start_date?: string;
    end_date?: string;
    refund_requests?: Array<{
      id: string;
      status: 'pending' | 'approved' | 'rejected' | 'pending_user_confirmation';
      refund_reason: string;
      approval_notes?: string;
      request_date: string;
      approval_date?: string;
      refund_amount?: number;
    }>;
  }>;
}

const GuaranteeQuotesPage: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuthContext();
  const { showSuccess, showError } = useCustomToast();

  // 함수 참조를 안정화하기 위한 ref
  const showErrorRef = useRef(showError);
  showErrorRef.current = showError;

  const [requests, setRequests] = useState<GuaranteeQuoteRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialLoadDone, setInitialLoadDone] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchStatus, setSearchStatus] = useState<string>('');
  const [searchServiceType, setSearchServiceType] = useState<string>('');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [searchDateFrom, setSearchDateFrom] = useState<string>('');
  const [searchDateTo, setSearchDateTo] = useState<string>('');
  const [searchSlotStatus, setSearchSlotStatus] = useState<string>('');
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [negotiationModal, setNegotiationModal] = useState<{
    open: boolean;
    requestId: string;
    requestData?: GuaranteeQuoteRequest;
  }>({
    open: false,
    requestId: ''
  });
  // 추가정보 팝오버 상태
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });

  // 모달 상태
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectSlotId, setRejectSlotId] = useState<string | null>(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvalSlotData, setApprovalSlotData] = useState<{
    slotId: string;
    campaignName?: string;
    guaranteeCount: number;
    guaranteeUnit?: string;
    startDate?: string;
    endDate?: string;
    targetRank?: number;
    workPeriod?: number;
    refundSettings?: any;
  } | null>(null);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completeSlotData, setCompleteSlotData] = useState<{
    slotId: string;
    campaignName?: string;
    campaignLogo?: string;
    serviceType?: string;
    slotStatus?: string;
    guaranteeCount: number;
    guaranteeUnit?: string;
    completedDays?: number;
    totalAmount?: number;
    negotiatedAmount?: number;
    startDate?: string;
    endDate?: string;
    actualCompletedCount?: number;
    refundSettings?: any;
  } | null>(null);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundSlotData, setRefundSlotData] = useState<{
    slotId: string;
    campaignName?: string;
    campaignLogo?: string;
    serviceType?: string;
    slotStatus?: string;
    guaranteeCount: number;
    guaranteeUnit?: string;
    completedDays?: number;
    totalAmount?: number;
    negotiatedAmount?: number;
    startDate?: string;
    endDate?: string;
    actualCompletedCount?: number;
    refundSettings?: any;
  } | null>(null);

  // 상세보기 모달 상태
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailRequestId, setDetailRequestId] = useState<string | null>(null);

  // 순위 확인 모달 상태
  const [rankCheckModalOpen, setRankCheckModalOpen] = useState(false);
  const [rankCheckSlotData, setRankCheckSlotData] = useState<{
    slotId: string;
    campaignName?: string;
    targetRank: number;
    keyword?: string;
  } | null>(null);

  // 엑셀 내보내기 모달 상태
  const [excelModalOpen, setExcelModalOpen] = useState<boolean>(false);

  // 요청 승인/반려 모달 상태
  const [requestApprovalModalOpen, setRequestApprovalModalOpen] = useState(false);
  const [requestApprovalData, setRequestApprovalData] = useState<{
    requestId: string;
    campaignName?: string;
  } | null>(null);
  const [requestRejectModalOpen, setRequestRejectModalOpen] = useState(false);
  const [requestRejectData, setRequestRejectData] = useState<{
    requestId: string;
    campaignName?: string;
  } | null>(null);
  const [requestCancelRejectModalOpen, setRequestCancelRejectModalOpen] = useState(false);
  const [requestCancelRejectData, setRequestCancelRejectData] = useState<{
    requestId: string;
    campaignName?: string;
  } | null>(null);
  const [requestProcessing, setRequestProcessing] = useState(false);

  // 문의 모달 상태
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);

  // 환불 요청 승인/거절 모달 상태
  const [refundRequestModalOpen, setRefundRequestModalOpen] = useState(false);
  const [refundRequestData, setRefundRequestData] = useState<{
    slotId: string;
    requestId: string;
    campaignName?: string;
    campaignLogo?: string;
    serviceType?: string;
    slotStatus?: string;
    refundAmount: number;
    refundReason: string;
    requesterName?: string;
    // 환불 계산용 추가 정보
    guaranteeCount?: number;
    guaranteeUnit?: string;
    completedDays?: number;
    totalAmount?: number;
    requestDate?: string;
    startDate?: string;
    endDate?: string;
    refundSettings?: any;
  } | null>(null);

  // 환불 정보 툴팁 상태
  const [openRefundInfoId, setOpenRefundInfoId] = useState<string | null>(null);
  const [refundTooltipPosition, setRefundTooltipPosition] = useState({ top: 0, left: 0 });

  const [inquiryData, setInquiryData] = useState<{
    slotId?: string;
    campaignId?: number;
    distributorId?: string;
    title?: string;
  } | null>(null);

  // 화면 크기 확인
  const isMediumScreen = useMediaQuery('(min-width: 768px)');
  const isLargeScreen = useMediaQuery('(min-width: 1024px)');
  const isExtraLargeScreen = useMediaQuery('(min-width: 1280px)');

  // 캠페인 관련 상태
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<any[]>([]);

  // MonthlyStatistics 컴포넌트 ref
  const monthlyStatisticsRef = useRef<GuaranteeMonthlyStatisticsRef>(null);

  // 키워드 툴팁 상태
  const [openKeywordTooltipId, setOpenKeywordTooltipId] = useState<string | null>(null);

  // 입력정보 툴팁 상태
  const [openInputDataTooltipId, setOpenInputDataTooltipId] = useState<string | null>(null);

  // 남은 일수 계산 함수
  const calculateRemainingDays = (endDate: string | null): number | null => {
    if (!endDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  // 남은 일수에 따른 색상 클래스 반환
  const getRemainingDaysColorClass = (days: number | null): string => {
    if (days === null) return 'text-gray-400';
    if (days < 0) return 'text-gray-500'; // 마감됨
    if (days === 0) return 'text-red-600 font-bold'; // 오늘 마감
    if (days <= 3) return 'text-orange-500 font-semibold'; // 3일 이하
    if (days <= 7) return 'text-yellow-600'; // 7일 이하
    return 'text-gray-700 dark:text-gray-300'; // 일반
  };

  // 남은 일수 표시 텍스트
  const getRemainingDaysText = (days: number | null): string => {
    if (days === null) return '-';
    if (days < 0) return '마감';
    if (days === 0) return '오늘';
    return `D-${days}`;
  };

  // 필터링된 요청 목록
  const filteredRequests = useMemo(() => {
    let filtered = requests;

    // 서비스 타입 필터
    if (searchServiceType) {
      filtered = filtered.filter(req => req.campaigns?.service_type === searchServiceType);
    }

    // 캠페인 필터
    if (selectedCampaign && selectedCampaign !== 'all') {
      filtered = filtered.filter(req => req.campaign_id?.toString() === selectedCampaign);
    }

    // 견적 상태 필터
    if (searchStatus) {
      filtered = filtered.filter(req => req.status === searchStatus);
    }

    // 슬롯 상태 필터
    if (searchSlotStatus) {
      filtered = filtered.filter(req => {
        // 슬롯이 있는 경우에만 필터링
        if (req.guarantee_slots && req.guarantee_slots.length > 0) {
          return req.guarantee_slots.some(slot => slot.status === searchSlotStatus);
        }
        // 슬롯이 없는 경우, pending 선택 시 포함
        return searchSlotStatus === 'pending';
      });
    }

    // 날짜 범위 필터
    if (searchDateFrom || searchDateTo) {
      filtered = filtered.filter(req => {
        const createdDate = new Date(req.created_at);
        if (searchDateFrom && createdDate < new Date(searchDateFrom)) return false;
        if (searchDateTo && createdDate > new Date(searchDateTo + 'T23:59:59')) return false;
        return true;
      });
    }

    // 검색어 필터
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(req =>
        req.campaign_id?.toString().includes(term) ||
        req.user_id?.toLowerCase().includes(term) ||
        req.campaigns?.campaign_name?.toLowerCase().includes(term) ||
        req.users?.email?.toLowerCase().includes(term) ||
        req.users?.full_name?.toLowerCase().includes(term) ||
        req.keywords?.main_keyword?.toLowerCase().includes(term) ||
        req.keywords?.keyword1?.toLowerCase().includes(term) ||
        req.keywords?.keyword2?.toLowerCase().includes(term) ||
        req.keywords?.keyword3?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [requests, searchServiceType, searchStatus, searchSlotStatus, searchDateFrom, searchDateTo, searchTerm, selectedCampaign]);

  // 사용자 정보를 안정화
  const userId = currentUser?.id;
  const userRole = currentUser?.role;

  // 견적 요청 목록 가져오기
  const fetchRequests = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      let allRequests: GuaranteeQuoteRequest[] = [];

      // ADMIN 그룹은 모든 요청을 볼 수 있음
      if (hasPermission(userRole, PERMISSION_GROUPS.ADMIN)) {
        const { data, error } = await guaranteeSlotRequestService.getRequests({});
        if (error) throw error;
        allRequests = data || [];

        // 사용자 정보 가져오기
        const userIds = [...new Set(allRequests.map(req => req.user_id))];
        if (userIds.length > 0) {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, email, full_name')
            .in('id', userIds);

          const usersMap = new Map((usersData || []).map(user => [user.id, user]));

          // 사용자 정보 매핑
          allRequests = allRequests.map(req => ({
            ...req,
            users: usersMap.get(req.user_id)
          }));
        }
      }
      // 총판은 자신이 distributor로 지정된 요청만 볼 수 있음
      else if (userRole === USER_ROLES.DISTRIBUTOR) {
        const { data, error } = await guaranteeSlotRequestService.getRequests({
          distributor_id: userId
        });
        if (error) throw error;
        allRequests = data || [];

        // 사용자 정보 가져오기
        const userIds = [...new Set(allRequests.map(req => req.user_id))];
        if (userIds.length > 0) {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, email, full_name')
            .in('id', userIds);

          const usersMap = new Map((usersData || []).map(user => [user.id, user]));

          // 사용자 정보 매핑
          allRequests = allRequests.map(req => ({
            ...req,
            users: usersMap.get(req.user_id)
          }));
        }
      }
      // 일반 사용자는 자신의 요청만
      else {
        const { data, error } = await guaranteeSlotRequestService.getRequests({
          user_id: userId
        });
        if (error) throw error;
        allRequests = data || [];

        // 사용자 정보 매핑 (자기 자신)
        allRequests = allRequests.map(req => ({
          ...req,
          users: {
            id: userId!,
            email: currentUser?.email!,
            full_name: currentUser?.full_name || '사용자'
          }
        }));
      }

      // 구매완료된 요청들의 슬롯 정보 가져오기
      const purchasedRequests = allRequests.filter(r => r.status === 'purchased');
      if (purchasedRequests.length > 0) {
        const requestIds = purchasedRequests.map(r => r.id);
        const { data: slotsData } = await supabase
          .from('guarantee_slots')
          .select('id, status, approved_at, approved_by, rejected_at, rejected_by, rejection_reason, start_date, end_date, request_id, refund_requests')
          .in('request_id', requestIds);

        if (slotsData) {
          // 슬롯 정보를 요청에 매핑
          const slotsMap = new Map<string, any[]>();
          slotsData.forEach(slot => {
            if (!slotsMap.has(slot.request_id)) {
              slotsMap.set(slot.request_id, []);
            }
            slotsMap.get(slot.request_id)!.push(slot);
          });

          // 요청에 슬롯 정보 추가
          allRequests = allRequests.map(req => ({
            ...req,
            guarantee_slots: slotsMap.get(req.id) || []
          }));
        }
      }

      setRequests(allRequests);
    } catch (error) {
      console.error('견적 요청 목록 조회 실패:', error);
      showErrorRef.current('견적 요청 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [userId, userRole]);

  // 캠페인 목록 가져오기
  const fetchCampaigns = useCallback(async () => {
    if (!userId) return;

    try {
      let query = supabase
        .from('campaigns')
        .select('*')
        .eq('slot_type', 'guarantee') // 보장형 캠페인만 필터링
        .order('campaign_name', { ascending: true });

      // 총판인 경우 자신의 캠페인만
      if (userRole === USER_ROLES.DISTRIBUTOR) {
        query = query.eq('mat_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setCampaigns(data || []);
    } catch (error) {
      console.error('캠페인 목록 조회 실패:', error);
    }
  }, [userId, userRole]);

  // 전체 새로고침 함수 (통계와 리스트 모두 새로고침)
  const handleRefreshAll = useCallback(() => {
    // 통계 새로고침
    if (monthlyStatisticsRef.current) {
      monthlyStatisticsRef.current.refresh();
    }
    // 리스트 새로고침
    fetchRequests();
  }, [fetchRequests]);

  // 총판 사용자가 가진 서비스 타입들을 계산
  const availableServiceTypes = useMemo(() => {
    // 총판이 아닌 경우 전체 서비스 타입 반환 (메뉴 순서대로)
    if (!currentUser || userRole !== USER_ROLES.DISTRIBUTOR) {
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
  }, [campaigns, currentUser, userRole]);

  // 서비스 타입에 따른 캠페인 필터링
  useEffect(() => {
    if (searchServiceType) {
      const filtered = campaigns.filter(c => c.service_type === searchServiceType);
      setFilteredCampaigns([{ id: 'all', campaign_name: '전체 캠페인' }, ...filtered]);
    } else {
      setFilteredCampaigns([{ id: 'all', campaign_name: '전체 캠페인' }, ...campaigns]);
    }
  }, [campaigns, searchServiceType]);

  // 초기 데이터 로드를 위한 useEffect
  useEffect(() => {
    // 이미 초기 로드가 완료되었으면 실행하지 않음
    if (initialLoadDone || authLoading || !userId) return;

    setInitialLoadDone(true);
    fetchRequests();
    fetchCampaigns();
  }, [authLoading, userId, initialLoadDone, fetchRequests, fetchCampaigns]);

  // 상태별 배지 색상
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'requested':
        return 'badge-info';
      case 'negotiating':
        return 'badge-warning';
      case 'accepted':
        return 'badge-success';
      case 'rejected':
        return 'badge-danger';
      case 'expired':
        return 'badge-gray';
      default:
        return 'badge-secondary';
    }
  };

  // 상태 라벨
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'requested':
        return '요청됨';
      case 'negotiating':
        return '협상중';
      case 'accepted':
        return '수락됨';
      case 'rejected':
        return '거절됨';
      case 'expired':
        return '만료됨';
      default:
        return status;
    }
  };

  // 가격 포맷
  const formatPrice = (price: number) => {
    if (price >= 100000000) {
      const billions = price / 100000000;
      return billions % 1 === 0 ? `${billions}억` : `${billions.toFixed(1)}억`;
    } else if (price >= 10000000) {
      const tenMillions = price / 10000000;
      return tenMillions % 1 === 0 ? `${tenMillions}천만` : `${tenMillions.toFixed(1)}천만`;
    } else if (price >= 10000) {
      const tenThousands = price / 10000;
      return tenThousands % 1 === 0 ? `${tenThousands}만` : `${tenThousands.toFixed(1)}만`;
    }
    return price.toLocaleString();
  };

  // 캠페인 상태 점 표시
  const getCampaignStatusDot = (campaign?: { status?: string }) => {
    if (!campaign?.status) return null;

    const statusConfig = {
      active: { color: 'bg-green-500', text: '진행중' },
      paused: { color: 'bg-yellow-500', text: '일시중지' },
      completed: { color: 'bg-gray-500', text: '종료' },
      pending: { color: 'bg-blue-500', text: '대기중' }
    };

    const config = statusConfig[campaign.status as keyof typeof statusConfig] ||
      { color: 'bg-gray-400', text: '알 수 없음' };

    return (
      <span
        className={`inline-block w-2 h-2 rounded-full ${config.color}`}
        title={config.text}
      />
    );
  };

  // 협상 모달 열기
  const handleOpenNegotiation = (request: GuaranteeQuoteRequest) => {
    setNegotiationModal({
      open: true,
      requestId: request.id,
      requestData: request
    });
  };

  // 협상 모달 닫기
  const handleCloseNegotiation = () => {
    setNegotiationModal({
      open: false,
      requestId: ''
    });
  };

  // 협상 상태 변경 시 목록 새로고침
  const handleNegotiationStatusChange = (status: string) => {
    fetchRequests(); // 목록 새로고침
  };

  // 캠페인 로고 가져오기
  const getCampaignLogo = (logo?: string): string | undefined => {
    if (!logo) return undefined;

    // animal/svg/ 형태의 경로면 /media/ 추가
    if (logo.includes('animal/svg/') && !logo.startsWith('/media/')) {
      return `/media/${logo}`;
    }
    // http로 시작하거나 /로 시작하면 그대로 사용
    if (logo.startsWith('http') || logo.startsWith('/')) {
      return logo;
    }
    // 단순 동물 이름이면 경로 구성
    if (!logo.includes('/')) {
      return `/media/animal/svg/${logo}.svg`;
    }
    return logo;
  };

  // 요청 승인 모달 열기
  const handleOpenApprovalModal = (requestId: string, campaignName?: string) => {
    setRequestApprovalData({ requestId, campaignName });
    setRequestApprovalModalOpen(true);
  };

  // 요청 승인
  const handleApproveRequest = async () => {
    if (!requestApprovalData) return;

    try {
      setRequestProcessing(true);
      const { error } = await guaranteeSlotRequestService.updateRequestStatus(requestApprovalData.requestId, 'accepted');

      if (error) {
        throw error;
      }

      showSuccess('견적 요청이 승인되었습니다.');
      setRequestApprovalModalOpen(false);
      setRequestApprovalData(null);
      fetchRequests();
    } catch (error) {
      console.error('승인 실패:', error);
      showError('요청 승인 중 오류가 발생했습니다.');
    } finally {
      setRequestProcessing(false);
    }
  };

  // 요청 반려 모달 열기
  const handleOpenRejectModal = (requestId: string, campaignName?: string) => {
    setRequestRejectData({ requestId, campaignName });
    setRequestRejectModalOpen(true);
  };

  // 요청 거절
  const handleRejectRequest = async () => {
    if (!requestRejectData) return;

    try {
      setRequestProcessing(true);
      const { error } = await guaranteeSlotRequestService.updateRequestStatus(requestRejectData.requestId, 'rejected');

      if (error) {
        throw error;
      }

      showSuccess('견적 요청이 거절되었습니다.');
      setRequestRejectModalOpen(false);
      setRequestRejectData(null);
      fetchRequests();
    } catch (error) {
      console.error('거절 실패:', error);
      showError('요청 거절 중 오류가 발생했습니다.');
    } finally {
      setRequestProcessing(false);
    }
  };

  // 요청 거절 취소 모달 열기
  const handleOpenCancelRejectModal = (requestId: string, campaignName?: string) => {
    setRequestCancelRejectData({ requestId, campaignName });
    setRequestCancelRejectModalOpen(true);
  };

  // 요청 거절 취소 처리
  const handleCancelRejectRequest = async () => {
    if (!requestCancelRejectData) return;

    try {
      setRequestProcessing(true);
      const { error } = await guaranteeSlotRequestService.updateRequestStatus(requestCancelRejectData.requestId, 'negotiating');

      if (error) {
        throw error;
      }

      showSuccess('거절이 취소되었습니다. 협상 상태로 돌아갔습니다.');
      setRequestCancelRejectModalOpen(false);
      setRequestCancelRejectData(null);
      fetchRequests();
    } catch (error) {
      console.error('거절 취소 실패:', error);
      showError('거절 취소 중 오류가 발생했습니다.');
    } finally {
      setRequestProcessing(false);
    }
  };

  // 슬롯 승인 모달 열기
  const handleApproveSlot = (slotId: string) => {
    const request = requests.find(req =>
      req.guarantee_slots?.some(slot => slot.id === slotId)
    );

    if (!request) {
      showError('요청 정보를 찾을 수 없습니다.');
      return;
    }

    // 날짜 계산
    let startDate: string;
    let endDate: string;

    if (request.start_date && request.end_date) {
      startDate = request.start_date;
      endDate = request.end_date;
    } else {
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() + 1);

      const end = new Date(start);
      const guaranteeUnit = request.campaigns?.guarantee_unit || 'daily';

      if (guaranteeUnit === 'daily') {
        end.setDate(start.getDate() + request.guarantee_count - 1);
      } else {
        end.setDate(start.getDate() + 29);
      }

      startDate = start.toISOString().split('T')[0];
      endDate = end.toISOString().split('T')[0];
    }

    setApprovalSlotData({
      slotId,
      campaignName: request.campaigns?.campaign_name,
      guaranteeCount: request.guarantee_count,
      guaranteeUnit: request.campaigns?.guarantee_unit,
      startDate,
      endDate,
      targetRank: request.target_rank,
      workPeriod: request.guarantee_period || request.guarantee_count,
      refundSettings: request.campaigns?.refund_settings
    });
    setApprovalModalOpen(true);
  };

  // 실제 슬롯 승인 처리
  const handleApproveConfirm = async () => {
    if (!currentUser || !approvalSlotData) return;

    try {
      const { data, error } = await guaranteeSlotService.approveSlot(approvalSlotData.slotId, currentUser.id!);

      if (error) {
        throw error;
      }

      showSuccess('보장형 슬롯이 승인되었습니다.');
      setApprovalModalOpen(false);
      setApprovalSlotData(null);
      fetchRequests();

      // 통계 새로고침
      if (monthlyStatisticsRef.current) {
        monthlyStatisticsRef.current.refresh();
      }
    } catch (error) {
      console.error('슬롯 승인 실패:', error);
      showError('슬롯 승인 중 오류가 발생했습니다.');
    }
  };

  // 슬롯 반려 모달 열기
  const handleRejectSlot = (slotId: string) => {
    setRejectSlotId(slotId);
    setRejectModalOpen(true);
  };

  // 실제 슬롯 반려 처리
  const handleRejectConfirm = async (reason: string) => {
    if (!currentUser || !rejectSlotId) return;

    try {
      const { data, error } = await guaranteeSlotService.rejectSlot(rejectSlotId, currentUser.id!, reason);

      if (error) {
        throw error;
      }

      showSuccess('보장형 슬롯이 반려되었습니다.');
      setRejectModalOpen(false);
      setRejectSlotId(null);
      fetchRequests();

      // 통계 새로고침
      if (monthlyStatisticsRef.current) {
        monthlyStatisticsRef.current.refresh();
      }
    } catch (error) {
      console.error('슬롯 반려 실패:', error);
      showError('슬롯 반려 중 오류가 발생했습니다.');
    }
  };

  // 슬롯 완료 모달 열기
  const handleCompleteSlot = (slotId: string) => {
    const request = requests.find(req =>
      req.guarantee_slots?.some(slot => slot.id === slotId)
    );

    if (!request) {
      showError('요청 정보를 찾을 수 없습니다.');
      return;
    }

    const slot = request.guarantee_slots?.find(s => s.id === slotId);
    if (!slot) return;

    // 완료된 일수 계산 (현재 날짜 기준)
    let completedDays = 0;
    if (slot.start_date) {
      const start = new Date(slot.start_date);
      const today = new Date();
      completedDays = Math.max(0, Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    }

    setCompleteSlotData({
      slotId,
      campaignName: request.campaigns?.campaign_name,
      campaignLogo: request.campaigns?.logo,
      serviceType: request.campaigns?.service_type,
      slotStatus: slot.status,
      guaranteeCount: request.guarantee_count,
      guaranteeUnit: request.campaigns?.guarantee_unit,
      completedDays,
      totalAmount: request.final_daily_amount ? smartCeil(request.final_daily_amount * request.guarantee_count * 1.1) : 0, // VAT 포함
      negotiatedAmount: request.final_daily_amount ? request.final_daily_amount * request.guarantee_count : 0, // VAT 제외 최종 협상금액
      startDate: slot.start_date,
      endDate: slot.end_date,
      actualCompletedCount: 0, // TODO: 실제 완료 횟수를 가져와야 함
      refundSettings: request.campaigns?.refund_settings
    });
    setCompleteModalOpen(true);
  };

  // 실제 슬롯 완료 처리
  const handleCompleteConfirm = async (workMemo: string, refundAmount?: number) => {
    if (!currentUser || !completeSlotData) return;

    try {
      const { data, error } = await guaranteeSlotService.completeSlot(
        completeSlotData.slotId,
        currentUser.id!,
        workMemo,
        refundAmount
      );

      if (error) {
        throw error;
      }

      if (refundAmount && refundAmount > 0) {
        showSuccess(`보장형 슬롯이 완료 처리되었습니다. 조기완료로 인해 ${refundAmount.toLocaleString()}원이 환불됩니다.`);
      } else {
        showSuccess('보장형 슬롯이 완료 처리되었습니다.');
      }

      setCompleteModalOpen(false);
      setCompleteSlotData(null);
      fetchRequests();

      // 통계 새로고침
      if (monthlyStatisticsRef.current) {
        monthlyStatisticsRef.current.refresh();
      }
    } catch (error) {
      console.error('슬롯 완료 실패:', error);
      showError('슬롯 완료 중 오류가 발생했습니다.');
    }
  };

  // 슬롯 환불 모달 열기
  const handleRefundSlot = (slotId: string) => {
    const request = requests.find(req =>
      req.guarantee_slots?.some(slot => slot.id === slotId)
    );

    if (!request) {
      showError('요청 정보를 찾을 수 없습니다.');
      return;
    }

    const slot = request.guarantee_slots?.find(s => s.id === slotId);
    if (!slot) return;

    // 완료된 일수 계산
    let completedDays = 0;
    if (slot.start_date) {
      const start = new Date(slot.start_date);
      const today = new Date();
      completedDays = Math.max(0, Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    }

    setRefundSlotData({
      slotId,
      campaignName: request.campaigns?.campaign_name,
      campaignLogo: request.campaigns?.logo,
      serviceType: request.campaigns?.service_type,
      slotStatus: slot.status,
      guaranteeCount: request.guarantee_count,
      guaranteeUnit: request.campaigns?.guarantee_unit,
      completedDays,
      totalAmount: request.final_daily_amount ? smartCeil(request.final_daily_amount * request.guarantee_count * 1.1) : 0, // VAT 포함
      negotiatedAmount: request.final_daily_amount ? request.final_daily_amount * request.guarantee_count : 0, // VAT 제외 최종 협상금액
      startDate: slot.start_date,
      endDate: slot.end_date,
      actualCompletedCount: 0, // TODO: 실제 완료 횟수를 가져와야 함
      refundSettings: request.campaigns?.refund_settings
    });
    setRefundModalOpen(true);
  };

  // 실제 슬롯 환불 처리
  const handleRefundConfirm = async (reason: string, refundAmount: number) => {
    if (!currentUser || !refundSlotData) return;

    try {
      const { data, error } = await guaranteeSlotService.refundSlot(
        refundSlotData.slotId,
        currentUser.id!,
        reason,
        refundAmount
      );

      if (error) {
        throw error;
      }

      showSuccess('환불 요청이 사용자에게 전송되었습니다. 사용자 확인 후 처리됩니다.');
      setRefundModalOpen(false);
      setRefundSlotData(null);
      fetchRequests();

      // 통계 새로고침
      if (monthlyStatisticsRef.current) {
        monthlyStatisticsRef.current.refresh();
      }
    } catch (error) {
      console.error('슬롯 환불 실패:', error);
      showError('슬롯 환불 중 오류가 발생했습니다.');
    }
  };

  // 환불 요청 승인/거절 모달 열기
  const handleRefundRequestModal = (slotId: string, refundRequest: any, request: GuaranteeQuoteRequest) => {
    const slot = request.guarantee_slots?.find(s => s.id === slotId);

    // 완료된 일수 계산
    let completedDays = 0;
    if (slot?.start_date) {
      const start = new Date(slot.start_date);
      const today = new Date();
      completedDays = Math.max(0, Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    }

    setRefundRequestData({
      slotId,
      requestId: refundRequest.id,
      campaignName: request.campaigns?.campaign_name,
      campaignLogo: request.campaigns?.logo,
      serviceType: request.campaigns?.service_type,
      slotStatus: slot?.status,
      refundAmount: refundRequest.refund_amount,
      refundReason: refundRequest.refund_reason,
      requesterName: request.users?.full_name,
      // 환불 계산용 추가 정보
      guaranteeCount: request.guarantee_count,
      guaranteeUnit: request.campaigns?.guarantee_unit,
      completedDays,
      totalAmount: request.final_daily_amount ? Math.ceil(request.final_daily_amount * request.guarantee_count * 1.1) : 0,
      startDate: slot?.start_date,
      endDate: slot?.end_date,
      requestDate: refundRequest.request_date,
      refundSettings: request.campaigns?.refund_settings
    });
    setRefundRequestModalOpen(true);
  };

  // 환불 요청 승인 처리
  const handleRefundRequestApprove = async (notes?: string) => {
    if (!currentUser || !refundRequestData) return;

    try {
      const { data, error } = await supabase.rpc('process_refund_request', {
        p_slot_id: refundRequestData.slotId,
        p_request_id: refundRequestData.requestId,
        p_distributor_id: currentUser.id,
        p_action: 'approve',
        p_notes: notes || null
      });

      if (error) {
        throw error;
      }

      // 환불 승인 알림 발송
      if (data?.user_id && refundRequestData.campaignName && refundRequestData.refundAmount) {
        const { createRefundApprovedNotification } = await import('@/utils/notificationActions');
        await createRefundApprovedNotification(
          data.user_id,
          refundRequestData.campaignName,
          refundRequestData.refundAmount,
          notes
        );
      }

      showSuccess('환불 요청이 승인되어 처리되었습니다.');
      setRefundRequestModalOpen(false);
      setRefundRequestData(null);
      fetchRequests();

      // 통계 새로고침
      if (monthlyStatisticsRef.current) {
        monthlyStatisticsRef.current.refresh();
      }
    } catch (error: any) {
      console.error('환불 요청 승인 실패:', error);
      showError(error.message || '환불 요청 승인 중 오류가 발생했습니다.');
    }
  };

  // 환불 요청 거절 처리
  const handleRefundRequestReject = async (notes: string) => {
    if (!currentUser || !refundRequestData) return;

    try {
      const { data, error } = await supabase.rpc('process_refund_request', {
        p_slot_id: refundRequestData.slotId,
        p_request_id: refundRequestData.requestId,
        p_distributor_id: currentUser.id,
        p_action: 'reject',
        p_notes: notes
      });

      if (error) {
        throw error;
      }

      // 사용자에게 환불 거절 알림 전송
      const request = requests.find(req =>
        req.guarantee_slots?.some(slot => slot.id === refundRequestData.slotId)
      );

      if (request?.user_id) {
        const { createRefundRejectedNotification } = await import('@/utils/notificationActions');
        await createRefundRejectedNotification(
          request.user_id,
          refundRequestData.campaignName || '캠페인',
          refundRequestData.refundAmount,
          notes
        );
      }

      showSuccess('환불 요청이 거절되었습니다.');
      setRefundRequestModalOpen(false);
      setRefundRequestData(null);
      fetchRequests();
    } catch (error: any) {
      console.error('환불 요청 거절 실패:', error);
      showError(error.message || '환불 요청 거절 중 오류가 발생했습니다.');
    }
  };

  // 엑셀 다운로드 처리
  const handleExcelExport = () => {
    setExcelModalOpen(true);
  };

  // 엑셀 내보내기 실행
  const handleExcelExportWithColumns = (columns: ExcelColumn[]) => {
    try {
      // 다운로드할 데이터 결정 (선택된 항목 또는 전체)
      const dataToExport = selectedRequests.length > 0
        ? filteredRequests.filter(req => selectedRequests.includes(req.id))
        : filteredRequests;

      if (dataToExport.length === 0) {
        showError('다운로드할 데이터가 없습니다.');
        return;
      }

      // 엑셀 데이터 준비
      const excelData = dataToExport.map(request => {
        const slot = request.guarantee_slots?.[0];
        const slotStatus = slot?.status || 'pending';

        // 진행 상태 한글 변환
        const getSlotStatusText = (status: string) => {
          const statusMap: Record<string, string> = {
            'pending': '진행 대기',
            'active': '진행중',
            'completed': '진행 완료',
            'cancelled': '진행 취소',
            'refunded': '환불 처리',
            'rejected': '진행 거절'
          };
          return statusMap[status] || status;
        };

        // 견적 상태 한글 변환
        const getRequestStatusText = (status: string) => {
          const statusMap: Record<string, string> = {
            'requested': '요청됨',
            'negotiating': '협상중',
            'accepted': '수락됨',
            'rejected': '거절됨',
            'expired': '만료됨',
            'purchased': '구매완료'
          };
          return statusMap[status] || status;
        };

        // 모든 가능한 필드를 객체로 준비
        const allData: Record<string, any> = {
          'campaign_name': request.campaigns?.campaign_name || '',
          'user_name': request.users?.full_name || '',
          'user_email': request.users?.email || request.user_id,
          'main_keyword': request.keywords?.main_keyword || request.input_data?.mainKeyword || '',
          'keyword1': request.keywords?.keyword1 || request.input_data?.keyword1 || '',
          'keyword2': request.keywords?.keyword2 || request.input_data?.keyword2 || '',
          'keyword3': request.keywords?.keyword3 || request.input_data?.keyword3 || '',
          'url': request.input_data?.url || '',
          'target_rank': request.target_rank,
          'guarantee_period': `${request.guarantee_count}${request.campaigns?.guarantee_unit || '일'}`,
          'initial_budget': request.initial_budget || 0,
          'final_amount': request.final_daily_amount || 0,
          'total_amount': (request.final_daily_amount || 0) * request.guarantee_count,
          'quote_status': getRequestStatusText(request.status),
          'slot_status': getSlotStatusText(slotStatus),
          'start_date': slot?.start_date ? format(new Date(slot.start_date), 'yyyy-MM-dd') : '',
          'end_date': slot?.end_date ? format(new Date(slot.end_date), 'yyyy-MM-dd') : '',
          'created_at': format(new Date(request.created_at), 'yyyy-MM-dd HH:mm:ss'),
          'updated_at': format(new Date(request.updated_at), 'yyyy-MM-dd HH:mm:ss'),
          'approved_at': slot?.approved_at ? format(new Date(slot.approved_at), 'yyyy-MM-dd HH:mm:ss') : '',
          'rejected_at': slot?.rejected_at ? format(new Date(slot.rejected_at), 'yyyy-MM-dd HH:mm:ss') : '',
          'rejection_reason': slot?.rejection_reason || ''
        };

        // 선택된 컴럼만 포함한 객체 생성
        const selectedData: Record<string, any> = {};
        columns.forEach(col => {
          if (col.enabled && allData.hasOwnProperty(col.field)) {
            selectedData[col.label] = allData[col.field];
          }
        });

        return selectedData;
      });

      // 워크시트 생성
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // 컬럼 너비 설정
      const columnWidths = columns
        .filter(col => col.enabled)
        .map(col => ({ wch: col.width || 15 }));
      worksheet['!cols'] = columnWidths;

      // 워크북 생성
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '보장형슬롯목록');

      // 파일명 생성
      const fileName = `보장형슬롯목록_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;

      // 엑셀 파일 다운로드
      XLSX.writeFile(workbook, fileName);

      showSuccess(`${dataToExport.length}개의 슬롯 데이터를 다운로드했습니다.`);
    } catch (error) {
      console.error('엑셀 다운로드 오류:', error);
      showError('엑셀 다운로드 중 오류가 발생했습니다.');
    }
  };

  // 로딩 상태
  if (authLoading || loading) {
    return (
      <CommonTemplate
        title="보장형 슬롯 관리"
        description="보장형 캠페인의 견적 요청 및 슬롯을 관리합니다."
        showPageMenu={false}
      >
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="spinner-border text-primary mb-4" role="status">
              <span className="visually-hidden">로딩 중...</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">데이터를 불러오는 중입니다...</p>
          </div>
        </div>
      </CommonTemplate>
    );
  }

  // 권한 체크
  if (!currentUser || !hasPermission(currentUser.role, PERMISSION_GROUPS.DISTRIBUTOR)) {
    return (
      <CommonTemplate
        title="보장형 슬롯 관리"
        description="보장형 캠페인의 견적 요청 및 슬롯을 관리합니다."
        showPageMenu={false}
      >
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <KeenIcon icon="shield-cross" className="text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">접근 권한이 없습니다</h3>
            <p className="text-gray-500">이 페이지는 총판 이상의 권한이 필요합니다.</p>
          </div>
        </div>
      </CommonTemplate>
    );
  }

  return (
    <CommonTemplate
      title="보장형 슬롯 관리"
      description="보장형 캠페인의 견적 요청 및 슬롯을 관리합니다."
      showPageMenu={false}
    >
      {/* 월간 통계 */}
      <GuaranteeMonthlyStatistics
        ref={monthlyStatisticsRef}
        selectedServiceType={searchServiceType}
        selectedCampaign={selectedCampaign}
        onRefresh={handleRefreshAll}
      />

      {/* 중요 안내사항 */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-1">보장형 슬롯 운영 안내</h4>
            <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
              <li>• 슬롯 승인 시 <strong>사용자의 캐시가 즉시 홀딩</strong>되며, 작업 완료 시까지 환불이 제한됩니다.</li>
              <li>• 목표 순위 달성 여부는 <strong>총판이 직접 확인</strong>하여 정산을 진행해야 합니다.</li>
              <li>• 보장 기간 내 목표를 달성하지 못할 경우 <strong>부분 환불</strong>이 가능합니다.</li>
            </ul>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
              * 보장형 슬롯은 일반 슬롯과 달리 사전에 비용이 홀딩되므로 신중한 승인이 필요합니다.
            </p>
          </div>
        </div>
      </div>

      {/* 검색 영역 */}
      <div className="card shadow-sm mb-3 sm:mb-4" inert={negotiationModal.open ? '' : undefined}>
        <div className="card-header px-3 sm:px-4 py-2.5 sm:py-3">
          <h3 className="card-title text-xs sm:text-sm">보장형 슬롯 검색</h3>
        </div>
        <div className="card-body px-3 sm:px-4 py-2.5 sm:py-3">
          {/* 데스크탑 검색 폼 */}
          <div className="hidden md:block space-y-3">
            {/* 첫 번째 줄 */}
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">서비스 타입</label>
                <select
                  className="select select-bordered select-sm w-full"
                  value={searchServiceType}
                  onChange={(e) => setSearchServiceType(e.target.value)}
                  disabled={negotiationModal.open || loading}
                >
                  <option value="">전체 서비스</option>
                  {availableServiceTypes.map((serviceType) => (
                    <option key={serviceType} value={serviceType}>
                      {SERVICE_TYPE_LABELS[serviceType] || serviceType}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-3">
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">캠페인</label>
                <select
                  className="select select-bordered select-sm w-full"
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                  disabled={negotiationModal.open || loading || filteredCampaigns.length <= 1}
                >
                  {filteredCampaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.campaign_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">견적 상태</label>
                <select
                  className="select select-bordered select-sm w-full"
                  value={searchStatus}
                  onChange={(e) => setSearchStatus(e.target.value)}
                  disabled={negotiationModal.open}
                >
                  <option value="">전체</option>
                  <option value="requested">요청됨</option>
                  <option value="negotiating">협상중</option>
                  <option value="accepted">수락됨</option>
                  <option value="rejected">거절됨</option>
                  <option value="expired">만료됨</option>
                  <option value="purchased">구매완료</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">슬롯 상태</label>
                <select
                  className="select select-bordered select-sm w-full"
                  value={searchSlotStatus}
                  onChange={(e) => setSearchSlotStatus(e.target.value)}
                  disabled={negotiationModal.open}
                >
                  <option value="">전체</option>
                  <option value="pending">대기중</option>
                  <option value="active">진행중</option>
                  <option value="completed">완료</option>
                  <option value="cancelled">취소됨</option>
                  <option value="rejected">거절됨</option>
                </select>
              </div>

              <div className="col-span-3 flex items-end">
                <button
                  className="btn btn-success btn-sm w-full"
                  onClick={handleExcelExport}
                  disabled={loading || negotiationModal.open}
                  title={selectedRequests.length > 0 ? `${selectedRequests.length}개 선택된 항목 다운로드` : `전체 ${filteredRequests.length}개 항목 다운로드`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    엑셀 다운로드
                    {selectedRequests.length > 0 && <span className="badge badge-sm badge-primary ml-1">{selectedRequests.length}</span>}
                  </span>
                </button>
              </div>
            </div>

            {/* 두 번째 줄 */}
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">시작일</label>
                <input
                  type="date"
                  className="input input-bordered input-sm w-full"
                  value={searchDateFrom}
                  onChange={(e) => setSearchDateFrom(e.target.value)}
                  disabled={negotiationModal.open}
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">종료일</label>
                <input
                  type="date"
                  className="input input-bordered input-sm w-full"
                  value={searchDateTo}
                  onChange={(e) => setSearchDateTo(e.target.value)}
                  disabled={negotiationModal.open}
                />
              </div>

              <div className="col-span-5">
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">검색어</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="이름, 상품명, URL, 키워드 검색"
                    className="input input-bordered input-sm w-full pr-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={negotiationModal.open}
                  />
                  {searchTerm && (
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setSearchTerm('')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="col-span-3 flex items-end">
                <button
                  className="btn btn-primary btn-sm w-full"
                  onClick={fetchRequests}
                  disabled={loading || negotiationModal.open}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="loading loading-spinner loading-xs"></span>
                      검색 중...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      검색하기
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 모바일 검색 폼 */}
          <div className="block md:hidden space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">서비스 타입</label>
                <select
                  className="select select-bordered select-sm w-full"
                  value={searchServiceType}
                  onChange={(e) => setSearchServiceType(e.target.value)}
                  disabled={negotiationModal.open}
                >
                  <option value="">전체 서비스</option>
                  {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">견적상태</label>
                <select
                  className="select select-bordered select-sm w-full"
                  value={searchStatus}
                  onChange={(e) => setSearchStatus(e.target.value)}
                  disabled={negotiationModal.open}
                >
                  <option value="">전체 상태</option>
                  <option value="requested">요청됨</option>
                  <option value="negotiating">협상중</option>
                  <option value="accepted">수락됨</option>
                  <option value="rejected">거절됨</option>
                  <option value="expired">만료됨</option>
                  <option value="purchased">구매완료</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">캠페인</label>
              <select
                className="select select-bordered select-sm w-full"
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                disabled={negotiationModal.open || loading || filteredCampaigns.length <= 1}
              >
                {filteredCampaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.campaign_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">슬롯상태</label>
              <select
                className="select select-bordered select-sm w-full"
                value={searchSlotStatus}
                onChange={(e) => setSearchSlotStatus(e.target.value)}
                disabled={negotiationModal.open}
              >
                <option value="">전체 진행</option>
                <option value="pending">진행 대기</option>
                <option value="active">진행중</option>
                <option value="completed">진행 완료</option>
                <option value="cancelled">진행 취소</option>
                <option value="refunded">환불 처리</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">검색어</label>
              <input
                type="text"
                placeholder="캠페인명, 요청자명, 키워드"
                className="input input-bordered input-sm w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={negotiationModal.open}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">시작일</label>
                <input
                  type="date"
                  className="input input-bordered input-sm w-full"
                  value={searchDateFrom}
                  onChange={(e) => setSearchDateFrom(e.target.value)}
                  disabled={negotiationModal.open}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">종료일</label>
                <input
                  type="date"
                  className="input input-bordered input-sm w-full"
                  value={searchDateTo}
                  onChange={(e) => setSearchDateTo(e.target.value)}
                  disabled={negotiationModal.open}
                />
              </div>
            </div>

            <button
              className="btn btn-success btn-sm w-full mb-2"
              onClick={handleExcelExport}
              disabled={loading || negotiationModal.open}
              title={selectedRequests.length > 0 ? `${selectedRequests.length}개 선택된 항목 다운로드` : `전체 ${filteredRequests.length}개 항목 다운로드`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                엑셀 다운로드
              </span>
            </button>

            <button
              className="btn btn-primary btn-sm w-full"
              onClick={fetchRequests}
              disabled={loading || negotiationModal.open}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="loading loading-spinner loading-xs"></span>
                  검색 중...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  검색하기
                </span>
              )}
            </button>
          </div>
        </div>
      </div>


      {/* 보장형 슬롯 목록 */}
      <div className="card" inert={negotiationModal.open ? '' : undefined}>
        <div className="card-header px-3 sm:px-6 py-3 sm:py-4">
          <h3 className="card-title text-sm sm:text-base">보장형 슬롯 목록</h3>
          <div className="card-toolbar">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <h3 className="card-title font-medium text-sm">
                전체 <span className="text-primary font-medium">{filteredRequests.length}</span> 건
              </h3>
            </div>
          </div>
        </div>
        <div className="card-body p-0 sm:p-2 md:p-3 lg:p-6">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-10">
              <KeenIcon icon="folder-open" className="text-6xl text-gray-300 mb-4" />
              <p className="text-gray-500">보장형 견적 요청이 없습니다.</p>
            </div>
          ) : (
            <>
              {/* 데스크탑 테이블 뷰 */}
              <div className="hidden md:block overflow-x-auto">
                <table className="table table-sm w-full">
                  <thead>
                    <tr className="text-gray-800 border-b border-gray-200">
                      <th className="w-10">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={selectedRequests.length === filteredRequests.length && filteredRequests.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRequests(filteredRequests.map(r => r.id));
                            } else {
                              setSelectedRequests([]);
                            }
                          }}
                          disabled={negotiationModal.open}
                        />
                      </th>
                      {isExtraLargeScreen && <th className="py-2 px-2 text-start font-medium">사용자</th>}
                      <th className="py-2 px-2 text-start font-medium">입력정보</th>
                      {isLargeScreen && <th className="py-2 px-2 text-center font-medium"></th>}
                      <th className="py-2 px-2 text-center font-medium">캠페인</th>
                      <th className="py-2 px-1 md:px-2 text-center font-medium">상태</th>
                      {isLargeScreen && <th className="py-2 px-2 text-center font-medium">기간</th>}
                      <th className="py-2 px-2 text-center font-medium">상세</th>
                      <th className="py-2 px-1 md:px-2 text-center font-medium">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="py-2 px-2">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={selectedRequests.includes(request.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRequests([...selectedRequests, request.id]);
                              } else {
                                setSelectedRequests(selectedRequests.filter(id => id !== request.id));
                              }
                            }}
                            disabled={negotiationModal.open}
                          />
                        </td>
                        {/* 사용자 */}
                        {isExtraLargeScreen && (
                          <td className="py-2 px-2 max-w-[120px]">
                            <div className="text-sm font-medium text-gray-900 truncate" title={request.users?.full_name || '사용자'}>
                              {request.users?.full_name || '사용자'}
                            </div>
                            <div className="text-xs text-gray-500 truncate" title={request.users?.email || request.user_id}>
                              {request.users?.email || request.user_id}
                            </div>
                          </td>
                        )}
                        {/* 입력정보 */}
                        <td className="py-2 px-1 md:px-2 max-w-[100px] md:max-w-[120px] lg:max-w-[150px]">
                          <div className="flex items-start gap-1 min-w-0">
                            {(() => {
                              // 중첩된 input_data 구조 확인
                              let mid = request.keywords?.mid || request.input_data?.mid;
                              let url = request.keywords?.url || request.input_data?.url;
                              let hasAdditionalData = false;
                              let additionalData: Record<string, any> = {};

                              // 중첩된 구조 확인 (keywords 배열 안의 input_data)
                              if (request.input_data?.keywords?.[0]?.input_data) {
                                const nestedData = request.input_data.keywords[0].input_data;
                                mid = nestedData.mid || mid;
                                url = nestedData.url || url;

                                // 추가 필드 확인
                                Object.entries(nestedData).forEach(([key, value]) => {
                                  if (!['mid', 'url', 'mainKeyword', 'keyword1', 'keyword2', 'keyword3', 'is_manual_input'].includes(key) && value) {
                                    hasAdditionalData = true;
                                    additionalData[key] = value;
                                  }
                                });
                              } else if (request.input_data) {
                                // 일반 input_data 구조에서 추가 필드 확인
                                Object.entries(request.input_data).forEach(([key, value]) => {
                                  if (!['mid', 'url', 'mainKeyword', 'keyword1', 'keyword2', 'keyword3', 'is_manual_input'].includes(key) && value) {
                                    hasAdditionalData = true;
                                    additionalData[key] = value;
                                  }
                                });
                              }

                              return (
                                <>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate" title={mid || '-'}>
                                      {mid || '-'}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                      <a
                                        href={url || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:underline"
                                        title={url || '-'}
                                        onClick={(e) => {
                                          if (!url) {
                                            e.preventDefault();
                                          }
                                        }}
                                      >
                                        {url || '-'}
                                      </a>
                                    </div>
                                  </div>
                                  <button
                                    className="flex-shrink-0 text-primary hover:text-primary-dark transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setPopoverPosition({
                                        top: rect.top - 10,
                                        left: rect.left + rect.width / 2
                                      });
                                      setOpenInputDataTooltipId(openInputDataTooltipId === request.id ? null : request.id);
                                    }}
                                  >
                                    <KeenIcon icon="information-2" className="text-base" />
                                  </button>
                                  {/* 입력정보 팝오버 */}
                                  {openInputDataTooltipId === request.id && ReactDOM.createPortal(
                                    <>
                                      <div
                                        className="fixed inset-0"
                                        style={{ zIndex: 9998 }}
                                        onClick={() => setOpenInputDataTooltipId(null)}
                                      />
                                      <div
                                        className="fixed bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm rounded-lg p-4 w-80 shadow-xl border border-gray-200 dark:border-gray-600"
                                        style={{
                                          zIndex: 99999,
                                          left: `${popoverPosition.left}px`,
                                          top: `${popoverPosition.top}px`,
                                          transform: 'translate(-50%, -100%)'
                                        }}
                                      >
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="font-medium">입력 정보</div>
                                          <button
                                            className="text-gray-400 hover:text-gray-600 transition-colors"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setOpenInputDataTooltipId(null);
                                            }}
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                        </div>
                                        <div className="space-y-2">
                                          {hasAdditionalData ? (
                                            Object.entries(additionalData).map(([key, value]) => {
                                              // 필드명 한글 변환 맵
                                              const fieldNameMap: Record<string, string> = {
                                                // 기본 필드
                                                'work_days': '작업일',
                                                'minimum_purchase': '최소 구매수',
                                                'url': 'URL',
                                                'mid': '상점 ID',
                                                'productName': '상품명',
                                                'mainKeyword': '메인 키워드',
                                                'main_keyword': '메인 키워드',
                                                'keywords': '서브 키워드',
                                                'keyword1': '키워드1',
                                                'keyword2': '키워드2',
                                                'keyword3': '키워드3',
                                                'quantity': '작업량',
                                                'dueDays': '작업기간',
                                                'due_days': '작업기간',
                                                'workCount': '작업수',
                                                'work_count': '작업수',
                                                'start_date': '시작일',
                                                'end_date': '종료일',

                                                // 가격 관련
                                                'price': '가격',
                                                'total_price': '총 가격',
                                                'unit_price': '단가',
                                                'daily_price': '일별 가격',

                                                // 보장 관련
                                                'guarantee_days': '보장일수',
                                                'guarantee_rank': '보장순위',
                                                'target_rank': '목표순위',
                                                'guarantee_info': '보장정보',

                                                // 캐시/포인트 관련
                                                'cash_amount': '캐시 지급액',
                                                'cash_info': '캐시 지급 안내',
                                                'point_amount': '포인트 금액',

                                                // 기타 정보
                                                'note': '비고',
                                                'description': '설명',
                                                'requirements': '요구사항',
                                                'additional_info': '추가정보',
                                                'work_period': '작업기간',
                                                'company_name': '회사명',
                                                'business_number': '사업자번호',
                                                'contact': '연락처',
                                                'email': '이메일',
                                                'phone': '전화번호',
                                                'mobile': '휴대폰번호',
                                                'address': '주소',
                                                'bank_name': '은행명',
                                                'account_number': '계좌번호',
                                                'account_holder': '예금주',

                                                // 상태 관련
                                                'status': '상태',
                                                'is_active': '활성화',
                                                'is_manual': '수동입력',
                                                'is_manual_input': '수동입력',

                                                // 날짜 관련
                                                'created_at': '생성일',
                                                'updated_at': '수정일',
                                                'completed_at': '완료일',
                                                'canceled_at': '취소일'
                                              };

                                              const displayKey = fieldNameMap[key] || key;

                                              return (
                                                <div key={key} className="flex gap-2">
                                                  <span className="text-gray-500 dark:text-gray-400 min-w-[80px]">{displayKey}:</span>
                                                  <span className="text-gray-900 dark:text-gray-100">
                                                    {typeof value === 'string' && value.startsWith('http') ? (
                                                      <a href={value} target="_blank" rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline break-all">
                                                        {value}
                                                      </a>
                                                    ) : (
                                                      <span className="break-all">{String(value)}</span>
                                                    )}
                                                  </span>
                                                </div>
                                              );
                                            })
                                          ) : (
                                            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                              입력 필드 데이터가 없습니다.
                                            </div>
                                          )}
                                        </div>
                                        {/* Arrow */}
                                        <div className="absolute left-1/2 transform -translate-x-1/2 bottom-0 translate-y-full">
                                          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white dark:border-t-gray-800"></div>
                                        </div>
                                      </div>
                                    </>,
                                    document.body
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </td>
                        {/* 키워드 */}
                        {isLargeScreen && (
                          <td className="py-2 px-2 text-center max-w-[100px]">
                            <div className="flex items-center justify-center gap-1 relative">
                              {(() => {
                                // 직접입력 체크
                                const isManualInput = request.keyword_id === 0 || request.input_data?.is_manual_input === true;

                                if (isManualInput) {
                                  return <span className="text-gray-400 text-sm">-</span>;
                                }

                                // 키워드 배열 생성
                                const keywordArray = [];
                                if (request.keywords?.main_keyword || request.input_data?.mainKeyword) {
                                  keywordArray.push(request.keywords?.main_keyword || request.input_data?.mainKeyword);
                                }
                                if (request.keywords?.keyword1 || request.input_data?.keyword1) keywordArray.push(request.keywords?.keyword1 || request.input_data?.keyword1);
                                if (request.keywords?.keyword2 || request.input_data?.keyword2) keywordArray.push(request.keywords?.keyword2 || request.input_data?.keyword2);
                                if (request.keywords?.keyword3 || request.input_data?.keyword3) keywordArray.push(request.keywords?.keyword3 || request.input_data?.keyword3);

                                if (keywordArray.length === 0) {
                                  return <span className="text-gray-400 text-sm">-</span>;
                                }

                                const mainKeyword = keywordArray[0];
                                const additionalCount = keywordArray.length - 1;

                                return (
                                  <>
                                    <span className="text-gray-900 dark:text-gray-100 font-medium text-sm truncate" title={mainKeyword}>
                                      {mainKeyword}
                                    </span>
                                    {additionalCount > 0 && (
                                      <>
                                        <button
                                          className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium bg-primary text-white rounded-full hover:bg-primary-dark transition-colors cursor-pointer min-w-[20px] h-5"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setPopoverPosition({
                                              top: rect.top - 10,
                                              left: rect.left + rect.width / 2
                                            });
                                            setOpenKeywordTooltipId(openKeywordTooltipId === request.id ? null : request.id);
                                          }}
                                        >
                                          +{additionalCount}
                                        </button>
                                        {/* Tooltip */}
                                        {openKeywordTooltipId === request.id && ReactDOM.createPortal(
                                          <>
                                            {/* 배경 클릭 시 닫기 */}
                                            <div
                                              className="fixed inset-0"
                                              style={{ zIndex: 9998 }}
                                              onClick={() => setOpenKeywordTooltipId(null)}
                                            />
                                            <div
                                              className="fixed bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg p-3 w-64 shadow-xl border border-gray-700 dark:border-gray-600"
                                              style={{
                                                zIndex: 99999,
                                                left: `${popoverPosition.left}px`,
                                                top: `${popoverPosition.top}px`,
                                                transform: 'translate(-50%, -100%)'
                                              }}
                                            >
                                              <div className="flex items-center justify-between mb-2">
                                                <div className="font-medium text-gray-100">전체 키워드</div>
                                                <button
                                                  className="text-gray-400 hover:text-gray-200 transition-colors"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenKeywordTooltipId(null);
                                                  }}
                                                >
                                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                  </svg>
                                                </button>
                                              </div>
                                              <div className="space-y-2">
                                                {/* 메인 키워드 */}
                                                <div>
                                                  <div className="text-xs text-gray-400 mb-1">메인 키워드</div>
                                                  <div className="flex flex-wrap gap-1">
                                                    <span className="px-2 py-0.5 text-xs rounded-md inline-block bg-blue-500/20 text-blue-200 font-medium">
                                                      {mainKeyword}
                                                    </span>
                                                  </div>
                                                </div>

                                                {/* 서브 키워드 */}
                                                {additionalCount > 0 && (
                                                  <>
                                                    <div className="border-t border-gray-700 dark:border-gray-600"></div>
                                                    <div>
                                                      <div className="text-xs text-gray-400 mb-1">서브 키워드</div>
                                                      <div className="flex flex-wrap gap-1">
                                                        {keywordArray.slice(1).map((keyword, index) => (
                                                          <span
                                                            key={index}
                                                            className={`px-2 py-0.5 text-xs rounded-md inline-block ${index % 4 === 0
                                                                ? 'bg-green-500/20 text-green-200'
                                                                : index % 4 === 1
                                                                  ? 'bg-purple-500/20 text-purple-200'
                                                                  : index % 4 === 2
                                                                    ? 'bg-orange-500/20 text-orange-200'
                                                                    : 'bg-pink-500/20 text-pink-200'
                                                              }`}
                                                          >
                                                            {keyword}
                                                          </span>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  </>
                                                )}
                                              </div>
                                              {/* Arrow */}
                                              <div className="absolute left-1/2 transform -translate-x-1/2 bottom-0 translate-y-full">
                                                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900 dark:border-t-gray-800"></div>
                                              </div>
                                            </div>
                                          </>,
                                          document.body
                                        )}
                                      </>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </td>
                        )}
                        {/* 캠페인 */}
                        <td className="py-2 px-1 md:px-2 text-center max-w-[90px] md:max-w-[110px] lg:max-w-[120px]">
                          <div className="flex items-center justify-center gap-1">
                            {getCampaignLogo(request.campaigns?.logo) && (
                              <img
                                src={getCampaignLogo(request.campaigns?.logo)}
                                alt="campaign logo"
                                className="w-4 h-4 object-contain rounded flex-shrink-0"
                              />
                            )}
                            <span className="text-xs text-gray-700 truncate" title={request.campaigns?.campaign_name || `캠페인 #${request.campaign_id}`}>
                              {request.campaigns?.campaign_name || `캠페인 #${request.campaign_id}`}
                            </span>
                            {getCampaignStatusDot(request.campaigns)}
                          </div>
                        </td>
                        {/* 상태 */}
                        <td className="py-2 px-1 md:px-2 text-center">
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            {request.status === 'requested' &&
                              <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-600">요청</span>}
                            {request.status === 'negotiating' &&
                              <span className="px-1.5 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700">협상중</span>}
                            {request.status === 'accepted' &&
                              <span className="px-1.5 py-0.5 text-xs rounded bg-blue-100 text-blue-700">구매결정</span>}
                            {request.status === 'rejected' &&
                              <span className="px-1.5 py-0.5 text-xs rounded bg-red-100 text-red-700">거절</span>}
                            {request.status === 'expired' &&
                              <span className="px-1.5 py-0.5 text-xs rounded bg-gray-600 text-white">만료</span>}
                            {request.status === 'purchased' && (
                              <>
                                {/* 슬롯이 없거나 pending/rejected 상태일 때 구매 상태 표시 (환불 요청이 없는 경우만) */}
                                {(!request.guarantee_slots?.[0] ||
                                  (request.guarantee_slots[0].status === 'pending' && !request.guarantee_slots[0].refund_requests?.length) ||
                                  request.guarantee_slots[0].status === 'rejected') && (
                                    <span className="px-1.5 py-0.5 text-xs rounded bg-green-100 text-green-700">구매</span>
                                  )}
                                {request.guarantee_slots?.[0] && (
                                  <>
                                    {(() => {
                                      // 환불 요청 상태 우선 확인
                                      const slot = request.guarantee_slots[0];
                                      const refundRequest = slot.refund_requests?.find(req => req.status === 'pending' || req.status === 'approved' || req.status === 'pending_user_confirmation' || (req.status === 'rejected' && slot.status !== 'active'));

                                      if (refundRequest) {
                                        // 환불 요청 상태가 있으면 환불 상태 표시
                                        switch (refundRequest.status) {
                                          case 'pending':
                                            return (
                                              <div className="flex items-center gap-1">
                                                <span className="px-1.5 py-0.5 text-xs rounded bg-red-100 text-red-700">
                                                  환불 검토중
                                                </span>
                                                <button
                                                  className="text-danger hover:text-danger-dark transition-colors"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setRefundTooltipPosition({
                                                      top: rect.top - 10,
                                                      left: rect.left + rect.width / 2
                                                    });
                                                    setOpenRefundInfoId(openRefundInfoId === request.id ? null : request.id);
                                                  }}
                                                  title="환불 정보"
                                                >
                                                  <KeenIcon icon="information-2" className="text-sm" />
                                                </button>
                                              </div>
                                            );
                                          case 'pending_user_confirmation':
                                            return (
                                              <div className="flex items-center gap-1">
                                                <span className="px-1.5 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700">
                                                  사용자 확인중
                                                </span>
                                                <button
                                                  className="text-warning hover:text-warning-dark transition-colors"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setRefundTooltipPosition({
                                                      top: rect.top - 10,
                                                      left: rect.left + rect.width / 2
                                                    });
                                                    setOpenRefundInfoId(openRefundInfoId === request.id ? null : request.id);
                                                  }}
                                                  title="환불 정보"
                                                >
                                                  <KeenIcon icon="information-2" className="text-sm" />
                                                </button>
                                              </div>
                                            );
                                          case 'approved':
                                            return (
                                              <div className="flex items-center gap-1">
                                                <span className="px-1.5 py-0.5 text-xs rounded bg-red-100 text-red-700">
                                                  환불승인
                                                </span>
                                                <button
                                                  className="text-danger hover:text-danger-dark transition-colors"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setRefundTooltipPosition({
                                                      top: rect.top - 10,
                                                      left: rect.left + rect.width / 2
                                                    });
                                                    setOpenRefundInfoId(openRefundInfoId === request.id ? null : request.id);
                                                  }}
                                                  title="환불 정보"
                                                >
                                                  <KeenIcon icon="information-2" className="text-sm" />
                                                </button>
                                              </div>
                                            );
                                          case 'rejected':
                                            return <span className="px-1.5 py-0.5 text-xs rounded bg-red-100 text-red-700 flex items-center gap-1">
                                              <KeenIcon icon="cross-circle" className="text-xs" />
                                              환불 거절됨
                                            </span>;
                                          default:
                                            return null;
                                        }
                                      }

                                      // 환불 요청이 없으면 기존 슬롯 상태 표시
                                      if (slot.status === 'pending') {
                                        return <span className="px-1.5 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700">대기</span>;
                                      }
                                      if (slot.status === 'active') {
                                        return <span className="px-1.5 py-0.5 text-xs rounded bg-blue-100 text-blue-700">진행중</span>;
                                      }
                                      if (slot.status === 'rejected') {
                                        return <span className="px-1.5 py-0.5 text-xs rounded bg-red-100 text-red-700">반려</span>;
                                      }
                                      if (slot.status === 'completed') {
                                        return <span className="px-1.5 py-0.5 text-xs rounded bg-gray-600 text-white">완료</span>;
                                      }
                                      return null;
                                    })()}
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        {/* 시작일/종료일 */}
                        {isLargeScreen && (
                          <td className="py-2 px-2 text-center">
                            <div className="text-xs">
                              {request.status === 'purchased' && request.guarantee_slots?.[0]?.status === 'active' && request.guarantee_slots[0].start_date ? (
                                <>
                                  <div className="text-green-600">{new Date(request.guarantee_slots[0].start_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</div>
                                  <div className="text-[10px] text-red-600">~{request.guarantee_slots[0].end_date ? new Date(request.guarantee_slots[0].end_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '-'}</div>
                                </>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </div>
                          </td>
                        )}
                        {/* 상세 */}
                        <td className="py-2 px-2 text-center">
                          <div className="flex gap-1 justify-center">
                            <button
                              className="btn btn-icon btn-sm btn-ghost text-blue-600"
                              onClick={() => {
                                setDetailRequestId(request.id);
                                setDetailModalOpen(true);
                              }}
                              title="상세보기"
                              disabled={negotiationModal.open}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            </button>
                            <button
                              className="btn btn-icon btn-sm btn-ghost text-amber-600"
                              onClick={() => handleOpenNegotiation(request)}
                              title="협상하기"
                              disabled={negotiationModal.open}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                              </svg>
                            </button>
                            {/* 1:1 문의 버튼 - 구매된 슬롯이 있을 때 표시 (환불승인 포함) */}
                            {request.status === 'purchased' && request.guarantee_slots?.[0] && (
                              <button
                                className="btn btn-icon btn-sm btn-ghost text-purple-600"
                                onClick={() => {
                                  setInquiryData({
                                    slotId: request.guarantee_slots![0].id,
                                    campaignId: request.campaign_id,
                                    distributorId: request.distributor_id,
                                    title: `보장형 슬롯 문의: ${request.campaigns?.campaign_name || '캠페인'}`
                                  });
                                  setInquiryModalOpen(true);
                                }}
                                title="1:1 문의"
                                disabled={negotiationModal.open}
                              >
                                <KeenIcon icon="messages" />
                              </button>
                            )}
                          </div>
                        </td>
                        {/* 작업 */}
                        <td className="py-2 px-0.5 md:px-1 text-center">
                          <div className="flex gap-0.5 justify-center flex-wrap">
                            {/* 총판 이상 권한인 경우 상태별 액션 버튼 표시 */}
                            {hasPermission(currentUser?.role, PERMISSION_GROUPS.DISTRIBUTOR) && (
                              <>
                                {request.status === 'requested' && (
                                  <button
                                    className="px-1.5 py-0.5 text-xs font-medium rounded bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                                    onClick={() => handleOpenNegotiation(request)}
                                    title="협상하기"
                                    disabled={negotiationModal.open}
                                  >
                                    협상
                                  </button>
                                )}
                                {request.status === 'negotiating' && (
                                  <button
                                    className="px-1.5 py-0.5 text-xs font-medium rounded bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                                    onClick={() => handleOpenNegotiation(request)}
                                    title="협상하기"
                                    disabled={negotiationModal.open}
                                  >
                                    협상
                                  </button>
                                )}
                                {request.status === 'accepted' && (
                                  <span className="text-xs text-gray-500">-</span>
                                )}
                                {request.status === 'rejected' && (
                                  <button
                                    className="px-1.5 py-0.5 text-xs font-medium rounded bg-gray-500 hover:bg-gray-600 text-white transition-colors"
                                    onClick={() => handleOpenCancelRejectModal(request.id, request.campaigns?.campaign_name)}
                                    title="거절 취소"
                                    disabled={negotiationModal.open}
                                  >
                                    거절 취소
                                  </button>
                                )}
                                {request.status === 'purchased' && request.guarantee_slots && request.guarantee_slots.length > 0 && (
                                  <>
                                    {request.guarantee_slots[0].status === 'pending' ? (
                                      <>
                                        <button
                                          className="px-1.5 py-0.5 text-xs font-medium rounded bg-green-500 hover:bg-green-600 text-white transition-colors"
                                          onClick={() => handleApproveSlot(request.guarantee_slots![0].id)}
                                          title="슬롯 승인"
                                          disabled={negotiationModal.open}
                                        >
                                          승인
                                        </button>
                                        <button
                                          className="px-1.5 py-0.5 text-xs font-medium rounded bg-red-500 hover:bg-red-600 text-white transition-colors"
                                          onClick={() => handleRejectSlot(request.guarantee_slots![0].id)}
                                          title="슬롯 반려"
                                          disabled={negotiationModal.open}
                                        >
                                          반려
                                        </button>
                                      </>
                                    ) : request.guarantee_slots[0].status === 'active' ? (
                                      <>
                                        {/* 작업 버튼들 */}
                                        <button
                                          className="px-1.5 py-0.5 text-xs font-medium rounded bg-green-500 hover:bg-green-600 text-white transition-colors"
                                          onClick={() => {
                                            setRankCheckSlotData({
                                              slotId: request.guarantee_slots![0].id,
                                              campaignName: request.campaigns?.campaign_name,
                                              targetRank: request.target_rank,
                                              keyword: request.keywords?.main_keyword || request.input_data?.mainKeyword
                                            });
                                            setRankCheckModalOpen(true);
                                          }}
                                          title="순위 확인"
                                          disabled={negotiationModal.open}
                                        >
                                          순위
                                        </button>
                                        {/* 사용자 확인중 상태가 아닐 때만 완료 버튼 표시 */}
                                        {!request.guarantee_slots[0].refund_requests?.find(req => req.status === 'pending_user_confirmation') && (
                                          <button
                                            className="px-1.5 py-0.5 text-xs font-medium rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                                            onClick={() => handleCompleteSlot(request.guarantee_slots![0].id)}
                                            title="슬롯 완료"
                                            disabled={negotiationModal.open}
                                          >
                                            완료
                                          </button>
                                        )}
                                        {/* 환불 요청이 없을 때만 환불 버튼 표시 */}
                                        {!request.guarantee_slots[0].refund_requests?.find(req => req.status === 'pending' || req.status === 'pending_user_confirmation') && (
                                          <button
                                            className="px-1.5 py-0.5 text-xs font-medium rounded bg-red-500 hover:bg-red-600 text-white transition-colors"
                                            onClick={() => handleRefundSlot(request.guarantee_slots![0].id)}
                                            title="환불 처리"
                                            disabled={negotiationModal.open}
                                          >
                                            환불
                                          </button>
                                        )}
                                        {/* 환불 요청 처리 버튼 */}
                                        {(() => {
                                          const pendingRequest = request.guarantee_slots[0].refund_requests?.find(req => req.status === 'pending');
                                          const userConfirmRequest = request.guarantee_slots[0].refund_requests?.find(req => req.status === 'pending_user_confirmation');

                                          if (pendingRequest) {
                                            return (
                                              <button
                                                className="px-1.5 py-0.5 text-xs font-medium rounded bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                                                onClick={() => {
                                                  handleRefundRequestModal(request.guarantee_slots![0].id, pendingRequest, request);
                                                }}
                                                title="환불 요청 처리"
                                                disabled={negotiationModal.open}
                                              >
                                                환불처리
                                              </button>
                                            );
                                          }

                                          if (userConfirmRequest) {
                                            return null;
                                          }

                                          return null;
                                        })()}
                                      </>
                                    ) : request.guarantee_slots[0].status === 'rejected' ? (
                                      <>
                                        <button
                                          className="px-1.5 py-0.5 text-xs font-medium rounded bg-info hover:bg-info-dark text-white transition-colors"
                                          onClick={() => handleApproveSlot(request.guarantee_slots![0].id)}
                                          title="대기로 변경"
                                          disabled={negotiationModal.open}
                                        >
                                          대기
                                        </button>
                                        <button
                                          className="px-1.5 py-0.5 text-xs font-medium rounded bg-red-500 hover:bg-red-600 text-white transition-colors"
                                          onClick={() => handleRejectSlot(request.guarantee_slots![0].id)}
                                          title="반려"
                                          disabled={negotiationModal.open}
                                        >
                                          반려
                                        </button>
                                      </>
                                    ) : request.guarantee_slots[0].status === 'completed' ? (
                                      <span className="text-xs text-gray-500">완료됨</span>
                                    ) : null}
                                  </>
                                )}
                                {request.status === 'purchased' && !request.guarantee_slots?.[0] && (
                                  <span className="text-xs text-gray-500">대기중</span>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 환불 정보 툴팁 */}
              {openRefundInfoId && (() => {
                const request = filteredRequests.find(r => r.id === openRefundInfoId);
                const refundRequest = request?.guarantee_slots?.[0]?.refund_requests?.find(
                  req => req.status === 'pending' || req.status === 'approved' || req.status === 'pending_user_confirmation'
                );

                if (!request || !refundRequest) return null;

                return ReactDOM.createPortal(
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setOpenRefundInfoId(null)}
                    />
                    <div
                      className="fixed z-50 bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-100 text-xs rounded p-3 w-72 max-w-xs shadow-xl border border-gray-700 dark:border-gray-600"
                      style={{
                        left: `${refundTooltipPosition.left}px`,
                        top: `${refundTooltipPosition.top}px`,
                        transform: 'translate(-50%, -100%)'
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-medium text-sm flex items-center gap-2">
                          {refundRequest.status === 'pending' ? (
                            <>
                              <KeenIcon icon="clock" className="text-orange-400" />
                              환불 검토 중
                            </>
                          ) : refundRequest.status === 'pending_user_confirmation' ? (
                            <>
                              <KeenIcon icon="notification-status" className="text-yellow-400" />
                              사용자 확인 대기 중
                            </>
                          ) : (
                            <>
                              <KeenIcon icon="check-circle" className="text-green-400" />
                              환불 승인됨
                            </>
                          )}
                        </div>
                        <button
                          className="text-gray-400 hover:text-gray-200 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenRefundInfoId(null);
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="space-y-2">
                        {refundRequest.status === 'pending' ? (
                          <>
                            <div className="flex items-center gap-2 text-orange-400 mb-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              <span className="font-medium">환불 검토 중</span>
                            </div>
                            <div>
                              <span className="text-gray-400">환불 사유:</span>
                              <div className="text-gray-200 mt-1">{refundRequest.refund_reason || '사유 없음'}</div>
                            </div>
                            <div>
                              <span className="text-gray-400">요청 금액:</span>
                              <div className="text-orange-400 font-medium mt-1">
                                {(() => {
                                  // 환불 금액이 있으면 사용, 없으면 직접 계산
                                  if (refundRequest.refund_amount && refundRequest.refund_amount > 0) {
                                    return Math.floor(refundRequest.refund_amount).toLocaleString();
                                  }
                                  // 직접 계산: 일별 단가 * 보장 일수 * 1.1 (VAT)
                                  const totalAmount = request.final_daily_amount && request.guarantee_count
                                    ? smartCeil(request.final_daily_amount * request.guarantee_count * 1.1)
                                    : 0;
                                  
                                  // 완료된 일수 계산
                                  const slot = request.guarantee_slots?.[0];
                                  const completedDays = (() => {
                                    if (!slot?.start_date) return 0;
                                    const start = new Date(slot.start_date);
                                    const today = new Date();
                                    const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                                    return Math.max(0, diffDays);
                                  })();
                                  
                                  // 완료된 금액 계산
                                  const completedAmount = request.final_daily_amount 
                                    ? smartCeil(request.final_daily_amount * completedDays * 1.1)
                                    : 0;
                                  
                                  // 환불 금액 = 총 금액 - 완료된 금액
                                  const refundAmount = Math.max(0, totalAmount - completedAmount);
                                  return refundAmount.toLocaleString();
                                })()}원
                              </div>
                            </div>
                            <div className="text-gray-400 text-xs">
                              신청일: {new Date(refundRequest.request_date).toLocaleDateString('ko-KR')}
                            </div>
                            <div className="bg-orange-900/30 border border-orange-700/50 rounded-md p-2 mt-2">
                              <div className="text-orange-300 text-xs">
                                💡 사용자가 환불을 요청했습니다. 검토 후 처리해 주세요.
                              </div>
                            </div>
                          </>
                        ) : refundRequest.status === 'pending_user_confirmation' ? (
                          <>
                            <div className="flex items-center gap-2 text-yellow-400 mb-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                              </svg>
                              <span className="font-medium">사용자 확인 대기 중</span>
                            </div>
                            <div>
                              <span className="text-gray-400">환불 사유:</span>
                              <div className="text-gray-200 mt-1">{refundRequest.refund_reason || '총판 요청'}</div>
                            </div>
                            <div>
                              <span className="text-gray-400">환불 예정 금액:</span>
                              <div className="text-yellow-400 font-medium mt-1">
                                {(() => {
                                  // 환불 금액이 있으면 사용, 없으면 직접 계산
                                  if (refundRequest.refund_amount && refundRequest.refund_amount > 0) {
                                    return Math.floor(refundRequest.refund_amount).toLocaleString();
                                  }
                                  // 직접 계산: 일별 단가 * 보장 일수 * 1.1 (VAT)
                                  const totalAmount = request.final_daily_amount && request.guarantee_count
                                    ? smartCeil(request.final_daily_amount * request.guarantee_count * 1.1)
                                    : 0;
                                  
                                  // 완료된 일수 계산
                                  const slot = request.guarantee_slots?.[0];
                                  const completedDays = (() => {
                                    if (!slot?.start_date) return 0;
                                    const start = new Date(slot.start_date);
                                    const today = new Date();
                                    const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                                    return Math.max(0, diffDays);
                                  })();
                                  
                                  // 완료된 금액 계산
                                  const completedAmount = request.final_daily_amount 
                                    ? smartCeil(request.final_daily_amount * completedDays * 1.1)
                                    : 0;
                                  
                                  // 환불 금액 = 총 금액 - 완료된 금액
                                  const refundAmount = Math.max(0, totalAmount - completedAmount);
                                  return refundAmount.toLocaleString();
                                })()}원
                              </div>
                            </div>
                            <div className="text-gray-400 text-xs">
                              요청일: {new Date(refundRequest.request_date).toLocaleDateString('ko-KR')}
                            </div>
                            <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-md p-2 mt-2">
                              <div className="text-yellow-300 text-xs">
                                ⚠️ 총판이 환불을 요청했습니다. 사용자의 확인을 기다리고 있습니다.
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 text-green-400 mb-1">
                              <KeenIcon icon="wallet" className="text-base" />
                              <span className="font-medium">환불 완료</span>
                            </div>
                            <div>
                              <span className="text-gray-400">환불 사유:</span>
                              <div className="text-gray-200 mt-1">{refundRequest.refund_reason || '사유 없음'}</div>
                            </div>
                            <div>
                              <span className="text-gray-400">환불 금액:</span>
                              <div className="text-green-400 font-medium mt-1">
                                {(() => {
                                  // 환불 금액이 있으면 사용, 없으면 직접 계산
                                  if (refundRequest.refund_amount && refundRequest.refund_amount > 0) {
                                    return Math.floor(refundRequest.refund_amount).toLocaleString();
                                  }
                                  // 직접 계산: 일별 단가 * 보장 일수 * 1.1 (VAT)
                                  const totalAmount = request.final_daily_amount && request.guarantee_count
                                    ? smartCeil(request.final_daily_amount * request.guarantee_count * 1.1)
                                    : 0;
                                  
                                  // 완료된 일수 계산
                                  const slot = request.guarantee_slots?.[0];
                                  const completedDays = (() => {
                                    if (!slot?.start_date) return 0;
                                    const start = new Date(slot.start_date);
                                    const today = new Date();
                                    const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                                    return Math.max(0, diffDays);
                                  })();
                                  
                                  // 완료된 금액 계산
                                  const completedAmount = request.final_daily_amount 
                                    ? smartCeil(request.final_daily_amount * completedDays * 1.1)
                                    : 0;
                                  
                                  // 환불 금액 = 총 금액 - 완료된 금액
                                  const refundAmount = Math.max(0, totalAmount - completedAmount);
                                  return refundAmount.toLocaleString();
                                })()}원
                              </div>
                            </div>
                            <div className="text-gray-400 text-xs">
                              신청일: {new Date(refundRequest.request_date).toLocaleDateString('ko-KR')}
                            </div>
                            {refundRequest.approval_date && (
                              <div className="text-gray-400 text-xs">
                                승인일: {new Date(refundRequest.approval_date).toLocaleDateString('ko-KR')}
                              </div>
                            )}
                            {refundRequest.approval_notes && (
                              <div className="mt-2">
                                <span className="text-gray-400 text-xs">승인 메시지:</span>
                                <div className="bg-green-900/30 border border-green-700/50 rounded-md p-2 mt-1">
                                  <div className="text-green-300 text-xs">
                                    {refundRequest.approval_notes}
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      {/* Arrow */}
                      <div className="absolute left-1/2 transform -translate-x-1/2 bottom-0 translate-y-full">
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900 dark:border-t-gray-800"></div>
                      </div>
                    </div>
                  </>,
                  document.body
                );
              })()}

              {/* 모바일 카드 뷰 */}
              <div className="block md:hidden space-y-4 p-4">
                {filteredRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                    {/* 체크박스와 기본 정보 */}
                    <div className="flex items-start gap-3 mb-3">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm mt-1"
                        checked={selectedRequests.includes(request.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRequests([...selectedRequests, request.id]);
                          } else {
                            setSelectedRequests(selectedRequests.filter(id => id !== request.id));
                          }
                        }}
                        disabled={negotiationModal.open}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getCampaignLogo(request.campaigns?.logo) && (
                            <img
                              src={getCampaignLogo(request.campaigns?.logo)}
                              alt="campaign logo"
                              className="w-8 h-8 object-contain rounded"
                            />
                          )}
                          <div>
                            <div className="font-medium text-sm">{request.campaigns?.campaign_name || `캠페인 #${request.campaign_id}`}</div>
                            <div className="text-xs text-gray-500">{request.keywords?.main_keyword || request.input_data?.mainKeyword || '-'}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">사용자:</span>
                            <div className="font-medium">{request.users?.full_name || '사용자'}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">보장:</span>
                            <div className={`font-medium ${request.campaigns?.guarantee_unit === '회' ? 'text-purple-600' : 'text-blue-600'}`}>
                              {request.guarantee_count}{request.campaigns?.guarantee_unit || '일'}
                            </div>
                          </div>
                        </div>

                        {/* 입력정보 및 키워드 */}
                        <div className="grid grid-cols-1 gap-2 text-xs mt-2">
                          <div>
                            <span className="text-gray-500">입력정보:</span>
                            <div className="font-medium">
                              <div>MID: {request.keywords?.mid || request.input_data?.mid || '-'}</div>
                              <div className="text-blue-600 hover:underline">
                                <a
                                  href={request.keywords?.url || request.input_data?.url || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => {
                                    if (!request.keywords?.url && !request.input_data?.url) {
                                      e.preventDefault();
                                    }
                                  }}
                                >
                                  {request.keywords?.url || request.input_data?.url || '-'}
                                </a>
                              </div>
                            </div>
                          </div>

                          {/* 키워드 */}
                          <div>
                            <span className="text-gray-500">키워드:</span>
                            <div className="font-medium">
                              {(() => {
                                const keywordArray = [];
                                if (request.keywords?.main_keyword || request.input_data?.mainKeyword) {
                                  keywordArray.push(request.keywords?.main_keyword || request.input_data?.mainKeyword);
                                }
                                if (request.keywords?.keyword1 || request.input_data?.keyword1) keywordArray.push(request.keywords?.keyword1 || request.input_data?.keyword1);
                                if (request.keywords?.keyword2 || request.input_data?.keyword2) keywordArray.push(request.keywords?.keyword2 || request.input_data?.keyword2);
                                if (request.keywords?.keyword3 || request.input_data?.keyword3) keywordArray.push(request.keywords?.keyword3 || request.input_data?.keyword3);

                                if (keywordArray.length === 0) {
                                  return '-';
                                }

                                return keywordArray.join(', ');
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* 기간 및 남은일 정보 */}
                        {request.status === 'purchased' && request.guarantee_slots?.[0]?.status === 'active' && request.guarantee_slots[0].start_date && (
                          <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                            <div>
                              <span className="text-gray-500">기간:</span>
                              <div>
                                <span className="text-green-600">{new Date(request.guarantee_slots[0].start_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                                <span className="text-gray-400 mx-1">~</span>
                                <span className="text-red-600">{request.guarantee_slots[0].end_date ? new Date(request.guarantee_slots[0].end_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '-'}</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500">남은일:</span>
                              <div className={getRemainingDaysColorClass(calculateRemainingDays(request.guarantee_slots[0].end_date || null))}>
                                {getRemainingDaysText(calculateRemainingDays(request.guarantee_slots[0].end_date || null))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 상태 레이블 */}
                    <div className="flex items-center gap-2 mb-3">
                      {request.status === 'requested' &&
                        <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">요청</span>}
                      {request.status === 'negotiating' &&
                        <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700">협상중</span>}
                      {request.status === 'accepted' &&
                        <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">승인</span>}
                      {request.status === 'rejected' &&
                        <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">거절</span>}
                      {request.status === 'expired' &&
                        <span className="px-2 py-1 text-xs rounded bg-gray-600 text-white">만료</span>}
                      {request.status === 'purchased' && (
                        <>
                          <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">구매완료</span>
                          {request.guarantee_slots?.[0] && (
                            <>
                              {request.guarantee_slots[0].status === 'pending' &&
                                <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700">대기</span>}
                              {request.guarantee_slots[0].status === 'active' &&
                                <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">활성</span>}
                              {request.guarantee_slots[0].status === 'rejected' &&
                                <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">반려</span>}
                              {request.guarantee_slots[0].status === 'completed' &&
                                <span className="px-2 py-1 text-xs rounded bg-gray-600 text-white">완료</span>}
                            </>
                          )}
                        </>
                      )}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex gap-2 justify-between">
                      <div className="flex gap-1">
                        <button
                          className="btn btn-icon btn-sm btn-ghost text-blue-600"
                          onClick={() => {
                            setDetailRequestId(request.id);
                            setDetailModalOpen(true);
                          }}
                          title="상세보기"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </button>
                        <button
                          className="btn btn-icon btn-sm btn-ghost text-amber-600"
                          onClick={() => handleOpenNegotiation(request)}
                          title="협상하기"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                          </svg>
                        </button>
                        {/* 1:1 문의 버튼 - 활성 슬롯이 있을 때만 표시 */}
                        {request.status === 'purchased' && request.guarantee_slots?.[0]?.status === 'active' && (
                          <button
                            className="btn btn-icon btn-sm btn-ghost text-purple-600"
                            onClick={() => {
                              setInquiryData({
                                slotId: request.guarantee_slots![0].id,
                                campaignId: request.campaign_id,
                                distributorId: request.distributor_id,
                                title: `보장형 슬롯 문의: ${request.campaigns?.campaign_name || '캠페인'}`
                              });
                              setInquiryModalOpen(true);
                            }}
                            title="1:1 문의"
                          >
                            <KeenIcon icon="messages" />
                          </button>
                        )}
                      </div>

                      {/* 작업 버튼 */}
                      {hasPermission(currentUser?.role, PERMISSION_GROUPS.DISTRIBUTOR) && (
                        <div className="flex gap-1 flex-wrap justify-end">
                          {request.status === 'requested' && (
                            <button
                              className="px-2 py-1 text-xs font-medium rounded bg-amber-500 hover:bg-amber-600 text-white"
                              onClick={() => handleOpenNegotiation(request)}
                            >
                              협상
                            </button>
                          )}
                          {request.status === 'negotiating' && (
                            <button
                              className="px-2 py-1 text-xs font-medium rounded bg-amber-500 hover:bg-amber-600 text-white"
                              onClick={() => handleOpenNegotiation(request)}
                            >
                              협상
                            </button>
                          )}
                          {request.status === 'rejected' && (
                            <button
                              className="px-2 py-1 text-xs font-medium rounded bg-gray-500 hover:bg-gray-600 text-white"
                              onClick={() => handleOpenCancelRejectModal(request.id, request.campaigns?.campaign_name)}
                            >
                              거절 취소
                            </button>
                          )}
                          {request.status === 'purchased' && request.guarantee_slots?.[0] && (
                            <>
                              {request.guarantee_slots[0].status === 'pending' && (
                                <>
                                  <button
                                    className="px-2 py-1 text-xs font-medium rounded bg-green-500 hover:bg-green-600 text-white"
                                    onClick={() => handleApproveSlot(request.guarantee_slots![0].id)}
                                  >
                                    승인
                                  </button>
                                  <button
                                    className="px-2 py-1 text-xs font-medium rounded bg-red-500 hover:bg-red-600 text-white"
                                    onClick={() => handleRejectSlot(request.guarantee_slots![0].id)}
                                  >
                                    반려
                                  </button>
                                </>
                              )}
                              {request.guarantee_slots[0].status === 'active' && (
                                <>
                                  <button
                                    className="px-2 py-1 text-xs font-medium rounded bg-green-500 hover:bg-green-600 text-white"
                                    onClick={() => {
                                      setRankCheckSlotData({
                                        slotId: request.guarantee_slots![0].id,
                                        campaignName: request.campaigns?.campaign_name,
                                        targetRank: request.target_rank,
                                        keyword: request.keywords?.main_keyword || request.input_data?.mainKeyword
                                      });
                                      setRankCheckModalOpen(true);
                                    }}
                                  >
                                    순위
                                  </button>
                                  <button
                                    className="px-2 py-1 text-xs font-medium rounded bg-blue-500 hover:bg-blue-600 text-white"
                                    onClick={() => handleCompleteSlot(request.guarantee_slots![0].id)}
                                  >
                                    완료
                                  </button>
                                  {/* 환불 요청이 없을 때만 환불 버튼 표시 */}
                                  {!request.guarantee_slots[0].refund_requests?.find(req => req.status === 'pending') && (
                                    <button
                                      className="px-2 py-1 text-xs font-medium rounded bg-red-500 hover:bg-red-600 text-white"
                                      onClick={() => handleRefundSlot(request.guarantee_slots![0].id)}
                                    >
                                      환불
                                    </button>
                                  )}
                                  {/* 환불 요청 처리 버튼 (pending 상태일 때만 추가) - 모바일 */}
                                  {(() => {
                                    const refundRequest = request.guarantee_slots[0].refund_requests?.find(req => req.status === 'pending');
                                    if (refundRequest) {
                                      return (
                                        <button
                                          className="px-2 py-1 text-xs font-medium rounded bg-orange-500 hover:bg-orange-600 text-white"
                                          onClick={() => {
                                            handleRefundRequestModal(request.guarantee_slots![0].id, refundRequest, request);
                                          }}
                                        >
                                          환불처리
                                        </button>
                                      );
                                    }
                                    return null;
                                  })()}
                                </>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 협상 모달 */}
      <GuaranteeNegotiationModal
        open={negotiationModal.open}
        onClose={handleCloseNegotiation}
        requestId={negotiationModal.requestId}
        requestData={negotiationModal.requestData}
        currentUserRole={currentUser?.role === USER_ROLES.DISTRIBUTOR ? 'distributor' : 'user'}
        onStatusChange={handleNegotiationStatusChange}
        isFromDistributorPage={true}
      />

      {/* 반려 모달 */}
      <GuaranteeRejectModal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setRejectSlotId(null);
        }}
        onConfirm={handleRejectConfirm}
      />

      {/* 승인 모달 */}
      <GuaranteeApprovalModal
        isOpen={approvalModalOpen}
        onClose={() => {
          setApprovalModalOpen(false);
          setApprovalSlotData(null);
        }}
        onConfirm={handleApproveConfirm}
        campaignName={approvalSlotData?.campaignName}
        guaranteeCount={approvalSlotData?.guaranteeCount || 0}
        guaranteeUnit={approvalSlotData?.guaranteeUnit}
        startDate={approvalSlotData?.startDate}
        endDate={approvalSlotData?.endDate}
        targetRank={approvalSlotData?.targetRank}
        workPeriod={approvalSlotData?.workPeriod}
        refundSettings={approvalSlotData?.refundSettings}
      />

      {/* 완료 모달 */}
      <GuaranteeCompleteModal
        isOpen={completeModalOpen}
        onClose={() => {
          setCompleteModalOpen(false);
          setCompleteSlotData(null);
        }}
        onConfirm={handleCompleteConfirm}
        campaignName={completeSlotData?.campaignName}
        campaignLogo={completeSlotData?.campaignLogo}
        serviceType={completeSlotData?.serviceType}
        slotStatus={completeSlotData?.slotStatus}
        guaranteeCount={completeSlotData?.guaranteeCount || 0}
        guaranteeUnit={completeSlotData?.guaranteeUnit}
        completedDays={completeSlotData?.completedDays}
        totalAmount={completeSlotData?.totalAmount}
        startDate={completeSlotData?.startDate}
        endDate={completeSlotData?.endDate}
        actualCompletedCount={completeSlotData?.actualCompletedCount}
        refundSettings={completeSlotData?.refundSettings}
        currentUserRole="distributor"
      />

      {/* 환불 모달 */}
      <GuaranteeRefundModal
        isOpen={refundModalOpen}
        onClose={() => {
          setRefundModalOpen(false);
          setRefundSlotData(null);
        }}
        onConfirm={handleRefundConfirm}
        campaignName={refundSlotData?.campaignName}
        guaranteeCount={refundSlotData?.guaranteeCount || 0}
        guaranteeUnit={refundSlotData?.guaranteeUnit}
        completedDays={refundSlotData?.completedDays}
        totalAmount={refundSlotData?.totalAmount}
        negotiatedAmount={refundSlotData?.negotiatedAmount}
        startDate={refundSlotData?.startDate}
        endDate={refundSlotData?.endDate}
        actualCompletedCount={refundSlotData?.actualCompletedCount}
        refundSettings={refundSlotData?.refundSettings}
        campaignLogo={refundSlotData?.campaignLogo}
        serviceType={refundSlotData?.serviceType}
        slotStatus={refundSlotData?.slotStatus}
        currentUserRole="distributor"
      />

      {/* 상세보기 모달 */}
      <GuaranteeSlotDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setDetailRequestId(null);
        }}
        requestId={detailRequestId || ''}
      />

      {/* 순위 확인 모달 */}
      <GuaranteeRankCheckModal
        isOpen={rankCheckModalOpen}
        onClose={() => {
          setRankCheckModalOpen(false);
          setRankCheckSlotData(null);
        }}
        slotId={rankCheckSlotData?.slotId || ''}
        campaignName={rankCheckSlotData?.campaignName}
        targetRank={rankCheckSlotData?.targetRank || 1}
        keyword={rankCheckSlotData?.keyword}
      />

      {/* 엑셀 내보내기 모달 */}
      <GuaranteeExcelExportModal
        isOpen={excelModalOpen}
        onClose={() => setExcelModalOpen(false)}
        onExport={handleExcelExportWithColumns}
      />

      {/* 요청 승인 확인 모달 */}
      <GuaranteeRequestApprovalModal
        isOpen={requestApprovalModalOpen}
        onClose={() => {
          setRequestApprovalModalOpen(false);
          setRequestApprovalData(null);
        }}
        onConfirm={handleApproveRequest}
        campaignName={requestApprovalData?.campaignName}
        isLoading={requestProcessing}
      />

      {/* 요청 반려 확인 모달 */}
      <GuaranteeRequestRejectModal
        isOpen={requestRejectModalOpen}
        onClose={() => {
          setRequestRejectModalOpen(false);
          setRequestRejectData(null);
        }}
        onConfirm={handleRejectRequest}
        campaignName={requestRejectData?.campaignName}
        isLoading={requestProcessing}
      />

      {/* 요청 거절 취소 확인 모달 */}
      <GuaranteeRequestCancelRejectModal
        isOpen={requestCancelRejectModalOpen}
        onClose={() => {
          setRequestCancelRejectModalOpen(false);
          setRequestCancelRejectData(null);
        }}
        onConfirm={handleCancelRejectRequest}
        campaignName={requestCancelRejectData?.campaignName}
        isLoading={requestProcessing}
      />

      {/* 환불 요청 승인/거절 모달 */}
      <GuaranteeRefundRequestModal
        isOpen={refundRequestModalOpen}
        onClose={() => {
          setRefundRequestModalOpen(false);
          setRefundRequestData(null);
        }}
        onApprove={handleRefundRequestApprove}
        onReject={handleRefundRequestReject}
        campaignName={refundRequestData?.campaignName}
        campaignLogo={refundRequestData?.campaignLogo}
        serviceType={refundRequestData?.serviceType}
        slotStatus={refundRequestData?.slotStatus}
        refundAmount={refundRequestData?.refundAmount || 0}
        refundReason={refundRequestData?.refundReason || ''}
        requesterName={refundRequestData?.requesterName}
        guaranteeCount={refundRequestData?.guaranteeCount}
        guaranteeUnit={refundRequestData?.guaranteeUnit}
        completedDays={refundRequestData?.completedDays}
        totalAmount={refundRequestData?.totalAmount}
        startDate={refundRequestData?.startDate}
        endDate={refundRequestData?.endDate}
        requestDate={refundRequestData?.requestDate}
        refundSettings={refundRequestData?.refundSettings}
        currentUserRole="distributor"
      />

      {/* 1:1 문의 모달 */}
      <InquiryChatModal
        open={inquiryModalOpen}
        onClose={() => {
          setInquiryModalOpen(false);
          setInquiryData(null);
        }}
        guaranteeSlotId={inquiryData?.slotId}  // 보장형 슬롯 ID로 전달
        campaignId={inquiryData?.campaignId}
        distributorId={inquiryData?.distributorId}
        initialTitle={inquiryData?.title}
      />
    </CommonTemplate>
  );
};

export { GuaranteeQuotesPage };