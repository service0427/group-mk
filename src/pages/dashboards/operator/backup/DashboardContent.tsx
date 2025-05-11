import React, { useEffect, useState } from 'react';
import { StatCard } from '@/pages/dashboards/components';
import { KeenIcon } from '@/components';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table';
import { useResponsive } from '@/hooks';
import { formatCurrency, formatCurrencyInTenThousand } from '@/utils/Format';

// 운영자 대시보드 통계 데이터 인터페이스
interface OperatorStats {
  totalProducts: { count: number; trend: number };
  totalMembers: { count: number; trend: number };
  monthlyRevenue: { count: number; trend: number };
  pendingWithdrawals: { count: number; trend: number };
}

export const DashboardContent: React.FC = () => {
  // 모바일 화면 감지 (md 이하인지 여부)
  const isMobile = useResponsive('down', 'md');

  // 대시보드 데이터 상태 관리
  const [stats, setStats] = useState<OperatorStats>({
    totalProducts: { count: 0, trend: 0 },
    totalMembers: { count: 0, trend: 0 },
    monthlyRevenue: { count: 0, trend: 0 },
    pendingWithdrawals: { count: 0, trend: 0 },
  });

  // 캐시 지급 설정 관련 상태 관리
  const [defaultBonusRate, setDefaultBonusRate] = useState("5");
  const [individualBonusRate, setIndividualBonusRate] = useState("7");
  const [individualAccount, setIndividualAccount] = useState("");

  // 컴포넌트 마운트 시 데이터 로딩
  useEffect(() => {
    // 실제 구현에서는 API 호출로 데이터를 가져오지만, 현재는 이미지에 맞는 임시 데이터 사용
    setStats({
      totalProducts: { count: 12, trend: 2 },
      totalMembers: { count: 587, trend: 34 },
      monthlyRevenue: { count: isMobile ? 8520 : 85200000, trend: 12.4 },
      pendingWithdrawals: { count: isMobile ? 430 : 4300000, trend: 2 },
    });
  }, [isMobile]);

  // 출금 요청 관리 데이터
  const withdrawalRequests = [
    { id: 'WD-215', name: '메가 미디어', amount: '2500000', date: '2023-05-20' },
    { id: 'WD-214', name: '퍼포먼스 마케팅', amount: '1800000', date: '2023-05-18' },
    { id: 'WD-213', name: '디지털 크리에이티브', amount: '3200000', date: '2023-05-15' },
    { id: 'WD-212', name: '소셜미디어 허브', amount: '1500000', date: '2023-05-12' },
    { id: 'WD-211', name: '트렌드 마케팅', amount: '950000', date: '2023-05-10' },
  ];

  // 총판 관리 데이터
  const distributorList = [
    { id: 'DST-001', name: '메가 미디어', productCount: '78개', revenue: '28500000' },
    { id: 'DST-002', name: '퍼포먼스 마케팅', productCount: '62개', revenue: '19800000' },
    { id: 'DST-003', name: '디지털 크리에이티브', productCount: '45개', revenue: '15200000' },
    { id: 'DST-004', name: '소셜미디어 허브', productCount: '34개', revenue: '12500000' },
    { id: 'DST-005', name: '트렌드 마케팅', productCount: '28개', revenue: '9500000' },
  ];

  // 특별 보너스 계정 데이터
  const specialBonusAccounts = [
    { name: '클라우드 마케팅', type: '대행사', rate: '7%', date: '2023-05-10', status: '삭제' },
    { name: '퍼포먼스 랩', type: '광고주', rate: '10%', date: '2023-05-08', status: '삭제' },
    { name: '소셜 마케팅', type: '대행사', rate: '8%', date: '2023-05-05', status: '삭제' },
  ];

  // 기본 보너스 지급률 적용 처리 함수
  const handleApplyDefaultBonus = () => {
    // API 호출 또는 상태 업데이트 로직 구현
    
  };

  // 개별 보너스 적용 처리 함수
  const handleApplyIndividualBonus = () => {
    if (!individualAccount) {
      alert('계정을 입력해주세요.');
      return;
    }
    // API 호출 또는 상태 업데이트 로직 구현
    
    setIndividualAccount(''); // 입력 필드 초기화
  };

  return (
    <>
      {/* 첫 번째 줄: 4개의 통계 카드 */}
      <div className="container mb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div>
            <StatCard
              title="총 총판 수"
              value={12}
              unit="개"
              trend={2}
            />
          </div>
          <div>
            <StatCard
              title="총 상품 수"
              value={587}
              unit="개"
              trend={34}
            />
          </div>
          <div>
            <StatCard
              title="월 거래액"
              value={isMobile ? 8520 : 85200000}
              unit={isMobile ? "만원" : "원"}
              trend={12.4}
            />
          </div>
          <div>
            <StatCard
              title="보류 중인 출금"
              value={isMobile ? 430 : 4300000}
              unit={isMobile ? "만원" : "원"}
              trend={2}
            />
          </div>
        </div>
      </div>

      {/* 두 번째 줄: 출금 요청 관리 & 총판 관리 */}
      <div className="container mb-10">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <div className="card h-96">
              <div className="card-header border-0 pt-5">
                <h3 className="card-title align-items-start flex-column">
                  <span className="card-label fw-bold text-gray-800">출금 요청 관리</span>
                </h3>
                <div className="card-toolbar">
                  <Button variant="outline" size="sm" className="h-8 px-4">
                    출금 요청 목록
                  </Button>
                </div>
              </div>
              <div className="card-body p-0 overflow-y-auto">
                <Table>
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      <TableHead className="py-2 px-4 hidden md:table-cell">ID</TableHead>
                      <TableHead className="py-2 px-4">총판명</TableHead>
                      <TableHead className="py-2 px-4 text-right">금액(원)</TableHead>
                      <TableHead className="py-2 px-4 text-center hidden md:table-cell">요청일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawalRequests.map((request, index) => (
                      <TableRow key={index} className="border-b border-gray-200">
                        <TableCell className="py-2 px-4 hidden md:table-cell">
                          <span className="font-medium">{request.id}</span>
                        </TableCell>
                        <TableCell className="py-2 px-4">
                          <span>{request.name}</span>
                        </TableCell>
                        <TableCell className="py-2 px-4 text-right">
                          <span className="font-medium">
                            {isMobile 
                              ? formatCurrencyInTenThousand(request.amount)
                              : formatCurrency(request.amount)}
                          </span>
                        </TableCell>
                        <TableCell className="py-2 px-4 text-center hidden md:table-cell">
                          <span className="text-muted-foreground">{request.date}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          <div>
            <div className="card h-96">
              <div className="card-header border-0 pt-5">
                <h3 className="card-title align-items-start flex-column">
                  <span className="card-label fw-bold text-gray-800">총판 관리</span>
                </h3>
                <div className="card-toolbar">
                  <Button variant="default" size="sm" className="h-8 px-4 bg-blue-600">
                    새 총판 추가
                  </Button>
                </div>
              </div>
              <div className="card-body p-0 overflow-y-auto">
                <Table>
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      <TableHead className="py-2 px-4 hidden md:table-cell">ID</TableHead>
                      <TableHead className="py-2 px-4">총판명</TableHead>
                      <TableHead className="py-2 px-4 text-center hidden md:table-cell">상품 수</TableHead>
                      <TableHead className="py-2 px-4 text-right">총 매출(원)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {distributorList.map((distributor, index) => (
                      <TableRow key={index} className="border-b border-gray-200">
                        <TableCell className="py-2 px-4 hidden md:table-cell">
                          <span className="font-medium">{distributor.id}</span>
                        </TableCell>
                        <TableCell className="py-2 px-4">
                          <span>{distributor.name}</span>
                        </TableCell>
                        <TableCell className="py-2 px-4 text-center hidden md:table-cell">
                          <span>{distributor.productCount}</span>
                        </TableCell>
                        <TableCell className="py-2 px-4 text-right">
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
            </div>
          </div>
        </div>
      </div>

      {/* 세 번째 줄: 캐시 지급 설정 */}
      <div className="container mb-10">
        <div className="grid grid-cols-1 gap-5">
          <div>
            <div className="card">
              <div className="card-header border-0 pt-5">
                <h3 className="card-title align-items-start flex-column">
                  <span className="card-label fw-bold">캐시 지급 설정</span>
                </h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div>
                      <h5 className="mb-4 font-bold text-base">기본 보너스 지급률</h5>
                      <div className="flex items-center mb-2">
                        <input 
                          type="number" 
                          className="w-16 h-9 py-1 px-2 bg-background text-foreground border border-input rounded" 
                          value={defaultBonusRate}
                          onChange={(e) => setDefaultBonusRate(e.target.value)}
                        />
                        <span className="mx-2">%</span>
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="h-8 px-4 ml-2 bg-blue-600"
                          onClick={handleApplyDefaultBonus}
                        >
                          적용
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">모든 신규 계정에 적용되는 기본 보너스 비율입니다.</p>
                    </div>
                  </div>
                  
                  <div>
                    <div>
                      <h5 className="mb-4 font-bold text-base">개별 보너스 설정</h5>
                      <div className="flex items-center">
                        <input 
                          type="text" 
                          className="w-full h-9 py-1 px-2 bg-background text-foreground border border-input rounded" 
                          placeholder="사용자"
                          value={individualAccount}
                          onChange={(e) => setIndividualAccount(e.target.value)}
                        />
                        <input 
                          type="number" 
                          className="w-16 h-9 py-1 px-2 bg-background text-foreground border border-input rounded ml-2" 
                          value={individualBonusRate}
                          onChange={(e) => setIndividualBonusRate(e.target.value)}
                        />
                        <span className="mx-2">%</span>
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="h-8 px-4 bg-blue-600"
                          onClick={handleApplyIndividualBonus}
                        >
                          적용
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="my-8 border-t border-gray-200"></div>
                
                <h5 className="mb-4 font-bold text-base">특별 보너스 계정</h5>
                
                <Table>
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      <TableHead className="py-2 px-4">계정명</TableHead>
                      <TableHead className="py-2 px-4">타입</TableHead>
                      <TableHead className="py-2 px-4 text-center">보너스 비율</TableHead>
                      <TableHead className="py-2 px-4 text-center">설정일</TableHead>
                      <TableHead className="py-2 px-4 text-center">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {specialBonusAccounts.map((account, index) => (
                      <TableRow key={index} className="border-b border-gray-200">
                        <TableCell className="py-2 px-4">{account.name}</TableCell>
                        <TableCell className="py-2 px-4">{account.type}</TableCell>
                        <TableCell className="py-2 px-4 text-center">{account.rate}</TableCell>
                        <TableCell className="py-2 px-4 text-center">{account.date}</TableCell>
                        <TableCell className="py-2 px-4 text-center">
                          <Button variant="destructive" size="sm" className="text-xs h-7 px-3">삭제</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};