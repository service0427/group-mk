import React, { useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { supabase } from '@/supabase';
import { useAuthContext } from '@/auth';
import { hasPermission, PERMISSION_GROUPS } from '@/config/roles.config';
import { SERVICE_TYPE_LABELS } from '@/components/campaign-modals/types';
import { TrendingUp, TrendingDown, Package, CheckCircle, XCircle, Clock, DollarSign, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';

interface GuaranteeStats {
  user_id: string;
  distributor_id: string;
  service_type: string;
  campaign_id: number;
  campaign_name: string;
  request_count: number;
  requested_count: number;
  negotiating_count: number;
  accepted_count: number;
  purchased_count: number;
  slot_count: number;
  pending_slot_count: number;
  active_slot_count: number;
  completed_slot_count: number;
  rejected_slot_count: number;
  total_guarantee_amount: number;
  total_completed_amount: number;
}

interface GuaranteeMonthlyStatisticsProps {
  selectedServiceType: string;
  selectedCampaign: string;
}

export interface GuaranteeMonthlyStatisticsRef {
  refresh: () => void;
}

const GuaranteeMonthlyStatistics = forwardRef<GuaranteeMonthlyStatisticsRef, GuaranteeMonthlyStatisticsProps>(({
  selectedServiceType,
  selectedCampaign
}, ref) => {
  const { currentUser } = useAuthContext();
  const [stats, setStats] = useState<GuaranteeStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previousStats, setPreviousStats] = useState<GuaranteeStats[]>([]);

  // 펼침/접기 상태 (localStorage에서 복원)
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('guaranteeMonthlyStatistics.isExpanded');
    return saved !== null ? saved === 'true' : false;
  });

  const fetchMonthlyStats = useCallback(async () => {
    if (!currentUser) return;

    try {
      // 초기 로드가 아닌 경우에만 로딩 표시
      if (stats.length > 0) {
        setLoading(true);
      }
      setError(null);

      const isAdmin = hasPermission(currentUser.role, PERMISSION_GROUPS.ADMIN);

      // 날짜 계산: 오늘부터 한 달 전까지
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const todayEnd = tomorrow.toISOString().split('T')[0];
      
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = oneMonthAgo.toISOString().split('T')[0];

      // 현재 기간 통계 쿼리
      let currentQuery = supabase
        .from('guarantee_slot_requests')
        .select(`
          *,
          campaigns (
            id,
            campaign_name,
            service_type,
            mat_id
          ),
          guarantee_slots (
            id,
            status,
            total_amount,
            completed_count,
            guarantee_count,
            daily_guarantee_amount
          )
        `)
        .gte('created_at', thirtyDaysAgo)
        .lt('created_at', todayEnd);

      // 권한에 따른 필터링
      if (!isAdmin) {
        // 총판인 경우 distributor_id로 필터
        if (currentUser.role === 'distributor') {
          currentQuery = currentQuery.eq('distributor_id', currentUser.id);
        } else {
          // 일반 사용자인 경우 user_id로 필터
          currentQuery = currentQuery.eq('user_id', currentUser.id);
        }
      }

      // 서비스 타입 필터링
      if (selectedServiceType && selectedServiceType !== '') {
        currentQuery = currentQuery.eq('campaigns.service_type', selectedServiceType);
      }

      // 캠페인 필터링
      if (selectedCampaign && selectedCampaign !== 'all') {
        currentQuery = currentQuery.eq('campaign_id', selectedCampaign);
      }

      const { data: currentData, error: currentError } = await currentQuery;

      if (currentError)
        throw currentError;

      // 통계 집계
      const aggregatedStats: Record<string, GuaranteeStats> = {};

      (currentData || []).forEach((request: any) => {
        // 사용자 역할에 따라 다른 키 생성
        let key: string;
        if (currentUser.role === 'distributor' || isAdmin) {
          // 총판 또는 관리자는 distributor별로 집계
          key = `${request.distributor_id || 'unknown'}_${request.campaigns?.service_type || 'unknown'}`;
        } else {
          // 일반 사용자는 user별로 집계
          key = `${request.user_id}_${request.campaigns?.service_type || 'unknown'}`;
        }

        if (!aggregatedStats[key]) {
          aggregatedStats[key] = {
            user_id: request.user_id,
            distributor_id: request.distributor_id || '',
            service_type: request.campaigns?.service_type || '',
            campaign_id: request.campaign_id,
            campaign_name: request.campaigns?.campaign_name || '',
            request_count: 0,
            requested_count: 0,
            negotiating_count: 0,
            accepted_count: 0,
            purchased_count: 0,
            slot_count: 0,
            pending_slot_count: 0,
            active_slot_count: 0,
            completed_slot_count: 0,
            rejected_slot_count: 0,
            total_guarantee_amount: 0,
            total_completed_amount: 0
          };
        }

        const stat = aggregatedStats[key];
        stat.request_count++;

        // 견적 상태별 카운트
        switch (request.status) {
          case 'requested':
            stat.requested_count++;
            break;
          case 'negotiating':
            stat.negotiating_count++;
            break;
          case 'accepted':
            stat.accepted_count++;
            break;
          case 'purchased':
            stat.purchased_count++;
            break;
        }

        // 슬롯 통계
        if (request.guarantee_slots && request.guarantee_slots.length > 0) {
          request.guarantee_slots.forEach((slot: any) => {
            stat.slot_count++;

            switch (slot.status) {
              case 'pending':
                stat.pending_slot_count++;
                break;
              case 'active':
                stat.active_slot_count++;
                break;
              case 'completed':
                stat.completed_slot_count++;
                stat.total_completed_amount += slot.total_amount || 0;
                break;
              case 'rejected':
                stat.rejected_slot_count++;
                break;
            }

            // 총 보장 금액 계산
            if (slot.status !== 'rejected') {
              stat.total_guarantee_amount += slot.total_amount || 0;
            }
          });
        }
      });

      setStats(Object.values(aggregatedStats));
    } catch (err: any) {
      console.error('보장형 통계 조회 오류:', err);
      setError('통계 데이터를 불러오는데 실패했습니다.');
    } finally {
      // 초기 로드 시에는 로딩 상태를 false로 유지
      if (stats.length > 0) {
        setLoading(false);
      }
    }
  }, [currentUser, selectedServiceType, selectedCampaign]);

  useEffect(() => {
    fetchMonthlyStats();
  }, [fetchMonthlyStats]);

  // 외부에서 호출할 수 있도록 ref 노출
  useImperativeHandle(ref, () => ({
    refresh: fetchMonthlyStats
  }), [fetchMonthlyStats]);

  // 전체 통계 계산
  const totalStats = stats.reduce((acc, stat) => ({
    request_count: acc.request_count + stat.request_count,
    requested_count: acc.requested_count + stat.requested_count,
    negotiating_count: acc.negotiating_count + stat.negotiating_count,
    accepted_count: acc.accepted_count + stat.accepted_count,
    purchased_count: acc.purchased_count + stat.purchased_count,
    slot_count: acc.slot_count + stat.slot_count,
    pending_slot_count: acc.pending_slot_count + stat.pending_slot_count,
    active_slot_count: acc.active_slot_count + stat.active_slot_count,
    completed_slot_count: acc.completed_slot_count + stat.completed_slot_count,
    rejected_slot_count: acc.rejected_slot_count + stat.rejected_slot_count,
    total_guarantee_amount: acc.total_guarantee_amount + stat.total_guarantee_amount,
    total_completed_amount: acc.total_completed_amount + stat.total_completed_amount
  }), {
    request_count: 0,
    requested_count: 0,
    negotiating_count: 0,
    accepted_count: 0,
    purchased_count: 0,
    slot_count: 0,
    pending_slot_count: 0,
    active_slot_count: 0,
    completed_slot_count: 0,
    rejected_slot_count: 0,
    total_guarantee_amount: 0,
    total_completed_amount: 0
  });

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-6">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
      <div
        className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        onClick={() => {
          const newExpanded = !isExpanded;
          setIsExpanded(newExpanded);
          localStorage.setItem('guaranteeMonthlyStatistics.isExpanded', String(newExpanded));
        }}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              보장형 슬롯 최근 30일 통계
            </h3>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR')} ~ {new Date().toLocaleDateString('ko-KR')}
            {!isExpanded && !loading && (
              <span className="ml-4">
                • 견적 요청: {totalStats.request_count}건
                • 구매 슬롯: {totalStats.slot_count}개
                • 총 보장 금액: ₩{totalStats.total_guarantee_amount.toLocaleString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            fetchMonthlyStats();
          }}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="새로고침"
        >
          <RefreshCw className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {isExpanded && (
        <div className="p-6 pt-0">
          {/* 주요 통계 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            {/* 전체 견적 요청 */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 md:p-4">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <Package className="w-4 h-4 md:w-5 md:h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="text-lg md:text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totalStats.request_count.toLocaleString()}
              </div>
              <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">견적 요청</div>
            </div>

            {/* 협상중/대기 */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 md:p-4">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="text-lg md:text-2xl font-bold text-gray-900 dark:text-gray-100">
                {(totalStats.requested_count + totalStats.negotiating_count + totalStats.pending_slot_count).toLocaleString()}
              </div>
              <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                <div>대기/협상중</div>
                <div className="hidden sm:block text-xs text-gray-500 dark:text-gray-500">
                  (요청 {totalStats.requested_count} + 협상 {totalStats.negotiating_count} + 슬롯대기 {totalStats.pending_slot_count})
                </div>
              </div>
            </div>

            {/* 구매된 슬롯 */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 md:p-4">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-lg md:text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totalStats.slot_count.toLocaleString()}
              </div>
              <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                <div>구매 슬롯</div>
                <div className="text-xs text-gray-500 dark:text-gray-500">(활성 {totalStats.active_slot_count}개)</div>
              </div>
            </div>

            {/* 총 보장 금액 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 md:p-4">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-lg md:text-2xl font-bold text-gray-900 dark:text-gray-100">
                <span className="hidden sm:inline">₩</span>{totalStats.total_guarantee_amount.toLocaleString()}
              </div>
              <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">총 보장 금액</div>
            </div>
          </div>

          {/* 상태별 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div className="text-center">
              <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">수락됨</div>
              <div className="text-lg md:text-xl font-semibold text-blue-600 dark:text-blue-400">
                {totalStats.accepted_count.toLocaleString()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">구매완료</div>
              <div className="text-lg md:text-xl font-semibold text-green-600 dark:text-green-400">
                {totalStats.purchased_count.toLocaleString()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">완료됨</div>
              <div className="text-lg md:text-xl font-semibold text-purple-600 dark:text-purple-400">
                {totalStats.completed_slot_count.toLocaleString()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">반려됨</div>
              <div className="text-lg md:text-xl font-semibold text-red-600 dark:text-red-400">
                {totalStats.rejected_slot_count.toLocaleString()}
              </div>
            </div>
          </div>

          {/* 서비스 타입별 통계 */}
          {(() => {
            // 서비스 타입별로 통계 집계
            const serviceTypeStats = stats.reduce((acc, stat) => {
              if (!acc[stat.service_type]) {
                acc[stat.service_type] = {
                  request_count: 0,
                  slot_count: 0,
                  total_guarantee_amount: 0
                };
              }
              acc[stat.service_type].request_count += stat.request_count;
              acc[stat.service_type].slot_count += stat.slot_count;
              acc[stat.service_type].total_guarantee_amount += stat.total_guarantee_amount;
              return acc;
            }, {} as Record<string, { request_count: number; slot_count: number; total_guarantee_amount: number }>);

            const serviceTypes = Object.keys(serviceTypeStats);

            return serviceTypes.length > 1 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  서비스 타입별 현황
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                  전체 견적 중 각 서비스가 차지하는 비율
                </p>
                <div className="space-y-2">
                  {serviceTypes.map((serviceType) => {
                    const serviceLabel = SERVICE_TYPE_LABELS[serviceType] || serviceType;
                    const stat = serviceTypeStats[serviceType];
                    const percentage = totalStats.request_count > 0
                      ? (stat.request_count / totalStats.request_count * 100).toFixed(1)
                      : '0';

                    return (
                      <div key={serviceType} className="flex items-center justify-between group">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {serviceLabel}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            ({stat.request_count}건)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 md:w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2 relative">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 w-12 text-right">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
});

GuaranteeMonthlyStatistics.displayName = 'GuaranteeMonthlyStatistics';

export default GuaranteeMonthlyStatistics;