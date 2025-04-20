import React, { useState, useEffect } from 'react';
import BasicTemplate from './components/BasicTemplate';
import { 
  Card, 
  CardContent
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/supabase'; // 프로젝트 구조에 맞게 경로 수정
import { useAuthContext } from '@/auth';



const ChargePage: React.FC = () => {
  // 사용자 정보 가져오기 (프로젝트에 맞는 훅 사용)
  const { currentUser } = useAuthContext();
  
  // 상태 관리
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedAmount, setSelectedAmount] = useState<string>('');
  const [koreanAmount, setKoreanAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
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
  
  // 금액이 변경될 때마다 한글 단위 표시 업데이트
  useEffect(() => {
    if (customAmount) {
      setKoreanAmount(formatToKorean(customAmount));
    } else {
      setKoreanAmount('');
    }
  }, [customAmount]);
  
  // Supabase에 충전 요청 데이터 삽입
  const insertChargeRequest = async () => {
    // 에러 초기화
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

    console.log(currentUser);
    
    try {
      console.log('충전 요청 시작:', { 
        userId: currentUser.id, 
        amount: Number(customAmount) 
      });
      
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
        console.error('Supabase 에러:', error);
        throw error;
      }
      
      console.log('충전 요청 성공:', data);
      alert(`${formatNumberWithCommas(Number(customAmount))}원 충전이 요청되었습니다.`);
      
      // 성공 후 폼 초기화
      setCustomAmount('');
      setSelectedAmount('');
      
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
    <BasicTemplate title="캐쉬 충전" description="캐쉬/포인트 관리 > 캐쉬 충전">
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
            
            {/* 출금 계좌 */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium">출금 계좌</p>
                <button className="text-gray-400" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center border border-gray-200 rounded-md p-3 cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white mr-3">
                  <span className="text-xs">IBK</span>
                </div>
                <div className="flex flex-col">
                  <p className="font-medium">IBK기업</p>
                  <p className="text-sm text-gray-500">IBK기업 694******1016</p>
                </div>
                <div className="ml-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* 충전 버튼 */}
            <div className="mt-auto">
              <button 
                onClick={handleCharge}
                disabled={isLoading || !customAmount}
                type="button"
                className={`w-full py-4 ${
                  customAmount && !isLoading 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
                } font-medium rounded-md transition-colors mt-5 ${
                  isLoading ? 'cursor-not-allowed opacity-70' : ''
                }`}
              >
                {isLoading ? '처리 중...' : '충전하기'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </BasicTemplate>
  );
};

export { ChargePage };