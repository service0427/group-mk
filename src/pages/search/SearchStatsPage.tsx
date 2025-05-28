import React, { useState, useEffect } from 'react';
import { CommonTemplate } from '@/components/pageTemplate';
import { KeenIcon } from '@/components';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import searchLimitService, { SearchStats, SearchLimitStatus } from '@/services/searchLimitService';
import { supabase } from '@/supabase';
import { StatCard } from '@/pages/dashboards/components/StatCard';
import { RankingChangeChart } from '@/components/charts';

type Period = 'day' | 'week' | 'month' | 'year';

interface SearchLimitConfig {
  user_role: string;
  search_type: string;
  daily_limit: number;
  monthly_limit: number | null;
}

const SearchStatsPage: React.FC = () => {
  const [period, setPeriod] = useState<Period>('month');
  const [searchStats, setSearchStats] = useState<SearchStats[]>([]);
  const [shopLimitStatus, setShopLimitStatus] = useState<SearchLimitStatus | null>(null);
  const [placeLimitStatus, setPlaceLimitStatus] = useState<SearchLimitStatus | null>(null);
  const [limitConfigs, setLimitConfigs] = useState<SearchLimitConfig[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string>('');

  // 데이터 조회
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 사용자 역할 조회
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('role')
          .eq('id', userData.user.id)
          .single();
        setUserRole(userProfile?.role || 'beginner');
      }

      // 검색 통계 조회
      const stats = await searchLimitService.getUserSearchStats(period);
      setSearchStats(stats);

      // 검색 제한 상태 조회
      const shopLimit = await searchLimitService.checkSearchLimit('shop');
      const placeLimit = await searchLimitService.checkSearchLimit('place');
      setShopLimitStatus(shopLimit);
      setPlaceLimitStatus(placeLimit);

      // 검색 제한 설정 조회
      const configs = await searchLimitService.getSearchLimitsConfig();
      setLimitConfigs(configs);
    } catch (error) {
      console.error('데이터 조회 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  // 기간별 통계 계산
  const getTotalSearches = () => {
    return searchStats.reduce((sum, stat) => sum + stat.totalSearches, 0);
  };

  const getShopSearches = () => {
    const shopStat = searchStats.find(stat => stat.searchType === 'shop');
    return shopStat?.totalSearches || 0;
  };

  const getPlaceSearches = () => {
    const placeStat = searchStats.find(stat => stat.searchType === 'place');
    return placeStat?.totalSearches || 0;
  };

  // 역할 배지 색상
  const getRoleBadgeColor = (role: string) => {
    const colors: { [key: string]: string } = {
      developer: 'bg-purple-100 text-purple-800',
      operator: 'bg-red-100 text-red-800',
      distributor: 'bg-blue-100 text-blue-800',
      agency: 'bg-yellow-100 text-yellow-800',
      advertiser: 'bg-green-100 text-green-800',
      beginner: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getPeriodText = (period: Period) => {
    const texts = {
      day: '오늘',
      week: '최근 7일',
      month: '최근 30일',
      year: '최근 1년'
    };
    return texts[period];
  };

  return (
    <CommonTemplate
      title="검색 통계"
      description="검색 사용량과 통계를 확인할 수 있습니다"
      showPageMenu={false}
    >
      <div className="flex flex-col space-y-6">
        {/* 기간 선택 */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">통계 기간</h3>
            <div className="flex gap-2">
              {(['day', 'week', 'month', 'year'] as Period[]).map((p) => (
                <Button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-light'}`}
                >
                  {getPeriodText(p)}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center p-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
            <p className="text-muted-foreground">통계를 불러오는 중...</p>
          </div>
        ) : (
          <>
            {/* 요약 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="전체 검색 횟수"
                value={getTotalSearches()}
                unit="회"
                keenIcon="magnifier"
                trend={0}
              />
              <StatCard
                title="N 쇼핑 검색"
                value={getShopSearches()}
                unit="회"
                keenIcon="shop"
                trend={0}
              />
              <StatCard
                title="N 플레이스 검색"
                value={getPlaceSearches()}
                unit="회"
                keenIcon="geolocation"
                trend={0}
              />
            </div>

            {/* 일일/월간 사용량 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* N 쇼핑 사용량 */}
              <Card className="p-6">
                <div className="flex items-center mb-4">
                  <KeenIcon icon="shop" className="h-5 w-5 text-blue-500 mr-2" />
                  <h3 className="text-lg font-semibold">N 쇼핑 사용량</h3>
                </div>
                {shopLimitStatus && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">일일 사용량</span>
                        <span className="text-sm">
                          {shopLimitStatus.dailyUsed} / {shopLimitStatus.dailyLimit === -1 ? '무제한' : shopLimitStatus.dailyLimit}
                        </span>
                      </div>
                      {shopLimitStatus.dailyLimit !== -1 && (
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (shopLimitStatus.dailyUsed / shopLimitStatus.dailyLimit) * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                    {shopLimitStatus.monthlyLimit && shopLimitStatus.monthlyLimit !== -1 && (
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">월간 사용량</span>
                          <span className="text-sm">
                            {shopLimitStatus.monthlyUsed} / {shopLimitStatus.monthlyLimit}
                            {shopLimitStatus.purchasedQuota > 0 && ` (+${shopLimitStatus.purchasedQuota})`}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (shopLimitStatus.monthlyUsed / (shopLimitStatus.monthlyLimit + shopLimitStatus.purchasedQuota)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* N 플레이스 사용량 */}
              <Card className="p-6">
                <div className="flex items-center mb-4">
                  <KeenIcon icon="geolocation" className="h-5 w-5 text-green-500 mr-2" />
                  <h3 className="text-lg font-semibold">N 플레이스 사용량</h3>
                </div>
                {placeLimitStatus && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">일일 사용량</span>
                        <span className="text-sm">
                          {placeLimitStatus.dailyUsed} / {placeLimitStatus.dailyLimit === -1 ? '무제한' : placeLimitStatus.dailyLimit}
                        </span>
                      </div>
                      {placeLimitStatus.dailyLimit !== -1 && (
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (placeLimitStatus.dailyUsed / placeLimitStatus.dailyLimit) * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                    {placeLimitStatus.monthlyLimit && placeLimitStatus.monthlyLimit !== -1 && (
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">월간 사용량</span>
                          <span className="text-sm">
                            {placeLimitStatus.monthlyUsed} / {placeLimitStatus.monthlyLimit}
                            {placeLimitStatus.purchasedQuota > 0 && ` (+${placeLimitStatus.purchasedQuota})`}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (placeLimitStatus.monthlyUsed / (placeLimitStatus.monthlyLimit + placeLimitStatus.purchasedQuota)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>

            {/* 회원 등급별 검색 제한 */}
            <Card>
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">회원 등급별 검색 제한</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="table align-middle text-sm w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted">
                      <th className="py-4 px-5 text-start font-medium">회원 등급</th>
                      <th className="py-4 px-5 text-center font-medium">N 쇼핑 일일</th>
                      <th className="py-4 px-5 text-center font-medium">N 쇼핑 월간</th>
                      <th className="py-4 px-5 text-center font-medium">N 플레이스 일일</th>
                      <th className="py-4 px-5 text-center font-medium">N 플레이스 월간</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['beginner', 'advertiser', 'agency', 'distributor', 'operator', 'developer'].map((role) => {
                      const shopConfig = limitConfigs.find(c => c.user_role === role && c.search_type === 'shop');
                      const placeConfig = limitConfigs.find(c => c.user_role === role && c.search_type === 'place');
                      
                      return (
                        <tr key={role} className={`border-b border-border ${userRole === role ? 'bg-primary/5' : ''}`}>
                          <td className="py-4 px-5">
                            <Badge className={getRoleBadgeColor(role)}>
                              {role === 'beginner' ? '비기너' :
                               role === 'advertiser' ? '광고주' :
                               role === 'agency' ? '대행사' :
                               role === 'distributor' ? '총판' :
                               role === 'operator' ? '운영자' : '개발자'}
                            </Badge>
                            {userRole === role && (
                              <Badge className="ml-2 bg-primary/10 text-primary">현재 등급</Badge>
                            )}
                          </td>
                          <td className="py-4 px-5 text-center">
                            {shopConfig?.daily_limit === -1 ? '무제한' : shopConfig?.daily_limit || '-'}
                          </td>
                          <td className="py-4 px-5 text-center">
                            {shopConfig?.monthly_limit === null ? '무제한' : shopConfig?.monthly_limit || '-'}
                          </td>
                          <td className="py-4 px-5 text-center">
                            {placeConfig?.daily_limit === -1 ? '무제한' : placeConfig?.daily_limit || '-'}
                          </td>
                          <td className="py-4 px-5 text-center">
                            {placeConfig?.monthly_limit === null ? '무제한' : placeConfig?.monthly_limit || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </CommonTemplate>
  );
};

export default SearchStatsPage;