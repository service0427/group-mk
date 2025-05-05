import { supabase } from '@/supabase';

/**
 * 잔액 변동 감사 로그 기록 유틸리티 함수
 */
export const logBalanceChange = async ({
  userId,
  changeType,
  oldPaidBalance,
  newPaidBalance,
  oldFreeBalance,
  newFreeBalance,
  changeAmount,
  details
}: {
  userId: string;
  changeType: 'increase' | 'decrease' | 'create' | 'delete' | 'no_change';
  oldPaidBalance: number;
  newPaidBalance: number;
  oldFreeBalance: number;
  newFreeBalance: number;
  changeAmount: number;
  details?: Record<string, any>;
}): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('balance_audit_log')
      .insert({
        user_id: userId,
        change_type: changeType,
        old_paid_balance: oldPaidBalance,
        new_paid_balance: newPaidBalance,
        old_free_balance: oldFreeBalance,
        new_free_balance: newFreeBalance,
        change_amount: changeAmount,
        details: details || {},
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('잔액 감사 로그 기록 실패:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('잔액 감사 로그 기록 중 오류 발생:', err);
    return false;
  }
};

/**
 * 슬롯 상태 변경 이력 기록 유틸리티 함수
 */
export const logSlotStatusChange = async ({
  slotId,
  userId,
  oldStatus,
  newStatus,
  action,
  details
}: {
  slotId: string;
  userId: string;
  oldStatus: string | null;
  newStatus: string;
  action: 'create' | 'approve' | 'reject' | 'cancel' | 'complete' | 'modify';
  details?: Record<string, any>;
}): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('slot_history_logs')
      .insert({
        slot_id: slotId,
        user_id: userId, // 변경자 ID
        old_status: oldStatus,
        new_status: newStatus,
        action: action,
        details: details || {},
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('슬롯 상태 변경 이력 기록 실패:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('슬롯 상태 변경 이력 기록 중 오류 발생:', err);
    return false;
  }
};

/**
 * 슬롯 보류 잔액 생성 유틸리티 함수
 */
export const createPendingBalance = async ({
  slotId,
  userId,
  productId,
  amount
}: {
  slotId: string;
  userId: string;
  productId: number;
  amount: number;
}): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('slot_pending_balances')
      .insert({
        slot_id: slotId,
        user_id: userId,
        product_id: productId,
        amount: amount,
        status: 'pending',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('보류 잔액 생성 실패:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('보류 잔액 생성 중 오류 발생:', err);
    return false;
  }
};

/**
 * 슬롯 보류 잔액 상태 업데이트 유틸리티 함수
 */
export const updatePendingBalanceStatus = async ({
  slotId,
  status,
  processorId,
  notes
}: {
  slotId: string;
  status: 'approved' | 'rejected' | 'cancelled';
  processorId: string;
  notes?: string;
}): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('slot_pending_balances')
      .update({
        status: status,
        processor_id: processorId, // slot_pending_balances 테이블에는 processor_id 필드가 있음
        notes: notes || null,
        processed_at: new Date().toISOString()
      })
      .eq('slot_id', slotId);

    if (error) {
      console.error('보류 잔액 상태 업데이트 실패:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('보류 잔액 상태 업데이트 중 오류 발생:', err);
    return false;
  }
};

export default {
  logBalanceChange,
  logSlotStatusChange,
  createPendingBalance,
  updatePendingBalanceStatus
};