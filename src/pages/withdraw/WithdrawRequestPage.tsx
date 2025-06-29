import React, { useState } from "react";
import { CommonTemplate } from '@/components/pageTemplate';
import {
  Card,
  CardContent
} from '@/components/ui/card';
import { useAuthContext } from '@/auth';
import { WithdrawForm, WithdrawHistory } from './components';
import { useUserCashBalance } from './hooks';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const WithdrawRequestPage: React.FC = () => {
  // AuthContext에서 currentUser 가져오기
  const { currentUser } = useAuthContext();

  // 새로고침 트리거용 상태
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // 알림 모달 상태
  const [notification, setNotification] = useState<{
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

  // 사용자 캐시 잔액 조회 커스텀 훅 사용
  const { balance: userCashBalance, isLoading: isLoadingBalance, refetch: refetchBalance } =
    useUserCashBalance(currentUser?.id);

  // 출금 신청 성공 처리 핸들러
  const handleWithdrawSuccess = (amount: string) => {
    // 내역과 잔액 새로고침
    setRefreshTrigger(prev => prev + 1);
    refetchBalance();

    // 가운데 알림 모달 표시
    setNotification({
      visible: true,
      type: 'success',
      title: '출금 신청이 완료되었습니다',
      message: `${formatNumberWithCommas(parseInt(amount) || 0)}원 출금이 요청되었습니다. 관리자 승인 후 입금됩니다.`
    });
  };

  // 금액을 천 단위 쉼표가 있는 형식으로 변환
  const formatNumberWithCommas = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <CommonTemplate
      title="캐시 출금 신청"
      description="캐시 출금을 신청합니다. 운영자 출금 요청 확인 및 승인 후 출금 처리됩니다."
      showPageMenu={false}
    >
      <div className="w-full max-w-lg mx-auto">
        <Card className="border-0 shadow-none">
          <CardContent className="p-10">
            {/* 헤더 */}
            <div className="flex items-center mb-8">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                <span className="font-bold">W</span>
              </div>
              <span className="font-medium text-lg">캐시 출금 신청</span>
            </div>

            {/* 현재 캐시 잔액 */}
            <div className="mb-6 bg-primary/10 p-4 rounded-md">
              <div className="text-sm text-muted-foreground">현재 보유한 캐시</div>
              <div className="text-lg font-medium">
                {isLoadingBalance ? (
                  <span className="text-muted-foreground">로딩 중...</span>
                ) : (
                  <span>{formatNumberWithCommas(userCashBalance)}원</span>
                )}
              </div>
            </div>

            {/* 출금 폼 */}
            {currentUser && (
              <WithdrawForm
                userId={currentUser?.id || ''}
                onSuccess={handleWithdrawSuccess}
                userCashBalance={userCashBalance}
                currentUser={currentUser}
              />
            )}

            {/* 출금 내역 */}
            {currentUser && (
              <WithdrawHistory
                userId={currentUser?.id || ''}
                refreshTrigger={refreshTrigger}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* 가운데 알림 모달 */}
      <Dialog open={notification.visible} onOpenChange={(open) => setNotification(prev => ({ ...prev, visible: open }))}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-semibold pb-2">
              {notification.type === 'success' ? (
                <div className="flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {notification.title}
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 mr-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  {notification.title}
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 text-center">
            <p className="text-gray-700 text-lg">{notification.message}</p>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setNotification(prev => ({ ...prev, visible: false }))}
              className={`w-full py-3 rounded-md font-medium ${notification.type === 'success'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
            >
              확인
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CommonTemplate>
  );
};

export default WithdrawRequestPage;