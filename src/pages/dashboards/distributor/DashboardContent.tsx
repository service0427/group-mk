import React, { useState, useEffect } from 'react';
import { DashboardTemplate } from '@/components/pageTemplate/DashboardTemplate';
import { DashboardColorCard } from '@/pages/dashboards/components/DashboardColorCard';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { useResponsive } from '@/hooks';
import { formatCurrency, formatCurrencyInTenThousand } from '@/utils/Format';
import { supabase } from '@/supabase';
import { toast } from 'sonner';
import { useAuthContext } from '@/auth/useAuthContext';
import { getUserCashBalance } from '@/pages/withdraw/services/withdrawService';
import { CampaignAddModal } from '@/pages/admin/campaigns/components/campaign-modals';
import { ICampaign } from '@/pages/admin/campaigns/components/CampaignContent';
import { useNavigate } from 'react-router-dom';

// Supabase 테이블 인터페이스 정의
interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  status: string;
}

interface Campaign {
  id: string;
  title: string;
  creator_id?: string;
  status: string;
  created_at: string;
  budget?: number;
  category?: string;
}

interface Sale {
  id: string;
  campaign_id: string;
  customer_id: string;
  amount: number;
  status: string;
  created_at: string;
  campaign?: Campaign;
  customer?: User;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  company?: string;
}

interface MarketingChannel {
  id: string;
  name: string;
  traffic_percentage: number;
  conversion_rate: number;
  revenue: number;
}

// 총판 대시보드 통계 데이터 인터페이스
interface DistributorStats {
  totalSales: { count: number; trend: number };
  activeProducts: { count: number; trend: number };
  monthlyRevenue: { count: number; trend: number };
  currentCash: { count: number; trend: number };
}

export const DashboardContent: React.FC = () => {
  // 모바일 화면 감지 (md 이하인지 여부)
  const isMobile = useResponsive('down', 'md');
  const { currentUser } = useAuthContext();
  const navigate = useNavigate(); // React Router navigate 훅 추가

  // 데이터 로딩 상태
  const [loading, setLoading] = useState(true);

  // 캠페인 추가 모달 상태
  const [addCampaignModalOpen, setAddCampaignModalOpen] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<string>('ntraffic'); // 기본값: 네이버 트래픽

  // 대시보드 데이터 상태 관리
  const [stats, setStats] = useState<DistributorStats>({
    totalSales: { count: 1248, trend: 18.7 },
    activeProducts: { count: 87, trend: 4.2 },
    monthlyRevenue: { count: 32500000, trend: 14.8 },
    currentCash: { count: 0, trend: 0.5 }, // 트렌드를 약간 양수로 설정하여 표시되도록 함
  });

  // 최근 판매 데이터
  const [recentSales, setRecentSales] = useState<Array<{
    id: string;
    product: string;
    customer: string;
    amount: number;
    date: string;
    status: string;
  }>>([
    { id: 'ORD-4921', product: '프리미엄 광고 패키지', customer: '(주)메가브랜드', amount: 1250000, date: '2023-05-20', status: '완료' },
    { id: 'ORD-4920', product: '비즈니스 마케팅 프로', customer: '디지털솔루션즈', amount: 850000, date: '2023-05-19', status: '완료' },
    { id: 'ORD-4919', product: '소셜 미디어 패키지', customer: '퍼포먼스마케팅', amount: 650000, date: '2023-05-19', status: '완료' },
    { id: 'ORD-4918', product: '검색 광고 기본형', customer: '테크노베이션', amount: 450000, date: '2023-05-18', status: '완료' },
    { id: 'ORD-4917', product: '모바일 광고 패키지', customer: '스마트모바일', amount: 720000, date: '2023-05-18', status: '완료' },
  ]);

  // 캠페인 추가 모달 열기 함수 - 선택된 서비스 타입으로 설정
  const openAddCampaignModal = (serviceType: string) => {
    setSelectedServiceType(serviceType);
    setAddCampaignModalOpen(true);
  };

  // 상품 판매 순위 데이터
  const [productRankings, setProductRankings] = useState<Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
    trend: number;
  }>>([
    { id: 'PRD-001', name: '프리미엄 광고 패키지', sales: 48, revenue: 14200000, trend: 12.4 },
    { id: 'PRD-002', name: '비즈니스 마케팅 프로', sales: 36, revenue: 10800000, trend: 8.2 },
    { id: 'PRD-003', name: '소셜 미디어 패키지', sales: 32, revenue: 7680000, trend: 15.7 },
    { id: 'PRD-004', name: '검색 광고 기본형', sales: 28, revenue: 5600000, trend: -3.2 },
    { id: 'PRD-005', name: '모바일 광고 패키지', sales: 26, revenue: 5200000, trend: 7.8 },
  ]);

  // 마케팅 채널별 성과 데이터
  const [channelPerformance, setChannelPerformance] = useState<Array<{
    name: string;
    traffic: number;
    conversions: number;
    revenue: number;
  }>>([
    { name: '검색 엔진', traffic: 42, conversions: 5.2, revenue: 8450000 },
    { name: '소셜 미디어', traffic: 35, conversions: 3.8, revenue: 6300000 },
    { name: '이메일 마케팅', traffic: 12, conversions: 6.5, revenue: 3750000 },
    { name: '제휴 마케팅', traffic: 8, conversions: 4.1, revenue: 2100000 },
    { name: '다이렉트 트래픽', traffic: 3, conversions: 2.8, revenue: 950000 },
  ]);
  
  // 통계 데이터 로드 (실제 Supabase 테이블이 없으므로 더미 데이터 사용)
  const loadStats = async () => {
    try {
      setLoading(true);
      
      if (!currentUser) {
        return;
      }
      
      // 현재 사용자의 캐시 잔액 조회 - UserInfoDisplay와 동일한 방식 사용
      let userCash = 0; // 기본값 0원으로 변경
      let cashTrend = 0.5; // 기본 트렌드를 약간 양수로 설정하여 표시되도록 함
      
      try {
        // getUserCashBalance 함수를 활용하여 사용자 캐시 잔액 가져오기
        const balance = await getUserCashBalance(currentUser.id || '');
        userCash = balance || 0;
        
        // 트렌드 계산을 위해 최근 거래 내역 조회
        const { data: historyData, error: historyError } = await supabase
          .from('user_cash_history')
          .select('amount, transaction_at')
          .eq('user_id', currentUser.id)
          .order('transaction_at', { ascending: false })
          .limit(10);
        
        if (!historyError && historyData && historyData.length > 1) {
          // 최근 거래 내역을 기준으로 트렌드 계산
          // 최근 5개 거래 합계와 그 이전 5개 거래 합계 비교
          const recentTransactions = historyData.slice(0, 5);
          const olderTransactions = historyData.slice(5, 10);
          
          const recentSum = recentTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
          const olderSum = olderTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
          
          if (olderSum !== 0) {
            // 변화율 계산 (%)
            cashTrend = ((recentSum - olderSum) / Math.abs(olderSum)) * 100;
          }
        }
        
        
      } catch (cashError) {
        
      }
      
      // 현재는 실제 Supabase 테이블이 없으므로 더미 데이터를 사용
      // 여기서는 실제 로직을 주석 처리하고 더미 데이터를 사용
      
      /* // 1. 총 판매 수
      const { count: salesCount, error: salesError } = await supabase
        .from('campaigns')
        .select('id', { count: 'exact' })
        .eq('creator_id', currentUser.id);
      
      if (salesError) {
        
      }
      
      // 2. 활성 상품 수
      const { count: activeCampaignsCount, error: campaignsError } = await supabase
        .from('campaigns')
        .select('id', { count: 'exact' })
        .eq('creator_id', currentUser.id)
        .eq('status', 'active');
      
      if (campaignsError) {
        
      } */
      
      // 임의의 통계 데이터로 설정 (캐시는 실제 사용자 데이터 사용)
      setStats({
        totalSales: { count: 1248, trend: 18.7 },
        activeProducts: { count: 87, trend: 4.2 },
        monthlyRevenue: { count: 32500000, trend: 14.8 },
        currentCash: { count: userCash, trend: cashTrend },
      });
      
      // 마무리
      setTimeout(() => {
        setLoading(false);
      }, 500);
    } catch (error) {
      
      setLoading(false);
    }
  };
  
  // 최근 판매 데이터 로드
  const loadRecentSales = async () => {
    // 실제 Supabase 테이블이 없으므로 더미 데이터를 사용
    // 원래 코드는 주석 처리
    
    /* try {
      if (!currentUser) {
        return;
      }
      
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          amount,
          status,
          created_at,
          campaigns!inner(title),
          customers!inner(company)
        `)
        .eq('distributor_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) {
        throw new Error('최근 판매 데이터 조회 중 오류가 발생했습니다.');
      }
      
      if (data) {
        const formattedSales = data.map(sale => ({
          id: `ORD-${sale.id.substring(0, 4)}`,
          product: sale.campaigns?.title || '알 수 없음',
          customer: sale.customers?.company || '알 수 없는 고객',
          amount: sale.amount || 0,
          date: new Date(sale.created_at).toISOString().split('T')[0],
          status: sale.status || '완료'
        }));
        
        setRecentSales(formattedSales);
      }
    } catch (error) {
      toast.error('최근 판매 데이터를 불러오는 중 오류가 발생했습니다.');
    } */
    
    // 더미 데이터 사용
    setRecentSales([
      { id: 'ORD-4921', product: '프리미엄 광고 패키지', customer: '(주)메가브랜드', amount: 1250000, date: '2023-05-20', status: '완료' },
      { id: 'ORD-4920', product: '비즈니스 마케팅 프로', customer: '디지털솔루션즈', amount: 850000, date: '2023-05-19', status: '완료' },
      { id: 'ORD-4919', product: '소셜 미디어 패키지', customer: '퍼포먼스마케팅', amount: 650000, date: '2023-05-19', status: '완료' },
      { id: 'ORD-4918', product: '검색 광고 기본형', customer: '테크노베이션', amount: 450000, date: '2023-05-18', status: '완료' },
      { id: 'ORD-4917', product: '모바일 광고 패키지', customer: '스마트모바일', amount: 720000, date: '2023-05-18', status: '완료' },
    ]);
  };
  
  // 상품 판매 순위 데이터 로드
  const loadProductRankings = async () => {
    // 실제 Supabase 테이블이 없으므로 더미 데이터를 사용
    
    /* try {
      if (!currentUser) {
        return;
      }
      
      // 여기에 실제 데이터 조회 로직 추가
    } catch (error) {
      toast.error('상품 판매 순위 데이터를 불러오는 중 오류가 발생했습니다.');
    } */
    
    // 더미 데이터 사용
    setProductRankings([
      { id: 'PRD-001', name: '프리미엄 광고 패키지', sales: 48, revenue: 14200000, trend: 12.4 },
      { id: 'PRD-002', name: '비즈니스 마케팅 프로', sales: 36, revenue: 10800000, trend: 8.2 },
      { id: 'PRD-003', name: '소셜 미디어 패키지', sales: 32, revenue: 7680000, trend: 15.7 },
      { id: 'PRD-004', name: '검색 광고 기본형', sales: 28, revenue: 5600000, trend: -3.2 },
      { id: 'PRD-005', name: '모바일 광고 패키지', sales: 26, revenue: 5200000, trend: 7.8 },
    ]);
  };
  
  // 마케팅 채널 성과 데이터 로드 (하드코딩 데이터 사용)
  const loadChannelPerformance = async () => {
    // 하드코딩 데이터 사용
    setChannelPerformance([
      { name: '검색 엔진', traffic: 42, conversions: 5.2, revenue: 8450000 },
      { name: '소셜 미디어', traffic: 35, conversions: 3.8, revenue: 6300000 },
      { name: '이메일 마케팅', traffic: 12, conversions: 6.5, revenue: 3750000 },
      { name: '제휴 마케팅', traffic: 8, conversions: 4.1, revenue: 2100000 },
      { name: '다이렉트 트래픽', traffic: 3, conversions: 2.8, revenue: 950000 },
    ]);
  };

  // 상태에 따른 색상 지정
  const getStatusColor = (status: string) => {
    switch (status) {
      case '완료': return 'bg-green-100 text-green-800';
      case '진행중': return 'bg-blue-100 text-blue-800';
      case '대기중': return 'bg-yellow-100 text-yellow-800';
      case '취소': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 트렌드에 따른 아이콘
  const getTrendIcon = (trend: number) => {
    return trend >= 0 ? 
      <span className="text-green-600">↑</span> : 
      <span className="text-red-600">↓</span>;
  };
  
  // 컴포넌트 마운트 시 데이터 로드 (타이머로 로딩 효과 주기)
  useEffect(() => {
    // 로딩 효과를 위해 약간의 지연 추가
    const timer = setTimeout(() => {
      loadStats();
      loadRecentSales();
      loadProductRankings();
      loadChannelPerformance();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <DashboardTemplate
      title="총판 대시보드"
      description="판매 현황, 상품 분석 및 마케팅 성과를 한눈에 파악할 수 있는 총판용 대시보드입니다."
      // 역할 기반 테마 적용
      headerTextClass="text-white"
      toolbarActions={
        <>
          {loading && (
            <div className="flex items-center ml-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              <span className="text-white text-xs">데이터 로드 중...</span>
            </div>
          )}
        </>
      }
    >
      {/* 첫 번째 줄: 4개의 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        <DashboardColorCard
          title="총 판매수 (개발필요)"
          value={stats.totalSales.count}
          unit="건"
          trend={0} // 요율 제거 (0으로 설정)
          icon="tag"
          iconColor="bg-blue-600"
        />
        <DashboardColorCard
          title="활성 상품 (개발필요)"
          value={stats.activeProducts.count}
          unit="개"
          trend={0} // 요율 제거 (0으로 설정)
          icon="element-4"
          iconColor="bg-amber-600"
        />
        <DashboardColorCard
          title="월 매출액 (개발필요)"
          value={isMobile ? stats.monthlyRevenue.count / 10000 : stats.monthlyRevenue.count}
          unit={isMobile ? "만원" : "원"}
          trend={0} // 요율 제거 (0으로 설정)
          icon="dollar"
          iconColor="bg-green-600"
        />
        <DashboardColorCard
          title="현재 캐시 잔액"
          value={isMobile ? stats.currentCash.count / 10000 : stats.currentCash.count}
          unit={isMobile ? "만원" : "원"}
          trend={0} // 요율 제거 (0으로 설정)
          icon="dollar" 
          iconColor="bg-purple-600"
        />
      </div>

      {/* 두 번째 줄: 최근 판매 & 상품 판매 순위 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* 신규 캠페인 신청 */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-blue-100 text-blue-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">신규 캠페인 신청</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => openAddCampaignModal('ntraffic')}
            >
              새 캠페인 신청
            </Button>
          </div>
          <div className="p-5">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
              <div className="flex">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-blue-700 dark:text-blue-300 font-medium mb-1">신규 캠페인을 제안해 보세요</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">총판은 새로운 캠페인을 제안하고 승인 받을 수 있습니다. 아래 캠페인 유형 중 하나를 선택하여 시작하세요.</p>
                </div>
              </div>
            </div>

            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">캠페인 유형 선택</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div
                className="border dark:border-gray-700 rounded-lg p-3 flex flex-col hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors"
                onClick={() => openAddCampaignModal('ntraffic')}
              >
                <div className="flex items-center mb-2">
                  <img src="/media/ad-brand/naver.png" alt="네이버" className="w-5 h-5 mr-2" />
                  <span className="font-medium">네이버 트래픽</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">네이버 검색을 통한 사이트 방문 증가</p>
              </div>

              <div
                className="border dark:border-gray-700 rounded-lg p-3 flex flex-col hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors"
                onClick={() => openAddCampaignModal('NaverShopTraffic')}
              >
                <div className="flex items-center mb-2">
                  <img src="/media/ad-brand/naver-shopping.png" alt="네이버 쇼핑" className="w-5 h-5 mr-2" />
                  <span className="font-medium">네이버 쇼핑</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">네이버 쇼핑 페이지 노출 및 트래픽</p>
              </div>

              <div
                className="border dark:border-gray-700 rounded-lg p-3 flex flex-col hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors"
                onClick={() => openAddCampaignModal('CoupangTraffic')}
              >
                <div className="flex items-center mb-2">
                  <img src="/media/ad-brand/coupang-app.png" alt="쿠팡" className="w-5 h-5 mr-2" />
                  <span className="font-medium">쿠팡 트래픽</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">쿠팡을 통한 사이트 방문자 유치</p>
              </div>
            </div>

            <div className="mt-3">
              <Button
                className="w-full text-center py-2 mt-2 bg-primary text-white hover:bg-primary-dark"
                onClick={() => navigate('/advertise/ntraffic/desc')}
              >
                전체 캠페인 유형 보기
              </Button>
            </div>
          </div>
        </Card>

        {/* 상품 판매 순위 */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-blue-100 text-blue-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">상품 판매 순위 (개발필요)</h3>
            </div>
            <Button variant="outline" size="sm" className="h-8 px-4">
              상품 분석
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="py-3 px-4 text-left">상품명</TableHead>
                  <TableHead className="py-3 px-4 text-center">판매량</TableHead>
                  <TableHead className="py-3 px-4 text-right">매출(원)</TableHead>
                  <TableHead className="py-3 px-4 text-right">추세</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productRankings.map((product, index) => (
                  <TableRow key={index} className="border-b border-gray-200">
                    <TableCell className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-blue-600">{product.name}</span>
                        <span className="text-xs text-gray-500">{product.id}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                        {product.sales}건
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <span className="font-medium">
                        {isMobile 
                          ? formatCurrencyInTenThousand(product.revenue)
                          : formatCurrency(product.revenue)}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end">
                        {getTrendIcon(product.trend)}
                        <span className="ml-1 font-medium">
                          {Math.abs(product.trend).toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* 세 번째 줄: 마케팅 채널 성과 */}
      <div className="grid grid-cols-1 gap-5 mb-5">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-green-100 text-green-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                  <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">마케팅 채널 성과 (개발필요)</h3>
            </div>
            <Button variant="outline" size="sm" className="h-8 px-4">
              마케팅 보고서
            </Button>
          </div>
          <div className="p-5">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="py-3 px-4 text-left">채널</TableHead>
                    <TableHead className="py-3 px-4 text-center">트래픽 비중</TableHead>
                    <TableHead className="py-3 px-4 text-center">전환율</TableHead>
                    <TableHead className="py-3 px-4 text-right">매출 기여(원)</TableHead>
                    <TableHead className="py-3 px-4 text-left">성과</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channelPerformance.map((channel, index) => (
                    <TableRow key={index} className="border-b border-gray-200">
                      <TableCell className="py-3 px-4">
                        <span className="font-medium">{channel.name}</span>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-center">
                        <span>{channel.traffic}%</span>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-center">
                        <span>{channel.conversions}%</span>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-right">
                        <span className="font-medium">
                          {isMobile 
                            ? formatCurrencyInTenThousand(channel.revenue)
                            : formatCurrency(channel.revenue)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="h-2.5 rounded-full bg-green-500" 
                            style={{ width: `${(channel.revenue / 10000000) * 100}%` }}
                          ></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">이번 달 총 매출</div>
                <div className="text-xl font-bold text-gray-800">
                  {isMobile ? '3,250만원' : '32,500,000원'}
                </div>
                <div className="text-xs text-green-600 mt-1">↑ 14.8% 증가</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">트래픽 대비 ROI</div>
                <div className="text-xl font-bold text-gray-800">235%</div>
                <div className="text-xs text-green-600 mt-1">↑ 5.2% 증가</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">광고 지출 효율</div>
                <div className="text-xl font-bold text-gray-800">3.8배</div>
                <div className="text-xs text-green-600 mt-1">↑ 0.3배 증가</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 캠페인 추가 모달 */}
      {addCampaignModalOpen && (
        <CampaignAddModal
          open={addCampaignModalOpen}
          onClose={() => setAddCampaignModalOpen(false)}
          serviceType={selectedServiceType}
          onSave={(newCampaign: ICampaign) => {
            // 캠페인이 성공적으로 생성되면 모달 닫기
            setAddCampaignModalOpen(false);
            // 성공 메시지 표시
            toast.success(`'${newCampaign.campaignName}' 캠페인 제안이 접수되었습니다.`);
          }}
        />
      )}
    </DashboardTemplate>
  );
};

export default DashboardContent;