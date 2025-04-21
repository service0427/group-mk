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

// 총판 대시보드 통계 데이터 인터페이스
interface DistributorStats {
  totalProducts: { count: number; trend: number };
  activeProducts: { count: number; trend: number };
  monthlyRevenue: { count: number; trend: number };
  pendingWithdrawal: { count: number; trend: number };
}

export const DashboardContent: React.FC = () => {
  // 모바일 화면 감지 (md 이하인지 여부)
  const isMobile = useResponsive('down', 'md');

  // 오늘 날짜 (YYYY-MM-DD 형식)
  const today = new Date().toISOString().split('T')[0];

  // 대시보드 데이터 상태 관리
  const [stats, setStats] = useState<DistributorStats>({
    totalProducts: { count: 0, trend: 0 },
    activeProducts: { count: 0, trend: 0 },
    monthlyRevenue: { count: 0, trend: 0 },
    pendingWithdrawal: { count: 0, trend: 0 },
  });

  // 컴포넌트 마운트 시 데이터 로딩
  useEffect(() => {
    // 실제 구현에서는 API 호출로 데이터를 가져오지만, 현재는 이미지에 맞는 임시 데이터 사용
    setStats({
      totalProducts: { count: 8, trend: 2 },
      activeProducts: { count: 5, trend: 1 },
      monthlyRevenue: { count: isMobile ? 2450 : 24500000, trend: 15.2 },
      pendingWithdrawal: { count: isMobile ? 250 : 2500000, trend: 0.5 },
    });
  }, [isMobile]);

  // 상품 목록 데이터
  const products = [
    { id: 'PRD-001', name: '인스타그램 팔로워 증가', description: '실제 활성 계정으로 팔로워 증가', price: 15000, quantity: 100, status: '활성' },
    { id: 'PRD-002', name: '유튜브 구독자 확보', description: '유튜브 구독자 확보 - 한국 타겟팅', price: 25000, quantity: 50, status: '활성' },
    { id: 'PRD-003', name: '블로그 방문자 증가', description: '네이버 블로그 방문자 증가 패키지', price: 10000, quantity: 200, status: '비활성' },
    { id: 'PRD-004', name: '페이스북 좋아요 확보', description: '소셜 미디어 포스팅 좋아요 확보', price: 5000, quantity: 300, status: '활성' },
    { id: 'PRD-005', name: '동영상 조회수 증가', description: '유튜브, 인스타그램 동영상 조회수 증가', price: 8000, quantity: 500, status: '활성' },
  ];

  // 오류 상품 데이터
  const errorItems = [
    { id: 'ERR-001', name: '인스타그램 팔로워 증가', quantity: '12개', buyer: '디자인 허브', date: '2023-05-18' },
    { id: 'ERR-002', name: '유튜브 구독자 확보', quantity: '5개', buyer: '트렌드 마케팅', date: '2023-05-17' },
  ];

  return (
    <>
      {/* 첫 번째 줄: 4개의 통계 카드 */}
      <div className="container mb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div>
            <StatCard
              title="총 상품 수"
              value={8}
              unit="개"
              trend={2}
              keenIcon="users"
              iconColor="primary"
            />
          </div>
          <div>
            <StatCard
              title="활성 상품"
              value={5}
              unit="개"
              trend={1}
              keenIcon="code"
              iconColor="success"
            />
          </div>
          <div>
            <StatCard
              title="총 판매 금액"
              value={isMobile ? 2450 : 24500000}
              unit={isMobile ? "만원" : "원"}
              trend={15.2}
              keenIcon="database"
              iconColor="warning"
            />
          </div>
          <div>
            <StatCard
              title="현재 캐시 잔액"
              value={isMobile ? 250 : 2500000}
              unit={isMobile ? "만원" : "원"}
              trend={0.5}
              keenIcon="timer"
              iconColor="info"
            />
          </div>
        </div>
      </div>

      {/* 두 번째 줄: 상품 등록 & 출금 신청 */}
      <div className="container mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="h-full">
            <div className="card h-full">
              <div className="card-header border-0 pt-5">
                <h3 className="card-title align-items-start flex-column">
                  <span className="card-label fw-bold text-gray-800">상품 등록</span>
                </h3>
              </div>
              <div className="card-body py-3">
                <div className="overflow-hidden border border-border rounded-lg mb-6">
                  <table className="min-w-full divide-y divide-border">
                    <tbody className="divide-y divide-border">
                      <tr>
                        <th className="px-4 py-3 bg-muted text-left text-sm font-medium text-muted-foreground w-1/3">
                          상품명
                        </th>
                        <td className="px-4 py-3">
                          <input type="text" className="input w-full bg-background text-foreground border border-input rounded" placeholder="상품명을 입력하세요" />
                        </td>
                      </tr>
                      <tr>
                        <th className="px-4 py-3 bg-muted text-left text-sm font-medium text-muted-foreground">
                          상품 설명
                        </th>
                        <td className="px-4 py-3">
                          <textarea className="input w-full bg-background text-foreground border border-input rounded p-3" style={{ resize: 'none', height: '180px' }} placeholder="상품 설명을 입력하세요"></textarea>
                        </td>
                      </tr>
                      <tr>
                        <th className="px-4 py-3 bg-muted text-left text-sm font-medium text-muted-foreground">
                          가격
                        </th>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <input type="number" className="input w-full md:w-2/3 bg-background text-foreground border border-input rounded" placeholder="가격을 입력하세요" />
                            <span className="ml-2 text-sm font-medium text-foreground">원</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <th className="px-4 py-3 bg-muted text-left text-sm font-medium text-muted-foreground">
                          수량
                        </th>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <input type="number" className="input w-full md:w-2/3 bg-background text-foreground border border-input rounded" placeholder="수량을 입력하세요" />
                            <span className="ml-2 text-sm font-medium text-foreground">개</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <th className="px-4 py-3 bg-muted text-left text-sm font-medium text-muted-foreground">
                          마감 기한 (선택)
                        </th>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-3">
                            <input
                              type="date"
                              className="input w-full md:w-2/3 bg-background text-foreground border border-input rounded"
                              defaultValue={today}
                            />
                            <label className="checkbox-group">
                              <input type="checkbox" className="checkbox checkbox-sm" id="checkbox1" />
                              <span className="checkbox-label">마감 시 자동 판매</span>
                            </label>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end">
                  <button type="button" className="btn btn-primary">상품 등록하기</button>
                </div>
              </div>
            </div>
          </div>
          <div className="h-full">
            <div className="card h-full">
              <div className="card-header border-0 pt-5">
                <h3 className="card-title align-items-start flex-column">
                  <span className="card-label fw-bold text-gray-800">출금 신청하기</span>
                </h3>
              </div>
              <div className="card-body py-3">
                <div className="bg-light-primary p-4 mb-5 rounded">
                  <div className="d-flex flex-col mb-2">
                    <div className="d-flex justify-between items-center mb-2">
                      <span className="text-foreground fw-bolder font-bold text-xl">현재 보유 캐시</span>
                      <span className="text-primary fw-bolder font-bold text-xl">{formatCurrency(2500000)}</span>
                    </div>
                    <div className="text-left">
                      <span className="badge badge-light-primary text-xs">최소 출금: ₩10,000</span>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden border border-border rounded-lg mb-6">
                  <table className="min-w-full divide-y divide-border">
                    <tbody className="divide-y divide-border">
                      <tr>
                        <th className="px-4 py-3 bg-muted text-left text-sm font-medium text-muted-foreground w-1/3">
                          출금 금액
                        </th>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <input type="number" className="input w-full md:w-2/3 bg-background text-foreground border border-input rounded" placeholder="출금 금액을 입력하세요" />
                            <span className="ml-2 text-sm font-medium text-foreground">원</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <th className="px-4 py-3 bg-muted text-left text-sm font-medium text-muted-foreground">
                          은행명
                        </th>
                        <td className="px-4 py-3">
                          <input type="text" className="input w-full bg-background text-foreground border border-input rounded" placeholder="은행명" />
                        </td>
                      </tr>
                      <tr>
                        <th className="px-4 py-3 bg-muted text-left text-sm font-medium text-muted-foreground">
                          계좌번호
                        </th>
                        <td className="px-4 py-3">
                          <input type="text" className="input w-full bg-background text-foreground border border-input rounded" placeholder="계좌번호 (-없이 입력)" />
                        </td>
                      </tr>
                      <tr>
                        <th className="px-4 py-3 bg-muted text-left text-sm font-medium text-muted-foreground">
                          예금주
                        </th>
                        <td className="px-4 py-3">
                          <input type="text" className="input w-full bg-background text-foreground border border-input rounded" placeholder="예금주명" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mb-5 flex flex-col gap-5">
                  <div className="text-sm bg-gray-100 p-4 rounded w-full">
                    <span className="block font-medium mb-2">입금 시 혜택:</span>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>100만원 이상: 2% 보너스 캐시</li>
                      <li>300만원 이상: 3% 보너스 캐시</li>
                      <li>500만원 이상: 5% 보너스 캐시</li>
                    </ul>
                  </div>
                  <div className="flex justify-end w-full">
                    <button type="button" className="btn btn-primary">출금 신청하기</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 세 번째 줄: 등록된 상품 관리 */}
      <div className="container mb-10">
        <div className="grid grid-cols-1 gap-5">
          <div>
            <div className="card">
              <div className="card-header border-0 pt-5">
                <h3 className="card-title align-items-start flex-column">
                  <span className="card-label fw-bold">등록된 상품 관리</span>
                </h3>
                <div className="card-toolbar">
                  <div className="input-group">
                    <input type="text" className="input input-sm" placeholder="상품 검색..." />
                    <Button variant="outline" size="sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.3-4.3"></path>
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
              <div className="card-body px-0 overflow-y-auto">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-100 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="py-2 px-4" style={{ minWidth: '100px' }}>ID</TableHead>
                        <TableHead className="py-2 px-4" style={{ minWidth: '150px' }}>상품명</TableHead>
                        <TableHead className="py-2 px-4 hidden md:table-cell" style={{ minWidth: '200px' }}>설명</TableHead>
                        <TableHead className="py-2 px-4 text-center" style={{ minWidth: '100px' }}>가격</TableHead>
                        <TableHead className="py-2 px-4 text-center" style={{ minWidth: '80px' }}>수량</TableHead>
                        <TableHead className="py-2 px-4 text-center" style={{ minWidth: '80px' }}>상태</TableHead>
                        <TableHead className="py-2 px-4 text-right" style={{ minWidth: '120px' }}>액션</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product, index) => (
                        <TableRow key={index} className="border-b border-gray-200 hover:bg-muted/50">
                          <TableCell className="py-2 px-4">
                            <span className="font-medium">{product.id}</span>
                          </TableCell>
                          <TableCell className="py-2 px-4">
                            <span className="font-medium">{product.name}</span>
                          </TableCell>
                          <TableCell className="py-2 px-4 hidden md:table-cell">
                            <span className="text-muted-foreground">{product.description}</span>
                          </TableCell>
                          <TableCell className="py-2 px-4 text-center">
                            <span className="font-medium">
                              {isMobile
                                ? formatCurrencyInTenThousand(product.price)
                                : formatCurrency(product.price)}
                            </span>
                          </TableCell>
                          <TableCell className="py-2 px-4 text-center">
                            <span>{product.quantity}</span>
                          </TableCell>
                          <TableCell className="py-2 px-4 text-center">
                            <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${product.status === '활성'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                              }`}>
                              {product.status}
                            </span>
                          </TableCell>
                          <TableCell className="py-2 px-4 text-center">
                            <div className="flex justify-center space-x-2">
                              <Button size="sm" variant="outline" className="bg-blue-50 hover:bg-blue-100 text-blue-600">수정</Button>
                              <Button size="sm" variant="outline" className="bg-red-50 hover:bg-red-100 text-red-600">비활성화</Button>
                            </div>
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

      {/* 네 번째 줄: 오류 상품 관리 */}
      <div className="container mb-10">
        <div className="grid grid-cols-1 gap-5">
          <div>
            <div className="card">
              <div className="card-header border-0 pt-5">
                <h3 className="card-title align-items-start flex-column">
                  <span className="card-label fw-bold">오류 상품 관리</span>
                </h3>
                <div className="card-toolbar">
                  <div className="input-group">
                    <input type="text" className="input input-sm" placeholder="오류 상품 검색..." />
                    <Button variant="outline" size="sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.3-4.3"></path>
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
              <div className="card-body px-0 overflow-y-auto">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-100 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="py-2 px-4" style={{ minWidth: '100px' }}>오류 ID</TableHead>
                        <TableHead className="py-2 px-4" style={{ minWidth: '150px' }}>상품명</TableHead>
                        <TableHead className="py-2 px-4 text-center" style={{ minWidth: '100px' }}>오류 수량</TableHead>
                        <TableHead className="py-2 px-4" style={{ minWidth: '120px' }}>구매자</TableHead>
                        <TableHead className="py-2 px-4 text-center hidden md:table-cell" style={{ minWidth: '120px' }}>발생일</TableHead>
                        <TableHead className="py-2 px-4 text-center" style={{ minWidth: '200px' }}>액션</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {errorItems.map((item, index) => (
                        <TableRow key={index} className="border-b border-gray-200 hover:bg-muted/50">
                          <TableCell className="py-2 px-4">
                            <span className="font-medium">{item.id}</span>
                          </TableCell>
                          <TableCell className="py-2 px-4">
                            <span>{item.name}</span>
                          </TableCell>
                          <TableCell className="py-2 px-4 text-center">
                            <span className="text-red-500 font-medium">{item.quantity}</span>
                          </TableCell>
                          <TableCell className="py-2 px-4">
                            <span>{item.buyer}</span>
                          </TableCell>
                          <TableCell className="py-2 px-4 text-center hidden md:table-cell">
                            <span className="text-muted-foreground">{item.date}</span>
                          </TableCell>
                          <TableCell className="py-2 px-4 text-center">
                            <div className="flex justify-center space-x-2">
                              <Button size="sm" variant="outline" className="bg-blue-50 hover:bg-blue-100 text-blue-600">수정 요청</Button>
                              <Button size="sm" variant="outline" className="bg-green-50 hover:bg-green-100 text-green-600">반품 처리</Button>
                            </div>
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
    </>
  );
};
