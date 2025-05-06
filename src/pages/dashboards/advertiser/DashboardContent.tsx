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

// 광고주 대시보드 통계 데이터 인터페이스
interface AdvertiserStats {
  activeCampaigns: { count: number; trend: number };
  totalImpressions: { count: number; trend: number };
  adSpend: { count: number; trend: number };
  ctr: { count: number; trend: number };
}

export const DashboardContent: React.FC = () => {
  // 모바일 화면 감지 (md 이하인지 여부)
  const isMobile = useResponsive('down', 'md');

  // 대시보드 데이터 상태 관리
  const [stats, setStats] = useState<AdvertiserStats>({
    activeCampaigns: { count: 5, trend: 25 },
    totalImpressions: { count: 3254687, trend: 15.8 },
    adSpend: { count: 15800000, trend: 8.3 },
    ctr: { count: 3.2, trend: 0.4 },
  });

  // 캠페인 현황 데이터
  const campaignStatus = [
    { id: 'CPG-01', name: '여름 시즌 특별 프로모션', budget: 5000000, spent: 3250000, impressions: 980000, clicks: 32400, ctr: 3.3, status: '진행중' },
    { id: 'CPG-02', name: '신규 사용자 유치 캠페인', budget: 3500000, spent: 2100000, impressions: 720000, clicks: 18720, ctr: 2.6, status: '진행중' },
    { id: 'CPG-03', name: '브랜드 인지도 향상', budget: 4200000, spent: 4200000, impressions: 1250000, clicks: 41250, ctr: 3.3, status: '종료' },
    { id: 'CPG-04', name: '모바일 앱 다운로드 캠페인', budget: 2800000, spent: 980000, impressions: 320000, clicks: 12800, ctr: 4.0, status: '일시중지' },
    { id: 'CPG-05', name: '가을 신상품 소개', budget: 3800000, spent: 0, impressions: 0, clicks: 0, ctr: 0, status: '대기중' },
  ];

  // 광고 성과 데이터
  const adPerformance = [
    { id: 'AD-001', name: '메인 배너 광고', clicks: 15240, impressions: 450000, ctr: 3.4, cpc: 520, status: '활성' },
    { id: 'AD-002', name: '모바일 전면 광고', clicks: 9800, impressions: 280000, ctr: 3.5, cpc: 480, status: '활성' },
    { id: 'AD-003', name: '검색 결과 상단 광고', clicks: 8450, impressions: 320000, ctr: 2.6, cpc: 550, status: '활성' },
    { id: 'AD-004', name: '제품 페이지 배너', clicks: 6200, impressions: 210000, ctr: 3.0, cpc: 490, status: '활성' },
    { id: 'AD-005', name: '이벤트 팝업 광고', clicks: 3650, impressions: 180000, ctr: 2.0, cpc: 440, status: '비활성' },
  ];

  // 타겟 그룹 데이터
  const targetGroups = [
    { name: '20-30대 여성', reach: 765000, engagement: 4.8, cost: 3250000, conversion: 3.2 },
    { name: '30-40대 남성', reach: 580000, engagement: 3.5, cost: 2850000, conversion: 2.7 },
    { name: '10대-20대 대학생', reach: 420000, engagement: 5.6, cost: 2200000, conversion: 4.1 },
    { name: '40-50대 전문직', reach: 320000, engagement: 2.8, cost: 1850000, conversion: 3.8 },
    { name: '모바일 게임 사용자', reach: 640000, engagement: 6.2, cost: 2950000, conversion: 5.3 },
  ];

  // 진행 상태에 따른 색상 지정
  const getStatusColor = (status: string) => {
    switch (status) {
      case '진행중':
      case '활성': return 'bg-green-100 text-green-800';
      case '종료': return 'bg-gray-100 text-gray-800';
      case '일시중지': return 'bg-yellow-100 text-yellow-800';
      case '대기중': return 'bg-blue-100 text-blue-800';
      case '비활성': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 진행률 계산
  const getProgress = (spent: number, budget: number) => {
    if (budget === 0) return 0;
    const progress = (spent / budget) * 100;
    return Math.min(progress, 100);
  };

  // 진행률 색상 계산
  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'bg-red-500';
    if (progress >= 70) return 'bg-yellow-500';
    if (progress >= 40) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <DashboardTemplate
      title="광고주 대시보드"
      description="광고 캠페인 관리, 성과 분석 및 타겟 그룹별 성과를 확인할 수 있는 종합 대시보드입니다."
      headerBgClass="bg-green-600"
      headerTextClass="text-white"
      toolbarActions={
        <>
          <Button variant="outline" size="sm" className="h-9 bg-white/20 text-white hover:bg-white/30 border-white/40">
            새 캠페인
          </Button>
          <Button variant="outline" size="sm" className="h-9 bg-white/20 text-white hover:bg-white/30 border-white/40">
            성과 보고서
          </Button>
        </>
      }
    >
      {/* 첫 번째 줄: 4개의 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        <DashboardColorCard
          title="활성 캠페인"
          value={stats.activeCampaigns.count}
          unit="개"
          trend={stats.activeCampaigns.trend}
          icon="rocket"
          iconColor="bg-green-600"
        />
        <DashboardColorCard
          title="총 노출수"
          value={stats.totalImpressions.count}
          unit="회"
          trend={stats.totalImpressions.trend}
          icon="eye"
          iconColor="bg-green-600"
        />
        <DashboardColorCard
          title="광고 지출액"
          value={isMobile ? stats.adSpend.count / 10000 : stats.adSpend.count}
          unit={isMobile ? "만원" : "원"}
          trend={stats.adSpend.trend}
          icon="dollar"
          iconColor="bg-blue-600"
        />
        <DashboardColorCard
          title="평균 CTR"
          value={stats.ctr.count}
          unit="%"
          trend={stats.ctr.trend}
          icon="mouse-click"
          iconColor="bg-purple-600"
        />
      </div>

      {/* 두 번째 줄: 캠페인 현황 & 광고 성과 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* 캠페인 현황 */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-green-100 text-green-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">캠페인 현황</h3>
            </div>
            <Button variant="outline" size="sm" className="h-8 px-4">
              관리
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="py-3 px-4 text-left">캠페인명</TableHead>
                  <TableHead className="py-3 px-4 text-center">상태</TableHead>
                  <TableHead className="py-3 px-4 text-right">예산/지출</TableHead>
                  <TableHead className="py-3 px-4 text-left">진행률</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignStatus.map((campaign, index) => (
                  <TableRow key={index} className="border-b border-gray-200">
                    <TableCell className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-green-600">{campaign.name}</span>
                        <span className="text-xs text-gray-500">{campaign.id}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {isMobile 
                            ? formatCurrencyInTenThousand(campaign.spent)
                            : formatCurrency(campaign.spent)}
                        </span>
                        <span className="text-xs text-gray-500">
                          / {isMobile 
                            ? formatCurrencyInTenThousand(campaign.budget)
                            : formatCurrency(campaign.budget)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${getProgressColor(getProgress(campaign.spent, campaign.budget))}`} 
                          style={{ width: `${getProgress(campaign.spent, campaign.budget)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-right mt-1">{getProgress(campaign.spent, campaign.budget).toFixed(0)}%</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* 광고 성과 */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-blue-100 text-blue-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">광고 성과</h3>
            </div>
            <Button variant="outline" size="sm" className="h-8 px-4">
              최적화
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="py-3 px-4 text-left">광고명</TableHead>
                  <TableHead className="py-3 px-4 text-center">클릭수</TableHead>
                  <TableHead className="py-3 px-4 text-center">CTR</TableHead>
                  <TableHead className="py-3 px-4 text-right">클릭당 비용</TableHead>
                  <TableHead className="py-3 px-4 text-center">상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adPerformance.map((ad, index) => (
                  <TableRow key={index} className="border-b border-gray-200">
                    <TableCell className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-blue-600">{ad.name}</span>
                        <span className="text-xs text-gray-500">{ad.id}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center">
                      <span>{ad.clicks.toLocaleString()}</span>
                      <div className="text-xs text-gray-500">
                        {ad.impressions.toLocaleString()} 노출
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center">
                      <span className="font-medium">{ad.ctr.toFixed(1)}%</span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <span>{ad.cpc}원</span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ad.status)}`}>
                        {ad.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* 세 번째 줄: 타겟 그룹별 성과 */}
      <div className="grid grid-cols-1 gap-5 mb-5">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-purple-100 text-purple-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">타겟 그룹별 성과</h3>
            </div>
            <Button variant="outline" size="sm" className="h-8 px-4">
              타겟 조정
            </Button>
          </div>
          <div className="p-5">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="py-3 px-4 text-left">타겟 그룹</TableHead>
                    <TableHead className="py-3 px-4 text-right">도달 인원</TableHead>
                    <TableHead className="py-3 px-4 text-center">참여율</TableHead>
                    <TableHead className="py-3 px-4 text-right">광고 비용(원)</TableHead>
                    <TableHead className="py-3 px-4 text-center">전환율</TableHead>
                    <TableHead className="py-3 px-4 text-left">효율성</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {targetGroups.map((group, index) => (
                    <TableRow key={index} className="border-b border-gray-200">
                      <TableCell className="py-3 px-4">
                        <span className="font-medium">{group.name}</span>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-right">
                        <span>{group.reach.toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-center">
                        <span>{group.engagement.toFixed(1)}%</span>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-right">
                        <span>
                          {isMobile 
                            ? formatCurrencyInTenThousand(group.cost)
                            : formatCurrency(group.cost)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-center">
                        <span className="font-medium">{group.conversion.toFixed(1)}%</span>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="h-2.5 rounded-full bg-purple-500" 
                            style={{ width: `${(group.conversion / 6) * 100}%` }}
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
                <div className="text-sm text-gray-500 mb-1">전체 도달 인원</div>
                <div className="text-xl font-bold text-gray-800">2,725,000</div>
                <div className="text-xs text-green-600 mt-1">↑ 15.8% 증가</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">평균 참여율</div>
                <div className="text-xl font-bold text-gray-800">4.58%</div>
                <div className="text-xs text-green-600 mt-1">↑ 0.7% 증가</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">평균 전환율</div>
                <div className="text-xl font-bold text-gray-800">3.82%</div>
                <div className="text-xs text-green-600 mt-1">↑ 0.4% 증가</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardTemplate>
  );
};

export default DashboardContent;