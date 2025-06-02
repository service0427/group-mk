import React, { useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { supabase } from '@/supabase';
import { useAuthContext } from '@/auth';
import { hasPermission, PERMISSION_GROUPS } from '@/config/roles.config';
import { SERVICE_TYPE_LABELS } from '@/components/campaign-modals/types';
import { TrendingUp, TrendingDown, Package, CheckCircle, XCircle, Clock, DollarSign, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';

interface DailyStats {
  stat_date: string;
  mat_id: string;
  service_type: string;
  campaign_id: number;
  campaign_name: string;
  slot_count: number;
  pending_count: number;
  approved_count: number;
  completed_count: number;
  rejected_count: number;
  refund_count: number;
  cancelled_count: number;
  total_quantity: number;
  actual_worked_quantity?: number; // 실제 작업된 수량
  total_revenue: number;
  expected_revenue?: number; // 예상 매출 (비교용)
}

interface MonthlyStatisticsProps {
  selectedServiceType: string;
  selectedCampaign: string;
}

export interface MonthlyStatisticsRef {
  refresh: () => void;
}

const MonthlyStatistics = forwardRef<MonthlyStatisticsRef, MonthlyStatisticsProps>(({
  selectedServiceType,
  selectedCampaign
}, ref) => {
  const { currentUser } = useAuthContext();
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previousStats, setPreviousStats] = useState<DailyStats[]>([]);
  // 펼침/접기 상태 (localStorage에서 복원)
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('monthlyStatistics.isExpanded');
    return saved !== null ? saved === 'true' : false;
  });

  const fetchMonthlyStats = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      const isAdmin = hasPermission(currentUser.role, PERMISSION_GROUPS.ADMIN);
      
      // 날짜 계산: 오늘부터 한 달 전까지 (타임스탬프 사용으로 안전하게 계산)
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = oneMonthAgo.toISOString().split('T')[0];
      
      // 비교를 위한 이전 30일 기간
      const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = twoMonthsAgo.toISOString().split('T')[0];

      // 일별 통계를 사용하여 30일간 데이터 집계
      let currentQuery = supabase
        .from('v_daily_slot_statistics')
        .select('*')
        .gte('stat_date', thirtyDaysAgo)
        .lte('stat_date', today);

      // 이전 30일 통계 (비교용)
      let previousQuery = supabase
        .from('v_daily_slot_statistics')
        .select('*')
        .gte('stat_date', sixtyDaysAgo)
        .lt('stat_date', thirtyDaysAgo);

      // 권한에 따른 필터링
      if (!isAdmin) {
        currentQuery = currentQuery.eq('mat_id', currentUser.id);
        previousQuery = previousQuery.eq('mat_id', currentUser.id);
      }

      // 서비스 타입 필터링
      if (selectedServiceType && selectedServiceType !== 'all') {
        currentQuery = currentQuery.eq('service_type', selectedServiceType);
        previousQuery = previousQuery.eq('service_type', selectedServiceType);
      }

      const [currentResult, previousResult] = await Promise.all([
        currentQuery,
        previousQuery
      ]);

      if (currentResult.error) throw currentResult.error;
      if (previousResult.error) throw previousResult.error;

      // 디버깅용 로그 (필요시 주석 해제)
      console.log('최근 30일 통계 데이터:', currentResult.data);
      // console.log('이전 30일 통계 데이터:', previousResult.data);
      
      // 매출 계산 검증
      if (currentResult.data && currentResult.data.length > 0) {
        const sampleData = currentResult.data[0];
        console.log('샘플 데이터 (첫 번째 레코드):', {
          stat_date: sampleData.stat_date,
          total_quantity: sampleData.total_quantity,
          actual_worked_quantity: sampleData.actual_worked_quantity,
          total_revenue: sampleData.total_revenue,
          expected_revenue: sampleData.expected_revenue,
          slot_count: sampleData.slot_count,
          difference: sampleData.expected_revenue ? sampleData.expected_revenue - sampleData.total_revenue : 0
        });
        
        // 전체 데이터의 매출 차이 계산
        const totalExpected = currentResult.data.reduce((sum: number, stat: DailyStats) => sum + (stat.expected_revenue || 0), 0);
        const totalActual = currentResult.data.reduce((sum: number, stat: DailyStats) => sum + stat.total_revenue, 0);
        console.log('매출 비교:', {
          예상_매출: totalExpected.toLocaleString(),
          실제_매출: totalActual.toLocaleString(),
          차이: (totalExpected - totalActual).toLocaleString(),
          차이_비율: totalExpected > 0 ? ((totalActual / totalExpected) * 100).toFixed(2) + '%' : '0%'
        });
      }
      
      // 직접 슬롯 상태 확인 (디버깅용)
      const statusCheck = await supabase
        .from('slots')
        .select('status, count:id')
        .in('status', ['completed', 'success', 'pending_user_confirm'])
        .gte('created_at', thirtyDaysAgo);
        
      // console.log('최근 30일 완료 상태 슬롯 직접 조회:', statusCheck.data);
      
      setStats(currentResult.data || []);
      setPreviousStats(previousResult.data || []);
    } catch (err: any) {
      console.error('통계 조회 오류:', err);
      setError('통계 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
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
  const totalStats = stats.reduce((acc, stat) => {
    // 각 stat의 completed_count 로그 (필요시 주석 해제)
    // if (stat.completed_count > 0) {
    //   console.log(`날짜별 완료 건수 - ${stat.stat_date}: ${stat.completed_count}건`);
    // }
    
    return {
      slot_count: acc.slot_count + stat.slot_count,
      pending_count: acc.pending_count + stat.pending_count,
      approved_count: acc.approved_count + stat.approved_count,
      completed_count: acc.completed_count + stat.completed_count,
      rejected_count: acc.rejected_count + stat.rejected_count,
      refund_count: acc.refund_count + stat.refund_count,
      total_quantity: acc.total_quantity + stat.total_quantity,
      total_revenue: acc.total_revenue + stat.total_revenue
    };
  }, {
    slot_count: 0,
    pending_count: 0,
    approved_count: 0,
    completed_count: 0,
    rejected_count: 0,
    refund_count: 0,
    total_quantity: 0,
    total_revenue: 0
  });
  
  // console.log('전체 통계 계산 결과:', totalStats);

  // 이전 30일 전체 통계
  const previousTotalStats = previousStats.reduce((acc, stat) => ({
    slot_count: acc.slot_count + stat.slot_count,
    total_revenue: acc.total_revenue + stat.total_revenue
  }), {
    slot_count: 0,
    total_revenue: 0
  });

  // 증감률 계산
  const slotGrowthRate = previousTotalStats.slot_count > 0 
    ? ((totalStats.slot_count - previousTotalStats.slot_count) / previousTotalStats.slot_count * 100).toFixed(1)
    : '0';
  
  const revenueGrowthRate = previousTotalStats.total_revenue > 0
    ? ((totalStats.total_revenue - previousTotalStats.total_revenue) / previousTotalStats.total_revenue * 100).toFixed(1)
    : '0';

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
          localStorage.setItem('monthlyStatistics.isExpanded', String(newExpanded));
        }}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              최근 30일 통계
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
                • 총 슬롯: {totalStats.slot_count}개
                • 총 매출: ₩{totalStats.total_revenue.toLocaleString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation(); // 헤더 클릭 이벤트와 충돌 방지
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 전체 슬롯 수 */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 relative group">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <div className="flex items-center text-sm">
              {Number(slotGrowthRate) > 0 ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600 dark:text-green-400">
                    +{slotGrowthRate}%
                  </span>
                </>
              ) : Number(slotGrowthRate) < 0 ? (
                <>
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-red-600 dark:text-red-400">
                    {slotGrowthRate}%
                  </span>
                </>
              ) : (
                <span className="text-gray-600 dark:text-gray-400">
                  0%
                </span>
              )}
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {totalStats.slot_count.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">전체 슬롯</div>
          
          {/* 툴팁 */}
          <div className="absolute -top-10 right-0 invisible group-hover:visible bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
            전월 대비 증감률
          </div>
        </div>

        {/* 승인 대기 */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {totalStats.pending_count.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">승인 대기</div>
        </div>

        {/* 완료된 슬롯 */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {totalStats.completed_count.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <div>완료</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">(완료+사용자확인대기)</div>
          </div>
        </div>

        {/* 총 매출 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 relative group">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div className="flex items-center text-sm">
              {Number(revenueGrowthRate) > 0 ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600 dark:text-green-400">
                    +{revenueGrowthRate}%
                  </span>
                </>
              ) : Number(revenueGrowthRate) < 0 ? (
                <>
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-red-600 dark:text-red-400">
                    {revenueGrowthRate}%
                  </span>
                </>
              ) : (
                <span className="text-gray-600 dark:text-gray-400">
                  0%
                </span>
              )}
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            ₩{totalStats.total_revenue.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">총 매출</div>
          
          {/* 툴팁 */}
          <div className="absolute -top-10 right-0 invisible group-hover:visible bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
            전월 대비 매출 증감률
          </div>
        </div>
      </div>

      {/* 상태별 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">승인됨</div>
          <div className="text-xl font-semibold text-blue-600 dark:text-blue-400">
            {totalStats.approved_count.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">반려됨</div>
          <div className="text-xl font-semibold text-red-600 dark:text-red-400">
            {totalStats.rejected_count.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">환불</div>
          <div className="text-xl font-semibold text-purple-600 dark:text-purple-400">
            {totalStats.refund_count.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 서비스 타입별 통계 */}
      {(() => {
        // 서비스 타입별로 통계 집계
        const serviceTypeStats = stats.reduce((acc, stat) => {
          if (!acc[stat.service_type]) {
            acc[stat.service_type] = {
              slot_count: 0,
              total_revenue: 0
            };
          }
          acc[stat.service_type].slot_count += stat.slot_count;
          acc[stat.service_type].total_revenue += stat.total_revenue;
          return acc;
        }, {} as Record<string, { slot_count: number; total_revenue: number }>);

        const serviceTypes = Object.keys(serviceTypeStats);
        
        return serviceTypes.length > 1 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              서비스 타입별 현황
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
              전체 슬롯 중 각 서비스가 차지하는 비율
            </p>
            <div className="space-y-2">
              {serviceTypes.map((serviceType) => {
                const serviceLabel = SERVICE_TYPE_LABELS[serviceType] || serviceType;
                const stat = serviceTypeStats[serviceType];
                const percentage = totalStats.slot_count > 0 
                  ? (stat.slot_count / totalStats.slot_count * 100).toFixed(1)
                  : '0';
                
                return (
                  <div key={serviceType} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {serviceLabel}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        ({stat.slot_count}개)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2 relative">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12 text-right">
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

MonthlyStatistics.displayName = 'MonthlyStatistics';

export default MonthlyStatistics;