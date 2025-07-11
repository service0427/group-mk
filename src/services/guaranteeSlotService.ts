// 보장성 슬롯 서비스
// 작성일: 2025-06-15

import { supabase } from '@/supabase';
import { smartCeil } from '@/utils/mathUtils';
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
import { inquiryService } from '@/services/inquiryService';
import {
  createGuaranteeQuoteRequestNotification,
  createNegotiationMessageNotification,
  createGuaranteePurchaseNotification,
  createGuaranteeApprovalNotification,
  createNegotiationCompleteNotification,
  createRenegotiationRequestNotification,
  createRefundConfirmationRequestNotification,
  createRefundRequestNotification,
  createRefundRejectedByUserNotification,
  getServiceTypeUrlPath
} from '@/utils/notificationActions';
import { SERVICE_TYPE_TO_CATEGORY } from '@/pages/advertise/campaigns/components/campaign-components/constants';
import { createNotification } from '@/utils/notification';
import { NotificationType, NotificationPriority } from '@/types/notification';
import { checkSingleKeywordRanking, checkKeywordsInBatches, extractKeywordsFromSlot } from '@/services/rankingCheckService';


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
      await createGuaranteeQuoteRequestNotification(
        campaign.mat_id,
        campaign.campaign_name,
        data.id,
        campaign.service_type, // 서비스 타입 코드를 그대로 전달
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
            add_info,
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
          const serviceDisplayName = SERVICE_TYPE_TO_CATEGORY[requestInfo.campaigns?.service_type || ''] || requestInfo.campaigns?.service_type || '';

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
            serviceDisplayName,
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
            add_info,
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

        const serviceDisplayName = SERVICE_TYPE_TO_CATEGORY[requestInfo.campaign?.service_type || ''] || requestInfo.campaign?.service_type || '';
        const serviceUrlPath = getServiceTypeUrlPath(requestInfo.campaign?.service_type || '');

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
            serviceDisplayName,
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
            serviceDisplayName,
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

      // 보장 일수로 계산 (guarantee_count 사용)
      const totalAmount = smartCeil(request.final_daily_amount * request.guarantee_count * 1.1); // VAT 포함

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
        const serviceDisplayName = SERVICE_TYPE_TO_CATEGORY[request.campaigns?.service_type || ''] || request.campaigns?.service_type || '';
        await createGuaranteePurchaseNotification(
          request.distributor_id,
          request.campaigns?.campaign_name || '캠페인',
          data.slot_id,
          serviceDisplayName,
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

      // NaverShopping 서비스 타입인 경우 순위 체크 API 호출
      if (slotInfo.campaigns?.service_type && slotInfo.campaigns.service_type.startsWith('NaverShopping')) {
        try {
          // 캠페인의 필드 매핑 정보와 슬롯의 입력 데이터 조회
          const { data: campaignData, error: campaignError } = await supabase
            .from('campaigns')
            .select('ranking_field_mapping')
            .eq('id', slotInfo.product_id)
            .single();
            
          const { data: slotData, error: slotDataError } = await supabase
            .from('guarantee_slots')
            .select('input_data')
            .eq('id', slotId)
            .single();
            
          if (!campaignError && !slotDataError && campaignData && slotData) {
            const fieldMapping = campaignData.ranking_field_mapping;
            const keywords = extractKeywordsFromSlot(slotData.input_data, fieldMapping);
            
            if (keywords.length > 0) {
              // 비동기로 호출하고 결과는 무시 (실패해도 승인 프로세스는 계속)
              if (keywords.length === 1) {
                checkSingleKeywordRanking(keywords[0]).catch(err => 
                  console.error('[보장형 순위체크API] 단일 키워드 API 호출 실패 (무시):', err)
                );
              } else {
                checkKeywordsInBatches(keywords).catch(err => 
                  console.error('[보장형 순위체크API] 다중 키워드 API 호출 실패 (무시):', err)
                );
              }
            }
          }
        } catch (err) {
          console.error('[보장형 순위체크API] 순위 체크 처리 중 오류 (무시):', err);
        }
      }

      // 사용자에게 승인 알림 전송 (정상 승인일 때만)
      if (slotInfo?.user_id) {
        const serviceDisplayName = SERVICE_TYPE_TO_CATEGORY[slotInfo.campaigns?.service_type || ''] || slotInfo.campaigns?.service_type || '';
        await createGuaranteeApprovalNotification(
          slotInfo.user_id,
          slotInfo.campaigns?.campaign_name || '캠페인',
          slotId,
          true,
          serviceDisplayName,
          slotInfo.campaigns?.slot_type || 'standard'
        );
      }

      // 보장형 슬롯 승인 시 1:1 문의 자동 생성
      try {
        if (slotInfo?.user_id && slotInfo?.product_id && distributorId) {
          // 기존 문의가 있는지 확인
          const { data: existingInquiries } = await supabase
            .from('inquiries')
            .select('id')
            .eq('guarantee_slot_id', slotId);

          // 기존 문의가 없는 경우에만 새로 생성
          if (!existingInquiries || existingInquiries.length === 0) {
            // RPC 함수를 사용하여 권한 문제 해결
            const { data: newInquiry, error: inquiryError } = await supabase.rpc('create_inquiry_on_approval', {
              p_user_id: slotInfo.user_id,
              p_distributor_id: distributorId,
              p_campaign_id: slotInfo.product_id,
              p_guarantee_slot_id: slotId,
              p_title: `보장형 슬롯 1:1 문의 - ${slotInfo.campaigns?.campaign_name || '캠페인'}`,
              p_category: '보장형슬롯'
            });

            if (inquiryError) {
              console.error('1:1 문의 자동 생성 실패:', inquiryError);
            }
          }
        }
      } catch (error) {
        console.error('1:1 문의 자동 생성 중 오류:', error);
        // 문의 생성 실패는 승인 프로세스에 영향을 주지 않음
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
        const serviceDisplayName = SERVICE_TYPE_TO_CATEGORY[slotInfo.campaigns?.service_type || ''] || slotInfo.campaigns?.service_type || '';
        await createGuaranteeApprovalNotification(
          slotInfo.user_id,
          slotInfo.campaigns?.campaign_name || '캠페인',
          slotId,
          false,
          serviceDisplayName,
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
  async completeSlot(slotId: string, distributorId: string, workMemo: string, refundAmount?: number) {
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
          completed_count: slot.guarantee_count // 전체 보장 횟수만큼 완료 처리
        })
        .eq('id', slotId)
        .select()
        .single();

      if (error) {
        console.error('보장형 슬롯 완료 처리 실패:', error);
        throw new Error(error.message || '완료 처리 중 오류가 발생했습니다.');
      }

      // 환불 금액이 있는 경우 환불 처리
      if (refundAmount && refundAmount > 0) {
        // 사용자 ID 가져오기
        const { data: slotRequest } = await supabase
          .from('guarantee_slot_requests')
          .select('user_id')
          .eq('id', slot.request_id)
          .single();

        if (!slotRequest?.user_id) {
          throw new Error('사용자 정보를 찾을 수 없습니다.');
        }

        // 현재 캐시 잔액 조회
        const { data: balance } = await supabase
          .from('user_cash_balances')
          .select('*')
          .eq('user_id', slotRequest.user_id)
          .single();

        const currentBalance = balance?.paid_balance || 0;
        const newBalance = currentBalance + refundAmount;

        // 캐시 잔액 업데이트
        const { error: balanceError } = await supabase
          .from('user_cash_balances')
          .upsert({
            user_id: slotRequest.user_id,
            paid_balance: newBalance,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (balanceError) {
          console.error('캐시 잔액 업데이트 실패:', balanceError);
          throw new Error('캐시 잔액 업데이트 중 오류가 발생했습니다.');
        }

        // 캐시 히스토리 추가
        const { error: historyError } = await supabase
          .from('user_cash_history')
          .insert({
            user_id: slotRequest.user_id,
            transaction_type: 'refund',
            amount: refundAmount,
            description: `보장형 슬롯 조기 완료 환불 - ${workMemo || '조기 완료'}`,
            reference_id: slotId,
            balance_type: 'paid',
            transaction_at: new Date().toISOString()
          });

        if (historyError) {
          console.error('캐시 히스토리 추가 실패:', historyError);
          throw new Error('캐시 히스토리 추가 중 오류가 발생했습니다.');
        }
      }

      // 사용자에게 완료 알림 전송
      const { data: request } = await supabase
        .from('guarantee_slot_requests')
        .select('user_id, campaign_id')
        .eq('id', slot.request_id)
        .single();

      if (request?.user_id) {
        // 캠페인 정보 조회
        const { data: campaign } = await supabase
          .from('campaigns')
          .select('campaign_name')
          .eq('id', request.campaign_id)
          .single();

        const campaignName = campaign?.campaign_name || '보장형 슬롯';
        const message = refundAmount && refundAmount > 0
          ? `[${campaignName}] 보장형 슬롯이 완료되었습니다. 조기 완료로 인해 ${refundAmount.toLocaleString()}원이 환불됩니다.`
          : `[${campaignName}] 보장형 슬롯이 완료되었습니다.`;

        await createNotification({
          userId: request.user_id,
          type: NotificationType.SLOT,
          title: '보장형 슬롯 완료',
          message,
          link: '/my-services',
          priority: NotificationPriority.HIGH
        });
      }

      return {
        data: {
          success: true,
          message: refundAmount && refundAmount > 0
            ? `보장형 슬롯이 완료 처리되었습니다. ${refundAmount.toLocaleString()}원이 환불됩니다.`
            : '보장형 슬롯이 완료 처리되었습니다.',
          slot: data,
          refundAmount
        },
        error: null
      };
    } catch (error: any) {
      console.error('보장형 슬롯 완료 처리 실패:', error);
      return { data: null, error };
    }
  },

  // 보장형 슬롯 환불 처리
  async refundSlot(slotId: string, distributorId: string, refundReason: string, refundAmount?: number) {
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

      // 환불 금액 계산 또는 전달받은 금액 사용
      let actualRefundAmount: number;
      if (refundAmount !== undefined && refundAmount > 0) {
        // 전달받은 환불 금액 사용
        actualRefundAmount = refundAmount;

        // 총 금액 초과 검증
        if (actualRefundAmount > slot.total_amount) {
          throw new Error('환불 금액이 총 결제금액을 초과할 수 없습니다.');
        }
      } else {
        // 기존 로직대로 계산
        const completedAmount = smartCeil(slot.daily_guarantee_amount * slot.completed_count * 1.1); // VAT 포함
        actualRefundAmount = slot.total_amount - completedAmount;

        if (actualRefundAmount <= 0) {
          throw new Error('환불 가능한 금액이 없습니다.');
        }
      }

      // 총판이 환불을 시작하는 경우: 사용자에게 환불 요청 확인을 받음
      const { data, error } = await supabase.rpc('add_refund_request', {
        p_slot_id: slotId,
        p_user_id: distributorId, // 총판이 요청자
        p_refund_reason: refundReason,
        p_refund_amount: actualRefundAmount,
        p_requested_by: 'distributor' // 총판이 요청했음을 표시
      });

      if (error) {
        console.error('보장형 슬롯 환불 요청 실패:', error);
        throw new Error(error.message || '환불 요청 처리 중 오류가 발생했습니다.');
      }

      // 사용자에게 환불 확인 요청 알림 전송
      const { data: slotInfo } = await supabase
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

      if (slotInfo?.user_id) {
        const serviceDisplayName = SERVICE_TYPE_TO_CATEGORY[slotInfo.campaigns?.service_type || ''] || slotInfo.campaigns?.service_type || '';
        await createRefundConfirmationRequestNotification(
          slotInfo.user_id,
          slotInfo.campaigns?.campaign_name || '캠페인',
          actualRefundAmount,
          refundReason,
          data.request_id,
          serviceDisplayName,
          slotInfo.campaigns?.slot_type || 'standard'
        );
      }

      return {
        data: {
          success: true,
          message: '환불 요청이 사용자에게 전송되었습니다. 사용자 확인 후 처리됩니다.',
          refundAmount: actualRefundAmount,
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
      const totalAmount = smartCeil(finalDailyAmount * workPeriod * 1.1);
      const completedAmount = smartCeil(finalDailyAmount * completedDays * 1.1);
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

      // 4단계: 총판에게 환불 요청 알림 전송
      // 이미 slot 정보가 있으므로 추가 정보만 가져오기
      if (slot.distributor_id) {
        // 캠페인 정보 가져오기
        const { data: campaignInfo } = await supabase
          .from('campaigns')
          .select('campaign_name, service_type')
          .eq('id', slot.product_id)
          .single();

        // 사용자 정보 가져오기
        const { data: userInfo } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', userId)
          .single();

        const serviceDisplayName = SERVICE_TYPE_TO_CATEGORY[campaignInfo?.service_type || ''] || campaignInfo?.service_type || '';
        await createRefundRequestNotification(
          slot.distributor_id,
          campaignInfo?.campaign_name || '캠페인',
          refundAmount,
          refundReason,
          userInfo?.full_name || '사용자',
          data?.request_id || 'unknown',
          serviceDisplayName,
          'guarantee'
        );
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

  // 환불 요청 확인/거절 (사용자가 총판의 환불 요청을 처리)
  async confirmRefundRequest(slotId: string, refundRequestId: string, userId: string, approve: boolean) {
    try {

      // 슬롯 정보와 refund_requests를 함께 조회
      const { data: slots, error: slotError } = await supabase
        .from('guarantee_slots')
        .select(`
          id, 
          status, 
          request_id, 
          distributor_id, 
          refund_requests,
          guarantee_slot_requests!inner(user_id)
        `)
        .eq('id', slotId)
        .eq('guarantee_slot_requests.user_id', userId);

      if (slotError || !slots || slots.length === 0) {
        throw new Error('슬롯을 찾을 수 없거나 권한이 없습니다.');
      }

      const slot = slots[0];

      // refund_requests 배열에서 해당 요청 찾기
      const refundRequests = slot.refund_requests || [];
      const requestIndex = refundRequests.findIndex((req: any) => req.id === refundRequestId);

      if (requestIndex === -1) {
        throw new Error('환불 요청을 찾을 수 없습니다.');
      }

      const refundRequest = refundRequests[requestIndex];

      // pending_user_confirmation 상태인지 확인
      if (refundRequest.status !== 'pending_user_confirmation') {
        throw new Error('확인 대기 중인 환불 요청이 아닙니다.');
      }

      if (approve) {
        // 승인: 새로운 RPC 함수 호출
        const { data, error } = await supabase.rpc('approve_distributor_refund_request', {
          p_slot_id: slotId,
          p_request_id: refundRequestId,
          p_user_id: userId
        });

        if (error) throw error;

        return {
          data: data || {
            success: true,
            message: '환불이 승인되었습니다.'
          },
          error: null
        };
      } else {
        // 거절: 환불 요청 상태를 rejected로 변경하고 슬롯을 active로 복구
        refundRequest.status = 'rejected';
        refundRequest.rejection_date = new Date().toISOString();
        refundRequest.rejection_reason = '사용자가 환불을 거절했습니다.';

        refundRequests[requestIndex] = refundRequest;

        const { error: updateError } = await supabase
          .from('guarantee_slots')
          .update({
            refund_requests: refundRequests,
            status: 'active' // 슬롯 상태를 active로 복구
          })
          .eq('id', slotId);

        if (updateError) throw updateError;

        // 총판에게 환불 거절 알림 전송
        if (slot.distributor_id) {
          await createRefundRejectedByUserNotification(
            slot.distributor_id,
            slotId,
            '사용자가 환불을 거절했습니다.'
          );
        }

        return {
          data: {
            success: true,
            message: '환불이 거절되었습니다.'
          },
          error: null
        };
      }
    } catch (error: any) {
      console.error('환불 요청 확인 실패:', error);
      return { data: null, error };
    }
  },
};

// 통계 및 유틸리티
export const guaranteeSlotUtils = {
  // 총 금액 계산 (부가세 포함)
  calculateTotalAmount(dailyAmount: number, guaranteeCount: number): number {
    return smartCeil(dailyAmount * guaranteeCount * 1.1); // 부가세 10%
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