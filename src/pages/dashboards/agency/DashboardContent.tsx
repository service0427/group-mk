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

interface AgencyStats {
  totalSales: { count: number; trend: number };
  activeCampaigns: { count: number; trend: number };
  totalBudget: { count: number; trend: number };
  bonusCredit: { count: number; trend: number };
}

export const DashboardContent: React.FC = () => {
  // 모바일 화면 감지 (md 이하인지 여부)
  const isMobile = useResponsive('down', 'md');

  const [stats, setStats] = useState<AgencyStats>({
    totalSales: { count: 0, trend: 0 },
    activeCampaigns: { count: 0, trend: 0 },
    totalBudget: { count: 0, trend: 0 },
    bonusCredit: { count: 0, trend: 0 },
  });

  // 입력 필드 상태 관리 추가
  const [chargeAmount, setChargeAmount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');

  useEffect(() => {
    // 실제 구현에서는 API 호출
    setStats({
      totalSales: { count: isMobile ? 385 : 3850000, trend: 0.85 },
      activeCampaigns: { count: 2, trend: 1 },
      totalBudget: { count: isMobile ? 1250 : 12500000, trend: 8.4 },
      bonusCredit: { count: isMobile ? 19.25 : 192500, trend: 0.0325 },
    });
  }, [isMobile]);

  const activeCampaigns = [
    ['camp-001', '여름 신상품 프로모션', '페이스북 광고 패키지', '40%', '2023-06-15', '진행중'],
    ['camp-002', '가을 시즌 특별 할인', '구글 검색 광고', '40%', '2023-09-01', '진행중'],
    ['camp-003', '여름 할인 프로모션', '유튜브 동영상 광고', '100%', '2023-07-10', '완료'],
  ];

  const transactions = [
    ['tx-001', '2023-06-10', '페이스북 광고 패키지 구매', 500000, '결제'],
    ['tx-002', '2023-06-05', '광고 예산 충전', 1000000, '입금'],
  ];

  // 입금 처리 함수
  const handleDeposit = () => {
    if (!chargeAmount) {
      alert('충전할 금액을 입력해주세요.');
      return;
    }

    const amount = parseInt(chargeAmount.replace(/,/g, ''), 10);
    if (isNaN(amount) || amount < 100000) {
      alert('최소 100,000원 이상 입력해주세요.');
      return;
    }

    console.log(`${amount}원을 ${paymentMethod === 'card' ? '신용카드' : '계좌이체'}로 충전 요청`);
    // API 호출 로직 추가

    // 입력 필드 초기화
    setChargeAmount('');
  };

  // 금액 입력 시 포맷팅 처리
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 숫자와 콤마만 허용
    const onlyNums = value.replace(/[^\d]/g, '');
    if (onlyNums === '') {
      setChargeAmount('');
      return;
    }

    // 천 단위 콤마 포맷팅
    const formattedValue = parseInt(onlyNums, 10).toLocaleString();
    setChargeAmount(formattedValue);
  };

  return (
    <>
      {/* 첫 번째 줄: 4개의 통계 카드 */}
      <div className="container mb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div>
            <StatCard
              title="현재 캐시 잔액"
              value={isMobile ? 385 : 3850000}
              unit={isMobile ? "만원" : "원"}
              trend={stats.totalSales.trend}
              keenIcon="users"
              iconColor="primary"
            />
          </div>
          <div>
            <StatCard
              title="진행중인 캠페인"
              value={stats.activeCampaigns.count}
              unit="개"
              trend={stats.activeCampaigns.trend}
              keenIcon="code"
              iconColor="success"
            />
          </div>
          <div>
            <StatCard
              title="총 구매액"
              value={isMobile ? 1250 : 12500000}
              unit={isMobile ? "만원" : "원"}
              trend={stats.totalBudget.trend}
              keenIcon="database"
              iconColor="warning"
            />
          </div>
          <div>
            <StatCard
              title="보너스 캐시"
              value={isMobile ? 19.25 : 192500}
              unit={isMobile ? "만원" : "원"}
              trend={stats.bonusCredit.trend}
              keenIcon="timer"
              iconColor="info"
            />
          </div>
        </div>
      </div>

      {/* 두 번째 줄: 예치금 입금 & 진행 중인 캠페인 */}
      <div className="container mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <div className="card h-100">
              <div className="card-header border-0 pt-5">
                <h3 className="card-title align-items-start flex-column">
                  <span className="card-label fw-bold text-gray-800">예치금 입금</span>
                </h3>
              </div>
              <div className="card-body py-3">
                <div className="bg-light-success rounded p-4 mb-4">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <div className="text-gray-800 fw-bold fs-6 mb-1">현재 보유 캐시</div>
                      <div className="text-success fw-bold fs-2">{formatCurrency(3850000)}</div>
                    </div>
                    <div className="ms-2">
                      <span className="badge badge-success fs-7">+₩192,500 (5%)</span>
                    </div>
                  </div>
                </div>
                <div className="form-group mb-3">
                  <label className="form-label fw-semibold">충전 금액 (원)</label>
                  <input
                    type="text"
                    className="input w-full px-2 py-1 border rounded"
                    placeholder="충전할 금액을 입력하세요"
                    value={chargeAmount}
                    onChange={handleAmountChange}
                  />
                  <div className="text-gray-600 fs-7 mt-2">
                    *최소 금액: ₩100,000원
                  </div>
                </div>
                <div className="d-flex mb-3">
                  <div className="form-check form-check-custom form-check-solid form-check-sm me-5">
                    <input
                      className="input-radio"
                      type="radio"
                      name="payment_method"
                      id="payment_card"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                    />
                    <label className="form-check-label" htmlFor="payment_card">
                      신용카드
                    </label>
                  </div>
                  <div className="form-check form-check-custom form-check-solid form-check-sm">
                    <input
                      className="input-radio"
                      type="radio"
                      name="payment_method"
                      id="payment_bank"
                      checked={paymentMethod === 'bank'}
                      onChange={() => setPaymentMethod('bank')}
                    />
                    <label className="form-check-label" htmlFor="payment_bank">
                      계좌이체
                    </label>
                  </div>
                </div>
                <div className="card bg-light p-4 mb-3">
                  <h5 className="fw-bold mb-2 fs-6">입금 시 혜택</h5>
                  <div className="d-flex align-items-center mb-2">
                    <i className="fas fa-arrow-up text-success me-2"></i>
                    <span className="text-gray-800 fs-7">100만원 이상: 2% 보너스 캐시</span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <i className="fas fa-arrow-up text-success me-2"></i>
                    <span className="text-gray-800 fs-7">300만원 이상: 3% 보너스 캐시</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <i className="fas fa-arrow-up text-success me-2"></i>
                    <span className="text-gray-800 fs-7">500만원 이상: 5% 보너스 캐시</span>
                  </div>
                </div>
                <button
                  className="btn btn-primary w-100"
                  onClick={handleDeposit}
                >
                  입금하기
                </button>
              </div>
            </div>
          </div>
          <div>
            <div className="card h-100">
              <div className="card-header border-0 pt-5">
                <h3 className="card-title align-items-start flex-column">
                  <span className="card-label fw-bold text-gray-800">진행 중인 캠페인</span>
                </h3>
                <div className="card-toolbar">
                  <input
                    type="text"
                    className="input input-sm px-2 py-1 border rounded"
                    placeholder="캠페인 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="card-body px-0 overflow-y-auto">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-100 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="py-2 px-4" style={{ minWidth: '80px' }}>ID</TableHead>
                        <TableHead className="py-2 px-4" style={{ minWidth: '200px' }}>캠페인 명</TableHead>
                        <TableHead className="py-2 px-4 text-center" style={{ minWidth: '150px' }}>진행률</TableHead>
                        <TableHead className="py-2 px-4 text-center" style={{ minWidth: '100px' }}>상태</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeCampaigns
                        .filter(campaign =>
                          searchQuery ?
                            campaign[1].toLowerCase().includes(searchQuery.toLowerCase()) ||
                            campaign[2].toLowerCase().includes(searchQuery.toLowerCase()) :
                            true
                        )
                        .map((campaign, index) => (
                          <TableRow key={index} className="border-b border-gray-200 hover:bg-muted/50">
                            <TableCell className="py-2 px-4">
                              <span className="font-medium">{campaign[0]}</span>
                            </TableCell>
                            <TableCell className="py-2 px-4">
                              <div className="flex flex-col py-1">
                                <span className="font-medium">{campaign[1]}</span>
                                <span className="text-muted-foreground text-sm">{campaign[2]}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-2 px-4 text-center">
                              <div className="flex items-center justify-center">
                                <div className="h-2 w-full rounded bg-gray-200 overflow-hidden mr-2">
                                  <div
                                    className={campaign[5] === '완료' ? 'bg-green-500 h-2 rounded' : 'bg-blue-500 h-2 rounded'}
                                    style={{ width: campaign[3] }}
                                  ></div>
                                </div>
                                <span className="text-muted-foreground whitespace-nowrap">{campaign[3]}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-2 px-4 text-center">
                              <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${campaign[5] === '완료'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                                }`}>
                                {campaign[5]}
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
      </div>

      {/* 세 번째 줄: 결제 내역 */}
      <div className="container mb-10">
        <div className="grid grid-cols-1 gap-5">
          <div>
            <div className="card">
              <div className="card-header border-0 pt-5">
                <h3 className="card-title align-items-start flex-column">
                  <span className="card-label fw-bold">결제 내역</span>
                </h3>
                <div className="card-toolbar">
                  <Button variant="outline" size="sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <polyline points="1 4 1 10 7 10"></polyline>
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                    </svg>
                    최근 결제 내역 보기
                  </Button>
                </div>
              </div>
              <div className="card-body px-0 overflow-y-auto">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-100 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="py-2 px-4 text-center whitespace-nowrap hidden md:table-cell" style={{ minWidth: '100px' }}>거래 ID</TableHead>
                        <TableHead className="py-2 px-4 text-center whitespace-nowrap" style={{ minWidth: '100px' }}>날짜</TableHead>
                        <TableHead className="py-2 px-4" style={{ minWidth: '200px' }}>내용</TableHead>
                        <TableHead className="py-2 px-4 text-center whitespace-nowrap" style={{ minWidth: '120px' }}>금액</TableHead>
                        <TableHead className="py-2 px-4 text-center whitespace-nowrap" style={{ minWidth: '100px' }}>타입</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction, index) => (
                        <TableRow key={index} className="border-b border-gray-200 hover:bg-muted/50">
                          <TableCell className="py-2 px-4 text-center whitespace-nowrap hidden md:table-cell">
                            <span className="font-medium">{transaction[0]}</span>
                          </TableCell>
                          <TableCell className="py-2 px-4 text-center whitespace-nowrap">
                            {transaction[1]}
                          </TableCell>
                          <TableCell className="py-2 px-4">
                            {transaction[2]}
                          </TableCell>
                          <TableCell className="py-2 px-4 text-center whitespace-nowrap font-medium">
                            <span className={transaction[4] === '입금' ? 'text-green-600' : 'text-red-600'}>
                              {transaction[4] === '입금' ? '+' : '-'}
                              {isMobile
                                ? formatCurrencyInTenThousand(transaction[3])
                                : formatCurrency(transaction[3])}
                            </span>
                          </TableCell>
                          <TableCell className="py-2 px-4 text-center whitespace-nowrap">
                            <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${transaction[4] === '입금'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                                : 'bg-primary/10 text-primary'
                              }`}>
                              {transaction[4]}
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
      </div>

      {/* 네 번째 줄: 캠페인 예산 */}
      <div className="container mb-10">
        <div className="grid grid-cols-1 gap-5">
          <div>
            <div className="card">
              <div className="card-header border-0 pt-5">
                <h3 className="card-title align-items-start flex-column">
                  <span className="card-label fw-bold">캠페인 예산 현황</span>
                </h3>
              </div>
              <div className="card-body py-3">
                <div className="flex flex-wrap gap-5 mb-5">
                  <div className="flex flex-col">
                    <div className="text-dark fw-bold fs-2 mb-1">₩3,850,000</div>
                    <div className="text-gray-700 fw-semibold fs-6">현재 보유 캐시</div>
                  </div>
                  <div className="flex flex-col">
                    <div className="text-dark fw-bold fs-2 mb-1">₩1,200,000</div>
                    <div className="text-gray-700 fw-semibold fs-6">할당된 예산</div>
                  </div>
                  <div className="flex flex-col">
                    <div className="text-success fw-bold fs-2 mb-1">₩2,650,000</div>
                    <div className="text-gray-700 fw-semibold fs-6">남은 예산</div>
                  </div>
                </div>
                <div className="separator my-7"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <div className="card bg-light-warning p-5">
                      <div className="d-flex align-items-center">
                        <div className="symbol symbol-50px me-3">
                          <span className="symbol-label bg-white">
                            <i className="fas fa-signal text-warning fs-1"></i>
                          </span>
                        </div>
                        <div className="d-flex flex-column flex-grow-1">
                          <a href="#" className="text-dark fw-bold fs-5 mb-1">여름 신제품 홍보</a>
                          <div className="d-flex">
                            <div className="text-gray-700 fw-semibold d-flex align-items-center">예산: 500,000원</div>
                            <div className="text-gray-700 fw-semibold d-flex align-items-center ms-5">소진률: 40%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="card bg-light-primary p-5">
                      <div className="d-flex align-items-center">
                        <div className="symbol symbol-50px me-3">
                          <span className="symbol-label bg-white">
                            <i className="fas fa-bullhorn text-primary fs-1"></i>
                          </span>
                        </div>
                        <div className="d-flex flex-column flex-grow-1">
                          <a href="#" className="text-dark fw-bold fs-5 mb-1">가을 신규 서비스 런칭</a>
                          <div className="d-flex">
                            <div className="text-gray-700 fw-semibold d-flex align-items-center">예산: 700,000원</div>
                            <div className="text-gray-700 fw-semibold d-flex align-items-center ms-5">소진률: 40%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};