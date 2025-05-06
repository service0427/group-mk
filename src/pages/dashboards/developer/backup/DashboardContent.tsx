import React, { useEffect, useState } from 'react';
import { StatCard } from '@/pages/dashboards/components';
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

interface DeveloperStats {
  users: { count: number; trend: number };
  apiCalls: { count: number; trend: number };
  dbUsage: { count: number; trend: number };
  responseTime: { count: number; trend: number };
}

export const DashboardContent: React.FC = () => {
  // 모바일 화면 감지 (md 이하인지 여부)
  const isMobile = useResponsive('down', 'md');

  const [stats, setStats] = useState<DeveloperStats>({
    users: { count: 0, trend: 0 },
    apiCalls: { count: 0, trend: 0 },
    dbUsage: { count: 0, trend: 0 },
    responseTime: { count: 0, trend: 0 },
  });

  useEffect(() => {
    // API 호출로 데이터 가져오기 (실제 구현에서는 API 호출)
    // 임시 데이터
    setStats({
      users: { count: 124, trend: 12 },
      apiCalls: { count: 38.2, trend: 5 },
      dbUsage: { count: 128, trend: 10 },
      responseTime: { count: 42, trend: -8 },
    });
  }, []);

  const dbData = [
    ['users', '124', '24MB'],
    ['products', '587', '42MB'],
    ['transactions', '8,493', '56MB'],
  ];

  const apiEndpoints = [
    {
      path: '/api/users/*',
      developer: '전체',
      operator: '읽기/수정',
      distributor: '읽기',
      agency: '-',
      advertiser: '-',
    },
    {
      path: '/api/products/*',
      developer: '전체',
      operator: '전체',
      distributor: '생성/수정',
      agency: '읽기',
      advertiser: '읽기',
    },
    {
      path: '/api/transactions/*',
      developer: '전체',
      operator: '전체',
      distributor: '부분만',
      agency: '부분만',
      advertiser: '부분만',
    },
  ];

  // 시스템 로그 데이터
  const systemLogs = [
    {
      id: 'WD-215',
      message: '출금 요청 승인됨 (ID: WD-215)',
      time: '2023-05-15 09:45',
      type: 'primary'
    },
    {
      id: 'USR-142',
      message: '새 사용자 가입 (ID: USR-142)',
      time: '2023-05-15 09:58',
      type: 'success'
    },
    {
      id: 'API-2',
      message: 'API 요청량 임계치 도달 (ID: API-2)',
      time: '2023-05-15 10:15',
      type: 'warning'
    },
    {
      id: 'PRD-8732',
      message: '새 상품 등록됨 (ID: PRD-8732)',
      time: '2023-05-15 10:30',
      type: 'primary'
    },
    {
      id: '사용자 인증 실패',
      message: '사용자 인증 실패 - 잘못된 토큰',
      time: '2023-05-15 10:42',
      type: 'danger'
    }
  ];

  return (
    <>
      {/* 첫 번째 줄: 4개의 통계 카드 컨테이너 - 반응형 */}
      <div className="container mb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div>
            <StatCard
              title="시스템 사용자"
              value={stats.users.count}
              unit="명"
              trend={stats.users.trend}
              keenIcon="users"
              iconColor="primary"
            />
          </div>
          <div>
            <StatCard
              title="API 호출 횟수"
              value={38200}
              unit="회"
              trend={5}
              keenIcon="code"
              iconColor="success"
            />
          </div>
          <div>
            <StatCard
              title="데이터베이스 용량"
              value={128}
              unit="MB"
              trend={10}
              keenIcon="database"
              iconColor="warning"
            />
          </div>
          <div>
            <StatCard
              title="평균 응답시간"
              value={42}
              unit="ms"
              trend={-8}
              keenIcon="timer"
              iconColor="info"
            />
          </div>
        </div>
      </div>

      {/* 두 번째 줄: 데이터베이스 & 시스템 로그 컨테이너 */}
      <div className="container mb-10">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <div className="card bg-card h-96">
              <div className="card-header border-0 pt-5">
                <h3 className="card-title align-items-start flex-column">
                  <span className="card-label fw-bold">데이터베이스 구조</span>
                </h3>
              </div>
              <div className="card-body px-0 overflow-y-auto">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-100 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="py-2 px-4" style={{ minWidth: '150px' }}>테이블명</TableHead>
                        <TableHead className="py-2 px-4 text-center" style={{ minWidth: '100px' }}>행 수</TableHead>
                        <TableHead className="py-2 px-4 text-center hidden md:table-cell" style={{ minWidth: '100px' }}>크기</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dbData.map((row, index) => (
                        <TableRow key={index} className="border-b border-gray-200 hover:bg-muted/50">
                          <TableCell className="py-2 px-4">
                            <span className="font-medium">{row[0]}</span>
                          </TableCell>
                          <TableCell className="py-2 px-4 text-center">
                            {row[1]}
                          </TableCell>
                          <TableCell className="py-2 px-4 text-center hidden md:table-cell">
                            {row[2]}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="card bg-card h-96">
              <div className="card-header border-0 pt-5">
                <h3 className="card-title align-items-start flex-column">
                  <span className="card-label fw-bold">시스템 로그</span>
                </h3>
                <div className="card-toolbar">
                  <Button variant="outline" size="sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:mr-2">
                      <polyline points="1 4 1 10 7 10"></polyline>
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                    </svg>
                    <span className="hidden md:inline">최근 시스템 로그</span>
                  </Button>
                </div>
              </div>
              <div className="card-body px-0 overflow-y-auto">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-100 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="py-2 px-4" style={{ minWidth: '250px' }}>메시지</TableHead>
                        <TableHead className="py-2 px-4 text-center whitespace-nowrap hidden md:table-cell" style={{ minWidth: '140px' }}>시간</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {systemLogs.map((log, index) => (
                        <TableRow key={index} className="border-b border-gray-200 hover:bg-muted/50">
                          <TableCell className="py-2 px-4">
                            {log.message}
                          </TableCell>
                          <TableCell className="py-2 px-4 text-center whitespace-nowrap hidden md:table-cell">
                            {log.time}
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
      </div>

      {/* 세 번째 줄: API 및 권한 설정 컨테이너 */}
      <div className="container mb-10">
        <div className="grid grid-cols-1 gap-5">
          <div>
            <div className="card h-96">
              <div className="card-header border-0 pt-5">
                <h3 className="card-title align-items-start flex-column">
                  <span className="card-label fw-bold">API 및 권한 설정</span>
                </h3>
              </div>
              <div className="card-body px-0 overflow-y-auto">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-100 sticky top-0 z-10">
                      <TableRow>
                        <TableHead style={{ minWidth: '150px' }}>엔드포인트</TableHead>
                        <TableHead className="text-center hidden md:table-cell" style={{ minWidth: '100px' }}>개발자</TableHead>
                        <TableHead className="text-center hidden md:table-cell" style={{ minWidth: '100px' }}>운영자</TableHead>
                        <TableHead className="text-center hidden md:table-cell" style={{ minWidth: '100px' }}>총판</TableHead>
                        <TableHead className="text-center hidden md:table-cell" style={{ minWidth: '100px' }}>대행사</TableHead>
                        <TableHead className="text-center hidden md:table-cell" style={{ minWidth: '100px' }}>광고주</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiEndpoints.map((endpoint, index) => (
                        <TableRow key={index} className="border-b border-gray-200 hover:bg-muted/50">
                          <TableCell className="py-2 px-4">
                            <span className="font-medium">{endpoint.path}</span>
                          </TableCell>
                          <TableCell className="py-2 px-4 text-center hidden md:table-cell">
                            {endpoint.developer}
                          </TableCell>
                          <TableCell className="py-2 px-4 text-center hidden md:table-cell">
                            {endpoint.operator}
                          </TableCell>
                          <TableCell className="py-2 px-4 text-center hidden md:table-cell">
                            {endpoint.distributor}
                          </TableCell>
                          <TableCell className="py-2 px-4 text-center hidden md:table-cell">
                            {endpoint.agency}
                          </TableCell>
                          <TableCell className="py-2 px-4 text-center hidden md:table-cell">
                            {endpoint.advertiser}
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
      </div>

      {/* 네 번째 줄: 거래 내역 컨테이너 */}
      <div className="container mb-10">
        <div className="grid grid-cols-1 gap-5">
          <div>
            <div className="card h-96">
              <div className="card-header border-0 pt-5">
                <h3 className="card-title align-items-start flex-column">
                  <span className="card-label fw-bold">거래 내역</span>
                </h3>
              </div>
              <div className="card-body px-0 overflow-y-auto">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-100 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="py-2 px-4 text-center whitespace-nowrap hidden md:table-cell" style={{ minWidth: '100px' }}>거래 ID</TableHead>
                        <TableHead className="py-2 px-4 text-center whitespace-nowrap" style={{ minWidth: '100px' }}>날짜</TableHead>
                        <TableHead className="py-2 px-4 hidden md:table-cell" style={{ minWidth: '200px' }}>내용</TableHead>
                        <TableHead className="py-2 px-4 text-center whitespace-nowrap" style={{ minWidth: '120px' }}>금액</TableHead>
                        <TableHead className="py-2 px-4 text-center whitespace-nowrap" style={{ minWidth: '100px' }}>타입</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="border-b border-gray-200 hover:bg-muted/50">
                        <TableCell className="py-2 px-4 text-center whitespace-nowrap hidden md:table-cell">
                          <span className="font-medium">tx-001</span>
                        </TableCell>
                        <TableCell className="py-2 px-4 text-center whitespace-nowrap">
                          2023-06-10
                        </TableCell>
                        <TableCell className="py-2 px-4 hidden md:table-cell">
                          페이스북 광고 패키지 구매
                        </TableCell>
                        <TableCell className="py-2 px-4 text-center whitespace-nowrap font-medium">
                          {isMobile
                            ? formatCurrencyInTenThousand(500000)
                            : formatCurrency(500000)}
                        </TableCell>
                        <TableCell className="py-2 px-4 text-center whitespace-nowrap">
                          <span className="inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">결제</span>
                        </TableCell>
                      </TableRow>
                      <TableRow className="border-b border-gray-200 hover:bg-muted/50">
                        <TableCell className="py-2 px-4 text-center whitespace-nowrap hidden md:table-cell">
                          <span className="font-medium">tx-002</span>
                        </TableCell>
                        <TableCell className="py-2 px-4 text-center whitespace-nowrap">
                          2023-06-05
                        </TableCell>
                        <TableCell className="py-2 px-4 hidden md:table-cell">
                          광고 예산 충전
                        </TableCell>
                        <TableCell className="py-2 px-4 text-center whitespace-nowrap font-medium">
                          {isMobile
                            ? formatCurrencyInTenThousand(1000000)
                            : formatCurrency(1000000)}
                        </TableCell>
                        <TableCell className="py-2 px-4 text-center whitespace-nowrap">
                          <span className="inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">입금</span>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};