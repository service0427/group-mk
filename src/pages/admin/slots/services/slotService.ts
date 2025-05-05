import { supabase } from '@/supabase';
import { Slot } from '../components/types';

/**
 * 슬롯 승인 서비스
 * RPC 대신 클라이언트 측에서 직접 테이블 업데이트 수행
 */

// 슬롯 승인 처리 함수
export const approveSlot = async (
  slotId: string,
  adminUserId: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    // 1. 슬롯 정보 조회
    const { data: slotData, error: slotError } = await supabase
      .from('slots')
      .select('*, campaigns(*)')
      .eq('id', slotId)
      .single();

    if (slotError) {
      console.error('슬롯 정보 조회 실패:', slotError.message);
      throw new Error('슬롯 정보 조회 실패');
    }

    if (!slotData) {
      throw new Error('해당 슬롯이 존재하지 않습니다.');
    }

    if (slotData.status !== 'pending') {
      throw new Error(`대기 중인 슬롯만 승인할 수 있습니다. (현재 상태: ${slotData.status})`);
    }

    // 단가 확인 (캠페인 데이터에서)
    const campaignData = slotData.campaigns;
    const unitPrice = parseFloat(String(campaignData?.unit_price || 0));
    
    if (unitPrice <= 0) {
      throw new Error('유효하지 않은 캠페인 단가입니다.');
    }

    // 2. 중간테이블에서 관리자(승일)에게 금액 이체
    
    // 관리자(승일) 잔액 조회
    const { data: adminBalanceData, error: adminBalanceError } = await supabase
      .from('user_balances')
      .select('paid_balance, free_balance, total_balance')
      .eq('user_id', adminUserId)
      .maybeSingle();

    if (adminBalanceError && adminBalanceError.code !== 'PGRST116') {
      console.error('관리자 잔액 조회 실패:', adminBalanceError.message);
      throw new Error('관리자 잔액 조회 실패');
    }

    const now = new Date().toISOString();

    // 관리자 계정이 없으면 새로 생성
    if (!adminBalanceData) {
      const { error: createBalanceError } = await supabase
        .from('user_balances')
        .insert({
          user_id: adminUserId,
          paid_balance: unitPrice, // 승인된 금액을 paid_balance에 추가
          free_balance: 0,
          total_balance: unitPrice,
          created_at: now,
          updated_at: now
        });

      if (createBalanceError) {
        console.error('관리자 잔액 생성 실패:', createBalanceError.message);
        throw new Error('관리자 잔액 생성 실패');
      }
    } else {
      // 기존 관리자 계정 잔액 업데이트
      const newPaidBalance = parseFloat(String(adminBalanceData.paid_balance || 0)) + unitPrice;
      const newTotalBalance = newPaidBalance + parseFloat(String(adminBalanceData.free_balance || 0));

      const { error: updateBalanceError } = await supabase
        .from('user_balances')
        .update({
          paid_balance: newPaidBalance,
          total_balance: newTotalBalance,
          updated_at: now
        })
        .eq('user_id', adminUserId);

      if (updateBalanceError) {
        console.error('관리자 잔액 업데이트 실패:', updateBalanceError.message);
        throw new Error('관리자 잔액 업데이트 실패');
      }
    }

    // 캐시 이체 내역 기록 (user_cash_history 테이블 사용)
    const { error: transferError } = await supabase
      .from('user_cash_history')
      .insert({
        user_id: adminUserId,
        amount: unitPrice, // 양수로 표시하여 입금 표시
        transaction_type: 'work', // work 타입으로 관리자에게 정산
        reference_id: slotId,
        description: `슬롯 승인 수익: [${slotData.input_data?.productName || '상품'}] (사용자ID: ${slotData.user_id}, 단가: ${unitPrice}원)`,
        transaction_at: now,
        balance_type: null // 관리자 수익은 캐시 타입 구분 필요 없음
      });

    if (transferError) {
      console.error('캐시 이체 내역 저장 실패:', transferError.message);
      // 비치명적 오류로 처리
    }

    // 3. 슬롯 상태 업데이트 (processor_id 필드 제거 - slots 테이블에 없음)
    const { data: updatedSlot, error: updateError } = await supabase
      .from('slots')
      .update({
        status: 'approved',
        processed_at: now
      })
      .eq('id', slotId)
      .select();

    if (updateError) {
      console.error('슬롯 업데이트 실패:', updateError.message);
      throw updateError;
    }

    // 4. 승인 기록 저장 (필요한 경우)
    try {
      await supabase
        .from('admin_action_logs')
        .insert({
          admin_id: adminUserId,
          action_type: 'slot_approval',
          target_id: slotId,
          details: {
            previous_status: slotData.status,
            new_status: 'approved',
            amount_transferred: unitPrice
          },
          created_at: now
        });
    } catch (logError) {
      console.warn('승인 로그 저장 실패 (비치명적):', logError);
      // 로그 저장 실패는 전체 프로세스 실패로 취급하지 않음
    }
    
    // 슬롯 이력 로그에 approve 액션 추가
    try {
      // 결제 정보 확인 (slot_pending_balances 테이블에서)
      const { data: pendingBalance, error: pendingBalanceError } = await supabase
        .from('slot_pending_balances')
        .select('amount, status, notes')
        .eq('slot_id', slotId)
        .single();
        
      // 결제 정보 처리
      let paymentDetails = null;
      if (!pendingBalanceError && pendingBalance?.notes) {
        try {
          const notesObj = JSON.parse(pendingBalance.notes);
          if (notesObj.payment_details) {
            paymentDetails = notesObj.payment_details;
          }
        } catch (e) {
          console.warn('결제 정보 파싱 실패:', e);
        }
      }
      
      // 이력 로그 저장
      await supabase
        .from('slot_history_logs')
        .insert({
          slot_id: slotId,
          action: 'approve',
          old_status: slotData.status,
          new_status: 'approved',
          user_id: adminUserId,
          details: {
            processed_at: now,
            amount: unitPrice,
            user_id: slotData.user_id,
            product_id: slotData.product_id,
            product_name: slotData.input_data?.productName || '상품',
            payment_details: paymentDetails || 'Unknown'
          },
          created_at: now
        });
    } catch (historyLogError) {
      console.warn('슬롯 이력 로그 저장 실패 (비치명적):', historyLogError);
      // 이력 로그 저장 실패는 전체 프로세스 실패로 취급하지 않음
    }

    // 5. 알림 생성
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: slotData.user_id,
          type: 'slot_approved',
          title: '슬롯 승인 완료',
          message: `귀하의 슬롯이 승인되었습니다.`,
          link: `/myinfo/services`,
          reference_id: slotId,
          status: 'unread',
          created_at: now
        });
    } catch (notifyError) {
      console.warn('알림 생성 실패 (비치명적):', notifyError);
      // 알림 생성 실패는 전체 프로세스 실패로 취급하지 않음
    }

    return {
      success: true,
      message: '슬롯이 성공적으로 승인되었습니다.',
      data: updatedSlot
    };
  } catch (err: any) {
    console.error('슬롯 승인 처리 오류:', err);
    return {
      success: false,
      message: err.message || '슬롯 승인 중 오류가 발생했습니다.'
    };
  }
};

// 슬롯 반려 처리 함수
export const rejectSlot = async (
  slotId: string,
  adminUserId: string,
  rejectionReason: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    if (!rejectionReason.trim()) {
      throw new Error('반려 사유를 입력해주세요.');
    }

    // 1. 슬롯 정보 조회
    const { data: slotData, error: slotError } = await supabase
      .from('slots')
      .select('*, campaigns(*)')
      .eq('id', slotId)
      .single();

    if (slotError) {
      console.error('슬롯 정보 조회 실패:', slotError.message);
      throw new Error('슬롯 정보 조회 실패');
    }

    if (!slotData) {
      throw new Error('해당 슬롯이 존재하지 않습니다.');
    }

    if (slotData.status !== 'pending') {
      throw new Error(`대기 중인 슬롯만 반려할 수 있습니다. (현재 상태: ${slotData.status})`);
    }

    // 단가 확인 (캠페인 데이터에서)
    const campaignData = slotData.campaigns;
    const unitPrice = parseFloat(String(campaignData?.unit_price || 0));
    
    if (unitPrice <= 0) {
      throw new Error('유효하지 않은 캠페인 단가입니다.');
    }

    const now = new Date().toISOString();

    // 1.5 결제 정보 확인 (slot_pending_balances 테이블에서)
    const { data: pendingBalance, error: pendingBalanceError } = await supabase
      .from('slot_pending_balances')
      .select('amount, status, notes')
      .eq('slot_id', slotId)
      .single();
      
    if (pendingBalanceError) {
      console.error('보류 잔액 조회 실패:', pendingBalanceError.message);
      throw new Error('거래 정보를 찾을 수 없습니다.');
    }
    
    if (pendingBalance.status !== 'pending') {
      throw new Error('이미 처리된 거래입니다.');
    }
    
    // 결제 시 저장된 세부 정보 가져오기
    let paymentDetails = null;
    let freeBalanceUsed = 0;
    let paidBalanceUsed = 0;
    
    try {
      if (pendingBalance.notes) {
        const notesObj = JSON.parse(pendingBalance.notes);
        if (notesObj.payment_details) {
          paymentDetails = notesObj.payment_details;
          freeBalanceUsed = parseFloat(String(paymentDetails.free_balance_used || 0));
          paidBalanceUsed = parseFloat(String(paymentDetails.paid_balance_used || 0));
        }
      }
    } catch (e) {
      console.warn('결제 정보 파싱 실패, 기본 환불 방식 사용:', e);
    }

    // 2. 사용자에게 캐시 환불 처리
    // 사용자 잔액 정보 조회
    const { data: userBalanceData, error: userBalanceError } = await supabase
      .from('user_balances')
      .select('paid_balance, free_balance, total_balance')
      .eq('user_id', slotData.user_id)
      .maybeSingle();

    if (userBalanceError) {
      console.error('사용자 잔액 조회 실패:', userBalanceError.message);
      throw new Error('사용자 잔액 조회 실패');
    }

    if (!userBalanceData) {
      throw new Error('사용자 잔액 정보가 없습니다.');
    }

    // 사용자 현재 잔액
    const currentPaidBalance = parseFloat(String(userBalanceData.paid_balance || 0));
    const currentFreeBalance = parseFloat(String(userBalanceData.free_balance || 0));
    
    // 원래 차감된 잔액 종류에 맞게 환불 진행
    let updatedPaidBalance = currentPaidBalance;
    let updatedFreeBalance = currentFreeBalance;
    
    // 결제 정보가 있으면 원래 차감된 대로 환불, 없으면 무료 캐시로 환불
    if (paymentDetails) {
      updatedPaidBalance += paidBalanceUsed;
      updatedFreeBalance += freeBalanceUsed;
      console.log(`결제 정보 파싱 성공: 무료 캐시 ${freeBalanceUsed}원, 유료 캐시 ${paidBalanceUsed}원 환불`);
    } else {
      // 기존 로직 유지 (무료 캐시로 환불)
      updatedFreeBalance += unitPrice;
      console.log(`결제 정보 없음: 전액 무료 캐시로 환불 (${unitPrice}원)`);
    }

    // 사용자 잔액 업데이트
    const { error: updateBalanceError } = await supabase
      .from('user_balances')
      .update({
        paid_balance: updatedPaidBalance,
        free_balance: updatedFreeBalance,
        total_balance: updatedPaidBalance + updatedFreeBalance,
        updated_at: now
      })
      .eq('user_id', slotData.user_id);

    if (updateBalanceError) {
      console.error('사용자 잔액 업데이트 실패:', updateBalanceError.message);
      throw new Error('환불 처리 중 오류가 발생했습니다.');
    }

    // 환불 내역 기록 (user_cash_history 테이블 사용)
    const { error: refundError } = await supabase
      .from('user_cash_history')
      .insert({
        user_id: slotData.user_id,
        amount: unitPrice, // 양수로 표시하여 환불 표시
        transaction_type: 'refund', // refund 타입으로 사용자에게 환불
        reference_id: slotId,
        description: `슬롯 반려 환불: [${slotData.input_data?.productName || '상품'}]`,
        transaction_at: now,
        user_agent: `Rejection reason: ${rejectionReason}`, // user_agent 필드에 추가 정보 저장
        balance_type: null // 환불이지만 타입 구분이 필요 없는 경우 null
      });

    if (refundError) {
      console.error('환불 내역 저장 실패:', refundError.message);
      // 비치명적 오류로 처리
    }

    // 3. 슬롯 상태 업데이트 (processor_id 필드 제거 - slots 테이블에 없음)
    const { data: updatedSlot, error: updateError } = await supabase
      .from('slots')
      .update({
        status: 'rejected',
        processed_at: now,
        rejection_reason: rejectionReason
      })
      .eq('id', slotId)
      .select();

    if (updateError) {
      console.error('슬롯 업데이트 실패:', updateError.message);
      throw updateError;
    }

    // 4. 반려 기록 저장 (필요한 경우)
    try {
      await supabase
        .from('admin_action_logs')
        .insert({
          admin_id: adminUserId,
          action_type: 'slot_rejection',
          target_id: slotId,
          details: {
            previous_status: slotData.status,
            new_status: 'rejected',
            rejection_reason: rejectionReason,
            amount_refunded: unitPrice
          },
          created_at: now
        });
    } catch (logError) {
      console.warn('반려 로그 저장 실패 (비치명적):', logError);
      // 로그 저장 실패는 전체 프로세스 실패로 취급하지 않음
    }
    
    // 슬롯 이력 로그에 reject 액션 추가
    try {
      await supabase
        .from('slot_history_logs')
        .insert({
          slot_id: slotId,
          action: 'reject',
          old_status: slotData.status,
          new_status: 'rejected',
          user_id: adminUserId,
          details: {
            rejection_reason: rejectionReason,
            processed_at: now,
            refund_details: {
              free_balance_used: freeBalanceUsed,
              paid_balance_used: paidBalanceUsed,
              total_amount: unitPrice,
              free_balance_before: currentFreeBalance,
              free_balance_after: updatedFreeBalance,
              paid_balance_before: currentPaidBalance,
              paid_balance_after: updatedPaidBalance
            },
            payment_details: paymentDetails || 'Unknown'
          },
          created_at: now
        });
    } catch (historyLogError) {
      console.warn('슬롯 이력 로그 저장 실패 (비치명적):', historyLogError);
      // 이력 로그 저장 실패는 전체 프로세스 실패로 취급하지 않음
    }

    // 5. 알림 생성
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: slotData.user_id,
          type: 'slot_rejected',
          title: '슬롯 반려 및 환불 완료',
          message: `귀하의 슬롯이 다음 사유로 반려되었습니다: ${rejectionReason}. ${unitPrice.toLocaleString()}원이 환불되었습니다.`,
          link: `/myinfo/services`,
          reference_id: slotId,
          status: 'unread',
          created_at: now
        });
    } catch (notifyError) {
      console.warn('알림 생성 실패 (비치명적):', notifyError);
      // 알림 생성 실패는 전체 프로세스 실패로 취급하지 않음
    }

    return {
      success: true,
      message: `슬롯이 성공적으로 반려되었으며, 사용자에게 ${unitPrice.toLocaleString()}원이 환불되었습니다.`,
      data: updatedSlot
    };
  } catch (err: any) {
    console.error('슬롯 반려 처리 오류:', err);
    return {
      success: false,
      message: err.message || '슬롯 반려 중 오류가 발생했습니다.'
    };
  }
};

// 슬롯 메모 저장 함수
export const updateSlotMemo = async (
  slotId: string,
  memo: string,
  adminUserId: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    // 1. 슬롯 정보 조회
    const { data: slotData, error: slotError } = await supabase
      .from('slots')
      .select('mat_reason')
      .eq('id', slotId)
      .single();

    if (slotError && slotError.code !== 'PGRST116') { // PGRST116: not found
      console.error('슬롯 정보 조회 실패:', slotError.message);
      throw new Error('슬롯 정보 조회 실패');
    }

    const oldMemo = slotData?.mat_reason || '';

    // 2. 슬롯 메모 업데이트
    const { data: updatedSlot, error: updateError } = await supabase
      .from('slots')
      .update({ mat_reason: memo })
      .eq('id', slotId)
      .select();

    if (updateError) {
      console.error('슬롯 메모 업데이트 실패:', updateError.message);
      throw updateError;
    }

    // 3. 메모 변경 로그 (필요한 경우)
    try {
      await supabase
        .from('admin_action_logs')
        .insert({
          admin_id: adminUserId,
          action_type: 'slot_memo_update',
          target_id: slotId,
          details: {
            old_memo: oldMemo,
            new_memo: memo
          },
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.warn('메모 변경 로그 저장 실패 (비치명적):', logError);
    }
    
    // 슬롯 이력 로그에 메모 변경 액션 추가
    try {
      // 슬롯 정보 추가 조회
      const { data: slotFullData, error: slotFullError } = await supabase
        .from('slots')
        .select('status, input_data')
        .eq('id', slotId)
        .single();
      
      if (!slotFullError) {
        await supabase
          .from('slot_history_logs')
          .insert({
            slot_id: slotId,
            action: 'memo_update',
            old_status: slotFullData.status,
            new_status: slotFullData.status, // 상태 변경 없음
            user_id: adminUserId,
            details: {
              old_memo: oldMemo,
              new_memo: memo,
              timestamp: new Date().toISOString(),
              product_name: slotFullData.input_data?.productName || '상품'
            },
            created_at: new Date().toISOString()
          });
      }
    } catch (historyLogError) {
      console.warn('슬롯 메모 이력 로그 저장 실패 (비치명적):', historyLogError);
      // 이력 로그 저장 실패는 전체 프로세스 실패로 취급하지 않음
    }

    return {
      success: true,
      message: '메모가 성공적으로 저장되었습니다.',
      data: updatedSlot
    };
  } catch (err: any) {
    console.error('슬롯 메모 저장 오류:', err);
    return {
      success: false,
      message: err.message || '메모 저장 중 오류가 발생했습니다.'
    };
  }
};

// 슬롯 삽입 함수
export const createSlot = async (
  slotData: {
    mat_id: string;
    product_id: number;
    user_id: string;
    input_data: any;
  }
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    // 사용자 잔액 확인
    const { data: userBalanceData, error: balanceError } = await supabase
      .from('user_balances')
      .select('*')
      .eq('user_id', slotData.user_id)
      .single();

    // 필요한 값들 가져오기
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select('unit_price')
      .eq('id', slotData.product_id)
      .single();

    if (campaignError) {
      throw new Error('캠페인 정보를 찾을 수 없습니다.');
    }

    const unitPrice = parseFloat(String(campaignData.unit_price || 0));

    // 잔액 확인
    if (balanceError && balanceError.code === 'PGRST116') { // not found
      throw new Error('잔액 정보가 없습니다. 먼저 캐시를 충전해주세요.');
    } else if (balanceError) {
      throw new Error('잔액 확인 중 오류가 발생했습니다.');
    }

    // 잔액 부족 확인
    const paidBalance = parseFloat(String(userBalanceData.paid_balance || 0));
    const freeBalance = parseFloat(String(userBalanceData.free_balance || 0));
    const totalBalance = paidBalance + freeBalance;

    if (totalBalance < unitPrice) {
      throw new Error(`잔액이 부족합니다. 현재 잔액: ${totalBalance.toLocaleString()}원, 필요 금액: ${unitPrice.toLocaleString()}원`);
    }

    // 슬롯 생성
    const now = new Date().toISOString();
    const { data: newSlot, error: insertError } = await supabase
      .from('slots')
      .insert({
        ...slotData,
        status: 'pending',
        created_at: now,
        updated_at: now
      })
      .select();

    if (insertError) {
      throw insertError;
    }

    // 결제 처리 (free_balance부터 차감)
    let remainingAmount = unitPrice;
    let updatedFreeBalance = freeBalance;
    let updatedPaidBalance = paidBalance;

    if (freeBalance >= remainingAmount) {
      updatedFreeBalance -= remainingAmount;
      remainingAmount = 0;
    } else {
      remainingAmount -= freeBalance;
      updatedFreeBalance = 0;
      updatedPaidBalance -= remainingAmount;
    }

    // 잔액 업데이트
    const { error: updateBalanceError } = await supabase
      .from('user_balances')
      .update({
        free_balance: updatedFreeBalance,
        paid_balance: updatedPaidBalance,
        updated_at: now
      })
      .eq('user_id', slotData.user_id);

    if (updateBalanceError) {
      console.error('잔액 업데이트 실패:', updateBalanceError);
      // 실패 시 롤백을 위한 추가 로직 필요
    }

    // 결제 내역 기록 (user_cash_history 테이블 사용)
    // 무료 캐시와 유료 캐시를 모두 사용한 경우 (혼합)
    let freeUsed = 0;
    let paidUsed = 0;
    
    if (freeBalance > 0 && freeBalance < unitPrice) {
      freeUsed = freeBalance;
      paidUsed = unitPrice - freeBalance;
      
      // 무료 캐시 사용 내역
      await supabase
        .from('user_cash_history')
        .insert({
          user_id: slotData.user_id,
          amount: -freeUsed, // 음수로 표시하여 차감 표시
          transaction_type: 'purchase',
          reference_id: newSlot[0].id,
          description: `슬롯 구매(무료 캐시): ${slotData.input_data.productName || '상품'}`,
          transaction_at: now,
          mat_id: slotData.mat_id,
          balance_type: 'free' // 무료 캐시 부분
        });
        
      // 유료 캐시 사용 내역
      await supabase
        .from('user_cash_history')
        .insert({
          user_id: slotData.user_id,
          amount: -paidUsed, // 음수로 표시하여 차감 표시
          transaction_type: 'purchase',
          reference_id: newSlot[0].id,
          description: `슬롯 구매(유료 캐시): ${slotData.input_data.productName || '상품'}`,
          transaction_at: now,
          mat_id: slotData.mat_id,
          balance_type: 'paid' // 유료 캐시 부분
        });
    }
    // 무료 캐시만 사용하거나 유료 캐시만 사용한 경우
    else {
      if (freeBalance >= unitPrice) {
        freeUsed = unitPrice;
      } else {
        paidUsed = unitPrice;
      }
      
      await supabase
        .from('user_cash_history')
        .insert({
          user_id: slotData.user_id,
          amount: -unitPrice, // 음수로 표시하여 차감 표시
          transaction_type: 'purchase', // purchase 타입으로 차감
          reference_id: newSlot[0].id,
          description: `슬롯 구매(${freeBalance >= unitPrice ? '무료' : '유료'} 캐시): ${slotData.input_data.productName || '상품'}`,
          transaction_at: now,
          mat_id: slotData.mat_id, // 총판 ID 저장
          balance_type: freeBalance >= unitPrice ? 'free' : 'paid' // 구매 거래 캐시 타입 구분
        });
    }
    
    // 슬롯 상태 변경 기록 (slot_history_logs)
    await supabase
      .from('slot_history_logs')
      .insert({
        slot_id: newSlot[0].id,
        action: 'create',
        old_status: null, // 최초 생성이므로 이전 상태 없음
        new_status: 'pending',
        user_id: slotData.user_id, // 변경한 사용자
        details: {
          product_id: slotData.product_id,
          product_name: slotData.input_data?.productName || '상품',
          unit_price: unitPrice,
          payment_details: {
            free_balance_used: freeUsed,
            paid_balance_used: paidUsed,
            total_amount: unitPrice
          },
          input_data: slotData.input_data
        },
        created_at: now
      });

    return {
      success: true,
      message: '슬롯이 성공적으로 생성되었습니다.',
      data: newSlot
    };
  } catch (err: any) {
    console.error('슬롯 생성 오류:', err);
    return {
      success: false,
      message: err.message || '슬롯 생성 중 오류가 발생했습니다.'
    };
  }
};

// 슬롯 리스트 가져오기 함수
export const getSlotList = async (
  filters: {
    mat_id?: string | string[];
    user_id?: string;
    status?: string;
    service_type?: string;
    dateFrom?: string;
    dateTo?: string;
    searchTerm?: string;
    page?: number;
    limit?: number;
  }
): Promise<{
  success: boolean;
  message: string;
  data?: Slot[];
  count?: number;
}> => {
  try {
    // 기본 페이지네이션 값
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 쿼리 빌드
    let query = supabase
      .from('slots')
      .select(`
        id,
        mat_id,
        user_id,
        status,
        created_at,
        submitted_at,
        processed_at,
        input_data,
        rejection_reason,
        user_reason,
        mat_reason,
        updated_at,
        users:user_id (
          id,
          full_name,
          email
        )
      `, { count: 'exact' });

    // 필터 적용
    if (filters.mat_id) {
      if (Array.isArray(filters.mat_id)) {
        query = query.in('mat_id', filters.mat_id);
      } else {
        query = query.eq('mat_id', filters.mat_id);
      }
    }

    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    // 날짜 필터
    if (filters.dateFrom) {
      query = query.gte('created_at', `${filters.dateFrom}T00:00:00`);
    }

    if (filters.dateTo) {
      query = query.lte('created_at', `${filters.dateTo}T23:59:59`);
    }

    // 검색어 필터
    if (filters.searchTerm) {
      query = query.or(`users.full_name.ilike.%${filters.searchTerm}%,users.email.ilike.%${filters.searchTerm}%`);

      // input_data 내부 필드 검색은 클라이언트에서 추가 필터링 필요
    }

    // 페이지네이션 및 정렬
    query = query
      .order('created_at', { ascending: false })
      .range(from, to);

    // 쿼리 실행
    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // 데이터 변환
    const formattedSlots = data.map(slot => {
      const usersArray = slot.users as any[];
      const user = usersArray && usersArray.length > 0 ? {
        id: usersArray[0].id,
        full_name: usersArray[0].full_name,
        email: usersArray[0].email
      } : undefined;

      // users 필드 제거 후 user 필드 추가
      const { users, ...slotWithoutUsers } = slot;
      return { ...slotWithoutUsers, user } as Slot;
    });

    return {
      success: true,
      message: '슬롯 목록을 성공적으로 가져왔습니다.',
      data: formattedSlots,
      count
    };
  } catch (err: any) {
    console.error('슬롯 목록 조회 오류:', err);
    return {
      success: false,
      message: err.message || '슬롯 목록 조회 중 오류가 발생했습니다.'
    };
  }
};

export default {
  approveSlot,
  rejectSlot,
  updateSlotMemo,
  createSlot,
  getSlotList
};