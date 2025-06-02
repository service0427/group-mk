import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

interface SlotStatisticsProps {
  userId: string;
  userRole: string;
  serviceType: string;
}

interface Stats {
  totalSlots: number;
  totalRevenue: number;
  pendingSlots: number;
  approvedSlots: number;
  completedSlots: number;
  rejectedSlots: number;
}

const SlotStatistics: React.FC<SlotStatisticsProps> = ({ userId, userRole, serviceType }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalSlots: 0,
    totalRevenue: 0,
    pendingSlots: 0,
    approvedSlots: 0,
    completedSlots: 0,
    rejectedSlots: 0
  });
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadStats = async () => {
    if (!userId || !serviceType) return;
    
    setLoading(true);
    
    try {
      // 간단한 쿼리로 직접 통계 가져오기
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      let query = supabase
        .from('slots')
        .select('status, quantity, campaigns!inner(unit_price, service_type)')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .eq('campaigns.service_type', serviceType);
      
      // 관리자가 아니면 자신의 것만
      if (userRole !== 'admin' && userRole !== 'super_admin') {
        query = query.eq('mat_id', userId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('통계 조회 오류:', error);
        return;
      }
      
      // 통계 계산
      const newStats: Stats = {
        totalSlots: 0,
        totalRevenue: 0,
        pendingSlots: 0,
        approvedSlots: 0,
        completedSlots: 0,
        rejectedSlots: 0
      };
      
      if (data) {
        data.forEach((slot: any) => {
          newStats.totalSlots++;
          
          const unitPrice = slot.campaigns?.unit_price || 0;
          const quantity = slot.quantity || 0;
          
          switch (slot.status) {
            case 'pending':
            case 'submitted':
              newStats.pendingSlots++;
              break;
            case 'approved':
              newStats.approvedSlots++;
              newStats.totalRevenue += unitPrice * quantity;
              break;
            case 'completed':
            case 'success':
            case 'pending_user_confirm':
              newStats.completedSlots++;
              newStats.totalRevenue += unitPrice * quantity;
              break;
            case 'rejected':
              newStats.rejectedSlots++;
              break;
          }
        });
      }
      
      setStats(newStats);
      setHasLoaded(true);
    } catch (error) {
      console.error('통계 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 확장될 때만 데이터 로드
  useEffect(() => {
    if (isExpanded && !hasLoaded) {
      loadStats();
    }
  }, [isExpanded]);

  const formatNumber = (num: number) => num.toLocaleString('ko-KR');
  const formatCurrency = (num: number) => `${formatNumber(num)}원`;

  return (
    <Card className="mb-6">
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">월간 통계 (최근 30일)</h3>
            {!isExpanded && hasLoaded && (
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>총 {formatNumber(stats.totalSlots)}건</span>
                <span>•</span>
                <span>{formatCurrency(stats.totalRevenue)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isExpanded && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  loadStats();
                }}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {loading && !hasLoaded ? (
            <div className="text-center py-4">
              <div className="text-gray-500">통계를 불러오는 중...</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-sm text-blue-600 dark:text-blue-400">총 슬롯</div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                  {formatNumber(stats.totalSlots)}건
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-sm text-green-600 dark:text-green-400">총 수익</div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-200">
                  {formatCurrency(stats.totalRevenue)}
                </div>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                <div className="text-sm text-amber-600 dark:text-amber-400">대기중</div>
                <div className="text-2xl font-bold text-amber-900 dark:text-amber-200">
                  {formatNumber(stats.pendingSlots)}건
                </div>
              </div>
              
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                <div className="text-sm text-indigo-600 dark:text-indigo-400">승인됨</div>
                <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-200">
                  {formatNumber(stats.approvedSlots)}건
                </div>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="text-sm text-purple-600 dark:text-purple-400">완료</div>
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-200">
                  {formatNumber(stats.completedSlots)}건
                </div>
              </div>
              
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div className="text-sm text-red-600 dark:text-red-400">반려</div>
                <div className="text-2xl font-bold text-red-900 dark:text-red-200">
                  {formatNumber(stats.rejectedSlots)}건
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default SlotStatistics;