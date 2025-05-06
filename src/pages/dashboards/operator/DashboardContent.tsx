import React, { useEffect, useState } from 'react';
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

// 운영자 대시보드 통계 데이터 인터페이스
interface OperatorStats {
  totalDistributors: { count: number; trend: number };
  totalProducts: { count: number; trend: number };
  monthlyRevenue: { count: number; trend: number };
  pendingWithdrawals: { count: number; trend: number };
}

export const DashboardContent: React.FC = () => {
  // 모바일 화면 감지 (md 이하인지 여부)
  const isMobile = useResponsive('down', 'md');

  // 대시보드 데이터 상태 관리
  const [stats, setStats] = useState<OperatorStats>({
    totalDistributors: { count: 12, trend: 2 },
    totalProducts: { count: 587, trend: 34 },
    monthlyRevenue: { count: 85200000, trend: 12.4 },
    pendingWithdrawals: { count: 4300000, trend: 2 },
  });

  // 캐시 지급 설정 관련 상태 관리
  const [defaultBonusRate, setDefaultBonusRate] = useState("5");
  const [individualBonusRate, setIndividualBonusRate] = useState("7");
  const [individualAccount, setIndividualAccount] = useState("");

  // 출금 요청 관리 데이터
  const withdrawalRequests = [
    { id: 'WD-215', name: '메가 미디어', amount: 2500000, date: '2023-05-20' },
    { id: 'WD-214', name: '퍼포먼스 마케팅', amount: 1800000, date: '2023-05-18' },
    { id: 'WD-213', name: '디지털 크리에이티브', amount: 3200000, date: '2023-05-15' },
    { id: 'WD-212', name: '소셜미디어 허브', amount: 1500000, date: '2023-05-12' },
    { id: 'WD-211', name: '트렌드 마케팅', amount: 950000, date: '2023-05-10' },
  ];

  // 총판 관리 데이터
  const distributorList = [
    { id: 'DST-001', name: '메가 미디어', productCount: 78, revenue: 28500000 },
    { id: 'DST-002', name: '퍼포먼스 마케팅', productCount: 62, revenue: 19800000 },
    { id: 'DST-003', name: '디지털 크리에이티브', productCount: 45, revenue: 15200000 },
    { id: 'DST-004', name: '소셜미디어 허브', productCount: 34, revenue: 12500000 },
    { id: 'DST-005', name: '트렌드 마케팅', productCount: 28, revenue: 9500000 },
  ];

  // 기본 보너스 지급률 적용 처리 함수
  const handleApplyDefaultBonus = () => {
    console.log(`기본 보너스 ${defaultBonusRate}% 적용`);
  };

  // 개별 보너스 적용 처리 함수
  const handleApplyIndividualBonus = () => {
    if (!individualAccount) {
      alert('계정을 입력해주세요.');
      return;
    }
    console.log(`${individualAccount}에 ${individualBonusRate}% 보너스 적용`);
    setIndividualAccount(''); // 입력 필드 초기화
  };

  return (
    <DashboardTemplate
      title="운영자 대시보드"
      description="총판 및 개별을 관리하고 시스템 설정을 변경할 수 있는 중앙 관리 시스템입니다. 운영자 권한이 있는 사용자만 접근할 수 있습니다."
      headerBgClass="bg-indigo-600"
      headerTextClass="text-white"
    >
      {/* 첫 번째 줄: 4개의 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        <DashboardColorCard
          title="총 총판 수"
          value={stats.totalDistributors.count}
          unit="개"
          trend={stats.totalDistributors.trend}
          icon="element-11"
          iconColor="bg-indigo-600"
        />
        <DashboardColorCard
          title="총 상품 수"
          value={stats.totalProducts.count}
          unit="개"
          trend={stats.totalProducts.trend}
          icon="basket"
          iconColor="bg-indigo-600"
        />
        <DashboardColorCard
          title="월 거래액"
          value={isMobile ? stats.monthlyRevenue.count / 10000 : stats.monthlyRevenue.count}
          unit={isMobile ? "만원" : "원"}
          trend={stats.monthlyRevenue.trend}
          icon="dollar"
          iconColor="bg-green-600"
        />
        <DashboardColorCard
          title="보류 중인 출금"
          value={isMobile ? stats.pendingWithdrawals.count / 10000 : stats.pendingWithdrawals.count}
          unit={isMobile ? "만원" : "원"}
          trend={stats.pendingWithdrawals.trend}
          icon="bank"
          iconColor="bg-amber-600"
        />
      </div>

      {/* 두 번째 줄: 출금 요청 관리 & 총판 관리 테이블 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* 출금 요청 관리 */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-indigo-100 text-indigo-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1.5V3a1 1 0 00-1-1h-5a1 1 0 00-1 1v1H4zm6 1V3h3v2h-3z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">출금 요청 관리</h3>
            </div>
            <Button variant="outline" size="sm" className="h-8 px-4">
              요청 목록
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="py-3 px-4 text-left">ID</TableHead>
                  <TableHead className="py-3 px-4 text-left">총판명</TableHead>
                  <TableHead className="py-3 px-4 text-right">금액(원)</TableHead>
                  <TableHead className="py-3 px-4 text-center">요청일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawalRequests.map((request, index) => (
                  <TableRow key={index} className="border-b border-gray-200">
                    <TableCell className="py-3 px-4">
                      <span className="font-medium text-indigo-600">{request.id}</span>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <span>{request.name}</span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <span className="font-medium">
                        {isMobile
                          ? formatCurrencyInTenThousand(request.amount)
                          : formatCurrency(request.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center">
                      <span className="text-gray-500">{request.date}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* 총판 관리 */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-green-100 text-green-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">총판 관리</h3>
            </div>
            <Button variant="default" size="sm" className="h-8 px-4 bg-green-600 hover:bg-green-700">
              새 총판 추가
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="py-3 px-4 text-left">ID</TableHead>
                  <TableHead className="py-3 px-4 text-left">총판명</TableHead>
                  <TableHead className="py-3 px-4 text-center">상품 수</TableHead>
                  <TableHead className="py-3 px-4 text-right">총 매출(원)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {distributorList.map((distributor, index) => (
                  <TableRow key={index} className="border-b border-gray-200">
                    <TableCell className="py-3 px-4">
                      <span className="font-medium text-green-600">{distributor.id}</span>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <span>{distributor.name}</span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center">
                      <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                        {distributor.productCount}개
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <span className="font-medium">
                        {isMobile
                          ? formatCurrencyInTenThousand(distributor.revenue)
                          : formatCurrency(distributor.revenue)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* 세 번째 줄: 캐시 지급 설정 */}
      <div className="grid grid-cols-1 gap-5 mb-5">
        <Card className="overflow-hidden">
          <div className="flex items-center p-5 border-b border-gray-200">
            <div className="w-8 h-8 flex items-center justify-center rounded-md bg-amber-100 text-amber-600 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">캐시 지급 설정</h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* 기본 보너스 지급률 */}
              <div className="bg-gray-50 p-5 rounded-lg">
                <h4 className="font-medium text-base mb-4">기본 보너스 지급률</h4>
                <div className="flex items-center">
                  <input
                    type="number"
                    className="w-20 h-10 py-2 px-3 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={defaultBonusRate}
                    onChange={(e) => setDefaultBonusRate(e.target.value)}
                  />
                  <span className="mx-2 text-gray-700">%</span>
                  <Button
                    variant="default"
                    size="sm"
                    className="h-10 px-4 ml-2 bg-indigo-600 hover:bg-indigo-700"
                    onClick={handleApplyDefaultBonus}
                  >
                    적용하기
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-3">모든 신규 계정에 적용되는 기본 보너스 비율입니다.</p>
              </div>

              {/* 개별 보너스 설정 */}
              <div className="bg-gray-50 p-5 rounded-lg">
                <h4 className="font-medium text-base mb-4">개별 보너스 설정</h4>
                <div className="flex items-center">
                  <input
                    type="text"
                    className="flex-1 h-10 py-2 px-3 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="계정 이름"
                    value={individualAccount}
                    onChange={(e) => setIndividualAccount(e.target.value)}
                  />
                  <input
                    type="number"
                    className="w-20 h-10 py-2 px-3 bg-white border border-gray-300 rounded-md ml-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={individualBonusRate}
                    onChange={(e) => setIndividualBonusRate(e.target.value)}
                  />
                  <span className="mx-2 text-gray-700">%</span>
                  <Button
                    variant="default"
                    size="sm"
                    className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700"
                    onClick={handleApplyIndividualBonus}
                  >
                    적용하기
                  </Button>
                </div>
              </div>
            </div>

            {/* 설정 적용 블록 */}
            <div className="flex items-center justify-between mb-5">
              <h4 className="font-medium text-base">설정 적용 완료</h4>
              <Button variant="outline" size="sm" className="h-8 px-4">
                설정 초기화
              </Button>
            </div>

            {/* 개별 설정 입력 필드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">기본 보너스 지급율</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    className="w-full h-10 py-2 px-3 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="5"
                  />
                  <span className="ml-2 text-gray-700">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">개별 보너스 지급률</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    className="w-full h-10 py-2 px-3 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="7"
                  />
                  <span className="ml-2 text-gray-700">%</span>
                </div>
              </div>
            </div>

            <Button
              variant="default"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              설정 저장하기
            </Button>
          </div>
        </Card>
      </div>
    </DashboardTemplate>
  );
};

export default DashboardContent;