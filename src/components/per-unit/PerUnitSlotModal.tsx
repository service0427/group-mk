import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';
import { supabase } from '@/supabase';
import { useAuthContext } from '@/auth';
import { useCustomToast } from '@/hooks/useCustomToast';

interface PerUnitSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: any;
  onSuccess: () => void;
}

export const PerUnitSlotModal: React.FC<PerUnitSlotModalProps> = ({
  isOpen,
  onClose,
  request,
  onSuccess
}) => {
  const { currentUser } = useAuthContext();
  const { showSuccess, showError } = useCustomToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (!currentUser?.id) return;

    try {
      setIsProcessing(true);

      // 1. 사용자 잔액 확인
      const { data: balanceData, error: balanceError } = await supabase
        .from('user_balances')
        .select('total_balance')
        .eq('user_id', currentUser.id)
        .single();

      if (balanceError) {
        showError('잔액 조회 중 오류가 발생했습니다.');
        return;
      }

      const currentBalance = balanceData?.total_balance || 0;
      const requiredAmount = request.total_price;

      if (currentBalance < requiredAmount) {
        showError(`잔액이 부족합니다. 필요 금액: ${requiredAmount.toLocaleString()}원, 현재 잔액: ${currentBalance.toLocaleString()}원`);
        return;
      }

      // 2. 결제 처리 (per_unit_payments 테이블에 기록)
      const { data: paymentData, error: paymentError } = await supabase
        .from('per_unit_payments')
        .insert({
          slot_request_id: request.id,
          user_id: currentUser.id,
          amount: requiredAmount,
          payment_method: 'cash',
          status: 'completed'
        })
        .select()
        .single();

      if (paymentError) {
        showError('결제 처리 중 오류가 발생했습니다.');
        return;
      }

      // 3. 슬롯 요청 상태 업데이트
      const { error: updateError } = await supabase
        .from('per_unit_slot_requests')
        .update({
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (updateError) {
        showError('상태 업데이트 중 오류가 발생했습니다.');
        return;
      }

      // 4. 사용자 잔액 차감
      const { error: balanceUpdateError } = await supabase
        .from('user_balances')
        .update({
          total_balance: currentBalance - requiredAmount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', currentUser.id);

      if (balanceUpdateError) {
        showError('잔액 업데이트 중 오류가 발생했습니다.');
        return;
      }

      // 5. 캐시 사용 내역 추가
      const { error: historyError } = await supabase
        .from('user_cash_history')
        .insert({
          user_id: currentUser.id,
          transaction_type: 'use',
          amount: requiredAmount,
          description: `단건형 슬롯 구매: ${request.per_unit_campaign?.campaign?.campaign_name || '캠페인'}`,
          balance_type: 'total'
        });

      if (historyError) {
        console.error('캐시 내역 추가 오류:', historyError);
      }

      showSuccess('결제가 완료되었습니다. 작업이 시작됩니다.');
      onSuccess();
    } catch (error) {
      console.error('결제 처리 오류:', error);
      showError('결제 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>단건형 슬롯 결제</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-semibold mb-3">결제 정보</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">캠페인</span>
                <span className="font-medium">
                  {request.per_unit_campaign?.campaign?.campaign_name || '알 수 없음'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">요청 수량</span>
                <span className="font-medium">{request.requested_quantity}개</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">단가</span>
                <span className="font-medium">{request.unit_price.toLocaleString()}원</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">총 결제 금액</span>
                  <span className="font-semibold text-lg text-primary">
                    {request.total_price.toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <KeenIcon icon="information-2" className="size-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">결제 안내</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• 캐시로 결제가 진행됩니다.</li>
                  <li>• 결제 완료 후 즉시 작업이 시작됩니다.</li>
                  <li>• 작업 기간: {request.per_unit_campaign?.work_period_days || 0}일</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            취소
          </Button>
          <Button onClick={handlePayment} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                처리 중...
              </>
            ) : (
              <>
                <KeenIcon icon="purchase" className="size-4 mr-2" />
                결제하기
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};