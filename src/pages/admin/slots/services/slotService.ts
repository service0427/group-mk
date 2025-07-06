import { supabase } from '@/supabase';
import { Slot } from '../components/types';
import { checkSingleKeywordRanking, checkKeywordsInBatches, extractKeywordsFromSlot } from '@/services/rankingCheckService';
import { createSlotExtensionRequestNotification, createSlotExtensionApprovedNotification, createSlotExtensionRejectedNotification } from '@/utils/notificationActions';

/**
 * 슬롯 승인 서비스
 * RPC 대신 클라이언트 측에서 직접 테이블 업데이트 수행
 */

// 캠페인 정보 조회 헬퍼 함수 (오류 처리 개선)
async function getCampaignInfo(productId: number) {
  try {
    // campaigns 테이블에서 조회
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', productId)
      .maybeSingle();

    if (!campaignError && campaign) {
      return campaign;
    }

    

    // 기본 정보 생성
    
    return {
      id: productId,
      unit_price: 1000, // 기본 단가
      campaign_name: `캠페인 #${productId}`,
      status: 'active'
    };
  } catch (err) {
    
    // 기본 정보 반환
    return {
      id: productId,
      unit_price: 1000,
      campaign_name: `캠페인 #${productId}`,
      status: 'active'
    };
  }
}

// 슬롯 삭제 함수
export const deleteSlot = async (slotId: string | string[]): Promise<{ success: boolean; error?: any }> => {
  try {
    const slotIds = Array.isArray(slotId) ? slotId : [slotId];
    
    // 슬롯 삭제
    const { error: deleteError } = await supabase
      .from('slots')
      .delete()
      .in('id', slotIds);
    
    if (deleteError) {
      throw deleteError;
    }
    
    return { success: true };
  } catch (error) {
    console.error('슬롯 삭제 실패:', error);
    return { success: false, error };
  }
};

// 슬롯 승인 처리 함수
export const approveSlot = async (
  slotId: string | string[],
  adminUserId: string,
  actionType?: string,
  start_date?: string,
  end_date?: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  // 배열인 경우 (다중 승인)
  if (Array.isArray(slotId)) {
    // 빈 배열 체크
    if (slotId.length === 0) {
      return {
        success: false,
        message: '선택된 슬롯이 없습니다.'
      };
    }
    
    // 다중 승인 시 NS 서비스 키워드 수집 (일반 승인인 경우만)
    if (!actionType || actionType === 'approve') {
      const allKeywords: string[] = [];
      
      // 먼저 모든 슬롯의 정보를 조회하여 NS 서비스의 키워드 수집
      for (const id of slotId) {
        try {
          const { data: slotData } = await supabase
            .from('slots')
            .select('input_data, campaigns!product_id(service_type, ranking_field_mapping)')
            .eq('id', id)
            .single();
            
          if (slotData?.campaigns) {
            const campaign = Array.isArray(slotData.campaigns) ? slotData.campaigns[0] : slotData.campaigns;
            
            if (campaign && campaign.service_type && campaign.service_type.startsWith('NaverShopping')) {
              const keywords = extractKeywordsFromSlot(slotData.input_data, campaign.ranking_field_mapping);
              allKeywords.push(...keywords);
            }
          }
        } catch (err) {
          console.error(`[순위체크API] 슬롯 ${id} 정보 조회 실패 (무시):`, err);
        }
      }
      
      
      // 수집된 키워드가 있으면 배치로 체크
      if (allKeywords.length > 0) {
        checkKeywordsInBatches(allKeywords).catch(err => 
          console.error('[순위체크API] 배치 순위 체크 API 호출 실패 (무시):', err)
        );
      }
    }
    
    // 다중 승인 처리 결과
    const results = [];
    const errors = [];
    
    // 슬롯 ID별로 순차적으로 승인 처리
    for (const id of slotId) {
      try {
        const result = await approveSingleSlot(id, adminUserId, actionType, start_date, end_date, true); // 다중 승인 시에는 개별 체크 스킵
        results.push({
          id,
          success: result.success,
          message: result.message
        });
        
        if (!result.success) {
          errors.push(`슬롯 ID ${id}: ${result.message}`);
        }
      } catch (err: any) {
        errors.push(`슬롯 ID ${id}: ${err.message || '알 수 없는 오류'}`);
      }
    }
    
    // 처리 결과 반환
    return {
      success: errors.length === 0,
      message: errors.length === 0 
        ? `${slotId.length}개의 슬롯이 성공적으로 승인되었습니다.` 
        : `${slotId.length - errors.length}/${slotId.length}개의 슬롯이 승인되었습니다. 오류: ${errors.join(', ')}`,
      data: results
    };
  }
  
  // 단일 슬롯 처리
  return await approveSingleSlot(slotId, adminUserId, actionType, start_date, end_date);
};

// 단일 슬롯 승인 처리 함수 (내부 구현)
const approveSingleSlot = async (
  slotId: string,
  adminUserId: string,
  actionType?: string,
  start_date?: string,
  end_date?: string,
  skipRankingCheck?: boolean // 다중 승인에서 이미 체크한 경우 스킵
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    // 1. 슬롯 정보 조회
    const { data: slotData, error: slotError } = await supabase
      .from('slots')
      .select('*, campaigns(*)')
      .eq('id', slotId)
      .single();

    if (slotError) {
      
      throw new Error('슬롯 정보 조회 실패');
    }

    if (!slotData) {
      throw new Error('해당 슬롯이 존재하지 않습니다.');
    }


    // actionType이 없는 경우에만 pending 체크 (일반 승인)
    if (!actionType && slotData.status !== 'pending') {
      throw new Error(`대기 중인 슬롯만 승인할 수 있습니다. (현재 상태: ${slotData.status})`);
    }

    // 단가 확인 (캠페인 데이터에서)
    let campaignData;

    if (slotData.campaigns) {
      campaignData = slotData.campaigns;
    } else if (slotData.product_id) {
      // 슬롯에 캠페인 데이터가 없지만 product_id가 있으면 헬퍼 함수로 조회
      
      campaignData = await getCampaignInfo(slotData.product_id);
    } else {
      
      throw new Error('해당 슬롯의 캠페인 정보를 찾을 수 없습니다.');
    }

    let unitPrice = 0;
    try {
      unitPrice = parseFloat(String(campaignData.unit_price || 0));
    } catch (e) {
      
      throw new Error('캠페인 단가 정보를 처리할 수 없습니다.');
    }

    if (unitPrice <= 0) {
      throw new Error('유효하지 않은 캠페인 단가입니다. 단가: ' + (campaignData.unit_price || '0'));
    }

    // 관리자/총판 계정에 금액 이체는 더 이상 여기서 하지 않음
    // 이 작업은 사용자가 거래 완료를 눌렀을 때 수행됨
    
    // NS 서비스 타입인 경우 순위 체크 API 호출 (승인 시에만, 스킵 플래그가 없을 때만)
    // 연장 슬롯인 경우는 순위 체크 스킵
    if ((!actionType || actionType === 'approve') && !skipRankingCheck && !slotData.is_extension && campaignData.service_type && campaignData.service_type.startsWith('NaverShopping')) {
      // 캠페인의 필드 매핑 정보 가져오기
      const fieldMapping = campaignData.ranking_field_mapping;
      
      const keywords = extractKeywordsFromSlot(slotData.input_data, fieldMapping);
      
      if (keywords.length > 0) {
        // 비동기로 호출하고 결과는 무시 (실패해도 승인 프로세스는 계속)
        if (keywords.length === 1) {
          checkSingleKeywordRanking(keywords[0]).catch(err => 
            console.error('[순위체크API] 단일 키워드 API 호출 실패 (무시):', err)
          );
        } else {
          checkKeywordsInBatches(keywords).catch(err => 
            console.error('[순위체크API] 다중 키워드 API 호출 실패 (무시):', err)
          );
        }
      }
    }
    
    // 현재 시간 가져오기
    const now = new Date().toISOString();

    // 시작일과 종료일 설정
    // 슬롯에 저장된 날짜를 가져옴 (하지만 잘못된 경우가 많음)
    let slotStartDate = slotData.start_date;
    let slotEndDate = slotData.end_date;
    
    // 함수 파라미터로 날짜가 전달되면 우선 사용
    let finalStartDate = start_date || slotStartDate;
    let finalEndDate = end_date || slotEndDate;
    
    
    // work_days 값 확인하고 날짜 재계산
    let dueDays = 1; // 기본값
    
    // work_days 또는 유사 필드 찾기
    if (slotData.input_data) {
      if (slotData.input_data.work_days) {
        dueDays = parseInt(String(slotData.input_data.work_days));
      } else if (slotData.input_data.dueDays) {
        dueDays = parseInt(String(slotData.input_data.dueDays));
      } else if (slotData.input_data.workDays) {
        dueDays = parseInt(String(slotData.input_data.workDays));
      } else if (slotData.input_data.workCount) {
        dueDays = parseInt(String(slotData.input_data.workCount));
      }
    }
    
    // dueDays 유효성 검사
    if (isNaN(dueDays) || dueDays <= 0) {
      dueDays = 1;
    }
    
    // 연장 슬롯인지 확인
    if (slotData.is_extension && slotData.parent_slot_id) {
      // 연장 슬롯인 경우, 무조건 원본 슬롯의 종료일을 기준으로 날짜 재계산
      const { data: parentSlot, error: parentError } = await supabase
        .from('slots')
        .select('end_date')
        .eq('id', slotData.parent_slot_id)
        .single();
      
      if (parentError || !parentSlot || !parentSlot.end_date) {
        throw new Error('원본 슬롯의 종료일을 확인할 수 없습니다.');
      }
      
      // 원본 슬롯 종료일 다음날부터 시작
      const [year, month, day] = parentSlot.end_date.split('-').map(Number);
      const parentEndDate = new Date(year, month - 1, day);
      
      // 하루(밀리초)를 더하는 방식으로 정확히 다음날 계산
      const extensionStartDate = new Date(parentEndDate.getTime() + 24 * 60 * 60 * 1000);
      
      // 날짜를 YYYY-MM-DD 형식으로 변환 (로컬 시간대 유지)
      const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      // 연장 슬롯은 무조건 원본 종료일 기준으로 날짜 설정
      finalStartDate = formatDate(extensionStartDate);
      
      const extensionEndDate = new Date(extensionStartDate);
      extensionEndDate.setDate(extensionStartDate.getDate() + dueDays - 1);
      finalEndDate = formatDate(extensionEndDate);
    } else {
      // 일반 슬롯인 경우 기존 로직 (승인일 다음날부터 시작)
      // 단, 이미 날짜가 설정되어 있으면 유지
      if (!finalStartDate || !finalEndDate) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        finalStartDate = tomorrow.toISOString().split('T')[0];
        
        // 종료일 계산: 시작일 + (dueDays - 1)
        const endDateObj = new Date(tomorrow);
        endDateObj.setDate(tomorrow.getDate() + dueDays - 1);
        finalEndDate = endDateObj.toISOString().split('T')[0];
        
        console.log('[일반 슬롯] 날짜 계산:', {
          today: today.toISOString().split('T')[0],
          tomorrow: finalStartDate,
          end: finalEndDate
        });
      }
    }

    // 3. 슬롯 상태 업데이트 (actionType에 따라 다른 상태로 업데이트)
    let newStatus = 'approved';
    let userRefund = false; // 사용자에게 환불 플래그
    
    // actionType이 있으면 액션 타입별로 처리
    if (actionType) {
      // actionType에 따라 새 상태 설정
      switch (actionType) {
        case 'success':
          // success는 approved 상태에서만 가능
          if (slotData.status !== 'approved') {
            throw new Error(`작업 완료 처리는 승인된 슬롯만 가능합니다. (현재 상태: ${slotData.status})`);
          }
          newStatus = 'success';
          // success 상태는 총판이 작업 완료했음을 의미함
          // 사용자가 나중에 complete로 바꿔야 총판에게 캐시 지급
          break;
        case 'refund':
          // refund는 pending 또는 approved 상태에서 가능
          if (slotData.status !== 'pending' && slotData.status !== 'approved') {
            throw new Error(`환불은 대기 중이거나 승인된 슬롯만 가능합니다. (현재 상태: ${slotData.status})`);
          }
          newStatus = 'refund';
          // 환불 시에는 사용자에게 환불 처리
          userRefund = true;
          break;
        default:
          // 기본값 유지
          break;
      }
    }
    
    // 환불(refund) 상태일 때 사용자에게 환불 처리
    if (newStatus === 'refund' && userRefund) {
      // 환불 로직 - rejectSlot 함수의 환불 코드와 유사
      try {
        // slot_pending_balances에서 결제 정보 확인
        const { data: pendingBalance } = await supabase
          .from('slot_pending_balances')
          .select('amount, notes')
          .eq('slot_id', slotId)
          .maybeSingle();

        // slot_pending_balances의 amount는 VAT 포함 금액
        const refundAmount = pendingBalance?.amount ? parseFloat(String(pendingBalance.amount)) : 0;
        
        // 환불 금액이 0인 경우 처리
        if (refundAmount === 0) {
          throw new Error('환불 금액이 0원입니다. slot_pending_balances를 확인해주세요.');
        }
        
        // 무조건 유료 캐시로 환불
        const paidBalanceUsed = refundAmount;
        const freeBalanceUsed = 0;
        unitPrice = refundAmount; // 환불 시 VAT 포함 금액 사용

        // 사용자의 잔액 조회
        const { data: userBalance, error: balanceError } = await supabase
          .from('user_balances')
          .select('paid_balance, free_balance, total_balance')
          .eq('user_id', slotData.user_id)
          .single();
        
        if (balanceError || !userBalance) {
          throw new Error('사용자 잔액 정보를 찾을 수 없습니다.');
        }

        // 잔액 업데이트 (환불 처리)
        const newPaidBalance = parseFloat(String(userBalance.paid_balance || 0)) + paidBalanceUsed;
        const newFreeBalance = parseFloat(String(userBalance.free_balance || 0)) + freeBalanceUsed;
        const newTotalBalance = newPaidBalance + newFreeBalance;
        
        await supabase
          .from('user_balances')
          .update({
            paid_balance: newPaidBalance,
            free_balance: newFreeBalance,
            total_balance: newTotalBalance,
            updated_at: now
          })
          .eq('user_id', slotData.user_id);
          
        // 환불 내역 기록
        await supabase
          .from('user_cash_history')
          .insert({
            user_id: slotData.user_id,
            amount: refundAmount, // VAT 포함 금액으로 환불
            transaction_type: 'refund', // refund 타입으로 사용자에게 환불
            reference_id: slotId,
            description: `슬롯 환불: [${slotData.input_data?.productName || '상품'}]`,
            transaction_at: now,
            balance_type: 'paid' // 무조건 유료 캐시로 환불
          });
      } catch (refundError) {
        console.error('환불 처리 중 오류:', refundError);
        // 환불 실패는 치명적이므로 예외 발생
        throw new Error('사용자에게 환불 처리 중 오류가 발생했습니다.');
      }
    }
    
    // 슬롯 상태 업데이트
    const updateData: any = {
      status: newStatus,
      processed_at: now
    };
    
    // 환불이 아닌 경우에만 날짜 업데이트
    if (newStatus !== 'refund') {
      updateData.start_date = finalStartDate;
      updateData.end_date = finalEndDate;
    }
    
    const { data: updatedSlot, error: updateError } = await supabase
      .from('slots')
      .update(updateData)
      .eq('id', slotId)
      .select();

    if (updateError) {
      console.error('[슬롯 승인] 업데이트 오류:', updateError);
      throw updateError;
    }
    
    // slot_pending_balances 테이블 상태 업데이트
    try {
      const { data: pendingBalanceData, error: pendingError } = await supabase
        .from('slot_pending_balances')
        .select('id, status')
        .eq('slot_id', slotId)
        .maybeSingle();
        
      if (!pendingError && pendingBalanceData) {
        // pending_balances 테이블의 상태도 업데이트
        await supabase
          .from('slot_pending_balances')
          .update({
            status: newStatus,
            processed_at: now
          })
          .eq('slot_id', slotId);
          
        // Slot pending balance updated for slot ID: ${slotId}
      }
    } catch (pendingUpdateError) {
      console.error('Error updating slot_pending_balances:', pendingUpdateError);
      // 이 오류는 전체 프로세스 실패로 취급하지 않음
    }

    // 4. 승인 기록 저장 (필요한 경우)
    try {
      // actionType에 따라 다른 action_type 사용
      let actionTypeForLog = 'slot_approval';
      if (actionType === 'success') {
        actionTypeForLog = 'slot_success';
      } else if (actionType === 'refund') {
        actionTypeForLog = 'slot_refund';
      }
      
      await supabase
        .from('admin_action_logs')
        .insert({
          admin_id: adminUserId,
          action_type: actionTypeForLog,
          target_id: slotId,
          details: {
            previous_status: slotData.status,
            new_status: newStatus,
            amount_transferred: newStatus === 'success' ? unitPrice : 0
          },
          created_at: now
        });
    } catch (logError) {
      // admin_action_logs 테이블이 없는 경우 무시
      // 로그 저장 실패는 전체 프로세스 실패로 취급하지 않음
    }
    
    // 슬롯 이력 로그에 액션 추가
    try {
      // 결제 정보 확인 (slot_pending_balances 테이블에서)
      let paymentDetails = null;

      try {
        const { data: pendingBalance, error: pendingBalanceError } = await supabase
          .from('slot_pending_balances')
          .select('amount, status, notes')
          .eq('slot_id', slotId)
          .maybeSingle(); // single() 대신 maybeSingle() 사용하여 데이터 없는 경우에도 오류 발생하지 않도록 함

        // 결제 정보 처리
        if (!pendingBalanceError && pendingBalance?.notes) {
          try {
            const notesObj = JSON.parse(pendingBalance.notes);
            if (notesObj.payment_details) {
              paymentDetails = notesObj.payment_details;
            }
          } catch (e) {
            
          }
        }
      } catch (pendingBalanceError) {
        
        // 이 오류는 전체 프로세스에 영향을 주지 않게 처리
      }
      
      // actionType에 따라 다른 액션 사용
      let actionForLog = 'approve';
      if (actionType === 'success') {
        actionForLog = 'success';
      } else if (actionType === 'refund') {
        actionForLog = 'refund';
      }
      
      // 이력 로그 저장
      await supabase
        .from('slot_history_logs')
        .insert({
          slot_id: slotId,
          action: actionForLog,
          old_status: slotData.status,
          new_status: newStatus,
          user_id: adminUserId,
          details: {
            processed_at: now,
            amount: newStatus === 'success' ? unitPrice : 0,
            user_id: slotData.user_id,
            product_id: slotData.product_id,
            product_name: slotData.input_data?.productName || '상품',
          },
          created_at: now
        });
    } catch (historyLogError) {
      
      // 이력 로그 저장 실패는 전체 프로세스 실패로 취급하지 않음
    }

    // 5. 알림 생성
    try {
      // getServiceTypeUrlPath 함수 가져오기
      const { getServiceTypeUrlPath } = await import('@/utils/notificationActions');
      
      // 서비스 타입과 슬롯 타입 결정
      const serviceType = campaignData.service_type || '';
      const slotType = campaignData.slot_type || 'standard';
      
      // 연장 슬롯인 경우 특별 처리
      if (slotData.is_extension && slotData.parent_slot_id) {
        // 연장 승인 알림
        await createSlotExtensionApprovedNotification(
          slotData.user_id,
          slotData.id,
          campaignData.campaign_name || `캠페인 #${slotData.product_id}`,
          finalEndDate || ''
        );
      } else {
        // actionType에 따라 다른 알림 내용 사용
        let notificationType = 'slot_approved';
        let notificationTitle = '슬롯 승인 완료';
        let notificationMessage = `귀하의 슬롯이 승인되었습니다.`;
        
        if (actionType === 'success') {
          notificationType = 'slot_success';
          notificationTitle = '슬롯 작업 완료';
          notificationMessage = `귀하의 슬롯 작업이 완료되었습니다.`;
        } else if (actionType === 'refund') {
          notificationType = 'slot_refund';
          notificationTitle = '슬롯 환불 처리';
          notificationMessage = `귀하의 슬롯이 환불 처리되었습니다.`;
        }
        
        await supabase
          .from('notifications')
          .insert({
            user_id: slotData.user_id,
            type: notificationType,
            title: notificationTitle,
            message: notificationMessage,
            link: `/my-services?service=${getServiceTypeUrlPath(serviceType)}&type=${slotType}`,
            status: 'unread',
            priority: 'medium', // 필수 필드 추가
            created_at: now
          });
      }
    } catch (notifyError) {
      
      // 알림 생성 실패는 전체 프로세스 실패로 취급하지 않음
    }
    
    // 응답 메시지도 상태에 따라 다르게 설정
    let successMessage = '슬롯이 성공적으로 승인되었습니다.';
    if (actionType === 'success') {
      successMessage = '슬롯이 성공적으로 완료 처리되었습니다.';
    } else if (actionType === 'refund') {
      successMessage = '슬롯이 성공적으로 환불 처리되었습니다.';
    }

    return {
      success: true,
      message: successMessage,
      data: updatedSlot
    };
  } catch (err: any) {
    
    return {
      success: false,
      message: err.message || '슬롯 승인 중 오류가 발생했습니다.'
    };
  }
};

// 슬롯 반려 처리 함수
export const rejectSlot = async (
  slotId: string | string[],
  adminUserId: string,
  rejectionReason: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  // 반려 사유 확인
  if (!rejectionReason.trim()) {
    return {
      success: false,
      message: '반려 사유를 입력해주세요.'
    };
  }
  
  // 배열인 경우 (다중 반려)
  if (Array.isArray(slotId)) {
    // 빈 배열 체크
    if (slotId.length === 0) {
      return {
        success: false,
        message: '선택된 슬롯이 없습니다.'
      };
    }
    
    // 다중 반려 처리 결과
    const results = [];
    const errors = [];
    
    // 슬롯 ID별로 순차적으로 반려 처리
    for (const id of slotId) {
      try {
        const result = await rejectSingleSlot(id, adminUserId, rejectionReason);
        results.push({
          id,
          success: result.success,
          message: result.message
        });
        
        if (!result.success) {
          errors.push(`슬롯 ID ${id}: ${result.message}`);
        }
      } catch (err: any) {
        errors.push(`슬롯 ID ${id}: ${err.message || '알 수 없는 오류'}`);
      }
    }
    
    // 처리 결과 반환
    return {
      success: errors.length === 0,
      message: errors.length === 0 
        ? `${slotId.length}개의 슬롯이 성공적으로 반려되었습니다.` 
        : `${slotId.length - errors.length}/${slotId.length}개의 슬롯이 반려되었습니다. 오류: ${errors.join(', ')}`,
      data: results
    };
  }
  
  // 단일 슬롯 처리
  return await rejectSingleSlot(slotId, adminUserId, rejectionReason);
};

// 단일 슬롯 반려 처리 함수 (내부 구현)
const rejectSingleSlot = async (
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
      
      throw new Error('슬롯 정보 조회 실패');
    }

    if (!slotData) {
      throw new Error('해당 슬롯이 존재하지 않습니다.');
    }

    if (slotData.status !== 'pending') {
      throw new Error(`대기 중인 슬롯만 반려할 수 있습니다. (현재 상태: ${slotData.status})`);
    }

    // 단가 확인 (캠페인 데이터에서)
    let campaignData;

    if (slotData.campaigns) {
      campaignData = slotData.campaigns;
    } else if (slotData.product_id) {
      // 슬롯에 캠페인 데이터가 없지만 product_id가 있으면 헬퍼 함수로 조회
      
      campaignData = await getCampaignInfo(slotData.product_id);
    } else {
      
      throw new Error('해당 슬롯의 캠페인 정보를 찾을 수 없습니다.');
    }

    let unitPrice = 0;
    try {
      unitPrice = parseFloat(String(campaignData.unit_price || 0));
    } catch (e) {
      
      throw new Error('캠페인 단가 정보를 처리할 수 없습니다.');
    }

    if (unitPrice <= 0) {
      throw new Error('유효하지 않은 캠페인 단가입니다. 단가: ' + (campaignData.unit_price || '0'));
    }

    const now = new Date().toISOString();

    // 1.5 결제 정보 확인 (slot_pending_balances 테이블에서)
    const { data: pendingBalance, error: pendingBalanceError } = await supabase
      .from('slot_pending_balances')
      .select('amount, status, notes')
      .eq('slot_id', slotId)
      .maybeSingle(); // single() 대신 maybeSingle() 사용

    // 결제 정보가 없어도 반려는 가능하도록 변경
    if (pendingBalanceError && pendingBalanceError.code !== 'PGRST116') {
      
      
      // 치명적 오류로 처리하지 않음
    }

    // 결제 정보가 있고 상태가 'pending'이 아니면 경고
    if (pendingBalance && pendingBalance.status !== 'pending') {
      
      // 치명적 오류로 처리하지 않음
    }
    
    // slot_pending_balances의 amount는 VAT 포함 금액
    const refundAmount = pendingBalance?.amount ? parseFloat(String(pendingBalance.amount)) : 0;
    
    // 환불 금액이 0인 경우 campaign 단가에 VAT를 포함하여 계산
    let finalRefundAmount = refundAmount;
    if (finalRefundAmount === 0) {
      // campaign 단가에 VAT 10% 추가
      finalRefundAmount = Math.ceil(unitPrice * 1.1);
    }
    
    // 무조건 유료 캐시로 환불
    const paidBalanceUsed = finalRefundAmount;
    const freeBalanceUsed = 0;

    // 2. 사용자에게 캐시 환불 처리
    // 사용자 잔액 정보 조회
    const { data: userBalanceData, error: userBalanceError } = await supabase
      .from('user_balances')
      .select('paid_balance, free_balance, total_balance')
      .eq('user_id', slotData.user_id)
      .maybeSingle();

    if (userBalanceError) {
      
      throw new Error('사용자 잔액 조회 실패');
    }

    if (!userBalanceData) {
      throw new Error('사용자 잔액 정보가 없습니다.');
    }

    // 사용자 현재 잔액
    const currentPaidBalance = parseFloat(String(userBalanceData.paid_balance || 0));
    const currentFreeBalance = parseFloat(String(userBalanceData.free_balance || 0));
    
    // 무조건 유료 캐시로 환불
    let updatedPaidBalance = currentPaidBalance + paidBalanceUsed;
    let updatedFreeBalance = currentFreeBalance + freeBalanceUsed;

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
      
      throw new Error('환불 처리 중 오류가 발생했습니다.');
    }

    // 환불 내역 기록 (user_cash_history 테이블 사용)
    const { error: refundError } = await supabase
      .from('user_cash_history')
      .insert({
        user_id: slotData.user_id,
        amount: finalRefundAmount, // VAT 포함 금액으로 환불
        transaction_type: 'refund', // refund 타입으로 사용자에게 환불
        reference_id: slotId,
        description: `슬롯 반려 환불: [${slotData.input_data?.productName || '상품'}]`,
        transaction_at: now,
        user_agent: `Rejection reason: ${rejectionReason}`, // user_agent 필드에 추가 정보 저장
        balance_type: 'paid' // 무조건 유료 캐시로 환불
      });

    if (refundError) {
      
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
      throw updateError;
    }
    
    // slot_pending_balances 테이블 상태도 업데이트
    try {
      const { data: pendingBalanceData, error: pendingError } = await supabase
        .from('slot_pending_balances')
        .select('id, status')
        .eq('slot_id', slotId)
        .maybeSingle();
        
      if (!pendingError && pendingBalanceData) {
        // pending_balances 테이블의 상태도 rejected로 업데이트
        await supabase
          .from('slot_pending_balances')
          .update({
            status: 'rejected',
            processed_at: now
          })
          .eq('slot_id', slotId);
          
        // Slot pending balance updated for rejected slot ID: ${slotId}
      }
    } catch (pendingUpdateError) {
      console.error('Error updating slot_pending_balances for rejected slot:', pendingUpdateError);
      // 이 오류는 전체 프로세스 실패로 취급하지 않음
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
      // admin_action_logs 테이블이 없는 경우 무시
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
          },
          created_at: now
        });
    } catch (historyLogError) {
      
      // 이력 로그 저장 실패는 전체 프로세스 실패로 취급하지 않음
    }

    // 5. 알림 생성
    try {
      // 연장 슬롯인지 확인
      if (slotData.is_extension && slotData.parent_slot_id) {
        // 연장 반려 알림
        await createSlotExtensionRejectedNotification(
          slotData.user_id,
          slotData.id,
          campaignData.campaign_name || `캠페인 #${slotData.product_id}`,
          rejectionReason
        );
      } else {
        // 일반 슬롯 반려 알림
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
            priority: 'high', // 반려는 중요도 높음
            created_at: now
          });
      }
    } catch (notifyError) {
      
      // 알림 생성 실패는 전체 프로세스 실패로 취급하지 않음
    }

    return {
      success: true,
      message: `슬롯이 성공적으로 반려되었으며, 사용자에게 ${unitPrice.toLocaleString()}원이 환불되었습니다.`,
      data: updatedSlot
    };
  } catch (err: any) {
    
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
      // admin_action_logs 테이블이 없는 경우 무시
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
      
      // 이력 로그 저장 실패는 전체 프로세스 실패로 취급하지 않음
    }

    return {
      success: true,
      message: '메모가 성공적으로 저장되었습니다.',
      data: updatedSlot
    };
  } catch (err: any) {
    
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
    
    // service_type을 직접 필터링하지 않음
    // 필요한 경우 추가 로직으로 서비스 타입에 해당하는 product_id 필터링 구현 필요

    // 날짜 필터
    if (filters.dateFrom && filters.dateTo) {
      // 둘 다 선택: start_date >= 시작일 AND end_date <= 종료일
      query = query
        .gte('start_date', filters.dateFrom)
        .lte('end_date', filters.dateTo);
    } else if (filters.dateFrom) {
      // 시작일만 선택: start_date >= 검색시작일
      query = query.gte('start_date', filters.dateFrom);
    } else if (filters.dateTo) {
      // 종료일만 선택: end_date <= 검색종료일
      query = query.lte('end_date', filters.dateTo);
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
      count: count || undefined
    };
  } catch (err: any) {
    
    return {
      success: false,
      message: err.message || '슬롯 목록 조회 중 오류가 발생했습니다.'
    };
  }
};

// 총판이 슬롯 작업 완료 처리하는 함수
export const completeSlotByMat = async (
  slotId: string,
  matId: string,
  workMemo?: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    // work_memo가 있으면 먼저 input_data에 저장
    if (workMemo && workMemo.trim()) {
      // 기존 슬롯 정보 가져오기
      const { data: slotData, error: slotError } = await supabase
        .from('slots')
        .select('input_data')
        .eq('id', slotId)
        .single();

      if (slotError) {
        console.error('슬롯 정보 조회 실패:', slotError);
      } else {
        // input_data 업데이트 (기존 데이터 유지하면서 work_memo 추가)
        const updatedInputData = {
          ...(slotData.input_data || {}),
          work_memo: workMemo,
          work_memo_date: new Date().toISOString()
        };

        const { error: updateError } = await supabase
          .from('slots')
          .update({ input_data: updatedInputData })
          .eq('id', slotId);

        if (updateError) {
          console.error('work_memo 저장 실패:', updateError);
        }
      }
    }

    // RPC 함수 호출 - mat_complete_slot
    const { data, error } = await supabase
      .rpc('mat_complete_slot', {
        p_slot_id: slotId,
        p_mat_id: matId,
        p_notes: workMemo || null
      });

    if (error) {
      console.error('슬롯 완료 처리 RPC 오류:', error);
      
      // 오류 메시지를 더 친화적으로 변환
      if (error.message.includes('찾을 수 없습니다')) {
        throw new Error('해당 슬롯을 찾을 수 없습니다.');
      } else if (error.message.includes('권한이 없습니다')) {
        throw new Error('이 슬롯을 처리할 권한이 없습니다.');
      } else if (error.message.includes('승인된 슬롯만')) {
        throw new Error('승인된 슬롯만 완료 처리할 수 있습니다.');
      } else if (error.message.includes('이미 완료')) {
        throw new Error('이미 완료 처리된 슬롯입니다.');
      }
      
      throw error;
    }

    // RPC 함수의 반환값 확인
    if (data && data.success) {
      return {
        success: true,
        message: data.message || '슬롯이 성공적으로 완료 처리되었습니다.',
        data: data
      };
    } else {
      return {
        success: false,
        message: data?.message || '슬롯 완료 처리에 실패했습니다.',
        data: data
      };
    }
  } catch (err: any) {
    console.error('슬롯 완료 처리 오류:', err);
    return {
      success: false,
      message: err.message || '슬롯 완료 처리 중 오류가 발생했습니다.'
    };
  }
};

// 사용자가 슬롯 완료를 확인하는 함수
export const confirmSlotByUser = async (
  slotId: string,
  userId: string,
  notes?: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    // RPC 함수 호출 - user_confirm_slot_completion
    const { data, error } = await supabase
      .rpc('user_confirm_slot_completion', {
        p_slot_id: slotId,
        p_user_id: userId,
        p_notes: notes || null
      });

    if (error) {
      console.error('슬롯 확인 처리 RPC 오류:', error);
      
      // 오류 메시지를 더 친화적으로 변환
      if (error.message.includes('찾을 수 없습니다')) {
        throw new Error('해당 슬롯을 찾을 수 없거나 권한이 없습니다.');
      } else if (error.message.includes('이미 완료')) {
        throw new Error('이미 완료 처리된 슬롯입니다.');
      } else if (error.message.includes('총판이 아직')) {
        throw new Error('총판이 아직 작업을 완료하지 않았습니다.');
      } else if (error.message.includes('사용자 확인 대기')) {
        throw new Error('사용자 확인 대기 중인 슬롯만 처리할 수 있습니다.');
      }
      
      throw error;
    }

    // RPC 함수의 반환값 확인
    if (data && data.success) {
      return {
        success: true,
        message: data.message || '슬롯이 성공적으로 완료되었습니다.',
        data: data
      };
    } else {
      return {
        success: false,
        message: data?.message || '슬롯 확인 처리에 실패했습니다.',
        data: data
      };
    }
  } catch (err: any) {
    console.error('슬롯 확인 처리 오류:', err);
    return {
      success: false,
      message: err.message || '슬롯 확인 처리 중 오류가 발생했습니다.'
    };
  }
};

// 슬롯 연장 가능 여부 체크 함수
export const checkExtensionEligibility = async (
  slotId: string
): Promise<{
  isEligible: boolean;
  message: string;
  daysUntilEnd?: number;
  slotData?: any;
}> => {
  try {
    // 1. 슬롯 정보 조회
    const { data: slot, error: slotError } = await supabase
      .from('slots')
      .select('*, campaigns(*)')
      .eq('id', slotId)
      .single();

    if (slotError || !slot) {
      return {
        isEligible: false,
        message: '슬롯 정보를 찾을 수 없습니다.'
      };
    }

    // 2. 상태 체크 (active 또는 approved 상태여야 함)
    if (slot.status !== 'active' && slot.status !== 'approved') {
      return {
        isEligible: false,
        message: '진행 중인 슬롯만 연장 신청이 가능합니다.'
      };
    }

    // 3. 종료일 체크
    if (!slot.end_date) {
      return {
        isEligible: false,
        message: '종료일이 설정되지 않은 슬롯입니다.'
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(slot.end_date);
    endDate.setHours(0, 0, 0, 0);
    
    const daysUntilEnd = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // 4. 종료일 3일 이내 체크
    if (daysUntilEnd > 3) {
      return {
        isEligible: false,
        message: `종료 3일 전부터 연장 신청이 가능합니다. (${daysUntilEnd}일 남음)`,
        daysUntilEnd
      };
    }

    // 이미 종료된 슬롯 체크
    if (daysUntilEnd < 0) {
      return {
        isEligible: false,
        message: '이미 종료된 슬롯은 연장할 수 없습니다.',
        daysUntilEnd
      };
    }

    // 5. 이미 연장 신청한 슬롯이 있는지 체크
    const { data: existingExtension, error: extensionError } = await supabase
      .from('slots')
      .select('id, status')
      .eq('parent_slot_id', slotId)
      .eq('is_extension', true)
      .in('status', ['pending', 'approved', 'active']);

    if (existingExtension && existingExtension.length > 0) {
      const status = existingExtension[0].status;
      const statusText = status === 'pending' ? '대기 중인' : 
                        status === 'approved' ? '승인된' : '진행 중인';
      return {
        isEligible: false,
        message: `이미 ${statusText} 연장 신청이 있습니다.`
      };
    }

    // 6. 환불된 슬롯 체크
    const { data: refundRequest } = await supabase
      .from('slot_refund_approvals')
      .select('status')
      .eq('slot_id', slotId)
      .in('status', ['pending', 'approved']);

    if (refundRequest && refundRequest.length > 0) {
      return {
        isEligible: false,
        message: '환불 처리 중이거나 환불된 슬롯은 연장할 수 없습니다.'
      };
    }

    return {
      isEligible: true,
      message: '연장 신청이 가능합니다.',
      daysUntilEnd,
      slotData: slot
    };
  } catch (error) {
    console.error('연장 가능 여부 체크 중 오류:', error);
    return {
      isEligible: false,
      message: '연장 가능 여부 확인 중 오류가 발생했습니다.'
    };
  }
};

// 슬롯 연장 신청 생성 함수
export const createExtensionRequest = async (
  originalSlotId: string,
  userId: string,
  extensionDays: number,
  notes?: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    // 1. 연장 가능 여부 재확인
    const eligibility = await checkExtensionEligibility(originalSlotId);
    if (!eligibility.isEligible) {
      return {
        success: false,
        message: eligibility.message
      };
    }

    const originalSlot = eligibility.slotData;
    if (!originalSlot) {
      throw new Error('원본 슬롯 정보를 찾을 수 없습니다.');
    }

    // 2. 캠페인 정보 확인
    const campaign = originalSlot.campaigns;
    if (!campaign) {
      throw new Error('캠페인 정보를 찾을 수 없습니다.');
    }

    const unitPrice = parseFloat(String(campaign.unit_price || 0));
    const totalPrice = Math.ceil(unitPrice * 1.1); // VAT 포함

    // 3. 사용자 잔액 확인
    const { data: userBalance, error: balanceError } = await supabase
      .from('user_balances')
      .select('paid_balance, free_balance, total_balance')
      .eq('user_id', userId)
      .single();

    if (balanceError || !userBalance) {
      throw new Error('잔액 정보를 확인할 수 없습니다.');
    }

    const paidBalance = parseFloat(String(userBalance.paid_balance || 0));

    if (paidBalance < totalPrice) {
      return {
        success: false,
        message: `잔액이 부족합니다. 필요 금액: ${totalPrice.toLocaleString()}원, 현재 잔액: ${paidBalance.toLocaleString()}원`
      };
    }

    // 4. 새 슬롯 데이터 준비
    // 원본 슬롯의 종료일 다음날부터 시작하도록 예상 날짜 계산
    let expectedStartDate = null;
    let expectedEndDate = null;
    
    if (originalSlot.end_date) {
      // 원본 슬롯의 end_date를 로컬 시간대로 파싱
      const [year, month, day] = originalSlot.end_date.split('-').map(Number);
      const originalEndDate = new Date(year, month - 1, day);
      
      // 연장 슬롯은 원본 종료일 다음날부터 시작
      // setDate는 월을 넘어가는 경우를 제대로 처리하지 못할 수 있으므로
      // 하루(밀리초)를 더하는 방식으로 처리
      const extensionStartDate = new Date(originalEndDate.getTime() + 24 * 60 * 60 * 1000);
      
      // 연장 종료일 계산
      const extensionEndDate = new Date(extensionStartDate);
      extensionEndDate.setDate(extensionStartDate.getDate() + extensionDays - 1);
      
      // 날짜를 YYYY-MM-DD 형식으로 변환 (로컬 시간대 유지)
      const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      expectedStartDate = formatDate(extensionStartDate);
      expectedEndDate = formatDate(extensionEndDate);
    } else {
      console.log('[연장 슬롯 생성] 경고: 원본 슬롯에 end_date가 없습니다!');
    }
    
    // quantity 값 추출 (원본 슬롯에서)
    const quantity = originalSlot.quantity || 
                    originalSlot.input_data?.workCount || 
                    originalSlot.input_data?.['작업량'] ||
                    originalSlot.input_data?.quantity || 
                    originalSlot.input_data?.['타수'] || 
                    originalSlot.input_data?.['일일 타수'] || 
                    originalSlot.input_data?.['일일타수'] || 
                    0;
    
    const newSlotData = {
      mat_id: originalSlot.mat_id,
      product_id: originalSlot.product_id,
      user_id: userId,
      status: 'pending',
      quantity: quantity,              // quantity 필드 추가
      start_date: expectedStartDate,   // 예상 시작일 설정
      end_date: expectedEndDate,       // 예상 종료일 설정
      input_data: {
        ...originalSlot.input_data,
        work_days: extensionDays,
        extension_note: notes,
        is_extension: true,
        original_slot_number: originalSlot.user_slot_number
      },
      parent_slot_id: originalSlotId,
      is_extension: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 5. 새 슬롯 생성
    const { data: newSlot, error: insertError } = await supabase
      .from('slots')
      .insert(newSlotData)
      .select()
      .single();

    if (insertError || !newSlot) {
      throw new Error('연장 슬롯 생성에 실패했습니다.');
    }

    // 6. 캐시 차감 처리 (유료 캐시만 사용)
    // 잔액 업데이트
    const { error: updateBalanceError } = await supabase
      .from('user_balances')
      .update({
        paid_balance: paidBalance - totalPrice,
        total_balance: paidBalance - totalPrice,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateBalanceError) {
      throw new Error('잔액 업데이트에 실패했습니다.');
    }

    // 7. 캐시 사용 내역 기록
    await supabase
      .from('user_cash_history')
      .insert({
        user_id: userId,
        amount: -totalPrice,
        transaction_type: 'purchase',
        reference_id: newSlot.id,
        description: `슬롯 연장: ${campaign.campaign_name}`,
        transaction_at: new Date().toISOString(),
        mat_id: originalSlot.mat_id,
        balance_type: 'paid'
      });

    // 8. slot_pending_balances 생성
    await supabase
      .from('slot_pending_balances')
      .insert({
        slot_id: newSlot.id,
        user_id: userId,
        product_id: originalSlot.product_id,
        amount: totalPrice,
        status: 'pending',
        notes: JSON.stringify({
          is_extension: true,
          original_slot_id: originalSlotId,
          extension_days: extensionDays,
          payment_details: {
            paid_balance_used: totalPrice,
            total_amount: totalPrice
          }
        }),
        created_at: new Date().toISOString()
      });

    // 9. 이력 기록
    await supabase
      .from('slot_history_logs')
      .insert({
        slot_id: newSlot.id,
        action: 'extension_request',
        old_status: null,
        new_status: 'pending',
        user_id: userId,
        details: {
          original_slot_id: originalSlotId,
          extension_days: extensionDays,
          notes: notes,
          amount: totalPrice,
          payment_details: {
            paid_balance_used: totalPrice
          }
        },
        created_at: new Date().toISOString()
      });

    // 10. 알림 생성 (총판에게)
    try {
      await createSlotExtensionRequestNotification(
        originalSlot.mat_id,
        originalSlot.id,
        campaign.campaign_name || `캠페인 #${originalSlot.product_id}`,
        extensionDays,
        '사용자'
      );
    } catch (notifyError) {
      console.error('알림 생성 실패:', notifyError);
    }

    return {
      success: true,
      message: '슬롯 연장 신청이 완료되었습니다.',
      data: newSlot
    };
  } catch (err: any) {
    console.error('슬롯 연장 신청 중 오류:', err);
    return {
      success: false,
      message: err.message || '슬롯 연장 신청 중 오류가 발생했습니다.'
    };
  }
};

export default {
  approveSlot,
  rejectSlot,
  updateSlotMemo,
  createSlot,
  getSlotList,
  completeSlotByMat,
  confirmSlotByUser,
  checkExtensionEligibility,
  createExtensionRequest
};