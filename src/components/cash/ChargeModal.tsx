import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { useAuthContext } from '@/auth';
import { CashService } from '@/pages/cash/CashService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogPortal,
} from "@/components/ui/dialog";
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from "@/components/ui/button";
import { createNotificationForRole } from '@/utils/notification';
import { NotificationType, NotificationPriority } from '@/types/notification';
import '@/styles/charge-modal-overlay.css';

// 충전 요청 타입 정의
interface ChargeRequest {
  id: string;
  amount: number;
  status: string;
  requested_at: string;
  free_cash_percentage: number;
  account_holder?: string;
}

// 캐시 설정 타입 정의
interface CashSetting {
  min_request_amount: number;
  free_cash_percentage: number;
  expiry_months: number;
  min_usage_amount: number;
  min_usage_percentage: number;
  bank_name?: string;
  account_number?: string;
  account_holder?: string;
}

interface ChargeModalProps {
  open: boolean;
  onClose: () => void;
}

const ChargeModal: React.FC<ChargeModalProps> = ({ open, onClose }) => {
  // AuthContext에서 currentUser 가져오기
  const { currentUser } = useAuthContext();
  // 페이지 이동을 위한 네비게이션 훅
  const navigate = useNavigate();

  // 상태 관리
  const [customAmount, setCustomAmount] = useState<string>('0');
  const [selectedAmount, setSelectedAmount] = useState<string>('');
  const [koreanAmount, setKoreanAmount] = useState<string>('0');
  const [depositorName, setDepositorName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [recentRequests, setRecentRequests] = useState<ChargeRequest[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [cashSetting, setCashSetting] = useState<CashSetting | null>(null);
  const [bonusAmount, setBonusAmount] = useState<number>(0);
  const [isEligibleForBonus, setIsEligibleForBonus] = useState<boolean>(false);
  const [isLoadingSetting, setIsLoadingSetting] = useState<boolean>(false);

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
    if (!value) return '';

    const num = parseInt(value);

    // 값이 0이면 '0'을 반환
    if (num === 0)
      return '0';

    const eok = Math.floor(num / 100000000);
    const man = Math.floor((num % 100000000) / 10000);
    const rest = num % 10000;

    let result = '';

    if (eok > 0) {
      result += formatNumberWithCommas(eok) + '억 ';
    }

    if (man > 0) {
      result += formatNumberWithCommas(man) + '만 ';
    }

    if (rest > 0) {
      result += formatNumberWithCommas(rest);
    }

    return result.trim();
  };

  // 캐시 설정 불러오기
  const fetchCashSetting = async () => {
    if (!currentUser) return Promise.resolve();

    setIsLoadingSetting(true);

    try {
      const result = await CashService.getCashSetting(currentUser.id || '');

      if (result.success && result.data) {
        const settingData = result.data;
        setCashSetting(settingData);

        // 포인트 표시 여부 설정 (설정의 free_cash_percentage 값에 따라)
        const showPoints = settingData.free_cash_percentage > 0;
        setShowPointInfo(showPoints);
      } else {
        setShowPointInfo(false); // 설정을 불러오지 못하면 포인트 정보 숨김
      }
    } catch (err) {
      setShowPointInfo(false); // 오류 발생 시 포인트 정보 숨김
    } finally {
      setIsLoadingSetting(false);
    }

    return Promise.resolve(); // 항상 Promise 반환
  };

  // 보너스(무료캐시) 금액 계산
  const calculateBonusAmount = () => {
    if (!cashSetting || !customAmount) {
      setBonusAmount(0);
      setIsEligibleForBonus(false);
      return;
    }

    const amount = parseInt(customAmount);

    // 최소 충전 금액 이상인지 확인
    if (amount >= cashSetting.min_request_amount) {
      const bonus = Math.ceil((amount * cashSetting.free_cash_percentage) / 100);
      setBonusAmount(bonus);
      setIsEligibleForBonus(true);
    } else {
      setBonusAmount(0);
      setIsEligibleForBonus(false);
    }
  };

  // 최근 충전 요청 내역 가져오기
  const fetchRecentRequests = async () => {
    if (!currentUser) {
      return Promise.resolve(); // 명시적으로 Promise 반환
    }

    setIsLoadingHistory(true);

    try {
      const result = await CashService.getChargeRequestHistory(currentUser.id || '', 3);

      if (result.success) {
        const requests = result.data || [];
        setRecentRequests(requests);

        // 가장 최근 요청의 입금자명이 있다면 자동으로 채우기
        if (requests.length > 0 && requests[0].account_holder) {
          setDepositorName(requests[0].account_holder);
        }
      } else {
        setRecentRequests([]);
      }
    } catch (err) {
      // 에러 발생 시 빈 배열로 처리하여 로딩 상태 종료
      setRecentRequests([]);
    } finally {
      setIsLoadingHistory(false);
    }

    return Promise.resolve(); // 항상 Promise 반환
  };

  // 금액이 변경될 때마다 한글 단위 표시 업데이트 및 보너스 금액 계산
  useEffect(() => {
    if (customAmount) {
      setKoreanAmount(formatToKorean(customAmount));
      calculateBonusAmount();
    } else {
      setKoreanAmount('');
      setBonusAmount(0);
      setIsEligibleForBonus(false);
    }

    // 입력값이 '0'일 때 특별 처리
    if (customAmount === '0') {
      setKoreanAmount('0');
    }
  }, [customAmount, cashSetting]);

  // 설정에서 포인트 표시 여부 확인 (기본값 false)
  const [showPointInfo, setShowPointInfo] = useState<boolean>(false);

  // 알림 다이얼로그 상태 관리
  const [resultDialogOpen, setResultDialogOpen] = useState<boolean>(false);
  const [dialogTitle, setDialogTitle] = useState<string>("");
  const [dialogDescription, setDialogDescription] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState<boolean>(true);

  // 충전 확인 모달 상태 관리
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);

  // 컴포넌트 마운트 시 캐시 설정 먼저 가져오기
  useEffect(() => {
    if (open && currentUser && currentUser.id) {
      // 모달이 열릴 때 데이터 로드
      const loadData = async () => {
        setShowPointInfo(false); // 명시적으로 초기값 설정
        await fetchCashSetting(); // 설정 먼저 로드
        await fetchRecentRequests(); // 설정 로드 후 충전 내역 가져오기
      };

      loadData();
    }
  }, [currentUser, open]); // currentUser와 open에 의존

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

  // 알림 다이얼로그 표시 함수
  const showResultDialog = (title: string, description: string, success: boolean = true) => {
    setDialogTitle(title);
    setDialogDescription(description);
    setIsSuccess(success);
    // 충전 모달은 닫고 결과 모달 표시
    onClose(); // 충전 모달 닫기
    setResultDialogOpen(true);
  };

  // 충전 버튼 클릭 시 확인 모달 표시
  const handleChargeClick = () => {
    // 유효성 검사
    if (!currentUser) {
      setError('로그인이 필요합니다.');
      return;
    }

    if (!customAmount || Number(customAmount) <= 0) {
      setError('충전할 금액을 입력해주세요.');
      return;
    }

    if (!depositorName.trim()) {
      setError('입금자명을 입력해주세요.');
      return;
    }

    // 에러가 없으면 확인 모달 표시
    setError(null);
    setConfirmDialogOpen(true);
  };

  // 실제 충전 요청 처리
  const handleCharge = async () => {
    // 확인 모달 닫기
    setConfirmDialogOpen(false);
    setError(null);
    setIsLoading(true);

    if (!currentUser) {
      setError('로그인이 필요합니다.');
      setIsLoading(false);
      return;
    }

    try {
      const result = await CashService.createChargeRequest(
        currentUser.id || '',
        Number(customAmount),
        depositorName.trim()
      );

      if (result.success) {
        // Dialog로 표시
        showResultDialog(
          "충전 요청 완료",
          `${result.message}\n관리자 승인 후 충전이 완료됩니다.`,
          true
        );

        // 운영자에게 알림 보내기
        await createNotificationForRole('operator', {
          type: NotificationType.TRANSACTION,
          title: '새로운 캐시 충전 요청',
          message: `${currentUser.email || '사용자'}님이 ${formatNumberWithCommas(Number(customAmount))}원의 캐시 충전을 요청했습니다. 입금자명: ${depositorName.trim()}`,
          priority: NotificationPriority.HIGH,
          icon: 'transaction',
          link: '/admin/cash'
        });

        // 성공 후 폼 초기화 및 내역 갱신
        setCustomAmount('0');
        setSelectedAmount('');
        setKoreanAmount('0');
        fetchRecentRequests();
      } else {
        // 실패 시 에러 메시지 표시
        showResultDialog("충전 요청 실패", result.message, false);
        setError(result.message);
      }
    } catch (err: any) {
      const errorMessage = err.message || '충전 요청 중 오류가 발생했습니다. 다시 시도해주세요.';
      showResultDialog("충전 요청 오류", errorMessage, false);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 모달 닫기 핸들러
  const handleModalClose = () => {
    // 상태 초기화 (금액은 0으로 설정)
    setCustomAmount('0');
    setSelectedAmount('');
    setKoreanAmount('0');
    setError(null);
    // 입금자명은 초기화하지 않음 (다음 사용 시 편의를 위해)
    onClose();
  };

  return (
    <>
      {/* 메인 캐시 충전 모달 */}
      <Dialog
        open={open}
        onOpenChange={(open) => {
          if (!open) handleModalClose();
        }}
      >
        <DialogContent
          className="max-w-lg p-0 mx-auto rounded-lg bg-card flex flex-col max-h-[90vh]"
          style={{ zIndex: 9999 }}
          onPointerDownOutside={(e) => {
            e.preventDefault();
            handleModalClose();
          }}
          aria-describedby={undefined}
        >
          <DialogHeader className="flex items-center py-5 px-6 border-b flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white mr-3">
              <span className="font-bold">W</span>
            </div>
            <DialogTitle className="text-lg font-medium">캐시 충전 신청</DialogTitle>
            <DialogDescription className="sr-only">
              캐시 충전을 위한 금액 입력 및 결제 정보 입력 화면입니다.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-background p-10 flex-1 overflow-y-auto min-h-0">
            {/* 에러 메시지 표시 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {/* 금액 입력 필드 */}
            <div className="mb-6">
              <p className="text-muted-foreground text-sm mb-2">충전할 금액을 입력해 주세요.</p>
              <div className="relative">
                <div className="flex items-center relative border-b border-gray-300 focus-within:border-b-gray-500">
                  <input
                    type="text"
                    value={customAmount ? formatNumberWithCommas(parseInt(customAmount)) : ''}
                    onChange={handleCustomAmountChange}
                    placeholder="0"
                    className="w-full bg-transparent border-none outline-none focus:outline-none text-lg pl-0 pr-8 py-1"
                  />
                  {customAmount && customAmount !== '0' && (
                    <button
                      onClick={() => {
                        setCustomAmount('0');
                        setKoreanAmount('0');
                      }}
                      type="button"
                      className="absolute right-0 text-gray-400 hover:text-gray-600 flex items-center justify-center h-full px-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* 보너스 캐시 정보 표시 */}
              {customAmount && cashSetting && showPointInfo && (
                <div className="mt-3 p-3 bg-muted/40 rounded-md">
                  {isEligibleForBonus ? (
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-foreground">충전 금액:</span>
                        <span className="font-medium">{formatNumberWithCommas(parseInt(customAmount))}원</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-foreground">무료 보너스 캐시 ({cashSetting.free_cash_percentage}%):</span>
                        <span className="font-medium text-green-600">+{formatNumberWithCommas(bonusAmount)}원</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-foreground">총 충전 금액:</span>
                        <span className="font-medium text-lg">{formatNumberWithCommas(parseInt(customAmount) + bonusAmount)}원</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        * 무료 캐시는 {cashSetting.expiry_months > 0 ? `${cashSetting.expiry_months}개월` : '무기한'}
                        {cashSetting.min_usage_amount > 0 && `, ${formatNumberWithCommas(cashSetting.min_usage_amount)}원 이상 결제`} 시 사용 가능합니다.
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {formatNumberWithCommas(cashSetting.min_request_amount)}원 이상 충전 시
                      <span className="text-green-600 font-medium"> {cashSetting.free_cash_percentage}% 무료 캐시</span>를 추가로 받을 수 있습니다.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 금액 빠른 선택 */}
            <div className="grid grid-cols-4 gap-2 mb-8">
              <button
                className="py-3 border border-gray-300 rounded text-sm bg-card hover:bg-muted/60"
                onClick={() => handleAmountSelect('10000')}
                type="button"
              >
                +1만
              </button>
              <button
                className="py-3 border border-gray-300 rounded text-sm bg-card hover:bg-muted/60"
                onClick={() => handleAmountSelect('50000')}
                type="button"
              >
                +5만
              </button>
              <button
                className="py-3 border border-gray-300 rounded text-sm bg-card hover:bg-muted/60"
                onClick={() => handleAmountSelect('100000')}
                type="button"
              >
                +10만
              </button>
              <button
                className="py-3 border border-gray-300 rounded text-sm bg-card hover:bg-muted/60"
                onClick={() => handleAmountSelect('1000000')}
                type="button"
              >
                +100만
              </button>
            </div>

            {/* 입금 계좌 정보 */}
            {cashSetting && (cashSetting.bank_name || cashSetting.account_number || cashSetting.account_holder) && (
              <div className="mb-6 p-4 border border-blue-100 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 8.5H22M6 16.5H8M10.5 16.5H16.5M2 11.5V19.5C2 20.05 2.45 20.5 3 20.5H21C21.55 20.5 22 20.05 22 19.5V11.5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M22 8.5V7.7C22 7.2 21.8 6.8 21.4 6.4L19.1 4.1C18.7 3.7 18.2 3.5 17.7 3.5H6.3C5.8 3.5 5.3 3.7 4.9 4.1L2.6 6.4C2.2 6.8 2 7.2 2 7.7V8.5H22Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400">입금 계좌 정보</h4>
                </div>

                <div className="space-y-1 text-sm">
                  {cashSetting.bank_name && (
                    <div className="flex justify-between py-1 border-b border-blue-100 dark:border-blue-800">
                      <span className="text-blue-800 dark:text-blue-300">은행명</span>
                      <span className="font-medium text-blue-900 dark:text-blue-50">{cashSetting.bank_name}</span>
                    </div>
                  )}

                  {cashSetting.account_number && (
                    <div className="flex justify-between py-1 border-b border-blue-100 dark:border-blue-800">
                      <span className="text-blue-800 dark:text-blue-300">계좌번호</span>
                      <span className="font-medium text-blue-900 dark:text-blue-50">{cashSetting.account_number}</span>
                    </div>
                  )}

                  {cashSetting.account_holder && (
                    <div className="flex justify-between py-1">
                      <span className="text-blue-800 dark:text-blue-300">예금주</span>
                      <span className="font-medium text-blue-900 dark:text-blue-50">{cashSetting.account_holder}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 text-xs text-blue-700 dark:text-blue-300">
                  충전 요청 이후 위 계좌로 입금을 진행해 주세요.
                </div>

                {/* 입금자명 입력 필드 */}
                <div className="mt-4 pt-3 border-t border-blue-100 dark:border-blue-800">
                  <label htmlFor="depositor-name" className="block text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                    입금자명
                  </label>
                  <input
                    id="depositor-name"
                    type="text"
                    value={depositorName}
                    onChange={(e) => setDepositorName(e.target.value)}
                    placeholder="입금자명을 입력해주세요"
                    className="w-full p-2 border border-blue-200 dark:border-blue-700 bg-white dark:bg-blue-900/30 text-blue-900 dark:text-blue-50 rounded-md focus:ring-primary focus:border-primary text-sm"
                  />
                  <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                    실제 입금 시 사용할 입금자명을 정확히 입력해주세요.
                  </p>
                </div>
              </div>
            )}

            {/* 최근 충전 요청 내역 */}
            <div className="mb-4">
              <div className="mb-3 flex justify-between items-center">
                <p className="text-sm font-medium">최근 충전 내역 (최근 3건)</p>
                <button
                  type="button"
                  className="text-xs text-primary hover:text-primary-dark hover:underline flex items-center gap-1 bg-transparent border-0 p-0 cursor-pointer"
                  onClick={() => {
                    // 모달 닫고 해당 페이지로 이동
                    handleModalClose();
                    navigate('/cash/history');
                  }}
                >
                  <span>상세보기</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {isLoadingHistory || isLoadingSetting ? (
                <div className="text-center py-4 text-muted-foreground">
                  내역을 불러오는 중...
                </div>
              ) : recentRequests.length > 0 ? (
                <div className="border border-border rounded-md overflow-hidden">
                  <div className="max-h-[200px] overflow-auto">
                    <table className="w-full text-sm table-fixed">
                      <colgroup>
                        <col className="w-[25%]" />
                        <col className="w-[55%]" />
                        <col className="w-[20%]" />
                      </colgroup>
                      <thead className="bg-muted sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-2 text-center font-medium text-muted-foreground">날짜</th>
                          <th className="px-4 py-2 text-center font-medium text-muted-foreground">금액</th>
                          <th className="px-3 py-2 text-center font-medium text-muted-foreground">상태</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {recentRequests.map((request) => (
                          <tr key={request.id} className="hover:bg-muted/40">
                            <td className="px-2 py-3 text-center text-foreground text-xs">
                              {formatDate(request.requested_at)}
                            </td>
                            <td className="px-3 py-3 text-center text-foreground font-medium">
                              {formatNumberWithCommas(request.amount)}원
                              {showPointInfo && request.free_cash_percentage > 0 && (
                                <div className="text-xs text-green-600">
                                  +{formatNumberWithCommas(Math.floor((request.amount * request.free_cash_percentage) / 100))}원 보너스
                                </div>
                              )}
                            </td>
                            <td className="px-1 py-3 text-center">
                              <span className={`inline-block px-1.5 py-0.5 text-xs rounded-full whitespace-nowrap ${getStatusColor(request.status)}`}>
                                {getStatusText(request.status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="border border-border rounded-md p-4 text-center text-muted-foreground">
                  최근 충전 요청 내역이 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* 충전 버튼 - 푸터 */}
          <DialogFooter className="px-6 py-4 border-t flex-shrink-0 bg-background">
            <button
              onClick={handleChargeClick}
              disabled={isLoading || !customAmount}
              type="button"
              className={`w-full py-4 ${customAmount && !isLoading
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-600'
                } font-medium rounded-md transition-colors ${isLoading ? 'cursor-not-allowed opacity-70' : ''
                }`}
            >
              {isLoading ? '처리 중...' : '충전하기'}
            </button>
            {showPointInfo && isEligibleForBonus && (
              <div className="text-center text-sm mt-2 text-green-600">
                {formatNumberWithCommas(bonusAmount)}원 무료 캐시가 추가로 지급됩니다!
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 충전 확인 다이얼로그 */}
      <Dialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
      >
        <DialogPortal>
          <DialogPrimitive.Content
            className="fixed left-[50%] top-[50%] z-[10000] max-w-md w-full translate-x-[-50%] translate-y-[-50%] rounded-lg border-2 border-blue-200 dark:border-blue-300 bg-white dark:bg-gray-900 p-0 shadow-2xl text-center"
            onPointerDownOutside={(e) => {
              e.preventDefault();
              setConfirmDialogOpen(false);
            }}
          >
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-t-[4px] p-6 border-b-2 border-yellow-200 dark:border-yellow-700">
              <DialogHeader className="text-center">
                <DialogTitle className="text-center text-lg mb-2 text-yellow-700 dark:text-yellow-400">
                  충전 요청 확인
                </DialogTitle>
              </DialogHeader>
            </div>

            <div className="p-6">
              <div className="space-y-3 mb-6">
                <div className="text-2xl font-bold text-foreground">
                  {formatNumberWithCommas(parseInt(customAmount || '0'))}원
                </div>
                {showPointInfo && isEligibleForBonus && (
                  <div className="text-sm text-green-600">
                    + {formatNumberWithCommas(bonusAmount)}원 무료 캐시
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  입금자명: <span className="font-medium text-foreground">{depositorName}</span>
                </div>
              </div>

              <DialogDescription className="text-center text-sm mb-6">
                위 금액으로 캐시 충전을 요청하시겠습니까?<br />
                충전 요청 후 입금 계좌로 송금해주세요.
              </DialogDescription>

              <DialogFooter className="flex gap-3 justify-center mt-4 sm:justify-center">
                <Button
                  onClick={handleCharge}
                  className="min-w-[100px] bg-green-600 hover:bg-green-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? '처리 중...' : '예, 충전 요청'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setConfirmDialogOpen(false)}
                  className="min-w-[100px]"
                >
                  취소
                </Button>
              </DialogFooter>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>

      {/* 결과 알림 다이얼로그 */}
      <Dialog
        open={resultDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setResultDialogOpen(false);
            // 결과 모달이 닫힐 때 폼 초기화
            setCustomAmount('0');
            setSelectedAmount('');
            setKoreanAmount('0');
            setError(null);
            // 입금자명은 유지
          }
        }}
      >
        <DialogContent
          className="max-w-md mx-auto text-center bg-card p-0"
          style={{ zIndex: 10000 }} // 충전 요청 모달(9999)보다 높은 z-index 설정
          onPointerDownOutside={() => setResultDialogOpen(false)} // 모달 외부 클릭 시 닫기
          aria-describedby={undefined}
        >
          <div className={`rounded-t-lg p-6 ${isSuccess ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
            <DialogHeader className="text-center">
              <DialogTitle className={`text-center text-lg mb-2 ${isSuccess ? "text-green-600" : "text-red-600"}`}>
                {dialogTitle}
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="p-6">
            <DialogDescription className="whitespace-pre-line text-center text-sm py-4">
              {dialogDescription}
            </DialogDescription>

            <DialogFooter className="flex justify-center mt-4 sm:justify-center">
              <Button
                onClick={() => {
                  setResultDialogOpen(false);
                  // 결과 모달이 닫힐 때 폼 초기화
                  setCustomAmount('0');
                  setSelectedAmount('');
                  setKoreanAmount('0');
                  setError(null);
                  // 입금자명은 유지
                }}
                className={`min-w-[100px] ${isSuccess ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700 text-white"}`}
              >
                확인
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { ChargeModal };