import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/alert';
import { KeenIcon } from '@/components';
import { RefundSettings, RefundCalculation } from '@/types/refund.types';
import { calculateRefund, getRefundTypeText } from '@/utils/refundUtils';
import { supabase } from '@/supabase';
import { useCustomToast } from '@/hooks/useCustomToast';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface SlotRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  slots: Array<{
    id: string;
    startDate?: string | null;
    endDate?: string | null;
    product_id: number;
    status?: string;
    campaign?: {
      campaignName: string;
      refund_settings?: RefundSettings;
    };
  }>;
  onSuccess: () => void;
}

export const SlotRefundModal: React.FC<SlotRefundModalProps> = ({
  isOpen,
  onClose,
  slots,
  onSuccess,
}) => {
  const { showSuccess, showError } = useCustomToast();
  const [refundReason, setRefundReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [refundCalculations, setRefundCalculations] = useState<Map<string, RefundCalculation>>(new Map());
  const [totalRefundAmount, setTotalRefundAmount] = useState(0);

  // 환불 계산
  useEffect(() => {
    const fetchAndCalculateRefunds = async () => {
      const calculations = new Map<string, RefundCalculation>();
      let total = 0;

      for (const slot of slots) {
        // slot_pending_balances에서 실제 결제 금액 가져오기
        const { data: pendingBalance } = await supabase
          .from('slot_pending_balances')
          .select('amount')
          .eq('slot_id', slot.id)
          .single();

        const amount = pendingBalance?.amount || 0;
        const refundSettings = slot.campaign?.refund_settings || {
          enabled: true,
          type: 'immediate',
          requires_approval: false,
          refund_rules: {
            min_usage_days: 0,
            max_refund_days: 7,
            partial_refund: true,
            refund_rate: 100
          }
        };

        // 작업 상태에 따라 환불 계산을 다르게 처리
        let calculation: RefundCalculation;
        
        if (slot.status === 'approved') {
          // approved 상태 (작업 시작 전) - 전액 환불
          calculation = {
            isRefundable: true,
            refundAmount: Number(amount),
            originalAmount: Number(amount),
            usedDays: 0,
            remainingDays: slot.startDate && slot.endDate ? 
              Math.ceil((new Date(slot.endDate).getTime() - new Date(slot.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0,
            refundRate: 100,
            message: '작업 시작 전 - 전액 환불 가능',
            requiresApproval: refundSettings.requires_approval || false,
            expectedRefundDate: refundSettings.type === 'delayed' && refundSettings.delay_days
              ? new Date(Date.now() + refundSettings.delay_days * 24 * 60 * 60 * 1000).toISOString()
              : undefined
          };
        } else {
          // active 상태 (작업 진행 중) - 사용 일수에 따른 부분 환불
          calculation = calculateRefund(
            slot.startDate ?? null,
            slot.endDate ?? null,
            Number(amount),
            refundSettings as RefundSettings
          );
        }

        calculations.set(slot.id, calculation);
        if (calculation.isRefundable) {
          total += calculation.refundAmount;
        }
      }

      setRefundCalculations(calculations);
      setTotalRefundAmount(total);
    };

    if (isOpen && slots.length > 0) {
      fetchAndCalculateRefunds();
    }
  }, [isOpen, slots]);

  const handleRefundRequest = async () => {
    if (!refundReason.trim()) {
      showError('환불 사유를 입력해주세요.');
      return;
    }

    setIsProcessing(true);
    try {
      // 환불 가능한 슬롯만 필터링
      const refundableSlots = slots.filter(slot => {
        const calc = refundCalculations.get(slot.id);
        return calc?.isRefundable;
      });

      if (refundableSlots.length === 0) {
        showError('환불 가능한 슬롯이 없습니다.');
        return;
      }

      // 승인이 필요한 경우와 즉시 환불 분리
      const slotsNeedingApproval: string[] = [];
      const immediateRefundSlots: string[] = [];

      refundableSlots.forEach(slot => {
        const calc = refundCalculations.get(slot.id);
        if (calc?.requiresApproval) {
          slotsNeedingApproval.push(slot.id);
        } else {
          immediateRefundSlots.push(slot.id);
        }
      });

      // 현재 사용자 정보 가져오기
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id;

      // 1. 승인이 필요한 슬롯은 환불 승인 요청 생성
      if (slotsNeedingApproval.length > 0) {
        for (const slotId of slotsNeedingApproval) {
          const calc = refundCalculations.get(slotId)!;
          
          // 기존 거절된 환불 요청이 있는지 확인
          const { data: existingApproval } = await supabase
            .from('slot_refund_approvals')
            .select('id, status')
            .eq('slot_id', slotId)
            .eq('status', 'rejected')
            .single();
          
          if (existingApproval) {
            // 기존 거절된 요청을 재사용
            const { error: updateError } = await supabase
              .from('slot_refund_approvals')
              .update({
                refund_amount: calc.refundAmount,
                refund_reason: refundReason,
                status: 'pending',
                request_date: new Date().toISOString(),
                approval_date: null,
                approver_id: null,
                approval_notes: null,
                approved_amount: null
              })
              .eq('id', existingApproval.id);
              
            if (updateError) throw updateError;
          } else {
            // 새로운 환불 요청 생성
            const { error: insertError } = await supabase
              .from('slot_refund_approvals')
              .insert({
                slot_id: slotId,
                requester_id: currentUserId,
                refund_amount: calc.refundAmount,
                refund_reason: refundReason,
                status: 'pending'
              });
              
            if (insertError) throw insertError;
          }
        }

        // 슬롯 상태를 refund_pending으로 변경
        const { error: statusError } = await supabase
          .from('slots')
          .update({
            status: 'refund_pending',
            updated_at: new Date().toISOString()
          })
          .in('id', slotsNeedingApproval);

        if (statusError) throw statusError;
      }

      // 2. 즉시 환불 가능한 슬롯 처리
      if (immediateRefundSlots.length > 0) {
        // 여기서는 기존 환불 로직 사용 (MyServicesPage의 handleConfirmCancel 참고)
        // TODO: 환불 시점에 따른 처리 추가 (delayed, cutoff_based)
        
        // 슬롯 상태를 cancelled로 변경
        const { error: slotError } = await supabase
          .from('slots')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .in('id', immediateRefundSlots);

        if (slotError) throw slotError;

        // 환불 처리 로직...
        // (기존 MyServicesPage의 환불 로직 재사용)
      }

      const message = [];
      if (immediateRefundSlots.length > 0) {
        message.push(`${immediateRefundSlots.length}개 슬롯이 환불 처리되었습니다.`);
      }
      if (slotsNeedingApproval.length > 0) {
        message.push(`${slotsNeedingApproval.length}개 슬롯의 환불 승인 요청이 접수되었습니다.`);
      }

      showSuccess(message.join(' '));
      onSuccess();
      onClose();
    } catch (error) {
      console.error('환불 처리 오류:', error);
      showError('환불 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const allRefundable = slots.every(slot => refundCalculations.get(slot.id)?.isRefundable);
  const anyRequiresApproval = slots.some(slot => refundCalculations.get(slot.id)?.requiresApproval);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-6">
        <DialogHeader className="pb-4 border-b mb-4">
          <DialogTitle className="text-xl font-bold flex items-center gap-3">
            <div className="size-12 rounded-full bg-gradient-to-br from-red-400 to-pink-500 shadow-lg flex items-center justify-center">
              <KeenIcon icon="wallet" className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">환불 신청</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-normal mt-0.5">선택한 슬롯의 환불을 신청합니다</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 환불 요약 정보 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-base mb-4 flex items-center gap-2">
              <KeenIcon icon="information-3" className="text-blue-600 dark:text-blue-400 size-5" />
              환불 요약
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <KeenIcon icon="file-sheet" className="size-4" />
                  환불 요청 슬롯
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">{slots.length}개</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <KeenIcon icon="wallet" className="size-4" />
                  총 환불 예정 금액
                </span>
                <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                  {totalRefundAmount.toLocaleString()}원
                </span>
              </div>
              {/* 환불 정책 정보 표시 */}
              {(() => {
                // 첫 번째 슬롯에서 환불 설정을 가져옴
                const firstSlotWithRefundSettings = slots.find(slot => 
                  slot.campaign?.refund_settings && slot.campaign.refund_settings.enabled
                );
                
                if (!firstSlotWithRefundSettings?.campaign?.refund_settings) {
                  return null;
                }
                
                const refundSettings = firstSlotWithRefundSettings.campaign.refund_settings;
                
                return (
                  <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <KeenIcon icon="information-2" className="text-amber-600 dark:text-amber-400 size-5 mt-0.5" />
                      <div className="text-sm space-y-1">
                        <p className="font-medium text-amber-800 dark:text-amber-200">환불 정책</p>
                        {(() => {
                          switch (refundSettings.type) {
                          case 'immediate':
                            return (
                              <p className="text-amber-700 dark:text-amber-300">
                                • 환불 승인 후 즉시 환불 처리됩니다.
                              </p>
                            );
                          case 'delayed':
                            return (
                              <p className="text-amber-700 dark:text-amber-300">
                                • 환불 승인 후 {refundSettings.delay_days || 0}일 뒤에 환불됩니다.
                              </p>
                            );
                          case 'cutoff_based':
                            return (
                              <p className="text-amber-700 dark:text-amber-300">
                                • 마감시간({refundSettings.cutoff_time || '18:00'}) 이후 환불 처리됩니다.
                              </p>
                            );
                          default:
                            return null;
                        }
                      })()}
                        {anyRequiresApproval && (
                          <p className="text-amber-700 dark:text-amber-300">
                            • 총판 승인이 필요합니다.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* 슬롯별 환불 상세 */}
          <div>
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <KeenIcon icon="calendar-tick" className="text-gray-600 dark:text-gray-400 size-4" />
              슬롯별 환불 상세
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {slots.map((slot) => {
              const calc = refundCalculations.get(slot.id);
              if (!calc) return null;

              return (
                <div
                  key={slot.id}
                  className={`border rounded-xl p-4 transition-all hover:shadow-md ${
                    calc.isRefundable
                      ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                      : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className={`size-2 rounded-full ${
                          calc.isRefundable ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">{slot.campaign?.campaignName}</p>
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {slot.startDate && slot.endDate && (
                          <span>
                            {format(new Date(slot.startDate), 'yyyy-MM-dd')} ~ {format(new Date(slot.endDate), 'yyyy-MM-dd')}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <KeenIcon icon="calendar" className="size-3" />
                          사용: {calc.usedDays}일
                        </span>
                        <span className="flex items-center gap-1">
                          <KeenIcon icon="time" className="size-3" />
                          남은: {calc.remainingDays}일
                        </span>
                        {slot.status && (
                          <span className={`flex items-center gap-1 font-medium ${
                            slot.status === 'approved' ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'
                          }`}>
                            <KeenIcon icon={slot.status === 'approved' ? 'shield-tick' : 'check-circle'} className="size-3" />
                            {slot.status === 'approved' ? '작업 대기' : '작업 진행중'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      {calc.isRefundable ? (
                        <div>
                          <p className="font-bold text-lg text-blue-600 dark:text-blue-400">
                            {calc.refundAmount.toLocaleString()}원
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {calc.refundRate?.toFixed(0) ?? 0}% 환불
                          </p>
                          {calc.expectedRefundDate && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                              <KeenIcon icon="calendar-check" className="size-3" />
                              {format(new Date(calc.expectedRefundDate), 'M/d', { locale: ko })} 예정
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                          <KeenIcon icon="cross-circle" className="size-4" />
                          <span>{calc.message}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>

          {/* 환불 사유 입력 */}
          <div className="space-y-2">
            <Label htmlFor="refund-reason" className="flex items-center gap-2">
              <KeenIcon icon="message-text" className="size-4 text-gray-600 dark:text-gray-400" />
              환불 사유 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="refund-reason"
              placeholder="환불 사유를 상세히 입력해주세요..."
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              rows={4}
              className="resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              환불 사유는 총판 승인 시 참고됩니다.
            </p>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isProcessing}
            className="min-w-[100px]"
          >
            <KeenIcon icon="cross" className="size-4 mr-1" />
            취소
          </Button>
          <Button
            onClick={handleRefundRequest}
            disabled={isProcessing || !allRefundable || !refundReason.trim()}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white min-w-[120px]"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                처리중...
              </>
            ) : (
              <>
                <KeenIcon icon="check" className="size-4 mr-1" />
                환불 신청
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};