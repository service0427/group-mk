import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuthContext } from '@/auth';
import { CommonTemplate } from '@/components/pageTemplate';
import { useCustomToast } from '@/hooks/useCustomToast';
import { guaranteeSlotRequestService } from '@/services/guaranteeSlotService';
import { supabase } from '@/supabase';
import { KeenIcon } from '@/components';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { GuaranteeNegotiationModal } from '@/components/campaign-modals/GuaranteeNegotiationModal';
import type { GuaranteeSlotRequestStatus } from '@/types/guarantee-slot.types';

// 타입 정의
interface MyGuaranteeQuoteRequest {
  id: string;
  campaign_id: number;
  user_id: string;
  distributor_id?: string;
  target_rank: number;
  guarantee_count: number;
  initial_budget?: number;
  status: GuaranteeSlotRequestStatus;
  final_daily_amount?: number;
  created_at: string;
  updated_at: string;
  // 조인된 데이터
  campaigns?: {
    id: number;
    campaign_name: string;
    service_type: string;
    guarantee_unit?: string;
  };
}

const MyGuaranteeQuotesPage: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuthContext();
  const { showSuccess, showError } = useCustomToast();

  const [requests, setRequests] = useState<MyGuaranteeQuoteRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchStatus, setSearchStatus] = useState<string>('');
  const [negotiationModal, setNegotiationModal] = useState<{
    open: boolean;
    requestId: string;
    requestData?: MyGuaranteeQuoteRequest;
  }>({
    open: false,
    requestId: ''
  });

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
        req.campaigns?.campaign_name?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [requests, searchStatus, searchTerm]);

  // 내 견적 요청 목록 가져오기
  const fetchMyRequests = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // 현재 사용자의 요청만 조회
      const { data, error } = await guaranteeSlotRequestService.getRequests({
        user_id: currentUser.id
      });

      if (error) {
        throw error;
      }

      // 캠페인 정보도 함께 가져오기
      if (data && data.length > 0) {
        const campaignIds = [...new Set(data.map(req => req.campaign_id))];
        const { data: campaigns, error: campaignError } = await supabase
          .from('campaigns')
          .select('id, campaign_name, service_type, guarantee_unit')
          .in('id', campaignIds);

        if (campaignError) throw campaignError;

        const campaignMap = campaigns.reduce((acc, campaign) => {
          acc[campaign.id] = campaign;
          return acc;
        }, {} as any);

        const requestsWithCampaigns = data.map(request => ({
          ...request,
          campaigns: campaignMap[request.campaign_id]
        }));

        setRequests(requestsWithCampaigns);
      } else {
        setRequests(data || []);
      }
    } catch (error) {
      console.error('내 견적 요청 목록 조회 실패:', error);
      showError('견적 요청 내역을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, showError]);

  useEffect(() => {
    if (!authLoading && currentUser) {
      fetchMyRequests();
    }
  }, [authLoading, currentUser, fetchMyRequests]);

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
        return '견적 요청됨';
      case 'negotiating':
        return '협상 중';
      case 'accepted':
        return '협상 완료';
      case 'rejected':
        return '협상 거절됨';
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

  // 협상 모달 열기
  const handleOpenNegotiation = (request: MyGuaranteeQuoteRequest) => {
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
    fetchMyRequests(); // 목록 새로고침
  };

  // 로딩 상태
  if (authLoading || loading) {
    return (
      <CommonTemplate
        title="보장형 견적 내역"
        description="내 정보 관리 > 보장형 견적 내역"
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

  return (
    <CommonTemplate
      title="보장형 견적 내역"
      description="내 정보 관리 > 보장형 견적 내역"
      showPageMenu={false}
    >
      {/* 검색 영역 */}
      <div className="card mb-6">
        <div className="card-header">
          <h3 className="card-title">견적 요청 검색</h3>
        </div>
        <div className="card-body">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="w-full lg:w-48">
              <select
                className="select"
                value={searchStatus}
                onChange={(e) => setSearchStatus(e.target.value)}
              >
                <option value="">전체 상태</option>
                <option value="requested">견적 요청됨</option>
                <option value="negotiating">협상 중</option>
                <option value="accepted">협상 완료</option>
                <option value="rejected">협상 거절됨</option>
                <option value="expired">만료됨</option>
              </select>
            </div>
            <div className="flex-1">
              <input
                type="text"
                className="input"
                placeholder="캠페인명, 캠페인 ID로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={fetchMyRequests}
              disabled={loading}
            >
              <KeenIcon icon="magnifier" className="me-2" />
              검색
            </button>
          </div>
        </div>
      </div>

      {/* 견적 요청 목록 */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">내 견적 요청 내역 ({filteredRequests.length}건)</h3>
        </div>
        <div className="card-body">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-10">
              <KeenIcon icon="folder-open" className="text-6xl text-gray-300 mb-4" />
              <p className="text-gray-500">
                {searchTerm || searchStatus ? '검색 결과가 없습니다.' : '견적 요청 내역이 없습니다.'}
              </p>
              {!searchTerm && !searchStatus && (
                <p className="text-sm text-gray-400 mt-2">
                  보장형 캠페인에서 견적을 요청해보세요.
                </p>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-rounded table-striped table-hover">
                <thead>
                  <tr className="fw-bold fs-6 text-gray-800">
                    <th>캠페인</th>
                    <th>희망 예산</th>
                    <th>보장 기간</th>
                    <th>최종 금액</th>
                    <th>상태</th>
                    <th>요청일시</th>
                    <th className="text-end">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <div>
                          <div className="font-medium text-gray-900">
                            {request.campaigns?.campaign_name || `캠페인 #${request.campaign_id}`}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {request.campaign_id} | 목표: {request.target_rank}위
                          </div>
                        </div>
                      </td>
                      <td>
                        {request.initial_budget ? (
                          <span className="text-gray-900 font-medium">
                            {formatPrice(request.initial_budget)}원
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td>
                        <span className="text-gray-900">
                          {request.guarantee_count}{request.campaigns?.guarantee_unit || '일'}
                        </span>
                      </td>
                      <td>
                        {request.final_daily_amount ? (
                          <div>
                            <div className="text-gray-900 font-medium">
                              {formatPrice(request.final_daily_amount)}원/일
                            </div>
                            <div className="text-xs text-gray-500">
                              총 {formatPrice(request.final_daily_amount * (request.guarantee_period || request.guarantee_count))}원
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">협상 중</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                          {getStatusLabel(request.status)}
                        </span>
                      </td>
                      <td>
                        <div className="text-gray-700 text-sm">
                          {formatDistanceToNow(new Date(request.created_at), { 
                            addSuffix: true,
                            locale: ko 
                          })}
                        </div>
                      </td>
                      <td className="text-end">
                        <div className="flex gap-2 justify-end">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleOpenNegotiation(request)}
                            title="협상 내용 보기"
                          >
                            <KeenIcon icon="message-text" className="fs-4" />
                          </button>
                          {request.status === 'accepted' && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => {
                                // TODO: 구매 진행 모달 열기
                                console.log('구매 진행:', request);
                              }}
                              title="구매 진행"
                            >
                              <KeenIcon icon="wallet" className="fs-4" />
                            </button>
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
        currentUserRole="user"
        onStatusChange={handleNegotiationStatusChange}
      />
    </CommonTemplate>
  );
};

export { MyGuaranteeQuotesPage };