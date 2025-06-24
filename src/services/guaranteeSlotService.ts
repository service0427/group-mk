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
import {
  createGuaranteeQuoteRequestNotification,
  createNegotiationMessageNotification,
  createGuaranteePurchaseNotification,
  createGuaranteeApprovalNotification,
  createNegotiationCompleteNotification,
  createRenegotiationRequestNotification
} from '@/utils/notificationActions';
import { SERVICE_TYPE_TO_CATEGORY } from '@/pages/advertise/campaigns/components/campaign-components/constants';

// 서비스 타입을 한글명으로 변환하는 함수
const getServiceTypeName = (serviceType: string): string => {
  return SERVICE_TYPE_TO_CATEGORY[serviceType] || serviceType;
};

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

      // 견적 요청 데이터 준비
      const requestData: any = {
        campaign_id: params.campaign_id,
        user_id: userId,
        distributor_id: campaign.mat_id, // 캠페인의 담당 총판
        target_rank: params.target_rank,
        guarantee_count: params.guarantee_count,
        guarantee_period: params.guarantee_period,
        initial_budget: params.initial_budget,
        budget_type: params.budget_type || 'daily',
        status: 'requested' as GuaranteeSlotRequestStatus,
        input_data: params.input_data || {},
        start_date: params.start_date,
        end_date: params.end_date,
        quantity: params.quantity || 1,
        user_reason: params.user_reason,
        additional_requirements: params.additional_requirements,
      };

      // keyword_id가 있고 양수인 경우에만 추가 (수동 입력은 -1이므로 제외)
      if (params.keyword_id && params.keyword_id > 0) {
        requestData.keyword_id = params.keyword_id;
      }

      // 견적 요청 생성
      const { data, error } = await supabase
        .from('guarantee_slot_requests')
        .insert(requestData)
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

      // 총판에게 알림 전송
      const serviceName = getServiceTypeName(campaign.service_type);
      await createGuaranteeQuoteRequestNotification(
        campaign.mat_id,
        campaign.campaign_name,
        data.id,
        serviceName,
        campaign.slot_type
      );

      return { data, error: null };
    } catch (error) {
      console.error('견적 요청 생성 실패:', error);
      return { data: null, error };
    }
  },

  // 견적 요청 목록 조회
  async getRequests(filter: GuaranteeSlotRequestFilter = {}) {
    try {
      // 캠페인 정보와 함께 가져오기
      let query = supabase
        .from('guarantee_slot_requests')
        .select(`
          *,
          campaigns (
            id,
            campaign_name,
            service_type,
            mat_id,
            min_guarantee_price,
            max_guarantee_price,
            guarantee_unit,
            logo,
            status
          ),
          keywords (
            id,
            main_keyword,
            keyword1,
            keyword2,
            keyword3,
            url,
            mid
          )
        `)
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
  async updateRequestStatus(
    requestId: string,
    status: GuaranteeSlotRequestStatus,
    finalDailyAmount?: number,
    finalGuaranteeCount?: number,
    finalBudgetType?: 'daily' | 'total',
    finalTotalAmount?: number,
    finalTargetRank?: number,
    finalGuaranteePeriod?: number
  ) {
    try {
      const updateData: any = { status };
      if (finalDailyAmount !== undefined) {
        updateData.final_daily_amount = finalDailyAmount;
      }
      if (finalGuaranteeCount !== undefined) {
        updateData.guarantee_count = finalGuaranteeCount;
      }
      if (finalBudgetType !== undefined) {
        updateData.final_budget_type = finalBudgetType;
      }
      if (finalTotalAmount !== undefined) {
        updateData.final_total_amount = finalTotalAmount;
      }
      if (finalTargetRank !== undefined) {
        updateData.target_rank = finalTargetRank;
      }
      if (finalGuaranteePeriod !== undefined) {
        updateData.guarantee_period = finalGuaranteePeriod;
      }

      const { data, error } = await supabase
        .from('guarantee_slot_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      // 협상이 완료(accepted)된 경우 사용자에게 구매 가능 알림 전송
      if (status === 'accepted' && finalDailyAmount) {
        // 캠페인 정보와 키워드 정보 조회
        const { data: requestInfo } = await supabase
          .from('guarantee_slot_requests')
          .select(`
            *,
            campaigns (
              campaign_name,
              service_type,
              slot_type
            ),
            keywords (
              main_keyword
            )
          `)
          .eq('id', requestId)
          .single();

        if (requestInfo) {
          const serviceName = getServiceTypeName(requestInfo.campaigns?.service_type || '');

          // 키워드 정보 가져오기
          let keyword = '';
          if (requestInfo.keywords?.main_keyword) {
            keyword = requestInfo.keywords.main_keyword;
          } else if (requestInfo.input_data?.keyword) {
            keyword = requestInfo.input_data.keyword;
          }

          await createNegotiationCompleteNotification(
            requestInfo.user_id,
            requestInfo.campaigns?.campaign_name || '캠페인',
            requestId,
            serviceName,
            requestInfo.campaigns?.slot_type || 'standard',
            finalDailyAmount,
            {
              startDate: requestInfo.start_date,
              endDate: requestInfo.end_date,
              guaranteeCount: finalGuaranteeCount || requestInfo.guarantee_count,
              keyword
            }
          );
        }
      }

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
            max_guarantee_price,
            logo,
            guarantee_unit,
            status
          ),
          keywords (
            id,
            main_keyword,
            keyword1,
            keyword2,
            keyword3,
            url,
            mid
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
          sender_type: senderType,  // 프론트엔드와 일치하도록 sender_type 사용
          message_type: params.message_type,
          message: params.message,
          proposed_daily_amount: params.proposed_daily_amount,
          proposed_guarantee_count: params.proposed_guarantee_count,
          proposed_total_amount: params.proposed_total_amount,
          proposed_work_period: params.proposed_work_period,
          proposed_target_rank: params.proposed_target_rank,
          budget_type: params.budget_type || 'daily',
          attachments: params.attachments || [],
        })
        .select()
        .single();

      if (error) throw error;

      // 협상 중 상태로 업데이트
      if (params.message_type === 'price_proposal' || params.message_type === 'counter_offer') {
        await guaranteeSlotRequestService.updateRequestStatus(params.request_id, 'negotiating');
      }

      // 재협상 요청인 경우 상태를 negotiating으로 변경
      if (params.message_type === 'renegotiation_request') {
        await guaranteeSlotRequestService.updateRequestStatus(params.request_id, 'negotiating');
      }

      // 견적 요청 정보와 관련 정보 조회
      const { data: requestInfo, error: requestError } = await supabase
        .from('guarantee_slot_requests')
        .select(`
          *,
          campaign:campaigns!guarantee_slot_requests_campaign_id_fkey (
            campaign_name,
            mat_id,
            service_type,
            slot_type
          )
        `)
        .eq('id', params.request_id)
        .single();

      if (!requestError && requestInfo) {
        // 수신자 결정 (발신자와 반대)
        const recipientId = senderType === 'user'
          ? requestInfo.distributor_id
          : requestInfo.user_id;

        const serviceName = getServiceTypeName(requestInfo.campaign?.service_type || '');

        // 재협상 요청인 경우 특별한 알림 전송
        if (params.message_type === 'renegotiation_request') {

          // 키워드 정보 조회
          let keyword = '';
          if (requestInfo.keyword_id) {
            const { data: keywordData } = await supabase
              .from('keywords')
              .select('main_keyword')
              .eq('id', requestInfo.keyword_id)
              .single();
            keyword = keywordData?.main_keyword || '';
          } else if (requestInfo.input_data) {
            // input_data에서 키워드 찾기 (여러 가능한 위치 확인)
            keyword = requestInfo.input_data.keyword ||
              requestInfo.input_data.main_keyword ||
              requestInfo.input_data['키워드'] ||
              requestInfo.input_data['검색어'] || '';
          }

          // 재협상 요청 알림은 상대방에게 전송 (recipientId 사용)
          // isFromDistributorPage 플래그를 그대로 전달
          await createRenegotiationRequestNotification(
            recipientId,
            requestInfo.campaign?.campaign_name || '캠페인',
            params.request_id,
            serviceName,
            requestInfo.campaign?.slot_type || 'standard',
            {
              keyword,
              targetRank: requestInfo.target_rank,
              finalDailyAmount: requestInfo.final_daily_amount,
              guaranteeCount: requestInfo.guarantee_count
            },
            params.isFromDistributorPage || false
          );
        } else {
          // 키워드 정보 조회
          let keyword = '';
          if (requestInfo.keyword_id) {
            const { data: keywordData } = await supabase
              .from('keywords')
              .select('main_keyword')
              .eq('id', requestInfo.keyword_id)
              .single();
            keyword = keywordData?.main_keyword || '';
          } else if (requestInfo.input_data) {
            // input_data에서 키워드 찾기 (여러 가능한 위치 확인)
            keyword = requestInfo.input_data.keyword ||
              requestInfo.input_data.main_keyword ||
              requestInfo.input_data['키워드'] ||
              requestInfo.input_data['검색어'] || '';
          }

          // 일반 협상 메시지 알림 전송 (디바운싱 적용)
          await createNegotiationMessageNotification(
            recipientId,
            requestInfo.campaign?.campaign_name || '캠페인',
            params.request_id,
            serviceName,
            requestInfo.campaign?.slot_type || 'standard',
            {
              keyword,
              targetRank: requestInfo.target_rank,
              guaranteeCount: requestInfo.guarantee_count
            },
            params.message_type,
            params.proposed_daily_amount,
            params.isFromDistributorPage || false
          );
        }
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
        throw new Error('협상된 가격이 확정되지 않았습니다.');
      }

      if (!request.guarantee_count) {
        throw new Error('보장 횟수가 확정되지 않았습니다.');
      }

      // 전체 작업기간으로 계산 (guarantee_period 사용)
      const workDays = request.guarantee_period || request.guarantee_count;
      const totalAmount = Math.floor(request.final_daily_amount * workDays * 1.1); // VAT 포함

      // 사용자 잔액 확인 (유료캐시만 확인)
      const { data: userBalance, error: balanceError } = await supabase
        .from('user_balances')
        .select('total_balance, paid_balance')
        .eq('user_id', userId)
        .single();

      if (balanceError || !userBalance) {
        throw new Error('사용자 잔액 정보를 조회할 수 없습니다.');
      }

      // 유료캐시만 확인
      if (!userBalance.paid_balance || userBalance.paid_balance < totalAmount) {
        throw new Error(`유료캐시가 부족합니다. 필요금액: ${totalAmount.toLocaleString()}원, 유료캐시 잔액: ${(userBalance.paid_balance || 0).toLocaleString()}원`);
      }

      // Supabase RPC 직접 호출로 구매 처리
      const { data, error } = await supabase.rpc('purchase_guarantee_slot', {
        p_request_id: params.request_id,
        p_user_id: userId,
        p_purchase_reason: params.purchase_reason || null
      });

      if (error) {
        console.error('보장형 슬롯 구매 RPC 오류:', error);
        throw new Error(error.message || '구매 처리 중 오류가 발생했습니다.');
      }

      if (data?.slot_id) {
        // 총판에게 구매 알림 전송
        const serviceName = getServiceTypeName(request.campaigns?.service_type || '');
        await createGuaranteePurchaseNotification(
          request.distributor_id,
          request.campaigns?.campaign_name || '캠페인',
          data.slot_id,
          serviceName,
          request.campaigns?.slot_type || 'standard'
        );
      }

      return {
        data: {
          success: true,
          message: '보장형 슬롯 구매가 완료되었습니다.',
          ...data
        },
        error: null
      };
    } catch (error) {
      console.error('보장형 슬롯 구매 실패:', error);
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

  // 보장형 슬롯 승인
  async approveSlot(slotId: string, distributorId: string) {
    try {
      // 슬롯 정보 먼저 조회
      const { data: slotInfo, error: slotError } = await supabase
        .from('guarantee_slots')
        .select(`
          *,
          campaigns:product_id (
            campaign_name,
            service_type,
            slot_type
          )
        `)
        .eq('id', slotId)
        .single();

      if (slotError) throw slotError;

      // 반려된 슬롯인 경우 먼저 pending 상태로 변경만 하고 리턴
      if (slotInfo.status === 'rejected') {
        const { error: updateError } = await supabase
          .from('guarantee_slots')
          .update({
            status: 'pending',
            rejected_at: null,
            rejected_by: null,
            rejection_reason: null
          })
          .eq('id', slotId);

        if (updateError) throw updateError;

        // 재승인 (반려 취소)인 경우 알림 없이 성공 메시지만 반환
        return {
          data: {
            success: true,
            message: '반려가 취소되었습니다. 슬롯이 대기 상태로 변경되었습니다.'
          },
          error: null
        };
      }

      // 정상적인 승인 프로세스
      const { data, error } = await supabase.rpc('approve_guarantee_slot', {
        p_slot_id: slotId,
        p_distributor_id: distributorId
      });

      if (error) {
        console.error('보장형 슬롯 승인 실패:', error);
        throw new Error(error.message || '승인 처리 중 오류가 발생했습니다.');
      }

      // 사용자에게 승인 알림 전송 (정상 승인일 때만)
      if (slotInfo?.user_id) {
        const serviceName = getServiceTypeName(slotInfo.campaigns?.service_type || '');
        await createGuaranteeApprovalNotification(
          slotInfo.user_id,
          slotInfo.campaigns?.campaign_name || '캠페인',
          slotId,
          true,
          serviceName,
          slotInfo.campaigns?.slot_type || 'standard'
        );
      }

      return {
        data: {
          success: true,
          message: '보장형 슬롯이 승인되었습니다.',
          ...data
        },
        error: null
      };
    } catch (error: any) {
      console.error('보장형 슬롯 승인 실패:', error);
      return { data: null, error };
    }
  },

  // 보장형 슬롯 반려
  async rejectSlot(slotId: string, distributorId: string, rejectionReason: string) {
    try {
      // 슬롯 정보 먼저 조회
      const { data: slotInfo, error: slotError } = await supabase
        .from('guarantee_slots')
        .select(`
          *,
          campaigns:product_id (
            campaign_name,
            service_type,
            slot_type
          )
        `)
        .eq('id', slotId)
        .single();

      if (slotError) throw slotError;

      const { data, error } = await supabase.rpc('reject_guarantee_slot', {
        p_slot_id: slotId,
        p_distributor_id: distributorId,
        p_rejection_reason: rejectionReason
      });

      if (error) {
        console.error('보장형 슬롯 반려 실패:', error);
        throw new Error(error.message || '반려 처리 중 오류가 발생했습니다.');
      }

      // 사용자에게 반려 알림 전송
      if (slotInfo?.user_id) {
        const serviceName = getServiceTypeName(slotInfo.campaigns?.service_type || '');
        await createGuaranteeApprovalNotification(
          slotInfo.user_id,
          slotInfo.campaigns?.campaign_name || '캠페인',
          slotId,
          false,
          serviceName,
          slotInfo.campaigns?.slot_type || 'standard',
          rejectionReason
        );
      }

      return {
        data: {
          success: true,
          message: '보장형 슬롯이 반려되었습니다.',
          ...data
        },
        error: null
      };
    } catch (error: any) {
      console.error('보장형 슬롯 반려 실패:', error);
      return { data: null, error };
    }
  },

  // 보장형 슬롯 완료 처리
  async completeSlot(slotId: string, distributorId: string, workMemo: string) {
    try {
      // 슬롯 정보 확인
      const { data: slot, error: slotError } = await supabase
        .from('guarantee_slots')
        .select('*')
        .eq('id', slotId)
        .eq('distributor_id', distributorId)
        .eq('status', 'active')
        .single();

      if (slotError || !slot) {
        throw new Error('유효하지 않은 슬롯이거나 권한이 없습니다.');
      }

      // 슬롯 상태를 완료로 변경
      const { data, error } = await supabase
        .from('guarantee_slots')
        .update({
          status: 'completed' as GuaranteeSlotStatus,
          completed_at: new Date().toISOString(),
          completed_by: distributorId,
          work_memo: workMemo,
          completed_count: slot.guarantee_count // 전체 보장 횟수만큼 완료 처리
        })
        .eq('id', slotId)
        .select()
        .single();

      if (error) {
        console.error('보장형 슬롯 완료 처리 실패:', error);
        throw new Error(error.message || '완료 처리 중 오류가 발생했습니다.');
      }

      // 홀딩 금액 정산 처리
      const { data: holding } = await supabase
        .from('guarantee_slot_holdings')
        .select('*')
        .eq('guarantee_slot_id', slotId)
        .single();

      if (holding && holding.user_holding_amount > 0) {
        // 남은 홀딩 금액을 모두 총판에게 이동
        await supabase
          .from('guarantee_slot_holdings')
          .update({
            user_holding_amount: 0,
            distributor_holding_amount: holding.total_amount,
            distributor_released_amount: holding.total_amount,
            status: 'completed'
          })
          .eq('id', holding.id);

        // 거래 내역 생성
        await supabase
          .from('guarantee_slot_transactions')
          .insert({
            guarantee_slot_id: slotId,
            user_id: slot.user_id,
            transaction_type: 'settlement',
            amount: holding.user_holding_amount,
            description: `보장형 슬롯 완료 정산 - ${workMemo}`
          });
      }

      return {
        data: {
          success: true,
          message: '보장형 슬롯이 완료 처리되었습니다.',
          slot: data
        },
        error: null
      };
    } catch (error: any) {
      console.error('보장형 슬롯 완료 처리 실패:', error);
      return { data: null, error };
    }
  },

  // 보장형 슬롯 환불 처리
  async refundSlot(slotId: string, distributorId: string, refundReason: string) {
    try {
      // 슬롯 정보 확인
      const { data: slot, error: slotError } = await supabase
        .from('guarantee_slots')
        .select('*')
        .eq('id', slotId)
        .eq('distributor_id', distributorId)
        .in('status', ['active', 'completed'])
        .single();

      if (slotError || !slot) {
        throw new Error('유효하지 않은 슬롯이거나 권한이 없습니다.');
      }

      // 홀딩 정보 조회
      const { data: holding } = await supabase
        .from('guarantee_slot_holdings')
        .select('*')
        .eq('guarantee_slot_id', slotId)
        .single();

      if (!holding) {
        throw new Error('홀딩 정보를 찾을 수 없습니다.');
      }

      // 환불 금액 계산 (완료된 횟수만큼 차감)
      const completedAmount = slot.daily_guarantee_amount * slot.completed_count * 1.1; // VAT 포함
      const refundAmount = slot.total_amount - completedAmount;

      if (refundAmount <= 0) {
        throw new Error('환불 가능한 금액이 없습니다.');
      }

      // 총판이 환불하는 경우도 환불 요청 시스템을 통해 처리
      // 환불 요청을 생성하여 검토 상태로 만듦
      const { data, error } = await supabase.rpc('add_refund_request', {
        p_slot_id: slotId,
        p_user_id: slot.user_id, // 실제 슬롯 사용자 ID
        p_refund_reason: refundReason,
        p_refund_amount: refundAmount
      });

      if (error) {
        console.error('보장형 슬롯 환불 요청 실패:', error);
        throw new Error(error.message || '환불 요청 처리 중 오류가 발생했습니다.');
      }

      return {
        data: {
          success: true,
          message: '환불 요청이 접수되었습니다. 검토 후 처리됩니다.',
          refundAmount,
          request_id: data.request_id
        },
        error: null
      };
    } catch (error: any) {
      console.error('보장형 슬롯 환불 처리 실패:', error);
      return { data: null, error };
    }
  },

  // 사용자 환불 신청
  async requestRefund(slotId: string, userId: string, refundReason: string) {
    try {
      // 1단계: 보장형 슬롯 정보 조회 및 검증
      const { data: slot, error: slotError } = await supabase
        .from('guarantee_slots')
        .select(`
          *
        `)
        .eq('id', slotId)
        .eq('user_id', userId)
        .in('status', ['active', 'completed'])
        .single();

      if (slotError || !slot) {
        throw new Error('유효하지 않은 슬롯이거나 환불할 수 없는 상태입니다.');
      }

      // 2단계: 관련 견적 요청 정보 조회
      let request = null;
      if (slot.request_id) {
        const { data: requestData, error: requestError } = await supabase
          .from('guarantee_slot_requests')
          .select('id, final_daily_amount, guarantee_count, guarantee_period')
          .eq('id', slot.request_id)
          .single();

        if (!requestError && requestData) {
          request = requestData;
        }
      }

      // 견적 요청 정보가 없으면 슬롯 정보로 계산
      const finalDailyAmount = request?.final_daily_amount || slot.daily_guarantee_amount || 0;
      const guaranteeCount = request?.guarantee_count || slot.guarantee_count || 0;
      const workPeriod = request?.guarantee_period || guaranteeCount; // 작업기간 우선 사용
      const completedDays = slot.completed_count || 0;

      // 환불 금액 계산 (VAT 포함) - 작업기간 기준으로 계산
      const totalAmount = finalDailyAmount * workPeriod * 1.1;
      const completedAmount = finalDailyAmount * completedDays * 1.1;
      const refundAmount = Math.max(0, totalAmount - completedAmount);

      if (refundAmount <= 0) {
        throw new Error('환불 가능한 금액이 없습니다.');
      }

      // 3단계: 데이터베이스 함수 호출로 환불 요청 생성
      const { data, error } = await supabase.rpc('add_refund_request', {
        p_slot_id: slotId,
        p_user_id: userId,
        p_refund_reason: refundReason,
        p_refund_amount: refundAmount
      });

      if (error) {
        console.error('환불 요청 생성 실패:', error);
        throw new Error(error.message || '환불 신청 중 오류가 발생했습니다.');
      }

      return {
        data: {
          success: true,
          message: data?.message || '환불 신청이 접수되었습니다. 총판 검토 후 처리됩니다.',
          refundAmount: data?.refund_amount || refundAmount,
          requestId: data?.request_id
        },
        error: null
      };
    } catch (error: any) {
      console.error('환불 신청 실패:', error);
      return { data: null, error };
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