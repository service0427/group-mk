import React, { useState, useEffect } from 'react';
import { Container } from '@/components';
import { Toolbar, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import {
  Card,
  CardContent
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  console.log(currentUser);

  // 상태 관리
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedAmount, setSelectedAmount] = useState<string>('');
  const [koreanAmount, setKoreanAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [recentRequests, setRecentRequests] = useState<ChargeRequest[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // 금액 선택 핸들러 (누적 방식)
  const handleAmountSelect = (amount: string) => {
    const currentAmount = customAmount ? parseInt(customAmount) : 0;
    const addAmount = parseInt(amount);
    const newAmount = (currentAmount + addAmount).toString();

    setCustomAmount(newAmount);
    setSelectedAmount(amount);
  };

  // 직접 입력 핸들러
  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 숫자만 입력 가능하도록
    const value = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(value);
    setSelectedAmount('');
  };

  // 금액을 천 단위 쉼표가 있는 형식으로 변환
  const formatNumberWithCommas = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // 금액을 한글 단위로 변환 (억, 만)
  const formatToKorean = (value: string): string => {
    if (!value || value === '0') return '';

    const num = parseInt(value);

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

    return result.trim();
  };

  // 최근 충전 요청 내역 가져오기
  const fetchRecentRequests = async () => {
    console.log("fetchRecentRequests 시작, currentUser:", currentUser);
    if (!currentUser) {
      console.log("currentUser가 없어서 종료");
      return;
    }

    setIsLoadingHistory(true);
    console.log("로딩 상태 true로 설정");

    try {
      console.log("Supabase 요청 시작, user_id:", currentUser.id);

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
      console.log("Supabase 응답 받음", { dataLength: data?.length, error });

      if (error) throw error;

      setRecentRequests(data || []);
      console.log("recentRequests 상태 업데이트됨, 개수:", data?.length);
    } catch (err) {
      console.error('최근 충전 내역 조회 오류:', err);
      // 에러 발생 시 빈 배열로 처리하여 로딩 상태 종료
      setRecentRequests([]);
    } finally {
      console.log("finally 블록 실행");
      setIsLoadingHistory(false);
      console.log("로딩 상태 false로 설정");
    }
  };

  // 금액이 변경될 때마다 한글 단위 표시 업데이트
  useEffect(() => {
    if (customAmount) {
      setKoreanAmount(formatToKorean(customAmount));
    } else {
      setKoreanAmount('');
    }
  }, [customAmount]);

  // 컴포넌트 마운트 시 최근 충전 내역 가져오기
  useEffect(() => {
    // currentUser가 있고, id 속성이 있는지 확인
    if (currentUser && currentUser.id) {
      console.log("useEffect에서 fetchRecentRequests 호출, currentUser ID:", currentUser.id);
      fetchRecentRequests();
    } else {
      console.log("useEffect: currentUser 없거나 ID 속성 없음:", currentUser);
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
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

    if (!customAmount || Number(customAmount) <= 0) {
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
      setCustomAmount('');
      setSelectedAmount('');
      fetchRecentRequests();

    } catch (err: any) {
      console.error('충전 요청 오류:', err);
      setError(err.message || '충전 요청 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 충전 버튼 핸들러
  const handleCharge = () => {
    insertChargeRequest();
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle customTitle="회원 관리" />
            <ToolbarDescription>관리자 메뉴 &gt; 회원 관리</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container>
        <div className="w-full max-w-lg mx-auto">
          <Card className="border-0 shadow-none">
            <CardContent className="p-0">
              {/* 네이버페이 로고와 헤더 */}
              <div className="flex items-center mb-8">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white mr-3">
                  <span className="font-bold">M</span>
                </div>
                <span className="font-medium text-lg">Npay 머니로</span>
              </div>

              {/* 에러 메시지 표시 */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              {/* 금액 입력 필드 */}
              <div className="mb-6">
                <p className="text-gray-500 text-sm mb-2">충전할 금액을 입력해 주세요.</p>
                <div className="relative">
                  <Input
                    type="text"
                    value={customAmount ? formatNumberWithCommas(parseInt(customAmount)) : ''}
                    onChange={handleCustomAmountChange}
                    placeholder="0"
                    className="w-full border-t-0 border-l-0 border-r-0 rounded-none border-b border-gray-300 text-lg focus:border-b-gray-500 pl-0"
                  />
                  {koreanAmount && (
                    <div className="text-sm text-gray-500 mt-1">
                      {koreanAmount}원
                    </div>
                  )}
                </div>
                <div className="h-[1px] w-full bg-gray-200 mt-1"></div>
              </div>

              {/* 금액 빠른 선택 */}
              <div className="grid grid-cols-4 gap-2 mb-8">
                <button
                  className="py-3 border border-gray-300 rounded text-sm bg-white hover:bg-gray-50"
                  onClick={() => handleAmountSelect('10000')}
                  type="button"
                >
                  +1만
                </button>
                <button
                  className="py-3 border border-gray-300 rounded text-sm bg-white hover:bg-gray-50"
                  onClick={() => handleAmountSelect('50000')}
                  type="button"
                >
                  +5만
                </button>
                <button
                  className="py-3 border border-gray-300 rounded text-sm bg-white hover:bg-gray-50"
                  onClick={() => handleAmountSelect('100000')}
                  type="button"
                >
                  +10만
                </button>
                <button
                  className="py-3 border border-gray-300 rounded text-sm bg-white hover:bg-gray-50"
                  onClick={() => handleAmountSelect('1000000')}
                  type="button"
                >
                  +100만
                </button>
              </div>

              {/* 최근 충전 요청 내역 */}
              <div className="mb-8">
                <div className="mb-3">
                  <p className="text-sm font-medium">최근 충전 요청 내역</p>
                </div>

                {isLoadingHistory ? (
                  <div className="text-center py-4 text-gray-500">
                    내역을 불러오는 중...
                  </div>
                ) : recentRequests.length > 0 ? (
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-500">날짜</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-500">금액</th>
                          <th className="px-4 py-2 text-center font-medium text-gray-500">상태</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {recentRequests.map((request) => (
                          <tr key={request.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-700">
                              {formatDate(request.requested_at)}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-900 font-medium">
                              {formatNumberWithCommas(request.amount)}원
                            </td>
                            <td className="px-4 py-3">
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
                  <div className="border border-gray-200 rounded-md p-4 text-center text-gray-500">
                    최근 충전 요청 내역이 없습니다.
                  </div>
                )}
              </div>

              {/* 충전 버튼 */}
              <div className="mt-auto">
                <button
                  onClick={handleCharge}
                  disabled={isLoading || !customAmount}
                  type="button"
                  className={`w-full py-4 ${customAmount && !isLoading
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                    } font-medium rounded-md transition-colors mt-5 ${isLoading ? 'cursor-not-allowed opacity-70' : ''
                    }`}
                >
                  {isLoading ? '처리 중...' : '충전하기'}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </>
  );
};

export { ChargePage };