import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useAuthContext } from '@/auth';
import { CommonTemplate } from '@/components/pageTemplate';
import { useCustomToast } from '@/hooks/useCustomToast';
import { hasPermission, PERMISSION_GROUPS, USER_ROLES } from '@/config/roles.config';
import { guaranteeSlotRequestService, guaranteeSlotService } from '@/services/guaranteeSlotService';
import { supabase } from '@/supabase';
import { KeenIcon } from '@/components';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { GuaranteeNegotiationModal } from '@/components/campaign-modals/GuaranteeNegotiationModal';
import GuaranteeRejectModal from '@/components/guarantee-slots/GuaranteeRejectModal';
import GuaranteeApprovalModal from '@/components/guarantee-slots/GuaranteeApprovalModal';
import GuaranteeCompleteModal from '@/components/guarantee-slots/GuaranteeCompleteModal';
import GuaranteeRefundModal from '@/components/guarantee-slots/GuaranteeRefundModal';

// 타입 정의
interface GuaranteeQuoteRequest {
  id: string;
  campaign_id: number;
  user_id: string;
  distributor_id?: string;
  target_rank: number;
  guarantee_count: number;
  initial_budget?: number;
  status: 'requested' | 'negotiating' | 'accepted' | 'rejected' | 'expired' | 'purchased';
  final_daily_amount?: number;
  start_date?: string;
  end_date?: string;
  keyword_id?: number;
  input_data?: Record<string, any>;
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
  }>;
}

const GuaranteeQuotesPage: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuthContext();
  const { showSuccess, showError } = useCustomToast();

  const [requests, setRequests] = useState<GuaranteeQuoteRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchStatus, setSearchStatus] = useState<string>('');
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
  } | null>(null);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completeSlotData, setCompleteSlotData] = useState<{
    slotId: string;
    campaignName?: string;
    guaranteeCount: number;
    guaranteeUnit?: string;
    completedDays?: number;
  } | null>(null);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundSlotData, setRefundSlotData] = useState<{
    slotId: string;
    campaignName?: string;
    guaranteeCount: number;
    guaranteeUnit?: string;
    completedDays?: number;
    totalAmount?: number;
  } | null>(null);

  // 필터링된 요청 목록
  const filteredRequests = useMemo(() => {
    let filtered = requests;

    // 상태 필터
    if (searchStatus) {
      filtered = filtered.filter(req => req.status === searchStatus);
    }

    // 검색어 필터
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(req =>
        req.campaign_id?.toString().includes(term) ||
        req.user_id?.toLowerCase().includes(term) ||
        req.campaigns?.campaign_name?.toLowerCase().includes(term) ||
        req.users?.email?.toLowerCase().includes(term) ||
        req.users?.full_name?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [requests, searchStatus, searchTerm]);

  // 견적 요청 목록 가져오기
  const fetchRequests = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      let allRequests: GuaranteeQuoteRequest[] = [];

      // ADMIN 그룹은 모든 요청을 볼 수 있음
      if (hasPermission(currentUser.role, PERMISSION_GROUPS.ADMIN)) {
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
      else if (currentUser.role === USER_ROLES.DISTRIBUTOR) {
        const { data, error } = await guaranteeSlotRequestService.getRequests({
          distributor_id: currentUser.id
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
          user_id: currentUser.id
        });
        if (error) throw error;
        allRequests = data || [];

        // 사용자 정보 매핑 (자기 자신)
        allRequests = allRequests.map(req => ({
          ...req,
          users: {
            id: currentUser.id!,
            email: currentUser.email!,
            full_name: currentUser.full_name || '사용자'
          }
        }));
      }

      // 구매완료된 요청들의 슬롯 정보 가져오기
      const purchasedRequests = allRequests.filter(r => r.status === 'purchased');
      if (purchasedRequests.length > 0) {
        const requestIds = purchasedRequests.map(r => r.id);
        const { data: slotsData } = await supabase
          .from('guarantee_slots')
          .select('id, status, approved_at, approved_by, rejected_at, rejected_by, rejection_reason, start_date, end_date, request_id')
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
      showError('견적 요청 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, showError]);

  useEffect(() => {
    if (!authLoading && currentUser) {
      fetchRequests();
    }
  }, [authLoading, currentUser, fetchRequests]);

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

  // 요청 승인
  const handleApproveRequest = async (requestId: string) => {
    try {
      const { error } = await guaranteeSlotRequestService.updateRequestStatus(requestId, 'accepted');

      if (error) {
        throw error;
      }

      showSuccess('견적 요청이 승인되었습니다.');
      fetchRequests();
    } catch (error) {
      console.error('승인 실패:', error);
      showError('요청 승인 중 오류가 발생했습니다.');
    }
  };

  // 요청 거절
  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await guaranteeSlotRequestService.updateRequestStatus(requestId, 'rejected');

      if (error) {
        throw error;
      }

      showSuccess('견적 요청이 거절되었습니다.');
      fetchRequests();
    } catch (error) {
      console.error('거절 실패:', error);
      showError('요청 거절 중 오류가 발생했습니다.');
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
      endDate
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
      completedDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }

    setCompleteSlotData({
      slotId,
      campaignName: request.campaigns?.campaign_name,
      guaranteeCount: request.guarantee_count,
      guaranteeUnit: request.campaigns?.guarantee_unit,
      completedDays
    });
    setCompleteModalOpen(true);
  };

  // 실제 슬롯 완료 처리
  const handleCompleteConfirm = async (workMemo: string) => {
    if (!currentUser || !completeSlotData) return;

    try {
      // TODO: 완료 처리 API 구현 필요
      showSuccess('슬롯 완료 처리 기능이 곧 구현됩니다.');
      setCompleteModalOpen(false);
      setCompleteSlotData(null);
      // fetchRequests();
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
      completedDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }

    setRefundSlotData({
      slotId,
      campaignName: request.campaigns?.campaign_name,
      guaranteeCount: request.guarantee_count,
      guaranteeUnit: request.campaigns?.guarantee_unit,
      completedDays,
      totalAmount: request.final_daily_amount ? request.final_daily_amount * request.guarantee_count : 0
    });
    setRefundModalOpen(true);
  };

  // 실제 슬롯 환불 처리
  const handleRefundConfirm = async (reason: string) => {
    if (!currentUser || !refundSlotData) return;

    try {
      // TODO: 환불 처리 API 구현 필요
      showSuccess('슬롯 환불 처리 기능이 곧 구현됩니다.');
      setRefundModalOpen(false);
      setRefundSlotData(null);
      // fetchRequests();
    } catch (error) {
      console.error('슬롯 환불 실패:', error);
      showError('슬롯 환불 중 오류가 발생했습니다.');
    }
  };

  // 로딩 상태
  if (authLoading || loading) {
    return (
      <CommonTemplate
        title="견적 요청 목록"
        description="보장형 캠페인 견적 요청 관리"
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
        title="견적 요청 목록"
        description="보장형 캠페인 견적 요청 관리"
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
      title="보장형 캠페인 관리"
      description="보장형 캠페인 견적 요청 및 승인 관리"
      showPageMenu={false}
    >
      {/* 검색 영역 */}
      <div className="card mb-6" inert={negotiationModal.open ? '' : undefined}>
        <div className="card-header">
          <h3 className="card-title">보장형 캠페인 검색</h3>
        </div>
        <div className="card-body">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="w-full lg:w-48">
              <select
                className="select"
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
              </select>
            </div>
            <div className="flex-1">
              <input
                type="text"
                className="input"
                placeholder="캠페인명, 요청자명, 이메일로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={negotiationModal.open}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={fetchRequests}
              disabled={loading || negotiationModal.open}
            >
              <KeenIcon icon="magnifier" className="me-2" />
              검색
            </button>
          </div>
        </div>
      </div>

      {/* 일괄 작업 버튼 */}
      {currentUser?.role === USER_ROLES.DISTRIBUTOR && selectedRequests.length > 0 && (
        <div className="mb-4 flex gap-2" inert={negotiationModal.open ? '' : undefined}>
          <button
            className="btn btn-sm btn-success"
            onClick={() => {
              // 선택된 요청들 일괄 승인
              selectedRequests.forEach(id => {
                const request = filteredRequests.find(r => r.id === id);
                if (request && (request.status === 'requested' || request.status === 'negotiating')) {
                  handleApproveRequest(id);
                }
              });
              setSelectedRequests([]);
            }}
            disabled={negotiationModal.open}
          >
            <KeenIcon icon="check-circle" className="me-2" />
            선택 항목 일괄 승인 ({selectedRequests.length}건)
          </button>
          <button
            className="btn btn-sm btn-danger"
            onClick={() => {
              // 선택된 요청들 일괄 거절
              selectedRequests.forEach(id => {
                const request = filteredRequests.find(r => r.id === id);
                if (request && (request.status === 'requested' || request.status === 'negotiating')) {
                  handleRejectRequest(id);
                }
              });
              setSelectedRequests([]);
            }}
            disabled={negotiationModal.open}
          >
            <KeenIcon icon="cross-circle" className="me-2" />
            선택 항목 일괄 거절 ({selectedRequests.length}건)
          </button>
        </div>
      )}

      {/* 보장형 슬롯 목록 */}
      <div className="card" inert={negotiationModal.open ? '' : undefined}>
        <div className="card-header">
          <h3 className="card-title">보장형 슬롯 목록 ({filteredRequests.length}건)</h3>
        </div>
        <div className="card-body">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-10">
              <KeenIcon icon="folder-open" className="text-6xl text-gray-300 mb-4" />
              <p className="text-gray-500">보장형 슬롯이 없습니다.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-rounded table-striped table-hover">
                <thead>
                  <tr className="fw-bold fs-6 text-gray-800">
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
                    <th className="py-3 px-3 text-start font-medium">사용자</th>
                    <th className="py-3 px-3 text-center font-medium">키워드</th>
                    <th className="py-3 px-3 text-center font-medium">보장기간</th>
                    <th className="py-3 px-3 text-center font-medium">작업기간</th>
                    <th className="py-3 px-3 text-center font-medium">캠페인</th>
                    <th className="py-3 px-3 text-center font-medium">상태</th>
                    <th className="py-3 px-3 text-center font-medium">추가정보</th>
                    <th className="py-3 px-3 text-center font-medium">상세/협상</th>
                    <th className="py-3 px-3 text-center font-medium">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="py-3 px-3">
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
                      <td className="py-3 px-3">
                        <div>
                          <div className="font-medium text-gray-900">{request.users?.full_name || '사용자'}</div>
                          <div className="text-xs text-gray-500">{request.users?.email || request.user_id}</div>
                        </div>
                      </td>
                      {/* 키워드 */}
                      <td className="py-3 px-3 text-center">
                        <div className="text-gray-900">
                          {request.keywords?.main_keyword || request.input_data?.mainKeyword || '-'}
                        </div>
                      </td>
                      {/* 보장기간 */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm text-gray-700">
                            {request.guarantee_count}{request.campaigns?.guarantee_unit || '일'}
                          </span>
                          {request.start_date && request.end_date && (
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(request.start_date).toLocaleDateString('ko-KR', {
                                month: '2-digit', day: '2-digit'
                              }).replace(/\. /g, '-').replace('.', '')}
                              ~
                              {new Date(request.end_date).toLocaleDateString('ko-KR', {
                                month: '2-digit', day: '2-digit'
                              }).replace(/\. /g, '-').replace('.', '')}
                            </div>
                          )}
                        </div>
                      </td>
                      {/* 작업기간 */}
                      <td className="py-3 px-3 text-center">
                        {request.guarantee_slots?.[0] && request.guarantee_slots[0].start_date && request.guarantee_slots[0].end_date ? (
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1 mb-1">
                              <span className="text-xs text-gray-600">시작:</span>
                              <span className="text-xs font-medium text-green-600">
                                {new Date(request.guarantee_slots[0].start_date).toLocaleDateString('ko-KR', {
                                  year: 'numeric', month: '2-digit', day: '2-digit'
                                }).replace(/\. /g, '-').replace('.', '')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-600">종료:</span>
                              <span className="text-xs font-medium text-red-600">
                                {new Date(request.guarantee_slots[0].end_date).toLocaleDateString('ko-KR', {
                                  year: 'numeric', month: '2-digit', day: '2-digit'
                                }).replace(/\. /g, '-').replace('.', '')}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      {/* 캠페인 */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {getCampaignLogo(request.campaigns?.logo) && (
                            <img
                              src={getCampaignLogo(request.campaigns?.logo)}
                              alt="campaign logo"
                              className="w-5 h-5 object-contain rounded"
                            />
                          )}
                          <span className="text-gray-700">
                            {request.campaigns?.campaign_name || `캠페인 #${request.campaign_id}`}
                          </span>
                          {getCampaignStatusDot(request.campaigns)}
                        </div>
                      </td>
                      {/* 상태 */}
                      <td className="py-3 px-3 text-center">
                        <div>
                          {request.status === 'requested' &&
                            <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-600">요청</span>}
                          {request.status === 'negotiating' &&
                            <span className="px-1.5 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700">협상중</span>}
                          {request.status === 'accepted' &&
                            <span className="px-1.5 py-0.5 text-xs rounded bg-blue-100 text-blue-700">승인</span>}
                          {request.status === 'rejected' &&
                            <span className="px-1.5 py-0.5 text-xs rounded bg-red-100 text-red-700">거절</span>}
                          {request.status === 'expired' &&
                            <span className="px-1.5 py-0.5 text-xs rounded bg-gray-600 text-white">만료</span>}
                          {request.status === 'purchased' && (
                            <div className="flex flex-col gap-1">
                              <span className="px-1.5 py-0.5 text-xs rounded bg-green-100 text-green-700">구매완료</span>
                              {request.guarantee_slots?.[0] && (
                                <>
                                  {request.guarantee_slots[0].status === 'pending' &&
                                    <span className="px-1.5 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700">슬롯 승인대기</span>}
                                  {request.guarantee_slots[0].status === 'active' &&
                                    <span className="px-1.5 py-0.5 text-xs rounded bg-blue-100 text-blue-700">슬롯 활성</span>}
                                  {request.guarantee_slots[0].status === 'rejected' &&
                                    <span className="px-1.5 py-0.5 text-xs rounded bg-red-100 text-red-700">슬롯 반려</span>}
                                  {request.guarantee_slots[0].status === 'completed' &&
                                    <span className="px-1.5 py-0.5 text-xs rounded bg-gray-600 text-white">슬롯 완료</span>}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      {/* 추가정보 */}
                      <td className="py-3 px-3 text-center">
                        {request.input_data && (() => {
                          const passItem = ['campaign_name', 'dueDays', 'expected_deadline', 'keyword1', 'keyword2', 'keyword3', 'keywordId', 'mainKeyword', 'mid', 'price', 'service_type', 'url', 'workCount', 'keywords'];
                          const userInputFields = Object.entries(request.input_data).filter(([key]) =>
                            !passItem.includes(key) && !key.endsWith('_fileName')
                          );

                          if (userInputFields.length === 0)
                            return <span className="text-xs text-gray-400">-</span>;

                          return (
                            <div className="relative inline-block">
                              <button
                                className="text-xs text-gray-600 hover:text-gray-900 underline cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setPopoverPosition({
                                    top: rect.top - 10,
                                    left: rect.left + rect.width / 2
                                  });
                                  setOpenPopoverId(openPopoverId === request.id ? null : request.id);
                                }}
                              >
                                {userInputFields.length}개 필드
                              </button>
                              {/* 클릭 시 표시되는 팝오버 */}
                              {openPopoverId === request.id && ReactDOM.createPortal(
                                <>
                                  {/* 배경 클릭 시 닫기 */}
                                  <div
                                    className="fixed inset-0"
                                    style={{ zIndex: 9998 }}
                                    onClick={() => setOpenPopoverId(null)}
                                  />
                                  <div
                                    className="fixed bg-gray-900 text-white text-xs rounded p-2 w-80 max-h-64 shadow-xl border border-gray-700"
                                    style={{
                                      zIndex: 9999,
                                      left: `${popoverPosition.left}px`,
                                      top: `${popoverPosition.top}px`,
                                      transform: 'translate(-50%, -100%)'
                                    }}>
                                    <div className="flex items-center justify-between mb-2 border-b border-gray-700 pb-1">
                                      <span className="font-medium text-gray-100">추가 정보</span>
                                      <button
                                        className="text-gray-400 hover:text-gray-200 transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenPopoverId(null);
                                        }}
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                    <div
                                      className="overflow-y-auto max-h-48 pr-2"
                                      style={{
                                        scrollbarWidth: 'thin',
                                        scrollbarColor: 'rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.1)'
                                      }}
                                    >
                                      <div className="space-y-1">
                                        {userInputFields.map(([key, value]) => (
                                          <div key={key} className="flex items-start gap-2 text-left py-1 border-b border-gray-800 last:border-0">
                                            <span className="font-medium text-gray-300 min-w-[80px] shrink-0">{key}</span>
                                            <span className="text-gray-400">:</span>
                                            <span className="text-gray-100 flex-1 break-words">
                                              {value ? String(value) : '-'}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </>,
                                document.body
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      {/* 상세/협상 */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            className="btn btn-icon btn-sm btn-ghost text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                            onClick={() => {
                              // TODO: 상세보기 구현
                              console.log('상세보기:', request);
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
                            className="btn btn-icon btn-sm btn-ghost text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                            onClick={() => handleOpenNegotiation(request)}
                            title="협상하기"
                            disabled={negotiationModal.open}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                      {/* 작업 */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex gap-1 justify-center">
                          {/* 총판 이상 권한인 경우 상태별 액션 버튼 표시 */}
                          {hasPermission(currentUser?.role, PERMISSION_GROUPS.DISTRIBUTOR) && (
                            <>
                              {request.status === 'requested' && (
                                <button
                                  className="px-2 py-0.5 text-xs font-medium rounded bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                                  onClick={() => handleOpenNegotiation(request)}
                                  title="협상하기"
                                  disabled={negotiationModal.open}
                                >
                                  협상
                                </button>
                              )}
                              {request.status === 'negotiating' && (
                                <>
                                  <button
                                    className="px-2 py-0.5 text-xs font-medium rounded bg-green-500 hover:bg-green-600 text-white transition-colors"
                                    onClick={() => handleApproveRequest(request.id)}
                                    title="승인"
                                    disabled={negotiationModal.open}
                                  >
                                    승인
                                  </button>
                                  <button
                                    className="px-2 py-0.5 text-xs font-medium rounded bg-red-500 hover:bg-red-600 text-white transition-colors"
                                    onClick={() => handleRejectRequest(request.id)}
                                    title="거절"
                                    disabled={negotiationModal.open}
                                  >
                                    반려
                                  </button>
                                </>
                              )}
                              {request.status === 'accepted' && (
                                <button
                                  className="px-2 py-0.5 text-xs font-medium rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                                  onClick={() => {
                                    // TODO: 구매 확인 구현
                                    console.log('구매 확인:', request);
                                  }}
                                  title="구매 확인"
                                  disabled={negotiationModal.open}
                                >
                                  완료
                                </button>
                              )}
                              {request.status === 'purchased' && request.guarantee_slots && request.guarantee_slots.length > 0 && (
                                <>
                                  {request.guarantee_slots[0].status === 'pending' ? (
                                    <>
                                      <button
                                        className="px-2 py-0.5 text-xs font-medium rounded bg-green-500 hover:bg-green-600 text-white transition-colors"
                                        onClick={() => handleApproveSlot(request.guarantee_slots![0].id)}
                                        title="슬롯 승인"
                                        disabled={negotiationModal.open}
                                      >
                                        승인
                                      </button>
                                      <button
                                        className="px-2 py-0.5 text-xs font-medium rounded bg-red-500 hover:bg-red-600 text-white transition-colors"
                                        onClick={() => handleRejectSlot(request.guarantee_slots![0].id)}
                                        title="슬롯 반려"
                                        disabled={negotiationModal.open}
                                      >
                                        반려
                                      </button>
                                    </>
                                  ) : request.guarantee_slots[0].status === 'active' ? (
                                    <>
                                      <button
                                        className="px-2 py-0.5 text-xs font-medium rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                                        onClick={() => handleCompleteSlot(request.guarantee_slots![0].id)}
                                        title="슬롯 완료"
                                        disabled={negotiationModal.open}
                                      >
                                        완료
                                      </button>
                                      <button
                                        className="px-2 py-0.5 text-xs font-medium rounded bg-gray-500 hover:bg-gray-600 text-white transition-colors"
                                        onClick={() => handleRefundSlot(request.guarantee_slots![0].id)}
                                        title="환불 처리"
                                        disabled={negotiationModal.open}
                                      >
                                        환불
                                      </button>
                                    </>
                                  ) : request.guarantee_slots[0].status === 'rejected' ? (
                                    <span className="text-xs text-red-600">반려됨</span>
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
        guaranteeCount={completeSlotData?.guaranteeCount || 0}
        guaranteeUnit={completeSlotData?.guaranteeUnit}
        completedDays={completeSlotData?.completedDays}
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
      />
    </CommonTemplate>
  );
};

export { GuaranteeQuotesPage };