import { v4 as uuidv4 } from 'uuid';
import { supabase, supabaseAdmin } from '@/supabase';
import { KeywordPurchaseInput, KeywordResponse, SlotStatus } from '../types';

// DB 스키마에 맞춘 인터페이스 정의
interface DbSlot {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  keyword_id?: number;
  input_data: {
    mainKeyword: string;
    mid?: number;
    url?: string;
    keyword1?: string;
    keyword2?: string;
    keyword3?: string;
    description?: string;
    keywords?: string[];
    workCount?: number;
    dueDays?: number;
    price?: number;
    campaign_name?: string;
    service_type?: string;
  };
  is_auto_refund_candidate: boolean;
  is_auto_continue: boolean;
}

interface SlotHistoryEntry {
  slot_id: string;
  status: string;
  created_at: string;
  note: string;
  user_id: string;
}

interface PendingBalanceEntry {
  slot_id: string;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export const keywordPurchaseService = {
  async purchaseKeywords(purchaseData: KeywordPurchaseInput): Promise<KeywordResponse> {
    const { keywordIds, amount } = purchaseData;
    
    if (!keywordIds || keywordIds.length === 0 || !amount || amount <= 0) {
      return {
        success: false,
        message: '유효하지 않은 입력 데이터입니다.'
      };
    }
    
    // 현재 로그인한 사용자 정보 가져오기
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        message: '로그인 정보를 가져올 수 없습니다.'
      };
    }
    
    const userId = user.id;
    const totalAmount = amount * keywordIds.length;
    
    try {
      // 트랜잭션 시작
      const { error: transactionStartError } = await supabase.rpc('begin_transaction');
      if (transactionStartError) throw new Error(`트랜잭션 시작 오류: ${transactionStartError.message}`);
      
      // 1. 사용자 잔액 확인 (사용자는 자신의 free_balance와 paid_balance를 확인할 수 있어야 함)
      const { data: userBalance, error: balanceError } = await supabase
        .from('user_balances')
        .select('free_balance, paid_balance')
        .eq('user_id', userId)
        .single();
      
      if (balanceError) {
        // 트랜잭션 롤백
        await supabase.rpc('rollback_transaction');
        return {
          success: false,
          message: '사용자 잔액 정보를 가져올 수 없습니다.'
        };
      }
      
      const freeBalance = userBalance.free_balance || 0;
      const paidBalance = userBalance.paid_balance || 0;
      const totalBalance = freeBalance + paidBalance;
      
      if (totalBalance < totalAmount) {
        // 트랜잭션 롤백
        await supabase.rpc('rollback_transaction');
        return {
          success: false,
          message: `잔액이 부족합니다. 필요 금액: ${totalAmount}원, 현재 잔액: ${totalBalance}원`
        };
      }
      
      // 2. 구매하려는 키워드 정보 가져오기 (사용자는 자신의 키워드만 가져올 수 있어야 함)
      const { data: keywords, error: keywordsError } = await supabase
        .from('keywords')
        .select('*')
        .in('id', keywordIds)
        .eq('user_id', userId);
      
      if (keywordsError || !keywords) {
        // 트랜잭션 롤백
        await supabase.rpc('rollback_transaction');
        return {
          success: false,
          message: '키워드 정보를 가져올 수 없습니다.'
        };
      }
      
      // 모든 요청된 키워드가 실제로 존재하는지 확인
      if (keywords.length !== keywordIds.length) {
        // 트랜잭션 롤백
        await supabase.rpc('rollback_transaction');
        return {
          success: false,
          message: '일부 키워드를 찾을 수 없거나 액세스 권한이 없습니다.'
        };
      }
      
      // 3. 사용할 무료 캐시 및 유료 캐시 계산
      const freeBalanceToUse = Math.min(freeBalance, totalAmount);
      const paidBalanceToUse = totalAmount - freeBalanceToUse;
      
      // 4. 각 키워드에 대해 슬롯, 히스토리 로그, 보류 잔액 생성
      const slotEntries = [];
      const slotHistoryEntries = [];
      const pendingBalanceEntries = [];
      
      for (const keyword of keywords) {
        // 슬롯 ID 생성
        const slotId = uuidv4();
        const now = new Date().toISOString();
        
        // 슬롯 항목 생성 (타입 매칭을 위해 명확한 인터페이스 사용)
        const slotEntry: DbSlot = {
          id: slotId,
          user_id: userId,
          status: SlotStatus.PENDING,
          created_at: now,
          updated_at: now,
          keyword_id: keyword.id,
          input_data: {
            mainKeyword: keyword.main_keyword,
            mid: keyword.mid,
            url: keyword.url, 
            keyword1: keyword.keyword1,
            keyword2: keyword.keyword2,
            keyword3: keyword.keyword3,
            description: keyword.description,
            // keywords 배열로도 저장 (호환성을 위해)
            keywords: [keyword.keyword1, keyword.keyword2, keyword.keyword3].filter(Boolean),
            // 작업 관련 정보
            workCount: 10, // 기본 작업 타수 설정
            dueDays: 3,   // 기본 마감일 설정
            price: amount, // 구매 금액
            campaign_name: "키워드 슬롯", // 기본 캠페인 이름
            service_type: "NaverTraffic", // 기본 서비스 타입
          },
          is_auto_refund_candidate: false,
          is_auto_continue: false
        };
        slotEntries.push(slotEntry);
        
        // 슬롯 히스토리 로그 항목 생성
        const historyEntry: SlotHistoryEntry = {
          slot_id: slotId,
          status: SlotStatus.PENDING, // 상태를 'pending'으로 설정
          created_at: now,
          note: '키워드 슬롯 생성됨',
          user_id: userId
        };
        slotHistoryEntries.push(historyEntry);
        
        // 보류 잔액 항목 생성
        const pendingBalanceEntry: PendingBalanceEntry = {
          slot_id: slotId,
          amount: amount,
          status: 'pending',
          created_at: now,
          updated_at: now
        };
        pendingBalanceEntries.push(pendingBalanceEntry);
      }
      
      // 5. 슬롯 항목 일괄 삽입
      const { error: slotsError } = await supabase
        .from('slots')
        .insert(slotEntries);
      
      if (slotsError) {
        // 트랜잭션 롤백
        await supabase.rpc('rollback_transaction');
        return {
          success: false,
          message: `슬롯 생성 오류: ${slotsError.message}`
        };
      }
      
      // 6. 슬롯 히스토리 로그 항목 일괄 삽입
      const { error: historyError } = await supabase
        .from('slot_history_logs')
        .insert(slotHistoryEntries);
      
      if (historyError) {
        // 트랜잭션 롤백
        await supabase.rpc('rollback_transaction');
        return {
          success: false,
          message: `슬롯 히스토리 로그 생성 오류: ${historyError.message}`
        };
      }
      
      // 7. 보류 잔액 항목 일괄 삽입
      const { error: pendingBalanceError } = await supabase
        .from('slot_pending_balances')
        .insert(pendingBalanceEntries);
      
      if (pendingBalanceError) {
        // 트랜잭션 롤백
        await supabase.rpc('rollback_transaction');
        return {
          success: false,
          message: `보류 잔액 생성 오류: ${pendingBalanceError.message}`
        };
      }
      
      // 8. 사용자 잔액 업데이트
      const { error: balanceUpdateError } = await supabase
        .from('user_balances')
        .update({
          free_balance: freeBalance - freeBalanceToUse,
          paid_balance: paidBalance - paidBalanceToUse,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (balanceUpdateError) {
        // 트랜잭션 롤백
        await supabase.rpc('rollback_transaction');
        return {
          success: false,
          message: `잔액 업데이트 오류: ${balanceUpdateError.message}`
        };
      }
      
      // 9. 사용자 캐시 히스토리에 기록
      const { error: cashHistoryError } = await supabase
        .from('user_cash_history')
        .insert({
          user_id: userId,
          transaction_type: 'keyword_purchase',
          free_amount: freeBalanceToUse > 0 ? -freeBalanceToUse : null,
          paid_amount: paidBalanceToUse > 0 ? -paidBalanceToUse : null,
          description: `키워드 ${keywords.length}개 구매`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (cashHistoryError) {
        // 트랜잭션 롤백
        await supabase.rpc('rollback_transaction');
        return {
          success: false,
          message: `캐시 히스토리 기록 오류: ${cashHistoryError.message}`
        };
      }
      
      // 트랜잭션 커밋
      const { error: commitError } = await supabase.rpc('commit_transaction');
      if (commitError) {
        // 트랜잭션 롤백 시도
        await supabase.rpc('rollback_transaction');
        return {
          success: false,
          message: `트랜잭션 커밋 오류: ${commitError.message}`
        };
      }
      
      return {
        success: true,
        message: `${keywords.length}개의 키워드가 성공적으로 구매되었습니다. 총 ${totalAmount}원이 차감되었습니다.`,
        data: {
          keywordCount: keywords.length,
          totalAmount,
          freeAmountUsed: freeBalanceToUse,
          paidAmountUsed: paidBalanceToUse
        }
      };
    } catch (error) {
      // 트랜잭션 롤백
      await supabase.rpc('rollback_transaction');
      console.error('키워드 구매 오류:', error);
      return {
        success: false,
        message: `키워드 구매 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      };
    }
  }
};

export default keywordPurchaseService;