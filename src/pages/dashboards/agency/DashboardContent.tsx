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

// 에이전시 대시보드 통계 데이터 인터페이스
interface AgencyStats {
  totalClients: { count: number; trend: number };
  totalCampaigns: { count: number; trend: number };
  monthlyRevenue: { count: number; trend: number };
  pendingApprovals: { count: number; trend: number };
}

export const DashboardContent: React.FC = () => {
  // 모바일 화면 감지 (md 이하인지 여부)
  const isMobile = useResponsive('down', 'md');

  // 대시보드 데이터 상태 관리
  const [stats, setStats] = useState<AgencyStats>({
    totalClients: { count: 24, trend: 8 },
    totalCampaigns: { count: 156, trend: 22 },
    monthlyRevenue: { count: 42800000, trend: 15.3 },
    pendingApprovals: { count: 8, trend: -12 },
  });

  // 활성 캠페인 데이터
  const activeCampaigns = [
    { id: 'CA-215', name: '여름 프로모션', client: '메가 브랜드', budget: 5800000, status: '진행중', progress: 65 },
    { id: 'CA-214', name: '신제품 출시', client: '퍼포먼스 브랜드', budget: 3200000, status: '진행중', progress: 42 },
    { id: 'CA-213', name: '가을 컬렉션', client: '디자인 슈퍼', budget: 4100000, status: '검토중', progress: 10 },
    { id: 'CA-212', name: '연말 세일', client: '리테일 마스터', budget: 2500000, status: '대기중', progress: 0 },
    { id: 'CA-211', name: '회원 모집', client: '서비스 원', budget: 1800000, status: '진행중', progress: 78 },
  ];

  // 클라이언트 리스트 데이터
  const clientList = [
    { id: 'CL-001', name: '메가 브랜드', campaigns: 5, totalSpend: 12500000, status: '활성' },
    { id: 'CL-002', name: '퍼포먼스 브랜드', campaigns: 3, totalSpend: 8200000, status: '활성' },
    { id: 'CL-003', name: '디자인 슈퍼', campaigns: 4, totalSpend: 9400000, status: '활성' },
    { id: 'CL-004', name: '리테일 마스터', campaigns: 2, totalSpend: 4800000, status: '활성' },
    { id: 'CL-005', name: '서비스 원', campaigns: 3, totalSpend: 6300000, status: '휴면' },
  ];

  // 진행 상태에 따른 색상 지정
  const getStatusColor = (status: string) => {
    switch (status) {
      case '진행중': return 'bg-green-100 text-green-800';
      case '검토중': return 'bg-amber-100 text-amber-800';
      case '대기중': return 'bg-gray-100 text-gray-800';
      case '활성': return 'bg-emerald-100 text-emerald-800';
      case '휴면': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 진행률 색상 계산
  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <DashboardTemplate
      title="대행사 대시보드"
      description="클라이언트 및 캠페인을 관리하고 마케팅 성과를 추적할 수 있는 관리 시스템입니다."
      headerBgClass="bg-blue-600"
      headerTextClass="text-white"
    >
      {/* 첫 번째 줄: 4개의 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        <DashboardColorCard
          title="총 클라이언트 수"
          value={stats.totalClients.count}
          unit="개"
          trend={stats.totalClients.trend}
          icon="profile-user"
          iconColor="bg-blue-600"
        />
        <DashboardColorCard
          title="활성 캠페인 수"
          value={stats.totalCampaigns.count}
          unit="개"
          trend={stats.totalCampaigns.trend}
          icon="chart-line"
          iconColor="bg-blue-600"
        />
        <DashboardColorCard
          title="월 마케팅 비용"
          value={isMobile ? stats.monthlyRevenue.count / 10000 : stats.monthlyRevenue.count}
          unit={isMobile ? "만원" : "원"}
          trend={stats.monthlyRevenue.trend}
          icon="dollar"
          iconColor="bg-green-600"
        />
        <DashboardColorCard
          title="승인 대기 캠페인"
          value={stats.pendingApprovals.count}
          unit="개"
          trend={stats.pendingApprovals.trend}
          icon="calendar-8"
          iconColor="bg-amber-600"
        />
      </div>

      {/* 두 번째 줄: 활성 캠페인 & 클라이언트 리스트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* 활성 캠페인 */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-blue-100 text-blue-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm9 4a1 1 0 10-2 0v6a1 1 0 102 0V7zm-3 2a1 1 0 10-2 0v4a1 1 0 102 0V9zm-3 3a1 1 0 10-2 0v1a1 1 0 102 0v-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">활성 캠페인</h3>
            </div>
            <Button variant="outline" size="sm" className="h-8 px-4">
              전체 보기
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="py-3 px-4 text-left">캠페인명</TableHead>
                  <TableHead className="py-3 px-4 text-left">클라이언트</TableHead>
                  <TableHead className="py-3 px-4 text-right">예산(원)</TableHead>
                  <TableHead className="py-3 px-4 text-center">상태</TableHead>
                  <TableHead className="py-3 px-4 text-left">진행률</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeCampaigns.map((campaign, index) => (
                  <TableRow key={index} className="border-b border-gray-200">
                    <TableCell className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-blue-600">{campaign.name}</span>
                        <span className="text-xs text-gray-500">{campaign.id}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <span>{campaign.client}</span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <span className="font-medium">
                        {isMobile 
                          ? formatCurrencyInTenThousand(campaign.budget)
                          : formatCurrency(campaign.budget)}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${getProgressColor(campaign.progress)}`} 
                          style={{ width: `${campaign.progress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-right mt-1">{campaign.progress}%</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* 클라이언트 리스트 */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-green-100 text-green-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">클라이언트</h3>
            </div>
            <Button variant="default" size="sm" className="h-8 px-4 bg-green-600 hover:bg-green-700">
              신규 등록
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="py-3 px-4 text-left">클라이언트명</TableHead>
                  <TableHead className="py-3 px-4 text-center">캠페인 수</TableHead>
                  <TableHead className="py-3 px-4 text-right">총 지출(원)</TableHead>
                  <TableHead className="py-3 px-4 text-center">상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientList.map((client, index) => (
                  <TableRow key={index} className="border-b border-gray-200">
                    <TableCell className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-green-600">{client.name}</span>
                        <span className="text-xs text-gray-500">{client.id}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                        {client.campaigns}개
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <span className="font-medium">
                        {isMobile 
                          ? formatCurrencyInTenThousand(client.totalSpend)
                          : formatCurrency(client.totalSpend)}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                        {client.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* 세 번째 줄: 마케팅 성과 요약 */}
      <div className="grid grid-cols-1 gap-5 mb-5">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-purple-100 text-purple-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">마케팅 성과 요약</h3>
            </div>
            <Button variant="outline" size="sm" className="h-8 px-4">
              성과 보고서
            </Button>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">노출 수</div>
                <div className="text-xl font-bold text-gray-800">5,843,291</div>
                <div className="text-xs text-green-600 mt-1">↑ 12.4% 증가</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">클릭 수</div>
                <div className="text-xl font-bold text-gray-800">132,458</div>
                <div className="text-xs text-green-600 mt-1">↑ 8.7% 증가</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">CTR</div>
                <div className="text-xl font-bold text-gray-800">2.27%</div>
                <div className="text-xs text-red-600 mt-1">↓ 0.4% 감소</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">전환율</div>
                <div className="text-xl font-bold text-gray-800">3.8%</div>
                <div className="text-xs text-green-600 mt-1">↑ 1.2% 증가</div>
              </div>
            </div>
            
            <div className="flex justify-between mb-5">
              <h4 className="font-medium text-base">주간 성과 하이라이트</h4>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="h-8 px-3">
                  이번 주
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-3">
                  지난 주
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-3">
                  이번 달
                </Button>
              </div>
            </div>
            
            <div className="bg-gray-50 p-5 rounded-lg">
              <div className="text-sm text-gray-500 mb-3">가장 성과가 좋은 캠페인</div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <div className="text-base font-medium text-blue-600">여름 프로모션</div>
                  <div className="text-sm text-gray-500">메가 브랜드</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-gray-800">ROI 320%</div>
                  <div className="text-xs text-green-600">목표 초과 달성</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">전환 수</div>
                  <div className="text-base font-medium text-gray-800">1,245</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">CPA</div>
                  <div className="text-base font-medium text-gray-800">₩4,650</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">CPC</div>
                  <div className="text-base font-medium text-gray-800">₩420</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardTemplate>
  );
};

export default DashboardContent;