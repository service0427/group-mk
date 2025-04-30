import React, { useState } from "react";
import { CommonTemplate } from '@/components/pageTemplate';
import { 
  Card, 
  CardContent
} from '@/components/ui/card';
import { useAuthContext } from '@/auth';
import { WithdrawForm, WithdrawHistory } from './components';
import { useUserCashBalance } from './hooks';

const WithdrawRequestPage: React.FC = () => {
  // AuthContext에서 currentUser 가져오기
  const { currentUser } = useAuthContext();
  
  // 새로고침 트리거용 상태
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  // 사용자 캐시 잔액 조회 커스텀 훅 사용
  const { balance: userCashBalance, isLoading: isLoadingBalance, refetch: refetchBalance } = 
    useUserCashBalance(currentUser?.id);
  
  // 출금 신청 성공 처리 핸들러
  const handleWithdrawSuccess = () => {
    // 내역과 잔액 새로고침
    setRefreshTrigger(prev => prev + 1);
    refetchBalance();
  };
  
  // 금액을 천 단위 쉼표가 있는 형식으로 변환
  const formatNumberWithCommas = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <CommonTemplate 
      title="출금 신청"
      description="캐쉬/포인트 관리 > 출금 신청"
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
                userId={currentUser.id} 
                onSuccess={handleWithdrawSuccess}
                userCashBalance={userCashBalance}
              />
            )}
            
            {/* 출금 내역 */}
            {currentUser && (
              <WithdrawHistory 
                userId={currentUser.id}
                refreshTrigger={refreshTrigger}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </CommonTemplate>
  );
};

export default WithdrawRequestPage;