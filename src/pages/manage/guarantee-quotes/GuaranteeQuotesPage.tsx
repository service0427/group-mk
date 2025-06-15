import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuthContext } from '@/auth';
import { CommonTemplate } from '@/components/pageTemplate';
import { useCustomToast } from '@/hooks/useCustomToast';
import { hasPermission, PERMISSION_GROUPS, USER_ROLES } from '@/config/roles.config';
import { guaranteeSlotRequestService } from '@/services/guaranteeSlotService';
import { supabase } from '@/supabase';
import { KeenIcon } from '@/components';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

// 타입 정의
interface GuaranteeQuoteRequest {
  id: string;
  campaign_id: number;
  user_id: string;
  distributor_id?: string;
  target_rank: number;
  guarantee_count: number;
  initial_budget?: number;
  status: 'requested' | 'negotiating' | 'accepted' | 'rejected' | 'expired';
  final_daily_amount?: number;
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
  };
  users?: {
    id: string;
    email: string;
    full_name: string;
  };
}

const GuaranteeQuotesPage: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuthContext();
  const { showSuccess, showError } = useCustomToast();

  const [requests, setRequests] = useState<GuaranteeQuoteRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchStatus, setSearchStatus] = useState<string>('');
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);

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
        req.user_id?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [requests, searchStatus, searchTerm]);

  // 견적 요청 목록 가져오기
  const fetchRequests = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // 권한에 따른 필터
      const filter: any = {};
      
      // ADMIN 그룹(운영자/개발자)이 아닌 경우, 총판은 자신이 생성한 캠페인의 요청만 볼 수 있음
      if (!hasPermission(currentUser.role, PERMISSION_GROUPS.ADMIN)) {
        if (currentUser.role === USER_ROLES.DISTRIBUTOR) {
          // 총판은 자신의 distributor_id가 설정된 요청만 조회
          filter.distributor_id = currentUser.id;
        }
      }
      // ADMIN 그룹은 모든 요청을 볼 수 있음 (필터 없음)

      const { data, error } = await guaranteeSlotRequestService.getRequests(filter);

      if (error) {
        throw error;
      }

      setRequests(data || []);
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
      title="견적 요청 목록"
      description="보장형 캠페인 견적 요청 관리"
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
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={fetchRequests}
              disabled={loading}
            >
              <KeenIcon icon="magnifier" className="me-2" />
              검색
            </button>
          </div>
        </div>
      </div>

      {/* 요청 목록 */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">견적 요청 목록 ({filteredRequests.length}건)</h3>
        </div>
        <div className="card-body">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-10">
              <KeenIcon icon="folder-open" className="text-6xl text-gray-300 mb-4" />
              <p className="text-gray-500">견적 요청이 없습니다.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-rounded table-striped table-hover">
                <thead>
                  <tr className="fw-bold fs-6 text-gray-800">
                    <th className="w-10">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={selectedRequests.length === filteredRequests.length && filteredRequests.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRequests(filteredRequests.map(r => r.id));
                          } else {
                            setSelectedRequests([]);
                          }
                        }}
                      />
                    </th>
                    <th>캠페인</th>
                    <th>요청자</th>
                    <th>희망 예산</th>
                    <th>보장 기간</th>
                    <th>상태</th>
                    <th>요청일시</th>
                    <th className="text-end">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <input
                          type="checkbox"
                          className="checkbox"
                          checked={selectedRequests.includes(request.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRequests([...selectedRequests, request.id]);
                            } else {
                              setSelectedRequests(selectedRequests.filter(id => id !== request.id));
                            }
                          }}
                        />
                      </td>
                      <td>
                        <div>
                          <div className="font-medium text-gray-900">캠페인 #{request.campaign_id}</div>
                          <div className="text-xs text-gray-500">ID: {request.campaign_id}</div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="text-gray-900">사용자</div>
                          <div className="text-xs text-gray-500">{request.user_id}</div>
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
                          {request.guarantee_count}일
                        </span>
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
                        <button
                          className="btn btn-sm btn-light"
                          onClick={() => {
                            // TODO: 상세보기/협상 모달 열기
                            console.log('상세보기:', request);
                          }}
                        >
                          <KeenIcon icon="eye" className="fs-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </CommonTemplate>
  );
};

export { GuaranteeQuotesPage };