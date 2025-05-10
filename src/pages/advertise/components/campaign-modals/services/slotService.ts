import { supabase } from '@/supabase';

// 슬롯 등록 서비스 (사용자 측)
// RPC 대신 클라이언트에서 직접 구현한 버전

/**
 * 슬롯 등록 함수
 * 트리거 로직을 클라이언트 측에서 구현
 */
export const registerSlot = async (
  userId: string,
  campaignId: number,
  matId: string, // 총판 ID
  inputData: any
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    // 1. 캠페인 정보 확인 (유효성 및 상태 체크)
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select('unit_price, status')
      .eq('id', campaignId)
      .single();

    if (campaignError) {
      console.error('캠페인 정보 조회 실패:', campaignError.message);
      throw new Error('캠페인 정보를 찾을 수 없습니다.');
    }

    // 캠페인 상태 체크
    if (campaignData.status !== 'active') {
      throw new Error(`이 캠페인은 현재 ${campaignData.status} 상태로 슬롯을 등록할 수 없습니다.`);
    }

    // 단가 가져오기
    const unitPrice = parseFloat(String(campaignData.unit_price || 0));
    if (unitPrice <= 0) {
      throw new Error('유효하지 않은 캠페인 단가입니다.');
    }

    // 2. 사용자 잔액 확인
    const { data: balanceData, error: balanceError } = await supabase
      .from('user_balances')
      .select('paid_balance, free_balance')
      .eq('user_id', userId)
      .single();

    if (balanceError) {
      if (balanceError.code === 'PGRST116') { // not found
        throw new Error('잔액 정보가 없습니다. 먼저 캐시를 충전해주세요.');
      }
      throw new Error('잔액 조회 중 오류가 발생했습니다.');
    }

    // 잔액 계산
    const paidBalance = parseFloat(String(balanceData.paid_balance || 0));
    const freeBalance = parseFloat(String(balanceData.free_balance || 0));
    const totalBalance = paidBalance + freeBalance;

    // 잔액 부족 체크
    if (totalBalance < unitPrice) {
      throw new Error(`잔액이 부족합니다. 현재 잔액: ${totalBalance.toLocaleString()}원, 필요 금액: ${unitPrice.toLocaleString()}원`);
    }

    // 3. 슬롯 생성 트랜잭션 시작
    const now = new Date().toISOString();

    // 슬롯 생성
    const { data: slotData, error: slotError } = await supabase
      .from('slots')
      .insert({
        mat_id: matId, // 총판 ID
        product_id: campaignId,
        user_id: userId,
        status: 'pending', // 보류 상태로 생성
        input_data: inputData,
        created_at: now,
        updated_at: now
      })
      .select();

    if (slotError) {
      console.error('슬롯 생성 실패:', slotError.message);
      throw new Error('슬롯 생성에 실패했습니다.');
    }

    // 5. 잔액 차감 (free_balance부터 차감)
    let remainingAmount = unitPrice;
    let updatedFreeBalance = freeBalance;
    let updatedPaidBalance = paidBalance;
    let freeBalanceUsed = 0; // 무료 캐시 사용 금액
    let paidBalanceUsed = 0; // 유료 캐시 사용 금액

    if (freeBalance >= remainingAmount) {
      updatedFreeBalance -= remainingAmount;
      freeBalanceUsed = remainingAmount; // 무료 캐시만 사용
      remainingAmount = 0;
    } else {
      freeBalanceUsed = freeBalance; // 무료 캐시 모두 사용
      remainingAmount -= freeBalance;
      updatedFreeBalance = 0;
      updatedPaidBalance -= remainingAmount;
      paidBalanceUsed = remainingAmount; // 나머지는 유료 캐시 사용
    }

    // 잔액 업데이트 (total_balance도 함께 업데이트)
    const updatedTotalBalance = updatedFreeBalance + updatedPaidBalance;
    const { error: updateBalanceError } = await supabase
      .from('user_balances')
      .update({
        free_balance: updatedFreeBalance,
        paid_balance: updatedPaidBalance,
        total_balance: updatedTotalBalance, // total_balance 추가
        updated_at: now
      })
      .eq('user_id', userId);

    if (updateBalanceError) {
      console.error('잔액 업데이트 실패:', updateBalanceError.message);
      // 오류 시 슬롯 삭제하여 롤백 시도
      await supabase.from('slots').delete().eq('id', slotData[0].id);
      throw new Error('결제 처리 중 오류가 발생했습니다.');
    }

    // 4. 보류 잔액 관리 (slot_pending_balances) - 결제 내역 정보 포함
    const { error: pendingBalanceError } = await supabase
      .from('slot_pending_balances')
      .insert({
        slot_id: slotData[0].id,
        user_id: userId,
        product_id: campaignId,
        amount: unitPrice,
        status: 'pending',
        created_at: now,
        notes: JSON.stringify({
          payment_details: {
            free_balance_used: freeBalanceUsed,
            paid_balance_used: paidBalanceUsed,
            total_amount: unitPrice,
            old_free_balance: freeBalance,
            new_free_balance: updatedFreeBalance,
            old_paid_balance: paidBalance,
            new_paid_balance: updatedPaidBalance
          }
        })
      });

    if (pendingBalanceError) {
      console.error('보류 잔액 기록 실패:', pendingBalanceError.message);
      // 오류 시 슬롯 삭제하여 롤백 시도, 이미 차감된 잔액 복구 필요
      try {
        await supabase
          .from('user_balances')
          .update({
            free_balance: freeBalance,
            paid_balance: paidBalance,
            total_balance: freeBalance + paidBalance,
            updated_at: now
          })
          .eq('user_id', userId);
      } catch (rollbackError) {
        console.error('잔액 롤백 실패:', rollbackError);
      }
      
      await supabase.from('slots').delete().eq('id', slotData[0].id);
      throw new Error('거래 처리 중 오류가 발생했습니다.');
    }

    // 6. 거래 내역 기록 (user_cash_history 테이블 사용)
    // 무료 캐시와 유료 캐시를 모두 사용한 경우, 각각 별도의 거래 내역으로 기록
    if (freeBalanceUsed > 0 && paidBalanceUsed > 0) {
      // 무료 캐시 사용 내역 기록
      const { error: freeTransactionError } = await supabase
        .from('user_cash_history')
        .insert({
          user_id: userId,
          amount: -freeBalanceUsed, // 무료 캐시 사용 금액만 기록
          transaction_type: 'purchase',
          reference_id: slotData[0].id,
          description: `슬롯 구매(무료 캐시): ${inputData.productName || '상품'} (캠페인ID: ${campaignId})`,
          transaction_at: now,
          mat_id: matId,
          balance_type: 'free' // 무료 캐시 사용
        });
        
      if (freeTransactionError) {
        console.error('무료 캐시 사용 거래 내역 기록 실패:', freeTransactionError.message);
      }
      
      // 유료 캐시 사용 내역 기록
      const { error: paidTransactionError } = await supabase
        .from('user_cash_history')
        .insert({
          user_id: userId,
          amount: -paidBalanceUsed, // 유료 캐시 사용 금액만 기록
          transaction_type: 'purchase',
          reference_id: slotData[0].id,
          description: `슬롯 구매(유료 캐시): ${inputData.productName || '상품'} (캠페인ID: ${campaignId})`,
          transaction_at: now,
          mat_id: matId,
          balance_type: 'paid' // 유료 캐시 사용
        });
        
      if (paidTransactionError) {
        console.error('유료 캐시 사용 거래 내역 기록 실패:', paidTransactionError.message);
      }
    }
    // 무료 캐시만 사용하거나 유료 캐시만 사용한 경우
    else {
      const { error: transactionError } = await supabase
        .from('user_cash_history')
        .insert({
          user_id: userId,
          amount: -unitPrice, // 음수로 입력하여 차감 표시
          transaction_type: 'purchase', // purchase 타입으로 차감
          reference_id: slotData[0].id,
          description: `슬롯 구매(${freeBalanceUsed > 0 ? '무료' : '유료'} 캐시): ${inputData.productName || '상품'} (캠페인ID: ${campaignId})`,
          transaction_at: now,
          mat_id: matId, // 총판 ID 저장
          balance_type: freeBalanceUsed > 0 ? 'free' : 'paid' // 무료 또는 유료 캐시 사용
        });

      if (transactionError) {
        console.error('거래 내역 기록 실패:', transactionError.message);
        // 거래 내역 기록 실패는 전체 과정을 실패로 처리하지 않음
      }
    }

    // 7. 잔액 변동 감사 로그 (balance_audit_log)
    const { error: auditLogError } = await supabase
      .from('balance_audit_log')
      .insert({
        user_id: userId,
        change_type: 'decrease',
        old_paid_balance: paidBalance,
        new_paid_balance: updatedPaidBalance,
        old_free_balance: freeBalance,
        new_free_balance: updatedFreeBalance,
        change_amount: -unitPrice,
        details: {
          operation: 'slot_purchase',
          slot_id: slotData[0].id,
          product_id: campaignId,
          product_name: inputData.productName || '상품',
          unit_price: unitPrice,
          free_balance_used: freeBalanceUsed,
          paid_balance_used: paidBalanceUsed
        },
        created_at: now
      });

    if (auditLogError) {
      console.error('잔액 감사 로그 기록 실패:', auditLogError.message);
      // 감사 로그 실패는 전체 과정을 실패로 처리하지 않음
    }
    
    // 8. 슬롯 상태 변경 기록 (slot_history_logs)
    const { error: historyLogError } = await supabase
      .from('slot_history_logs')
      .insert({
        slot_id: slotData[0].id,
        action: 'create',
        old_status: null, // 최초 생성이므로 이전 상태 없음
        new_status: 'pending',
        user_id: userId, // 변경한 사용자
        details: {
          product_id: campaignId,
          product_name: inputData.productName || '상품',
          unit_price: unitPrice,
          payment_details: {
            free_balance_used: freeBalanceUsed,
            paid_balance_used: paidBalanceUsed,
            old_free_balance: freeBalance,
            new_free_balance: updatedFreeBalance,
            old_paid_balance: paidBalance,
            new_paid_balance: updatedPaidBalance
          },
          input_data: inputData
        },
        created_at: now
      });

    if (historyLogError) {
      console.error('슬롯 이력 기록 실패:', historyLogError.message);
      // 이력 기록 실패는 전체 과정을 실패로 처리하지 않음
    }

    return {
      success: true,
      message: '슬롯이 성공적으로 등록되었습니다.',
      data: slotData[0]
    };
  } catch (err: any) {
    console.error('슬롯 등록 중 오류 발생:', err);
    return {
      success: false,
      message: err.message || '슬롯 등록 중 오류가 발생했습니다.'
    };
  }
};

/**
 * 슬롯 승인 함수 (관리자용)
 */
export const approveSlot = async (
  slotId: string,
  adminUserId: string,
  notes?: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    // 1. 슬롯 정보 확인
    const { data: slotData, error: slotError } = await supabase
      .from('slots')
      .select('*, campaigns(unit_price)')
      .eq('id', slotId)
      .single();

    if (slotError) {
      console.error('슬롯 정보 조회 실패:', slotError);
      throw new Error('슬롯을 찾을 수 없습니다.');
    }

    // 상태 체크
    if (slotData.status !== 'pending') {
      throw new Error('대기 중인 슬롯만 승인할 수 있습니다.');
    }

    // 단가 확인
    const unitPrice = parseFloat(String(slotData.campaigns.unit_price || 0));
    if (unitPrice <= 0) {
      throw new Error('유효하지 않은 캠페인 단가입니다.');
    }

    const now = new Date().toISOString();
    
    // 2. 보류 잔액 확인 및 상태 업데이트
    const { data: pendingBalance, error: pendingBalanceError } = await supabase
      .from('slot_pending_balances')
      .select('amount, status')
      .eq('slot_id', slotId)
      .single();
      
    if (pendingBalanceError) {
      console.error('보류 잔액 조회 실패:', pendingBalanceError);
      throw new Error('거래 정보를 찾을 수 없습니다.');
    }
    
    if (pendingBalance.status !== 'pending') {
      throw new Error('이미 처리된 거래입니다.');
    }
    
    // 보류 잔액 상태 업데이트 (processor_id 필드 사용)
    const { error: updatePendingError } = await supabase
      .from('slot_pending_balances')
      .update({
        status: 'approved',
        processed_at: now,
        processor_id: adminUserId, // processor_id 필드에 관리자 ID 저장
        notes: notes || '관리자 승인'
      })
      .eq('slot_id', slotId);
      
    if (updatePendingError) {
      console.error('보류 잔액 업데이트 실패:', updatePendingError);
      throw new Error('거래 승인 처리에 실패했습니다.');
    }

    // 3. 관리자 잔액 증가 (작업 수행 보상)
    const { data: adminBalance, error: adminBalanceError } = await supabase
      .from('user_balances')
      .select('paid_balance, free_balance')
      .eq('user_id', adminUserId)
      .single();

    if (adminBalanceError && adminBalanceError.code !== 'PGRST116') {
      console.error('관리자 잔액 조회 실패:', adminBalanceError);
      throw new Error('관리자 계정 정보를 찾을 수 없습니다.');
    }

    let updatedPaidBalance = 0;
    let oldPaidBalance = 0;
    let oldFreeBalance = 0;
    
    // 관리자 잔액 업데이트 또는 생성
    if (adminBalanceError && adminBalanceError.code === 'PGRST116') {
      // 계정이 없으면 새로 생성
      const { error: insertBalanceError } = await supabase
        .from('user_balances')
        .insert({
          user_id: adminUserId,
          paid_balance: unitPrice,
          free_balance: 0,
          total_balance: unitPrice,
          created_at: now,
          updated_at: now
        });
        
      if (insertBalanceError) {
        console.error('관리자 잔액 생성 실패:', insertBalanceError);
        throw new Error('관리자 계정 잔액 생성에 실패했습니다.');
      }
      
      updatedPaidBalance = unitPrice;
    } else if (adminBalance) {
      // 기존 계정 잔액 업데이트
      oldPaidBalance = parseFloat(String(adminBalance.paid_balance || 0));
      oldFreeBalance = parseFloat(String(adminBalance.free_balance || 0));
      updatedPaidBalance = oldPaidBalance + unitPrice;
      
      const { error: updateBalanceError } = await supabase
        .from('user_balances')
        .update({
          paid_balance: updatedPaidBalance,
          total_balance: updatedPaidBalance + oldFreeBalance,
          updated_at: now
        })
        .eq('user_id', adminUserId);
        
      if (updateBalanceError) {
        console.error('관리자 잔액 업데이트 실패:', updateBalanceError);
        throw new Error('관리자 계정 잔액 업데이트에 실패했습니다.');
      }
    }

    // 4. 슬롯 상태 업데이트 (processor_id 필드 제거 - slots 테이블에 없음)
    const { data: updatedSlot, error: updateSlotError } = await supabase
      .from('slots')
      .update({
        status: 'approved',
        processed_at: now
      })
      .eq('id', slotId)
      .select();
      
    if (updateSlotError) {
      console.error('슬롯 상태 업데이트 실패:', updateSlotError);
      throw new Error('슬롯 승인 처리에 실패했습니다.');
    }

    // 5. 거래 내역 기록 (관리자 수익)
    const { error: transactionError } = await supabase
      .from('user_cash_history')
      .insert({
        user_id: adminUserId,
        amount: unitPrice, // 양수로 입력하여 수익 표시
        transaction_type: 'work', // work 타입으로 수익 표시
        reference_id: slotId,
        description: `슬롯 승인 수익: [${slotData.input_data?.productName || '상품'}] (사용자ID: ${slotData.user_id}, 단가: ${unitPrice}원)`,
        transaction_at: now,
        mat_id: slotData.mat_id
      });
      
    if (transactionError) {
      console.error('관리자 거래 내역 기록 실패:', transactionError);
      // 거래 내역 기록 실패는 전체 과정을 실패로 처리하지 않음
    }
    
    // 6. 관리자 잔액 변동 감사 로그
    const { error: adminAuditLogError } = await supabase
      .from('balance_audit_log')
      .insert({
        user_id: adminUserId,
        change_type: 'increase',
        old_paid_balance: oldPaidBalance,
        new_paid_balance: updatedPaidBalance,
        old_free_balance: oldFreeBalance,
        new_free_balance: oldFreeBalance,
        change_amount: unitPrice,
        details: {
          operation: 'slot_approval',
          slot_id: slotId,
          user_id: slotData.user_id,
          product_id: slotData.product_id,
          product_name: slotData.input_data?.productName || '상품',
          unit_price: unitPrice
        },
        created_at: now
      });
      
    if (adminAuditLogError) {
      console.error('관리자 잔액 감사 로그 기록 실패:', adminAuditLogError);
      // 감사 로그 실패는 전체 과정을 실패로 처리하지 않음
    }
    
    // 7. 슬롯 상태 변경 기록
    const { error: historyLogError } = await supabase
      .from('slot_history_logs')
      .insert({
        slot_id: slotId,
        action: 'approve',
        old_status: 'pending',
        new_status: 'approved',
        user_id: adminUserId, // 변경됨: changed_by → user_id
        details: {
          processed_at: now,
          notes: notes || '관리자 승인',
          unit_price: unitPrice
        },
        created_at: now
      });
      
    if (historyLogError) {
      console.error('슬롯 이력 기록 실패:', historyLogError);
      // 이력 기록 실패는 전체 과정을 실패로 처리하지 않음
    }

    // 8. 알림 생성 (선택적)
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: slotData.user_id,
          type: 'slot_approved',
          title: '슬롯 승인 완료',
          message: '귀하의 슬롯이 승인되었습니다.',
          link: '/myinfo/services',
          reference_id: slotId,
          status: 'unread',
          created_at: now
        });
    } catch (notifyError) {
      console.error('알림 생성 실패:', notifyError);
      // 알림 실패는 무시
    }

    return {
      success: true,
      message: '슬롯이 성공적으로 승인되었습니다.',
      data: updatedSlot[0]
    };
  } catch (err: any) {
    console.error('슬롯 승인 중 오류 발생:', err);
    return {
      success: false,
      message: err.message || '슬롯 승인 중 오류가 발생했습니다.'
    };
  }
};

/**
 * 슬롯 반려 함수 (관리자용)
 */
export const rejectSlot = async (
  slotId: string,
  adminUserId: string,
  rejectionReason: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    // 반려 사유 체크
    if (!rejectionReason?.trim()) {
      throw new Error('반려 사유를 입력해주세요.');
    }

    // 1. 슬롯 정보 확인
    const { data: slotData, error: slotError } = await supabase
      .from('slots')
      .select('*, campaigns(unit_price)')
      .eq('id', slotId)
      .single();

    if (slotError) {
      console.error('슬롯 정보 조회 실패:', slotError);
      throw new Error('슬롯을 찾을 수 없습니다.');
    }

    // 상태 체크
    if (slotData.status !== 'pending') {
      throw new Error('대기 중인 슬롯만 반려할 수 있습니다.');
    }

    // 단가 확인
    const unitPrice = parseFloat(String(slotData.campaigns.unit_price || 0));
    if (unitPrice <= 0) {
      throw new Error('유효하지 않은 캠페인 단가입니다.');
    }

    const now = new Date().toISOString();
    
    // 2. 보류 잔액 확인 및 상태 업데이트
    const { data: pendingBalance, error: pendingBalanceError } = await supabase
      .from('slot_pending_balances')
      .select('amount, status, notes')
      .eq('slot_id', slotId)
      .single();
      
    if (pendingBalanceError) {
      console.error('보류 잔액 조회 실패:', pendingBalanceError);
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
    
    // 보류 잔액 상태 업데이트 (processor_id 필드 사용)
    const { error: updatePendingError } = await supabase
      .from('slot_pending_balances')
      .update({
        status: 'rejected', // 상태를 rejected로 변경
        processed_at: now,
        processor_id: adminUserId, // processor_id 필드에 관리자 ID 저장
        notes: JSON.stringify({
          rejection_reason: rejectionReason,
          refund_details: {
            free_balance_refunded: freeBalanceUsed,
            paid_balance_refunded: paidBalanceUsed,
            total_refunded: unitPrice
          },
          product_name: slotData.input_data?.productName || '상품',
          processed_at: now,
          payment_details: paymentDetails
        })
      })
      .eq('slot_id', slotId);
      
    if (updatePendingError) {
      console.error('보류 잔액 업데이트 실패:', updatePendingError);
      throw new Error('거래 반려 처리에 실패했습니다.');
    }

    // 3. 사용자 잔액 정보 조회
    const { data: userData, error: userError } = await supabase
      .from('user_balances')
      .select('paid_balance, free_balance')
      .eq('user_id', slotData.user_id)
      .single();

    if (userError) {
      console.error('사용자 잔액 조회 실패:', userError);
      throw new Error('사용자 잔액 정보를 찾을 수 없습니다.');
    }

    // 사용자 현재 잔액
    const currentPaidBalance = parseFloat(String(userData.paid_balance || 0));
    const currentFreeBalance = parseFloat(String(userData.free_balance || 0));
    
    // 원래 차감된 잔액 종류에 맞게 환불 진행
    let updatedPaidBalance = currentPaidBalance;
    let updatedFreeBalance = currentFreeBalance;
    
    // 결제 정보가 있으면 원래 차감된 대로 환불, 없으면 무료 캐시로 환불
    if (paymentDetails) {
      updatedPaidBalance += paidBalanceUsed;
      updatedFreeBalance += freeBalanceUsed;
    } else {
      // 기존 로직 유지 (무료 캐시로 환불)
      updatedFreeBalance += unitPrice;
    }
    
    // 4. 사용자 잔액 업데이트 (환불)
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
      console.error('사용자 잔액 환불 실패:', updateBalanceError);
      throw new Error('환불 처리에 실패했습니다.');
    }

    // 5. 슬롯 상태 업데이트 (processor_id 필드 제거 - slots 테이블에 없음)
    const { data: updatedSlot, error: updateSlotError } = await supabase
      .from('slots')
      .update({
        status: 'rejected',
        processed_at: now,
        rejection_reason: rejectionReason
      })
      .eq('id', slotId)
      .select();
      
    if (updateSlotError) {
      console.error('슬롯 상태 업데이트 실패:', updateSlotError);
      throw new Error('슬롯 반려 처리에 실패했습니다.');
    }

    // 6. 거래 내역 기록 (환불) - 타입별로 구분하여 기록
    
    // 환불 거래는 구매 시 사용된 캐시 종류에 맞게 타입 설정 (기록 목적으로만 사용)
    // 무료 캐시와 유료 캐시 모두 환불되는 경우, 각각 별도의 환불 내역으로 기록
    if (freeBalanceUsed > 0 && paidBalanceUsed > 0) {
      // 무료 캐시 환불 내역 기록
      const { error: freeCashTransactionError } = await supabase
        .from('user_cash_history')
        .insert({
          user_id: slotData.user_id,
          amount: freeBalanceUsed, // 무료 캐시 환불 금액만 기록
          transaction_type: 'refund',
          reference_id: slotId,
          description: `슬롯 반려 환불(무료 캐시): [${slotData.input_data?.productName || '상품'}]`,
          transaction_at: now,
          mat_id: slotData.mat_id,
          user_agent: `Rejection reason: ${rejectionReason}, Free balance refund part`,
          balance_type: 'free' // 무료 캐시 환불
        });
        
      if (freeCashTransactionError) {
        console.error('무료 캐시 환불 거래 내역 기록 실패:', freeCashTransactionError);
      }
      
      // 유료 캐시 환불 내역 기록
      const { error: paidCashTransactionError } = await supabase
        .from('user_cash_history')
        .insert({
          user_id: slotData.user_id,
          amount: paidBalanceUsed, // 유료 캐시 환불 금액만 기록
          transaction_type: 'refund',
          reference_id: slotId,
          description: `슬롯 반려 환불(유료 캐시): [${slotData.input_data?.productName || '상품'}]`,
          transaction_at: now,
          mat_id: slotData.mat_id,
          user_agent: `Rejection reason: ${rejectionReason}, Paid balance refund part`,
          balance_type: 'paid' // 유료 캐시 환불
        });
        
      if (paidCashTransactionError) {
        console.error('유료 캐시 환불 거래 내역 기록 실패:', paidCashTransactionError);
      }
    }
    // 무료 캐시만 환불되는 경우
    else if (freeBalanceUsed > 0) {
      const { error: freeCashTransactionError } = await supabase
        .from('user_cash_history')
        .insert({
          user_id: slotData.user_id,
          amount: freeBalanceUsed, // 양수로 입력하여 환불 표시
          transaction_type: 'refund', // refund 타입으로 환불 표시
          reference_id: slotId,
          description: `슬롯 반려 환불(무료 캐시): [${slotData.input_data?.productName || '상품'}]`,
          transaction_at: now,
          mat_id: slotData.mat_id,
          user_agent: `Rejection reason: ${rejectionReason}`,
          balance_type: 'free' // 무료 캐시 환불
        });
        
      if (freeCashTransactionError) {
        console.error('무료 캐시 환불 거래 내역 기록 실패:', freeCashTransactionError);
      }
    }
    // 유료 캐시만 환불되는 경우
    else if (paidBalanceUsed > 0) {
      const { error: paidCashTransactionError } = await supabase
        .from('user_cash_history')
        .insert({
          user_id: slotData.user_id,
          amount: paidBalanceUsed, // 양수로 입력하여 환불 표시
          transaction_type: 'refund', // refund 타입으로 환불 표시
          reference_id: slotId,
          description: `슬롯 반려 환불(유료 캐시): [${slotData.input_data?.productName || '상품'}]`,
          transaction_at: now,
          mat_id: slotData.mat_id,
          user_agent: `Rejection reason: ${rejectionReason}`,
          balance_type: 'paid' // 유료 캐시 환불
        });
        
      if (paidCashTransactionError) {
        console.error('유료 캐시 환불 거래 내역 기록 실패:', paidCashTransactionError);
      }
    }
    // 결제 정보가 없는 경우 (이전 방식대로 단일 환불 내역 기록)
    else {
      const { error: transactionError } = await supabase
        .from('user_cash_history')
        .insert({
          user_id: slotData.user_id,
          amount: unitPrice, // 양수로 입력하여 환불 표시
          transaction_type: 'refund', // refund 타입으로 환불 표시
          reference_id: slotId,
          description: `슬롯 반려 환불: [${slotData.input_data?.productName || '상품'}]`,
          transaction_at: now,
          mat_id: slotData.mat_id,
          user_agent: `Rejection reason: ${rejectionReason}`,
          balance_type: null // 타입 미구분 환불 (충전/출금 등과 구분하기 위한 목적이 아닌 경우)
        });
        
      if (transactionError) {
        console.error('환불 거래 내역 기록 실패:', transactionError);
      }
    }
    
    // 7. 잔액 변동 감사 로그 (결제 시 차감된 방식대로 환불)
    const { error: auditLogError } = await supabase
      .from('balance_audit_log')
      .insert({
        user_id: slotData.user_id,
        change_type: 'increase',
        old_paid_balance: currentPaidBalance,
        new_paid_balance: updatedPaidBalance,
        old_free_balance: currentFreeBalance,
        new_free_balance: updatedFreeBalance,
        change_amount: unitPrice,
        details: {
          operation: 'slot_refund',
          slot_id: slotId,
          admin_id: adminUserId,
          rejection_reason: rejectionReason,
          product_id: slotData.product_id,
          product_name: slotData.input_data?.productName || '상품',
          unit_price: unitPrice,
          free_balance_refunded: freeBalanceUsed,
          paid_balance_refunded: paidBalanceUsed,
          payment_details: paymentDetails || 'Unknown (defaulted to free balance)'
        },
        created_at: now
      });
      
    if (auditLogError) {
      console.error('잔액 감사 로그 기록 실패:', auditLogError);
      // 감사 로그 실패는 전체 과정을 실패로 처리하지 않음
    }
    
    // 8. 슬롯 상태 변경 기록 (더 상세한 정보 포함)
    const { error: historyLogError } = await supabase
      .from('slot_history_logs')
      .insert({
        slot_id: slotId,
        action: 'reject',
        old_status: 'pending',
        new_status: 'rejected',
        user_id: adminUserId, // 변경됨: changed_by → user_id
        details: {
          processed_at: now,
          processor_id: adminUserId,
          rejection_reason: rejectionReason,
          unit_price: unitPrice,
          refunded: true,
          refund_details: {
            free_balance_refunded: freeBalanceUsed,
            paid_balance_refunded: paidBalanceUsed,
            total_refunded: unitPrice,
            free_balance_before: currentFreeBalance,
            free_balance_after: updatedFreeBalance,
            paid_balance_before: currentPaidBalance,
            paid_balance_after: updatedPaidBalance
          },
          product_id: slotData.product_id,
          product_name: slotData.input_data?.productName || '상품',
          user_id: slotData.user_id,
          input_data: slotData.input_data
        },
        created_at: now
      });
      
    if (historyLogError) {
      console.error('슬롯 이력 기록 실패:', historyLogError);
      // 이력 기록 실패는 전체 과정을 실패로 처리하지 않음
    }

    // 9. 알림 생성 (선택적)
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: slotData.user_id,
          type: 'slot_rejected',
          title: '슬롯 반려 및 환불 완료',
          message: `귀하의 슬롯이 다음 사유로 반려되었습니다: ${rejectionReason}. ${unitPrice}원이 환불되었습니다.`,
          link: '/myinfo/services',
          reference_id: slotId,
          status: 'unread',
          created_at: now
        });
    } catch (notifyError) {
      console.error('알림 생성 실패:', notifyError);
      // 알림 실패는 무시
    }

    return {
      success: true,
      message: `슬롯이 성공적으로 반려되었으며, 사용자에게 ${unitPrice}원이 환불되었습니다.`,
      data: updatedSlot[0]
    };
  } catch (err: any) {
    console.error('슬롯 반려 중 오류 발생:', err);
    return {
      success: false,
      message: err.message || '슬롯 반려 중 오류가 발생했습니다.'
    };
  }
};

/**
 * 슬롯 조회 함수 - 사용자 슬롯 목록 가져오기
 */
export const getUserSlots = async (
  userId: string,
  filters?: {
    status?: string;
    campaignId?: number;
    dateFrom?: string;
    dateTo?: string;
    keyword?: string;
    page?: number;
    limit?: number;
  }
): Promise<{ success: boolean; message: string; data?: any[]; count?: number }> => {
  try {
    // 기본값 설정
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 기본 쿼리 빌드
    let query = supabase
      .from('slots')
      .select('*, campaigns(*)', { count: 'exact' })
      .eq('user_id', userId);

    // 필터 적용
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.campaignId) {
      query = query.eq('product_id', filters.campaignId);
    }

    // 날짜 필터
    if (filters?.dateFrom) {
      query = query.gte('created_at', `${filters.dateFrom}T00:00:00`);
    }

    if (filters?.dateTo) {
      query = query.lte('created_at', `${filters.dateTo}T23:59:59`);
    }

    // 정렬 및 페이지네이션
    query = query
      .order('created_at', { ascending: false })
      .range(from, to);

    // 쿼리 실행
    const { data, error, count } = await query;

    if (error) {
      console.error('슬롯 목록 조회 실패:', error.message);
      throw new Error('슬롯 목록을 가져오는데 실패했습니다.');
    }

    // 키워드 필터링 (input_data 내에서 검색)
    let filteredData = data;
    if (filters?.keyword && filters.keyword.trim() !== '') {
      const normalizedKeyword = filters.keyword.toLowerCase().trim();
      
      filteredData = data.filter(slot => {
        const inputData = slot.input_data;
        
        // 상품명, MID, URL, 키워드 등에서 검색
        if (inputData?.productName?.toLowerCase().includes(normalizedKeyword)) {
          return true;
        }
        
        if (inputData?.mid?.toLowerCase().includes(normalizedKeyword)) {
          return true;
        }
        
        if (inputData?.url?.toLowerCase().includes(normalizedKeyword)) {
          return true;
        }
        
        // 키워드 배열 검색
        if (Array.isArray(inputData?.keywords)) {
          return inputData.keywords.some((keyword: string) => 
            keyword.toLowerCase().includes(normalizedKeyword)
          );
        }
        
        return false;
      });
    }

    return {
      success: true,
      message: '슬롯 목록을 성공적으로 가져왔습니다.',
      data: filteredData,
      count: count || filteredData.length
    };
  } catch (err: any) {
    console.error('슬롯 목록 조회 중 오류 발생:', err);
    return {
      success: false,
      message: err.message || '슬롯 목록 조회 중 오류가 발생했습니다.'
    };
  }
};

/**
 * 슬롯 통계 가져오기
 */
export const getSlotStats = async (
  userId: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    // 상태별 슬롯 개수 조회
    const { data, error } = await supabase
      .from('slots')
      .select('status')
      .eq('user_id', userId);

    if (error) {
      console.error('슬롯 통계 조회 실패:', error.message);
      throw new Error('슬롯 통계를 가져오는데 실패했습니다.');
    }

    // 상태별 카운팅
    const stats = {
      total: data.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      completed: 0,
      cancelled: 0
    };

    data.forEach(slot => {
      switch (slot.status) {
        case 'pending':
          stats.pending++;
          break;
        case 'approved':
          stats.approved++;
          break;
        case 'rejected':
          stats.rejected++;
          break;
        case 'completed':
          stats.completed++;
          break;
        case 'cancelled':
          stats.cancelled++;
          break;
      }
    });

    return {
      success: true,
      message: '슬롯 통계를 성공적으로 가져왔습니다.',
      data: stats
    };
  } catch (err: any) {
    console.error('슬롯 통계 조회 중 오류 발생:', err);
    return {
      success: false,
      message: err.message || '슬롯 통계 조회 중 오류가 발생했습니다.'
    };
  }
};

export default {
  registerSlot,
  approveSlot,
  rejectSlot,
  getUserSlots,
  getSlotStats
};