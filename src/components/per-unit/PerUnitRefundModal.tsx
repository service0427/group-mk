import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { KeenIcon } from '@/components';
import { supabase } from '@/supabase';
import { useAuthContext } from '@/auth';
import { useCustomToast } from '@/hooks/useCustomToast';

interface PerUnitRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: any;
  onSuccess: () => void;
}

export const PerUnitRefundModal: React.FC<PerUnitRefundModalProps> = ({
  isOpen,
  onClose,
  slot,
  onSuccess
}) => {
  const { currentUser } = useAuthContext();
  const { showSuccess, showError } = useCustomToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [reason, setReason] = useState('');

  // 환불 가능 금액 계산
  const getRefundableAmount = () => {
    const completedRatio = slot.completed_quantity / slot.quantity;
    const totalAmount = slot.quantity * slot.unit_price;
    const completedAmount = slot.completed_quantity * slot.unit_price;
    const refundableAmount = totalAmount - completedAmount;
    return {
      totalAmount,
      completedAmount,
      refundableAmount,
      uncompletedQuantity: slot.quantity - slot.completed_quantity
    };
  };

  const handleRefundRequest = async () => {
    if (!reason.trim()) {
      showError('환불 사유를 입력해주세요.');
      return;
    }

    try {
      setIsProcessing(true);
      const { refundableAmount, uncompletedQuantity } = getRefundableAmount();

      // 환불 요청 생성
      const { data: refundData, error: refundError } = await supabase
        .from('per_unit_refund_requests')
        .insert({
          slot_id: slot.id,
          user_id: currentUser?.id,
          uncompleted_quantity: uncompletedQuantity,
          refund_amount: refundableAmount,
          reason: reason,
          status: 'requested'
        })
        .select()
        .single();

      if (refundError) throw refundError;

      // 슬롯 상태 업데이트
      const { error: updateError } = await supabase
        .from('per_unit_slots')
        .update({
          status: 'refund_requested',
          updated_at: new Date().toISOString()
        })
        .eq('id', slot.id);

      if (updateError) throw updateError;

      showSuccess('환불 요청이 접수되었습니다.');
      onSuccess();
    } catch (error) {
      console.error('환불 요청 오류:', error);
      showError('환불 요청 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const { totalAmount, completedAmount, refundableAmount, uncompletedQuantity } = getRefundableAmount();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>단건형 환불 요청</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 캠페인 정보 */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-semibold mb-3">캠페인 정보</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">캠페인</span>
                <span className="font-medium">
                  {slot.per_unit_slot_request?.per_unit_campaign?.campaign?.campaign_name || '알 수 없음'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">전체 수량</span>
                <span className="font-medium">{slot.quantity.toLocaleString()}건</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">완료 수량</span>
                <span className="font-medium">{slot.completed_quantity.toLocaleString()}건</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">미완료 수량</span>
                <span className="font-medium text-red-600">{uncompletedQuantity.toLocaleString()}건</span>
              </div>
            </div>
          </div>

          {/* 환불 금액 정보 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="font-semibold mb-3">환불 금액 정보</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">총 결제 금액</span>
                <span className="font-medium">{totalAmount.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">완료 작업 금액</span>
                <span className="font-medium">{completedAmount.toLocaleString()}원</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">환불 예정 금액</span>
                  <span className="font-semibold text-lg text-primary">
                    {refundableAmount.toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 환불 사유 */}
          <div>
            <label className="text-sm font-medium mb-2 block">환불 사유</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="환불 사유를 상세히 입력해주세요."
              rows={4}
              className="w-full"
            />
          </div>

          {/* 안내 메시지 */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <KeenIcon icon="information-2" className="size-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">환불 안내</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• 미완료 작업에 대한 금액만 환불됩니다.</li>
                  <li>• 환불 요청 후 운영자 검토가 진행됩니다.</li>
                  <li>• 승인 시 캐시로 환불됩니다.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            취소
          </Button>
          <Button 
            onClick={handleRefundRequest} 
            disabled={isProcessing || uncompletedQuantity === 0}
            variant="destructive"
          >
            {isProcessing ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                처리 중...
              </>
            ) : (
              <>
                <KeenIcon icon="wallet" className="size-4 mr-2" />
                환불 요청
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};