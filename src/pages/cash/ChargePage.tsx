import React, { useState, useEffect } from 'react';
import { Container } from '@/components';
import { Toolbar, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/supabase';
import { useAuthContext } from '@/auth';

// 충전 요청 타입 정의
interface ChargeRequest {
  id: string;
  amount: number;
  status: string;
  requested_at: string;
  free_cash_percentage: number;
}

const ChargePage: React.FC = () => {
  // AuthContext에서 currentUser 가져오기
  const { currentUser } = useAuthContext();

  // 상태 관리
  const [customAmount, setCustomAmount] = useState<string>('0');
  const [selectedAmount, setSelectedAmount] = useState<string>('');
  const [koreanAmount, setKoreanAmount] = useState<string>('0원');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [recentRequests, setRecentRequests] = useState<ChargeRequest[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // 금액 선택 핸들러 (누적 방식)
  const handleAmountSelect = (amount: string) => {
    const currentAmount = customAmount === '0' ? 0 : parseInt(customAmount);
    const addAmount = parseInt(amount);
    const newAmount = (currentAmount + addAmount).toString();

    setCustomAmount(newAmount);
    setSelectedAmount(amount);
  };

  // 직접 입력 핸들러
  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 숫자만 입력 가능하도록
    const value = e.target.value.replace(/[^0-9]/g, '');

    // 0만 입력된 경우 '0'으로 설정
    if (value === '' || value === '0') {
      setCustomAmount('0');
    } else {
      // 앞에 0이 있는 경우 제거 (예: '01234' -> '1234')
      setCustomAmount(value.replace(/^0+/, ''));
    }

    setSelectedAmount('');
  };

  // 금액을 천 단위 쉼표가 있는 형식으로 변환
  const formatNumberWithCommas = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // 금액을 한글 단위로 변환 (억, 만)
  const formatToKorean = (value: string): string => {
    const num = parseInt(value);

    if (num === 0) return '0원';

    const eok = Math.floor(num / 100000000);
    const man = Math.floor((num % 100000000) / 10000);
    const rest = num % 10000;

    let result = '';

    if (eok > 0) {
      result += eok + '억 ';
    }

    if (man > 0) {
      result += man + '만 ';
    }

    if (rest > 0) {
      result += formatNumberWithCommas(rest);
    }

    return result.trim() + '원';
  };

  // 최근 충전 요청 내역 가져오기
  const fetchRecentRequests = async () => {
    if (!currentUser) {
      return;
    }

    setIsLoadingHistory(true);

    try {
      // 타임아웃 설정 (10초)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('요청 시간 초과')), 10000)
      );

      const fetchPromise = supabase
        .from('cash_charge_requests')
        .select('id, amount, status, requested_at, free_cash_percentage')
        .eq('user_id', currentUser.id)
        .order('requested_at', { ascending: false })
        .limit(5);

      // Promise.race를 사용하여 타임아웃 처리
      const result = await Promise.race([
        fetchPromise,
        timeoutPromise.then(() => {
          throw new Error('요청 시간 초과');
        })
      ]);

      const { data, error } = result;

      if (error) throw error;

      setRecentRequests(data || []);
    } catch (err) {
      console.error('최근 충전 내역 조회 오류:', err);
      // 에러 발생 시 빈 배열로 처리하여 로딩 상태 종료
      setRecentRequests([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // 금액이 변경될 때마다 한글 단위 표시 업데이트
  useEffect(() => {
    setKoreanAmount(formatToKorean(customAmount));
  }, [customAmount]);

  // 컴포넌트 마운트 시 최근 충전 내역 가져오기
  useEffect(() => {
    if (currentUser && currentUser.id) {
      fetchRecentRequests();
    }
  }, [currentUser]); // currentUser에 의존

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // 상태에 따른 배지 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // 상태 한글 표시
  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return '승인';
      case 'rejected':
        return '거절';
      case 'pending':
        return '대기중';
      default:
        return status;
    }
  };

  // Supabase에 충전 요청 데이터 삽입
  const insertChargeRequest = async () => {
    setError(null);

    if (!currentUser) {
      setError('로그인이 필요합니다.');
      return;
    }

    if (customAmount === '0') {
      setError('충전할 금액을 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      // cash_charge_requests 테이블에 데이터 삽입
      const { data, error } = await supabase
        .from('cash_charge_requests')
        .insert({
          user_id: currentUser.id,
          amount: Number(customAmount),
          status: 'pending',
          free_cash_percentage: 0 // 기본값
        })
        .select();

      if (error) {
        throw error;
      }

      alert(`${formatNumberWithCommas(Number(customAmount))}원 충전이 요청되었습니다.`);

      // 성공 후 폼 초기화 및 내역 갱신
      setCustomAmount('0');
      setSelectedAmount('');
      fetchRecentRequests();

    } catch (err: any) {
      console.error('충전 요청 오류:', err);
      setError(err.message || '충전 요청 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle customTitle="캐시 충전" />
            <ToolbarDescription>마이페이지 &gt; 캐시 충전</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container>
        <div className="grid gap-5 lg:gap-7.5">
          {/* 충전 카드 */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white mr-3">
                  <span className="font-bold">M</span>
                </div>
                <CardTitle className="text-lg font-medium">Npay 머니로 충전하기</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {/* 에러 메시지 표시 */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              {/* 금액 입력 필드 */}
              <div className="mb-6">
                <p className="text-muted-foreground text-sm mb-2">충전할 금액을 입력해 주세요.</p>
                <div className="relative">
                  <Input
                    type="text"
                    value={customAmount === '0' ? '0' : formatNumberWithCommas(parseInt(customAmount))}
                    onChange={handleCustomAmountChange}
                    placeholder="0"
                    className="w-full border-t-0 border-l-0 border-r-0 rounded-none border-b border-input text-lg focus:border-b-primary pl-0"
                  />
                  <div className="text-sm text-muted-foreground mt-1 h-6">
                    {koreanAmount}
                  </div>
                </div>
                <div className="h-[1px] w-full bg-border mt-1"></div>
              </div>

              {/* 금액 빠른 선택 */}
              <div className="grid grid-cols-4 gap-2 mb-8">
                <button
                  className="py-3 border border-input rounded text-sm bg-background hover:bg-accent text-foreground"
                  onClick={() => handleAmountSelect('10000')}
                  type="button"
                >
                  +1만
                </button>
                <button
                  className="py-3 border border-input rounded text-sm bg-background hover:bg-accent text-foreground"
                  onClick={() => handleAmountSelect('50000')}
                  type="button"
                >
                  +5만
                </button>
                <button
                  className="py-3 border border-input rounded text-sm bg-background hover:bg-accent text-foreground"
                  onClick={() => handleAmountSelect('100000')}
                  type="button"
                >
                  +10만
                </button>
                <button
                  className="py-3 border border-input rounded text-sm bg-background hover:bg-accent text-foreground"
                  onClick={() => handleAmountSelect('1000000')}
                  type="button"
                >
                  +100만
                </button>
              </div>

              {/* 충전 버튼 */}
              <Button
                onClick={insertChargeRequest}
                disabled={isLoading || customAmount === '0'}
                className={`w-full py-6 ${customAmount === '0' || isLoading
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white'
                  }`}
              >
                {isLoading ? '처리 중...' : '충전하기'}
              </Button>
            </CardContent>
          </Card>

          {/* 최근 충전 요청 내역 카드 */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">최근 충전 요청 내역</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoadingHistory ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
              ) : recentRequests.length > 0 ? (
                <div className="border border-input rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">날짜</th>
                        <th className="px-4 py-2 text-right font-medium text-muted-foreground">금액</th>
                        <th className="px-4 py-2 text-center font-medium text-muted-foreground">상태</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-muted/40">
                          <td className="px-4 py-3 text-foreground">
                            {formatDate(request.requested_at)}
                          </td>
                          <td className="px-4 py-3 text-right text-foreground font-medium">
                            {formatNumberWithCommas(request.amount)}원
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}>
                              {getStatusText(request.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border border-input rounded-md p-4 text-center text-muted-foreground">
                  최근 충전 요청 내역이 없습니다.
                </div>
              )}
            </CardContent>
          </Card>

          {/* 캐시 충전 안내 카드 */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">캐시 충전 안내</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-muted-foreground">
                <p>• 충전 요청 후 관리자 승인 절차를 거쳐 캐시가 충전됩니다.</p>
                <p>• 승인은 영업일 기준 최대 24시간 이내에 처리됩니다.</p>
                <p>• 충전 취소는 승인 전에만 가능하며, 고객센터로 문의해 주세요.</p>
                <p>• 대량 충전(100만원 이상)은 고객센터에 문의하시면 더 빠르게 처리 가능합니다.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </>
  );
};

export { ChargePage };