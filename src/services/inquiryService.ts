import { supabase } from '@/supabase';
import type { 
  Inquiry, 
  InquiryMessage, 
  InquiryCategory,
  CreateInquiryParams,
  CreateInquiryMessageParams,
  UpdateInquiryStatusParams,
  InquiryFilter,
  InquirySenderRole
} from '@/types/inquiry.types';

/**
 * 1:1 문의 서비스
 */
export const inquiryService = {
  /**
   * 문의 생성
   */
  async createInquiry(params: CreateInquiryParams, userId: string) {
    try {
      // 1. 문의 생성
      const inquiryData: any = {
        user_id: userId,
        slot_id: params.slot_id,
        campaign_id: params.campaign_id,
        distributor_id: params.distributor_id,
        title: params.title,
        category: params.category,
        priority: params.priority || 'normal',
        status: 'open'
      };

      // guarantee_slot_id 추가 (속성이 있을 경우)
      if ('guarantee_slot_id' in params && params.guarantee_slot_id) {
        inquiryData.guarantee_slot_id = params.guarantee_slot_id;
      }

      const { data: inquiry, error: inquiryError } = await supabase
        .from('inquiries')
        .insert(inquiryData)
        .select('*')
        .single();

      if (inquiryError) throw inquiryError;

      // 초기 메시지는 별도로 처리
      // createInquiry 호출 후 sendMessage로 처리

      return { data: inquiry, error: null };
    } catch (error) {
      console.error('문의 생성 실패:', error);
      return { data: null, error };
    }
  },

  /**
   * 문의 목록 조회
   */
  async getInquiries(filter: InquiryFilter = {}) {
    try {
      let query = supabase
        .from('inquiries')
        .select(`
          *,
          users:user_id (id, email, full_name),
          distributors:distributor_id (id, email, full_name),
          slots:slot_id (id, slot_name, status),
          campaigns:campaign_id (id, campaign_name, service_type)
        `)
        .order('created_at', { ascending: false });

      // 필터 적용
      if (filter.user_id) {
        query = query.eq('user_id', filter.user_id);
      }
      if (filter.distributor_id) {
        query = query.eq('distributor_id', filter.distributor_id);
      }
      if (filter.status) {
        query = query.eq('status', filter.status);
      }
      if (filter.category) {
        query = query.eq('category', filter.category);
      }
      if (filter.priority) {
        query = query.eq('priority', filter.priority);
      }
      if (filter.slot_id) {
        query = query.eq('slot_id', filter.slot_id);
      }
      if (filter.campaign_id) {
        query = query.eq('campaign_id', filter.campaign_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data: data as Inquiry[], error: null };
    } catch (error) {
      console.error('문의 목록 조회 실패:', error);
      return { data: null, error };
    }
  },

  /**
   * 문의 상세 조회
   */
  async getInquiry(inquiryId: string) {
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .select(`
          *,
          users:user_id (id, email, full_name),
          distributors:distributor_id (id, email, full_name),
          campaigns:campaign_id (id, campaign_name, service_type)
        `)
        .eq('id', inquiryId)
        .single();

      if (error) throw error;

      // 슬롯 정보가 있는 경우 guarantee_slots에서 상세 정보 조회
      if (data.slot_id) {
        const { data: slotData, error: slotError } = await supabase
          .from('guarantee_slots')
          .select(`
            id,
            status,
            start_date,
            end_date,
            guarantee_slot_requests!inner(
              id,
              target_rank,
              guarantee_count,
              initial_budget,
              final_daily_amount,
              input_data,
              campaigns(
                id,
                campaign_name,
                service_type,
                logo
              ),
              keywords:keyword_id(
                id,
                main_keyword,
                keyword1,
                keyword2,
                keyword3,
                url,
                mid
              )
            )
          `)
          .eq('id', data.slot_id)
          .single();

        if (!slotError && slotData && slotData.guarantee_slot_requests && slotData.guarantee_slot_requests.length > 0) {
          const request = slotData.guarantee_slot_requests[0];
          const campaign = Array.isArray(request.campaigns) ? request.campaigns[0] : request.campaigns;
          const keyword = Array.isArray(request.keywords) ? request.keywords[0] : request.keywords;
          // slot_info 객체 생성 (견적 협상 모달과 동일한 구조)
          data.slot_info = {
            service_type: campaign?.service_type || data.campaigns?.service_type,
            campaign_name: campaign?.campaign_name || data.campaigns?.campaign_name,
            campaign_logo: campaign?.logo,
            start_date: slotData.start_date,
            end_date: slotData.end_date,
            target_rank: request.target_rank,
            guarantee_count: request.guarantee_count,
            initial_budget: request.initial_budget,
            final_daily_amount: request.final_daily_amount,
            input_data: request.input_data,
            keywords: keyword
          };
        }
      }

      return { data: data as Inquiry, error: null };
    } catch (error) {
      console.error('문의 조회 실패:', error);
      return { data: null, error };
    }
  },

  /**
   * 문의 상태 업데이트
   */
  async updateInquiryStatus({ inquiry_id, status, resolved_by }: UpdateInquiryStatusParams) {
    try {
      const updateData: any = { status };
      
      if (status === 'resolved' && resolved_by) {
        updateData.resolved_by = resolved_by;
      }

      const { data, error } = await supabase
        .from('inquiries')
        .update(updateData)
        .eq('id', inquiry_id)
        .select('*')
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('문의 상태 업데이트 실패:', error);
      return { data: null, error };
    }
  },

  /**
   * 문의 카테고리 목록 조회
   */
  async getCategories() {
    try {
      const { data, error } = await supabase
        .from('inquiry_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      return { data: data as InquiryCategory[], error: null };
    } catch (error) {
      console.error('카테고리 목록 조회 실패:', error);
      return { data: null, error };
    }
  }
};

/**
 * 문의 메시지 서비스
 */
export const inquiryMessageService = {
  /**
   * 메시지 목록 조회
   */
  async getMessages(inquiryId: string) {
    try {
      const { data, error } = await supabase
        .from('inquiry_messages')
        .select('*')
        .eq('inquiry_id', inquiryId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // 발신자 정보 별도 조회
      const senderIds = [...new Set(data.map(msg => msg.sender_id))];
      const { data: senders } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('id', senderIds);

      // 발신자 정보 맵 생성
      const senderMap = new Map(
        senders?.map(sender => [sender.id, sender]) || []
      );

      // 발신자 정보 매핑
      const messages = data.map(msg => {
        const sender = senderMap.get(msg.sender_id);
        return {
          ...msg,
          sender: sender,
          senderName: sender?.full_name || sender?.email || '알 수 없음',
          senderEmail: sender?.email
        };
      });

      return { data: messages as InquiryMessage[], error: null };
    } catch (error: any) {
      console.error('메시지 목록 조회 실패:', error);
      console.error('Error details:', error.message, error.code, error.details);
      return { data: null, error };
    }
  },

  /**
   * 메시지 전송
   */
  async sendMessage(params: CreateInquiryMessageParams, senderId: string, senderRole: InquirySenderRole) {
    try {
      const { data, error } = await supabase
        .from('inquiry_messages')
        .insert({
          inquiry_id: params.inquiry_id,
          sender_id: senderId,
          sender_role: senderRole,
          message: params.content, // DB 컬럼명은 'message'
          attachments: params.attachments
        })
        .select('*')
        .single();

      if (error) throw error;

      // 문의 상태를 'in_progress'로 업데이트 (open인 경우만)
      await supabase
        .from('inquiries')
        .update({ status: 'in_progress' })
        .eq('id', params.inquiry_id)
        .eq('status', 'open');

      return { data: data as InquiryMessage, error: null };
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      return { data: null, error };
    }
  },

  /**
   * 메시지 읽음 처리
   */
  async markAsRead(inquiryId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('inquiry_messages')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('inquiry_id', inquiryId)
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('읽음 처리 실패:', error);
      return { error };
    }
  },

  /**
   * 읽지 않은 메시지 수 조회
   */
  async getUnreadCount(userId: string) {
    try {
      // 사용자가 받은 읽지 않은 메시지 수 조회
      // 먼저 사용자의 문의 ID들을 가져옴
      const { data: userInquiries, error: inquiryError } = await supabase
        .from('inquiries')
        .select('id')
        .or(`user_id.eq.${userId},distributor_id.eq.${userId}`);

      if (inquiryError) throw inquiryError;

      const inquiryIds = userInquiries?.map(i => i.id) || [];

      if (inquiryIds.length === 0) {
        return { data: 0, error: null };
      }

      const { count, error } = await supabase
        .from('inquiry_messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', userId)
        .in('inquiry_id', inquiryIds);

      if (error) throw error;

      return { data: count || 0, error: null };
    } catch (error) {
      console.error('읽지 않은 메시지 수 조회 실패:', error);
      return { data: 0, error };
    }
  },

  /**
   * 실시간 구독 설정
   */
  subscribeToMessages(inquiryId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`inquiry_messages:${inquiryId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'inquiry_messages',
          filter: `inquiry_id=eq.${inquiryId}`
        },
        callback
      )
      .subscribe();
  }
};