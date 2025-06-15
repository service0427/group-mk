// 보장성 슬롯 서비스
// 작성일: 2025-06-15

import { supabase } from '@/supabase';
import type {
  GuaranteeSlotRequest,
  GuaranteeSlotNegotiation,
  GuaranteeSlot,
  GuaranteeSlotHolding,
  GuaranteeSlotSettlement,
  GuaranteeSlotTransaction,
  CreateGuaranteeSlotRequestParams,
  CreateNegotiationMessageParams,
  PurchaseGuaranteeSlotParams,
  ConfirmRankAchievementParams,
  GuaranteeSlotRequestFilter,
  GuaranteeSlotFilter,
  GuaranteeSlotRequestStatus,
  GuaranteeSlotStatus,
} from '@/types/guarantee-slot.types';

// 보장성 슬롯 견적 요청 관련
export const guaranteeSlotRequestService = {
  // 견적 요청 생성
  async createRequest(params: CreateGuaranteeSlotRequestParams, userId: string) {
    try {
      // 캠페인 정보 확인
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', params.campaign_id)
        .eq('slot_type', 'guarantee')
        .single();

      if (campaignError || !campaign) {
        throw new Error('유효하지 않은 보장성 캠페인입니다.');
      }

      // 견적 요청 생성
      const { data, error } = await supabase
        .from('guarantee_slot_requests')
        .insert({
          campaign_id: params.campaign_id,
          user_id: userId,
          distributor_id: campaign.mat_id, // 캠페인의 담당 총판
          target_rank: params.target_rank,
          guarantee_count: params.guarantee_count,
          initial_budget: params.initial_budget,
          status: 'requested' as GuaranteeSlotRequestStatus,
        })
        .select()
        .single();

      if (error) throw error;

      // 초기 메시지 생성 (선택사항)
      if (params.message) {
        await supabase.from('guarantee_slot_negotiations').insert({
          request_id: data.id,
          sender_id: userId,
          sender_type: 'user',
          message_type: 'message',
          message: params.message,
        });
      }

      return { data, error: null };
    } catch (error) {
      console.error('견적 요청 생성 실패:', error);
      return { data: null, error };
    }
  },

  // 견적 요청 목록 조회
  async getRequests(filter: GuaranteeSlotRequestFilter = {}) {
    try {
      // 먼저 기본 데이터만 가져오기
      let query = supabase
        .from('guarantee_slot_requests')
        .select('*')
        .order('created_at', { ascending: false });

      // 필터 적용
      if (filter.user_id) query = query.eq('user_id', filter.user_id);
      if (filter.distributor_id) query = query.eq('distributor_id', filter.distributor_id);
      if (filter.status) query = query.eq('status', filter.status);
      if (filter.campaign_id) query = query.eq('campaign_id', filter.campaign_id);

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('견적 요청 목록 조회 실패:', error);
      return { data: null, error };
    }
  },

  // 견적 요청 상태 업데이트
  async updateRequestStatus(requestId: string, status: GuaranteeSlotRequestStatus, finalDailyAmount?: number) {
    try {
      const updateData: any = { status };
      if (finalDailyAmount !== undefined) {
        updateData.final_daily_amount = finalDailyAmount;
      }

      const { data, error } = await supabase
        .from('guarantee_slot_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('견적 요청 상태 업데이트 실패:', error);
      return { data: null, error };
    }
  },

  // 특정 견적 요청 조회
  async getRequestById(requestId: string) {
    try {
      const { data, error } = await supabase
        .from('guarantee_slot_requests')
        .select(`
          *,
          campaigns (
            id,
            campaign_name,
            service_type,
            mat_id,
            min_guarantee_price,
            max_guarantee_price
          ),
          negotiations:guarantee_slot_negotiations (*)
        `)
        .eq('id', requestId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('견적 요청 조회 실패:', error);
      return { data: null, error };
    }
  },
};

// 협상 메시지 관련
export const negotiationService = {
  // 협상 메시지 생성
  async createMessage(params: CreateNegotiationMessageParams, senderId: string, senderType: 'user' | 'distributor') {
    try {
      const { data, error } = await supabase
        .from('guarantee_slot_negotiations')
        .insert({
          request_id: params.request_id,
          sender_id: senderId,
          sender_type: senderType,
          message_type: params.message_type,
          message: params.message,
          proposed_daily_amount: params.proposed_daily_amount,
        })
        .select()
        .single();

      if (error) throw error;

      // 협상 중 상태로 업데이트
      if (params.message_type === 'price_proposal' || params.message_type === 'counter_offer') {
        await guaranteeSlotRequestService.updateRequestStatus(params.request_id, 'negotiating');
      }

      return { data, error: null };
    } catch (error) {
      console.error('협상 메시지 생성 실패:', error);
      return { data: null, error };
    }
  },

  // 메시지 읽음 처리
  async markAsRead(messageIds: string[]) {
    try {
      const { error } = await supabase
        .from('guarantee_slot_negotiations')
        .update({ is_read: true })
        .in('id', messageIds);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('메시지 읽음 처리 실패:', error);
      return { error };
    }
  },
};

// 보장성 슬롯 관련
export const guaranteeSlotService = {
  // 보장성 슬롯 구매
  async purchaseSlot(params: PurchaseGuaranteeSlotParams, userId: string) {
    try {
      // 견적 요청 정보 조회
      const { data: request, error: requestError } = await supabase
        .from('guarantee_slot_requests')
        .select('*, campaigns(*)')
        .eq('id', params.request_id)
        .eq('user_id', userId)
        .eq('status', 'accepted')
        .single();

      if (requestError || !request) {
        throw new Error('유효하지 않은 견적 요청입니다.');
      }

      if (!request.final_daily_amount) {
        throw new Error('최종 가격이 확정되지 않았습니다.');
      }

      const totalAmount = request.final_daily_amount * request.guarantee_count * 1.1; // 부가세 10% 포함

      // 사용자 잔액 확인
      const { data: userBalance, error: balanceError } = await supabase
        .from('users')
        .select('cash_amount, free_cash_amount')
        .eq('id', userId)
        .single();

      if (balanceError || !userBalance) {
        throw new Error('사용자 정보를 조회할 수 없습니다.');
      }

      const totalBalance = (userBalance.cash_amount || 0) + (userBalance.free_cash_amount || 0);
      if (totalBalance < totalAmount) {
        throw new Error('잔액이 부족합니다.');
      }

      // Edge Function 호출로 구매 처리
      const { data, error } = await supabase.functions.invoke('purchase-guarantee-slot', {
        body: {
          request_id: params.request_id,
          user_id: userId,
          purchase_reason: params.purchase_reason,
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('보장성 슬롯 구매 실패:', error);
      return { data: null, error };
    }
  },

  // 보장성 슬롯 목록 조회
  async getSlots(filter: GuaranteeSlotFilter = {}) {
    try {
      let query = supabase
        .from('guarantee_slots')
        .select(`
          *,
          campaigns:product_id (
            id,
            campaign_name,
            service_type
          ),
          users!guarantee_slots_user_id_fkey (
            id,
            email,
            full_name
          ),
          distributors:users!guarantee_slots_distributor_id_fkey (
            id,
            email,
            full_name
          ),
          holdings:guarantee_slot_holdings (*)
        `)
        .order('created_at', { ascending: false });

      // 필터 적용
      if (filter.user_id) query = query.eq('user_id', filter.user_id);
      if (filter.distributor_id) query = query.eq('distributor_id', filter.distributor_id);
      if (filter.status) query = query.eq('status', filter.status);
      if (filter.product_id) query = query.eq('product_id', filter.product_id);

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('보장성 슬롯 목록 조회 실패:', error);
      return { data: null, error };
    }
  },

  // 특정 보장성 슬롯 조회
  async getSlotById(slotId: string) {
    try {
      const { data, error } = await supabase
        .from('guarantee_slots')
        .select(`
          *,
          campaigns:product_id (*),
          settlements:guarantee_slot_settlements (*),
          holdings:guarantee_slot_holdings (*),
          transactions:guarantee_slot_transactions (*)
        `)
        .eq('id', slotId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('보장성 슬롯 조회 실패:', error);
      return { data: null, error };
    }
  },

  // 순위 달성 확인
  async confirmRankAchievement(params: ConfirmRankAchievementParams, distributorId: string) {
    try {
      // 슬롯 정보 확인
      const { data: slot, error: slotError } = await supabase
        .from('guarantee_slots')
        .select('*')
        .eq('id', params.guarantee_slot_id)
        .eq('distributor_id', distributorId)
        .eq('status', 'active')
        .single();

      if (slotError || !slot) {
        throw new Error('유효하지 않은 슬롯입니다.');
      }

      // 오늘 이미 확인했는지 체크
      const today = new Date().toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('guarantee_slot_settlements')
        .select('id')
        .eq('guarantee_slot_id', params.guarantee_slot_id)
        .eq('confirmed_date', today)
        .single();

      if (existing) {
        throw new Error('오늘은 이미 확인이 완료되었습니다.');
      }

      const isGuaranteed = params.achieved_rank <= slot.target_rank;
      const amount = isGuaranteed ? slot.daily_guarantee_amount : 0;

      // 정산 내역 생성
      const { data, error } = await supabase
        .from('guarantee_slot_settlements')
        .insert({
          guarantee_slot_id: params.guarantee_slot_id,
          confirmed_date: today,
          confirmed_by: distributorId,
          target_rank: slot.target_rank,
          achieved_rank: params.achieved_rank,
          is_guaranteed: isGuaranteed,
          amount,
          notes: params.notes,
        })
        .select()
        .single();

      if (error) throw error;

      // 달성 횟수 업데이트
      if (isGuaranteed) {
        const newCompletedCount = slot.completed_count + 1;
        await supabase
          .from('guarantee_slots')
          .update({
            completed_count: newCompletedCount,
            status: newCompletedCount >= slot.guarantee_count ? 'completed' : 'active',
          })
          .eq('id', params.guarantee_slot_id);

        // 홀딩 금액 이동 (사용자 → 총판)
        await this.updateHolding(params.guarantee_slot_id, amount);
      }

      return { data, error: null };
    } catch (error) {
      console.error('순위 달성 확인 실패:', error);
      return { data: null, error };
    }
  },

  // 홀딩 금액 업데이트 (내부 함수)
  async updateHolding(slotId: string, amount: number) {
    try {
      const { data: holding, error: holdingError } = await supabase
        .from('guarantee_slot_holdings')
        .select('*')
        .eq('guarantee_slot_id', slotId)
        .single();

      if (holdingError || !holding) return;

      const newUserHolding = Math.max(0, holding.user_holding_amount - amount);
      const newDistributorHolding = holding.distributor_holding_amount + amount;

      await supabase
        .from('guarantee_slot_holdings')
        .update({
          user_holding_amount: newUserHolding,
          distributor_holding_amount: newDistributorHolding,
          status: newUserHolding === 0 ? 'completed' : 'holding',
        })
        .eq('id', holding.id);
    } catch (error) {
      console.error('홀딩 업데이트 실패:', error);
    }
  },
};

// 통계 및 유틸리티
export const guaranteeSlotUtils = {
  // 총 금액 계산 (부가세 포함)
  calculateTotalAmount(dailyAmount: number, guaranteeCount: number): number {
    return dailyAmount * guaranteeCount * 1.1; // 부가세 10%
  },

  // 진행률 계산
  calculateProgress(completedCount: number, guaranteeCount: number): number {
    return Math.round((completedCount / guaranteeCount) * 100);
  },

  // 예상 완료일 계산
  estimateCompletionDate(startDate: string, completedCount: number, guaranteeCount: number): Date | null {
    if (completedCount === 0) return null;
    
    const start = new Date(startDate);
    const today = new Date();
    const daysPassed = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const averageDaysPerCompletion = daysPassed / completedCount;
    const remainingCount = guaranteeCount - completedCount;
    const estimatedDaysRemaining = Math.ceil(remainingCount * averageDaysPerCompletion);
    
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + estimatedDaysRemaining);
    
    return estimatedDate;
  },
};