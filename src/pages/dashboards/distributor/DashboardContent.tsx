import React, { useState } from 'react';
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

// 총판 대시보드 통계 데이터 인터페이스
interface DistributorStats {
  totalSales: { count: number; trend: number };
  activeProducts: { count: number; trend: number };
  monthlyRevenue: { count: number; trend: number };
  conversionRate: { count: number; trend: number };
}

export const DashboardContent: React.FC = () => {
  // 모바일 화면 감지 (md 이하인지 여부)
  const isMobile = useResponsive('down', 'md');

  // 대시보드 데이터 상태 관리
  const [stats, setStats] = useState<DistributorStats>({
    totalSales: { count: 1248, trend: 18.7 },
    activeProducts: { count: 87, trend: 4.2 },
    monthlyRevenue: { count: 32500000, trend: 14.8 },
    conversionRate: { count: 4.8, trend: 0.6 },
  });

  // 최근 판매 데이터
  const recentSales = [
    { id: 'ORD-4921', product: '프리미엄 광고 패키지', customer: '(주)메가브랜드', amount: 1250000, date: '2023-05-20', status: '완료' },
    { id: 'ORD-4920', product: '비즈니스 마케팅 프로', customer: '디지털솔루션즈', amount: 850000, date: '2023-05-19', status: '완료' },
    { id: 'ORD-4919', product: '소셜 미디어 패키지', customer: '퍼포먼스마케팅', amount: 650000, date: '2023-05-19', status: '완료' },
    { id: 'ORD-4918', product: '검색 광고 기본형', customer: '테크노베이션', amount: 450000, date: '2023-05-18', status: '완료' },
    { id: 'ORD-4917', product: '모바일 광고 패키지', customer: '스마트모바일', amount: 720000, date: '2023-05-18', status: '완료' },
  ];

  // 상품 판매 순위 데이터
  const productRankings = [
    { id: 'PRD-001', name: '프리미엄 광고 패키지', sales: 48, revenue: 14200000, trend: 12.4 },
    { id: 'PRD-002', name: '비즈니스 마케팅 프로', sales: 36, revenue: 10800000, trend: 8.2 },
    { id: 'PRD-003', name: '소셜 미디어 패키지', sales: 32, revenue: 7680000, trend: 15.7 },
    { id: 'PRD-004', name: '검색 광고 기본형', sales: 28, revenue: 5600000, trend: -3.2 },
    { id: 'PRD-005', name: '모바일 광고 패키지', sales: 26, revenue: 5200000, trend: 7.8 },
  ];

  // 마케팅 채널별 성과 데이터
  const channelPerformance = [
    { name: '검색 엔진', traffic: 42, conversions: 5.2, revenue: 8450000 },
    { name: '소셜 미디어', traffic: 35, conversions: 3.8, revenue: 6300000 },
    { name: '이메일 마케팅', traffic: 12, conversions: 6.5, revenue: 3750000 },
    { name: '제휴 마케팅', traffic: 8, conversions: 4.1, revenue: 2100000 },
    { name: '다이렉트 트래픽', traffic: 3, conversions: 2.8, revenue: 950000 },
  ];

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

  return (
    <DashboardTemplate
      title="총판 대시보드"
      description="판매 현황, 상품 분석 및 마케팅 성과를 한눈에 파악할 수 있는 총판용 대시보드입니다."
      headerBgClass="bg-amber-600"
      headerTextClass="text-white"
      toolbarActions={
        <>
          <Button variant="outline" size="sm" className="h-9 bg-white/20 text-white hover:bg-white/30 border-white/40">
            상품 관리
          </Button>
          <Button variant="outline" size="sm" className="h-9 bg-white/20 text-white hover:bg-white/30 border-white/40">
            보고서 다운로드
          </Button>
        </>
      }
    >
      {/* 첫 번째 줄: 4개의 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        <DashboardColorCard
          title="총 판매수"
          value={stats.totalSales.count}
          unit="건"
          trend={stats.totalSales.trend}
          icon="tag"
          iconColor="bg-amber-600"
        />
        <DashboardColorCard
          title="활성 상품"
          value={stats.activeProducts.count}
          unit="개"
          trend={stats.activeProducts.trend}
          icon="element-4"
          iconColor="bg-amber-600"
        />
        <DashboardColorCard
          title="월 매출액"
          value={isMobile ? stats.monthlyRevenue.count / 10000 : stats.monthlyRevenue.count}
          unit={isMobile ? "만원" : "원"}
          trend={stats.monthlyRevenue.trend}
          icon="dollar"
          iconColor="bg-green-600"
        />
        <DashboardColorCard
          title="전환율"
          value={stats.conversionRate.count}
          unit="%"
          trend={stats.conversionRate.trend}
          icon="arrow-turn-up"
          iconColor="bg-blue-600"
        />
      </div>

      {/* 두 번째 줄: 최근 판매 & 상품 판매 순위 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* 최근 판매 */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-amber-100 text-amber-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">최근 판매</h3>
            </div>
            <Button variant="outline" size="sm" className="h-8 px-4">
              전체 거래
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="py-3 px-4 text-left">주문 정보</TableHead>
                  <TableHead className="py-3 px-4 text-left">구매자</TableHead>
                  <TableHead className="py-3 px-4 text-right">금액(원)</TableHead>
                  <TableHead className="py-3 px-4 text-center">상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales.map((sale, index) => (
                  <TableRow key={index} className="border-b border-gray-200">
                    <TableCell className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-amber-600">{sale.product}</span>
                        <div className="flex items-center text-xs text-gray-500">
                          <span>{sale.id}</span>
                          <span className="mx-1">•</span>
                          <span>{sale.date}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <span>{sale.customer}</span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <span className="font-medium">
                        {isMobile 
                          ? formatCurrencyInTenThousand(sale.amount)
                          : formatCurrency(sale.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
                        {sale.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
              <h3 className="text-lg font-semibold text-gray-800">상품 판매 순위</h3>
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
              <h3 className="text-lg font-semibold text-gray-800">마케팅 채널 성과</h3>
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
    </DashboardTemplate>
  );
};

export default DashboardContent;