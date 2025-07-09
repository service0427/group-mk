import { supabase } from '@/supabase';
import { checkSingleKeywordRanking, extractKeywordsFromSlot } from '@/services/rankingCheckService';

export interface SlotModificationRequest {
  id?: string;
  slot_id: string;
  requester_id: string;
  approver_id?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  request_type: 'keyword' | 'mid' | 'both' | 'url';
  old_data: Record<string, any>;
  new_data: Record<string, any>;
  request_reason?: string;
  approval_notes?: string;
  request_date?: string;
  approval_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SlotModificationRequestWithDetails extends SlotModificationRequest {
  slots?: {
    user_slot_number: number;
    mat_id: string;
    product_id: number;
    status: string;
    input_data: any;
    users?: {
      full_name: string;
    };
    campaigns?: {
      campaign_name: string;
      service_type: string;
    };
  };
  requester?: {
    full_name: string;
    email: string;
  };
  approver?: {
    full_name: string;
  };
}

/**
 * 키워드 중복 체크 함수
 */
export const checkDuplicateKeyword = async (
  userId: string,
  campaignId: number,
  keyword: string,
  excludeSlotId?: string
): Promise<{ isDuplicate: boolean; duplicateSlots?: any[] }> => {
  try {
    // 해당 캠페인의 ranking_field_mapping 조회
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('ranking_field_mapping')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign?.ranking_field_mapping) {
      return { isDuplicate: false };
    }

    const keywordField = campaign.ranking_field_mapping.keyword;
    if (!keywordField) {
      return { isDuplicate: false };
    }

    // 사용자의 진행중/승인된 슬롯 중에서 동일한 키워드를 가진 슬롯 조회
    let query = supabase
      .from('slots')
      .select('id, user_slot_number, status, input_data')
      .eq('user_id', userId)
      .eq('product_id', campaignId)
      .in('status', ['pending', 'approved', 'active', 'pending_user_confirm']);

    if (excludeSlotId) {
      query = query.neq('id', excludeSlotId);
    }

    const { data: slots, error: slotsError } = await query;

    if (slotsError || !slots) {
      return { isDuplicate: false };
    }

    // 동일한 키워드를 가진 슬롯 찾기
    const duplicateSlots = slots.filter(slot => {
      const slotKeyword = slot.input_data?.[keywordField];
      return slotKeyword && slotKeyword.toLowerCase() === keyword.toLowerCase();
    });

    return {
      isDuplicate: duplicateSlots.length > 0,
      duplicateSlots
    };
  } catch (error) {
    console.error('키워드 중복 체크 실패:', error);
    return { isDuplicate: false };
  }
};

/**
 * 슬롯 수정 요청 생성
 */
export const createSlotModificationRequest = async (
  slotId: string,
  requestType: 'keyword' | 'mid' | 'both' | 'url',
  oldData: Record<string, any>,
  newData: Record<string, any>,
  requestReason?: string
): Promise<{ success: boolean; data?: SlotModificationRequest; error?: any }> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      throw new Error('사용자 인증 정보를 가져올 수 없습니다.');
    }

    // 키워드 변경이 포함된 경우 중복 체크
    if (requestType === 'keyword' || requestType === 'both') {
      // 슬롯 정보 조회
      const { data: slotInfo } = await supabase
        .from('slots')
        .select('product_id, campaigns!inner(ranking_field_mapping)')
        .eq('id', slotId)
        .single();

      if (slotInfo?.campaigns) {
        const campaign = Array.isArray(slotInfo.campaigns) ? slotInfo.campaigns[0] : slotInfo.campaigns;
        const keywordField = campaign.ranking_field_mapping?.keyword;
        
        if (keywordField && newData[keywordField]) {
          const duplicateCheck = await checkDuplicateKeyword(
            userData.user.id,
            slotInfo.product_id,
            newData[keywordField],
            slotId
          );

          if (duplicateCheck.isDuplicate) {
            throw new Error('동일한 키워드가 이미 사용 중입니다.');
          }
        }
      }
    }

    const { data, error } = await supabase
      .from('slot_modification_requests')
      .insert({
        slot_id: slotId,
        requester_id: userData.user.id,
        status: 'pending',
        request_type: requestType,
        old_data: oldData,
        new_data: newData,
        request_reason: requestReason
      })
      .select()
      .single();

    if (error) throw error;

    // 총판에게 알림 전송
    const { data: slotData } = await supabase
      .from('slots')
      .select('mat_id, campaigns!inner(campaign_name)')
      .eq('id', slotId)
      .single();

    if (slotData?.mat_id) {
      const campaign = Array.isArray(slotData.campaigns) ? slotData.campaigns[0] : slotData.campaigns;
      await supabase
        .from('notifications')
        .insert({
          user_id: slotData.mat_id,
          type: 'slot',
          title: '슬롯 수정 요청',
          message: `${campaign?.campaign_name || '슬롯'}에 대한 수정 요청이 있습니다.`,
          priority: 'high',
          status: 'unread'
        });
    }

    return { success: true, data };
  } catch (error) {
    console.error('슬롯 수정 요청 생성 실패:', error);
    return { success: false, error };
  }
};

/**
 * 슬롯의 대기 중인 수정 요청 조회
 */
export const getPendingModificationRequest = async (
  slotId: string
): Promise<{ success: boolean; data?: SlotModificationRequest; error?: any }> => {
  try {
    const { data, error } = await supabase
      .from('slot_modification_requests')
      .select('*')
      .eq('slot_id', slotId)
      .eq('status', 'pending')
      .order('request_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('수정 요청 조회 실패:', error);
    return { success: false, error };
  }
};

/**
 * 수정 요청 목록 조회 (총판/운영자용)
 */
export const getModificationRequests = async (
  filters?: {
    status?: string;
    requester_id?: string;
    approver_id?: string;
    mat_id?: string;
  },
  pagination?: {
    page: number;
    limit: number;
  }
): Promise<{ 
  success: boolean; 
  data?: SlotModificationRequestWithDetails[]; 
  count?: number;
  error?: any 
}> => {
  try {
    let query = supabase
      .from('slot_modification_requests')
      .select(`
        *,
        slots!inner(
          user_slot_number,
          mat_id,
          product_id,
          status,
          input_data,
          campaigns!inner(
            campaign_name,
            service_type
          )
        ),
        requester:users!requester_id(
          full_name,
          email
        ),
        approver:users!approver_id(
          full_name
        )
      `, { count: 'exact' });

    // 필터 적용
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.requester_id) {
      query = query.eq('requester_id', filters.requester_id);
    }
    if (filters?.approver_id) {
      query = query.eq('approver_id', filters.approver_id);
    }
    if (filters?.mat_id) {
      query = query.eq('slots.mat_id', filters.mat_id);
    }

    // 정렬
    query = query.order('request_date', { ascending: false });

    // 페이지네이션
    if (pagination) {
      const from = (pagination.page - 1) * pagination.limit;
      const to = from + pagination.limit - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return { success: true, data, count: count || 0 };
  } catch (error) {
    console.error('수정 요청 목록 조회 실패:', error);
    return { success: false, error };
  }
};

/**
 * 수정 요청 승인
 */
export const approveModificationRequest = async (
  requestId: string,
  approvalNotes?: string
): Promise<{ success: boolean; message?: string; error?: any }> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      throw new Error('사용자 인증 정보를 가져올 수 없습니다.');
    }

    // RPC 함수 호출
    const { data, error } = await supabase
      .rpc('approve_slot_modification_request', {
        p_request_id: requestId,
        p_approver_id: userData.user.id,
        p_approval_notes: approvalNotes
      });

    if (error) throw error;
    
    if (!data?.success) {
      throw new Error(data?.message || '수정 요청 승인에 실패했습니다.');
    }

    // 승인 후 키워드 체크 및 keyword_id 업데이트 (슬롯 승인과 동일한 로직)
    try {
      // 승인된 수정 요청의 슬롯 정보 조회
      const { data: requestInfo } = await supabase
        .from('slot_modification_requests')
        .select('slot_id, request_type')
        .eq('id', requestId)
        .single();

      if (!requestInfo) return { success: true, message: data.message };

      const { data: slotData } = await supabase
        .from('slots')
        .select(`
          *,
          campaigns!inner(
            service_type,
            ranking_field_mapping
          )
        `)
        .eq('id', requestInfo.slot_id)
        .single();

      if (slotData && slotData.campaigns?.service_type?.startsWith('NaverShopping')) {
        const fieldMapping = slotData.campaigns.ranking_field_mapping;
        const keywords = extractKeywordsFromSlot(slotData.input_data, fieldMapping);
        
        if (keywords.length > 0 && (requestInfo.request_type === 'keyword' || requestInfo.request_type === 'both')) {
          // 키워드 API 호출 후 keyword_id 업데이트
          checkSingleKeywordRanking(keywords[0]).then(async (result) => {
            // API 호출 성공 시 새 keyword_id 찾아서 업데이트
            if (result) {
              const { data: newKeywordData } = await supabase
                .from('search_keywords')
                .select('id')
                .eq('keyword', keywords[0])
                .eq('type', 'shopping')
                .single();
                
              if (newKeywordData) {
                await supabase
                  .from('slots')
                  .update({ keyword_id: newKeywordData.id })
                  .eq('id', requestInfo.slot_id);
              }
            }
          }).catch(err => 
            console.error('[순위체크API] 수정 승인 후 키워드 API 호출 실패:', err)
          );
        }
      }
    } catch (err) {
      // 키워드 체크 실패해도 승인은 완료
      console.error('키워드 체크 중 오류:', err);
    }

    return { success: true, message: data.message };
  } catch (error) {
    console.error('수정 요청 승인 실패:', error);
    return { success: false, error };
  }
};

/**
 * 수정 요청 반려
 */
export const rejectModificationRequest = async (
  requestId: string,
  rejectionReason: string
): Promise<{ success: boolean; message?: string; error?: any }> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      throw new Error('사용자 인증 정보를 가져올 수 없습니다.');
    }

    // RPC 함수 호출
    const { data, error } = await supabase
      .rpc('reject_slot_modification_request', {
        p_request_id: requestId,
        p_approver_id: userData.user.id,
        p_rejection_reason: rejectionReason
      });

    if (error) throw error;
    
    if (!data?.success) {
      throw new Error(data?.message || '수정 요청 반려에 실패했습니다.');
    }

    return { success: true, message: data.message };
  } catch (error) {
    console.error('수정 요청 반려 실패:', error);
    return { success: false, error };
  }
};

/**
 * 수정 요청 취소 (요청자용)
 */
export const cancelModificationRequest = async (
  requestId: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      throw new Error('사용자 인증 정보를 가져올 수 없습니다.');
    }

    const { error } = await supabase
      .from('slot_modification_requests')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .eq('requester_id', userData.user.id)
      .eq('status', 'pending');

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('수정 요청 취소 실패:', error);
    return { success: false, error };
  }
};

/**
 * 슬롯의 수정 요청 이력 조회
 */
export const getSlotModificationHistory = async (
  slotId: string
): Promise<{ success: boolean; data?: SlotModificationRequestWithDetails[]; error?: any }> => {
  try {
    const { data, error } = await supabase
      .from('slot_modification_requests')
      .select(`
        *,
        requester:users!requester_id(
          full_name,
          email
        ),
        approver:users!approver_id(
          full_name
        )
      `)
      .eq('slot_id', slotId)
      .order('request_date', { ascending: false });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('수정 요청 이력 조회 실패:', error);
    return { success: false, error };
  }
};

/**
 * 슬롯 입력 데이터 직접 수정 (대기중 상태 슬롯용)
 */
export const updateSlotInputData = async (
  slotId: string,
  inputData: Record<string, any>
): Promise<{ success: boolean; error?: any }> => {
  try {
    // 현재 사용자 정보 가져오기
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      throw new Error('사용자 인증 정보를 가져올 수 없습니다.');
    }

    // 슬롯 정보 조회
    const { data: slotInfo } = await supabase
      .from('slots')
      .select('product_id, input_data, campaigns!inner(ranking_field_mapping)')
      .eq('id', slotId)
      .single();

    if (slotInfo?.campaigns) {
      const campaign = Array.isArray(slotInfo.campaigns) ? slotInfo.campaigns[0] : slotInfo.campaigns;
      const keywordField = campaign.ranking_field_mapping?.keyword;
      
      // 키워드가 변경되었는지 확인
      if (keywordField && 
          inputData[keywordField] && 
          inputData[keywordField] !== slotInfo.input_data?.[keywordField]) {
        
        // 중복 체크
        const duplicateCheck = await checkDuplicateKeyword(
          userData.user.id,
          slotInfo.product_id,
          inputData[keywordField],
          slotId
        );

        if (duplicateCheck.isDuplicate) {
          throw new Error('동일한 키워드가 이미 사용 중입니다.');
        }
      }
    }

    const { error } = await supabase
      .from('slots')
      .update({
        input_data: inputData,
        updated_at: new Date().toISOString()
      })
      .eq('id', slotId)
      .eq('status', 'pending'); // 대기중 상태의 슬롯만 수정 가능

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('슬롯 데이터 수정 실패:', error);
    return { success: false, error };
  }
};