import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { useWithdrawSettings } from '../hooks/useWithdrawSettings';
import { createWithdrawRequest, getLastWithdrawAccount, LastWithdrawAccount } from '../services/withdrawService';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { notifyOperators, createNewWithdrawRequestNotification } from '@/utils/notificationActions';
import { smartCeil } from '@/utils/mathUtils';

interface WithdrawFormProps {
  userId: string;
  onSuccess: (amount: string) => void;
  userCashBalance: number;
  currentUser?: any; // 현재 사용자 정보 추가
}

const WithdrawForm: React.FC<WithdrawFormProps> = ({ userId, onSuccess, userCashBalance, currentUser }) => {
  // 상태 관리
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedAmount, setSelectedAmount] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountHolder, setAccountHolder] = useState<string>('');
  const [koreanAmount, setKoreanAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAccountFromProfile, setIsAccountFromProfile] = useState<boolean>(false);
  const [feeAmount, setFeeAmount] = useState<number>(0);

  // 추가된 상태
  const [saveAccount, setSaveAccount] = useState<boolean>(true);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [lastAccountInfo, setLastAccountInfo] = useState<LastWithdrawAccount | null>(null);
  const [loadingLastAccount, setLoadingLastAccount] = useState<boolean>(false);
  const [lastAccountLoaded, setLastAccountLoaded] = useState<boolean>(false);

  // 커스텀 알림 토스트 상태
  const [toast, setToast] = useState<{
    visible: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'success',
    title: '',
    message: ''
  });

  // 토스트 타이머 ref
  const toastTimerRef = useRef<number | null>(null);

  // 출금 설정 및 수수료 계산 커스텀 훅 사용 (userId 전달)
  const { withdrawSetting, isLoading: isLoadingSetting, calculateFeeAmount } = useWithdrawSettings(userId);

  // 토스트 알림 표시 함수
  const showToast = (type: 'success' | 'error', title: string, message: string) => {
    // 기존 타이머가 있다면 제거
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }

    // 토스트 표시
    setToast({
      visible: true,
      type,
      title,
      message
    });

    // 3초 후 토스트 숨기기
    toastTimerRef.current = window.setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // 마지막 출금 신청 정보 불러오기 
  const fetchLastWithdrawAccount = async () => {
    if (!userId) return;

    setLoadingLastAccount(true);
    try {
      const accountInfo = await getLastWithdrawAccount(userId);
      setLastAccountInfo(accountInfo);

      // 마지막 계좌 정보가 있다면 자동으로 입력
      if (accountInfo && !lastAccountLoaded) {
        // 계좌 정보가 비어있다면 마지막 신청 정보 설정
        if (!bankName && !accountNumber && !accountHolder) {
          setBankName(accountInfo.bank_name);
          setAccountNumber(accountInfo.account_number);
          setAccountHolder(accountInfo.account_holder);
          setLastAccountLoaded(true);

        }
      }
    } catch (err) {

    } finally {
      setLoadingLastAccount(false);
    }
  };

  // 컴포넌트 마운트 시 마지막 출금 신청 정보 불러오기
  useEffect(() => {
    if (userId) {
      // 사용자의 계좌 정보가 있으면 우선 사용
      if (currentUser?.business?.bank_account) {
        const { bank_name, account_number, account_holder } = currentUser.business.bank_account;
        if (bank_name && account_number && account_holder) {
          setBankName(bank_name);
          setAccountNumber(account_number);
          setAccountHolder(account_holder);
          setLastAccountLoaded(true);
          setIsAccountFromProfile(true);
          return;
        }
      }
      // 없으면 마지막 출금 신청 정보 불러오기
      fetchLastWithdrawAccount();
    }

    // 컴포넌트 언마운트 시 토스트 타이머 정리
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
    };
  }, [userId, currentUser]);

  // withdrawSetting 변경 시 로그
  useEffect(() => {

  }, [withdrawSetting]);

  // 은행 목록
  const bankList = [
    '신한은행', '국민은행', '우리은행', '하나은행', 'NH농협은행',
    '기업은행', 'SC제일은행', '카카오뱅크', '토스뱅크', '케이뱅크',
    '부산은행', '대구은행', '광주은행', '경남은행', '전북은행',
    '제주은행', '산업은행', '수협은행', '새마을금고', '신협', '우체국'
  ];

  // 금액 선택 핸들러 (누적 방식)
  const handleAmountSelect = (amount: string) => {
    const currentAmount = customAmount ? parseInt(customAmount) || 0 : 0;
    const addAmount = parseInt(amount) || 0;
    let newAmount = currentAmount + addAmount;

    // 보유 캐시를 초과하지 않도록 제한
    if (newAmount > userCashBalance) {
      newAmount = userCashBalance;
    }

    setCustomAmount(newAmount.toString());
    setSelectedAmount(amount);
  };

  // 직접 입력 핸들러
  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 숫자만 입력 가능하도록
    const value = e.target.value.replace(/[^0-9]/g, '');

    // 입력값이 보유한 캐시보다 크면 보유 캐시로 제한
    if (value && parseInt(value) > userCashBalance) {
      setCustomAmount(userCashBalance.toString());
    } else {
      setCustomAmount(value);
    }

    setSelectedAmount('');
  };

  // 최대 금액 설정 핸들러
  const handleMaxAmountSelect = () => {
    setCustomAmount(userCashBalance.toString());
    setSelectedAmount('max');
  };

  // 계좌번호 입력 핸들러
  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 숫자와 하이픈만 입력 가능하도록
    const value = e.target.value.replace(/[^0-9-]/g, '');
    setAccountNumber(value);
  };

  // 금액을 천 단위 쉼표가 있는 형식으로 변환
  const formatNumberWithCommas = (num: number | undefined | null): string => {
    if (num === undefined || num === null || isNaN(num)) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // 금액을 한글 단위로 변환 (억, 만)
  const formatToKorean = (value: string): string => {
    if (!value || value === '0') return '';

    const num = parseInt(value);
    if (isNaN(num)) return '';

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

  // 금액이 변경될 때마다 한글 단위 표시 업데이트 및 수수료 금액 계산
  useEffect(() => {



    if (customAmount) {
      setKoreanAmount(formatToKorean(customAmount));
      try {
        // Supabase에서 가져온 원본 데이터에 어떤 필드가 있는지 확인
        if (withdrawSetting) {


          // 실제 DB 필드 이름인 min_request_percentage 사용
          let feePercentage = withdrawSetting.min_request_percentage;
          // 호환성을 위해 fee_percentage도 확인
          if (feePercentage === undefined) {
            feePercentage = withdrawSetting.fee_percentage || 0;

          } else {

          }

          const amount = parseInt(customAmount) || 0;


          if (feePercentage !== undefined) {

            // 수수료 계산 (퍼센트 기준만 적용)
            const fee = smartCeil((amount * feePercentage) / 100);


            // 최소/최대 수수료 제한 없음


            setFeeAmount(fee);
          } else {

            // 백업 계산 - 기본 설정값 사용 (퍼센트만 적용)
            const fee = smartCeil((amount * 3) / 100); // 기본 3%

            setFeeAmount(fee);
          }
        } else {

          // 백업 계산 - 기본 설정값 사용 (퍼센트만 적용)
          const amount = parseInt(customAmount) || 0;
          const fee = Math.floor((amount * 3) / 100); // 기본 3%

          setFeeAmount(fee);
        }
      } catch (error) {

        setFeeAmount(0);
      }
    } else {
      setKoreanAmount('');
      setFeeAmount(0);
    }
  }, [customAmount, withdrawSetting]);

  // 입력값 검증
  const validateInput = (): boolean => {
    setError(null);

    if (!userId) {
      setError('로그인이 필요합니다.');
      return false;
    }

    if (!customAmount || Number(customAmount) <= 0) {
      setError('출금할 금액을 입력해주세요.');
      return false;
    }

    if (Number(customAmount) > userCashBalance) {
      setError('보유한 캐시보다 큰 금액은 출금할 수 없습니다.');
      return false;
    }

    if (!bankName) {
      setError('은행명을 선택해주세요.');
      return false;
    }

    if (!accountNumber) {
      setError('계좌번호를 입력해주세요.');
      return false;
    }

    if (!accountHolder) {
      setError('예금주를 입력해주세요.');
      return false;
    }

    if (withdrawSetting && Number(customAmount) < withdrawSetting.min_request_amount) {
      setError(`최소 출금 금액은 ${formatNumberWithCommas(withdrawSetting.min_request_amount || 0)}원 입니다.`);
      return false;
    }

    return true;
  };

  // 출금 요청 전 확인 모달 표시
  const handleConfirmWithdraw = () => {
    if (!validateInput()) return;
    setConfirmModalOpen(true);
  };

  // 출금 요청 처리
  const handleWithdraw = async () => {
    setIsLoading(true);
    setConfirmModalOpen(false);

    try {
      const result = await createWithdrawRequest(
        userId,
        Number(customAmount),
        bankName,
        accountNumber,
        accountHolder,
        feeAmount
      );

      if (!result.success) {
        throw new Error(result.message);
      }

      // 성공 알림 표시
      showToast(
        'success',
        '출금 신청 완료',
        `${formatNumberWithCommas(Number(customAmount) || 0)}원 출금이 요청되었습니다.`
      );

      // 성공 후 폼 초기화
      const amount = customAmount;
      setCustomAmount('');
      setSelectedAmount('');

      // 계좌 정보 저장 옵션을 선택했을 경우 유지, 아니면 초기화
      if (!saveAccount) {
        setBankName('');
        setAccountNumber('');
        setAccountHolder('');
      }

      // 출금 요청 성공 후 운영자에게 알림 전송
      try {
        // 운영자에게 새로운 출금 요청 알림 전송
        const notificationResult = await createNewWithdrawRequestNotification(
          userId,
          Number(customAmount) || 0,
          accountHolder
        );

      } catch (notificationError) {
        // 알림 전송 실패는 출금 신청 성공에 영향을 주지 않음
        console.error('운영자 알림 전송 실패:', notificationError);
      }

      // 부모 컴포넌트에 성공 알림 (출금 금액 전달)
      onSuccess(amount);

    } catch (err: any) {

      setError(err.message || '출금 요청 중 오류가 발생했습니다. 다시 시도해주세요.');

      // 실패 알림 표시
      showToast(
        'error',
        '출금 신청 실패',
        err.message || '출금 요청 중 오류가 발생했습니다. 다시 시도해주세요.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* 에러 메시지 표시 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* 금액 입력 필드 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-500 text-sm">출금할 금액을 입력해 주세요.</p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">보유 캐시:</span> <span className="text-blue-600 font-semibold">{formatNumberWithCommas(userCashBalance)}원</span>
          </p>
        </div>
        <div className="relative">
          <div className="relative">
            <Input
              type="text"
              value={customAmount ? formatNumberWithCommas(parseInt(customAmount) || 0) : ''}
              onChange={handleCustomAmountChange}
              placeholder="0"
              className="w-full border-t-0 border-l-0 border-r-0 rounded-none border-b border-gray-300 text-lg focus:border-b-gray-500 pl-0 pr-8"
            />
            {customAmount ? (
              <button
                onClick={() => setCustomAmount('')}
                type="button"
                className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              </button>
            ) : (
              <button
                onClick={handleMaxAmountSelect}
                type="button"
                className="absolute right-0 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-600 text-xs font-medium"
              >
                최대
              </button>
            )}
          </div>
        </div>

        {/* 수수료 정보 표시 - 항상 노출 */}
        <div className="mt-3 p-3 bg-muted/40 rounded-md">
          <div className="flex justify-between items-center">
            <span className="text-sm text-foreground">출금 금액:</span>
            <span className="font-medium">{formatNumberWithCommas(parseInt(customAmount) || 0)}원</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-foreground">수수료 ({withdrawSetting?.min_request_percentage !== undefined ? withdrawSetting.min_request_percentage : (withdrawSetting?.fee_percentage !== undefined ? withdrawSetting.fee_percentage : '3')}%):</span>
            <span className="font-medium text-red-600">-{formatNumberWithCommas(feeAmount)}원</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-foreground">실수령액:</span>
            <span className="font-medium text-lg">{formatNumberWithCommas((parseInt(customAmount) || 0) - feeAmount)}원</span>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            * 출금 수수료는 {withdrawSetting?.min_request_percentage || 3}% 입니다.
          </div>
        </div>
      </div>

      {/* 금액 빠른 선택 */}
      <div className="grid grid-cols-5 gap-2 mb-8">
        <button
          className="py-3 border border-gray-300 rounded text-xs bg-card hover:bg-muted/60"
          onClick={() => handleAmountSelect('10000')}
          type="button"
        >
          +1만
        </button>
        <button
          className="py-3 border border-gray-300 rounded text-xs bg-card hover:bg-muted/60"
          onClick={() => handleAmountSelect('50000')}
          type="button"
        >
          +5만
        </button>
        <button
          className="py-3 border border-gray-300 rounded text-xs bg-card hover:bg-muted/60"
          onClick={() => handleAmountSelect('100000')}
          type="button"
        >
          +10만
        </button>
        <button
          className="py-3 border border-gray-300 rounded text-xs bg-card hover:bg-muted/60"
          onClick={() => handleAmountSelect('1000000')}
          type="button"
        >
          +100만
        </button>
        <button
          className="py-3 border border-blue-500 rounded text-xs text-blue-500 bg-card bg-blue-50 hover:bg-blue-100"
          onClick={handleMaxAmountSelect}
          type="button"
        >
          전액
        </button>
      </div>

      {/* 계좌 정보 입력 */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-medium">출금 계좌 정보</h3>

          {loadingLastAccount && (
            <div className="flex items-center text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
              계좌 정보 불러오는 중...
            </div>
          )}

          {!loadingLastAccount && (isAccountFromProfile || lastAccountInfo) && (
            <div className="text-xs text-gray-500">
              {isAccountFromProfile ? '내정보에서 등록한 계좌 정보가 자동으로 입력되었습니다.' : '마지막 신청 계좌 정보 자동 입력됨'}
            </div>
          )}
        </div>

        {/* 은행 선택 */}
        <div className="mb-4">
          <label htmlFor="bankSelect" className="block text-sm text-gray-600 mb-1">은행 선택</label>
          <select
            id="bankSelect"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className={`select w-full h-10 px-3 py-2 rounded-md border border-input text-sm ${
              isAccountFromProfile 
                ? 'bg-gray-100 cursor-not-allowed' 
                : 'bg-light-light hover:border-gray-400 focus:border-primary'
            }`}
            disabled={isAccountFromProfile}
          >
            <option value="">은행을 선택하세요</option>
            {bankList.map((bank) => (
              <option key={bank} value={bank}>{bank}</option>
            ))}
          </select>
        </div>

        {/* 계좌번호 입력 */}
        <div className="mb-4">
          <label htmlFor="accountNumber" className="block text-sm text-gray-600 mb-1">계좌번호</label>
          <Input
            id="accountNumber"
            type="text"
            placeholder="숫자와 하이픈(-)만 입력 (예: 110-123-456789)"
            value={accountNumber}
            onChange={handleAccountNumberChange}
            className={`w-full ${
              isAccountFromProfile ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            disabled={isAccountFromProfile}
          />
        </div>

        {/* 예금주 입력 */}
        <div className="mb-4">
          <label htmlFor="accountHolder" className="block text-sm text-gray-600 mb-1">예금주</label>
          <Input
            id="accountHolder"
            type="text"
            placeholder="예금주명을 입력하세요"
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
            className={`w-full ${
              isAccountFromProfile ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            disabled={isAccountFromProfile}
          />
        </div>

        {/* 계좌 저장 관련 안내 */}
        <div className="mt-2 text-xs text-gray-500">
          입력한 계좌 정보는 출금 신청 후 자동으로 저장됩니다.
        </div>
      </div>

      {/* 출금 버튼 */}
      <div className="mt-auto">
        <button
          onClick={handleConfirmWithdraw}
          disabled={isLoading || !customAmount || Number(customAmount) <= 0 || !bankName || !accountNumber || !accountHolder}
          type="button"
          className={`w-full py-4 ${customAmount && Number(customAmount) > 0 && bankName && accountNumber && accountHolder && !isLoading
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'bg-gray-200 text-gray-600'
            } font-medium rounded-md transition-colors mt-5 ${isLoading ? 'cursor-not-allowed opacity-70' : ''
            }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              처리 중...
            </div>
          ) : (
            '출금 신청하기'
          )}
        </button>
        <div className="text-center text-xs text-gray-500 mt-2">
          출금 신청 시 수수료가 차감되며, 관리자 승인 후 입금됩니다.
        </div>
      </div>

      {/* 출금 확인 모달 */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>출금 신청 확인</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <p className="text-gray-700">아래 정보로 출금을 신청하시겠습니까?</p>
            <div className="bg-muted/40 p-3 rounded-md space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">출금 금액:</span>
                <span className="font-medium">{formatNumberWithCommas(parseInt(customAmount) || 0)}원</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">수수료:</span>
                <span className="text-red-600">-{formatNumberWithCommas(feeAmount)}원</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">실수령액:</span>
                <span className="font-semibold">{formatNumberWithCommas((parseInt(customAmount) || 0) - feeAmount)}원</span>
              </div>
              <div className="h-px my-2 bg-gray-200"></div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">입금 계좌:</span>
                <span className="font-medium">{bankName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">계좌번호:</span>
                <span className="font-medium">{accountNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">예금주:</span>
                <span className="font-medium">{accountHolder}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <button
              type="button"
              className="flex-1 py-2.5 bg-blue-500 text-white rounded-md font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
              onClick={handleWithdraw}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  처리 중...
                </div>
              ) : (
                "신청하기"
              )}
            </button>
            <button
              type="button"
              className="flex-1 py-2.5 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              onClick={() => setConfirmModalOpen(false)}
            >
              취소
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 커스텀 토스트 알림 */}
      {toast.visible && (
        <div
          className={`fixed bottom-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg border transition-opacity duration-300 ${toast.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
            }`}
        >
          <div className="flex items-start">
            <div className={`mr-3 flex-shrink-0 ${toast.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {toast.type === 'success' ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium">{toast.title}</h3>
              <p className="mt-1 text-sm opacity-90">{toast.message}</p>
            </div>
            <button
              type="button"
              className="ml-4 inline-flex text-gray-500 hover:text-gray-700"
              onClick={() => setToast(prev => ({ ...prev, visible: false }))}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawForm;