// 테이블 존재 확인 유틸리티
import { supabaseAdmin } from '@/supabase';

interface TableCheckResult {
  exists: boolean;
  data?: any;
  error?: string;
  message?: string;
}

/**
 * Supabase 테이블 존재 여부 확인
 */
export const checkNotificationAggregatesTable = async (): Promise<TableCheckResult> => {
  try {
    // 테이블 존재 여부 확인
    const { data, error } = await supabaseAdmin
      .from('notification_aggregates')
      .select('id, updated_at')
      .limit(1);

    if (error) {
      if (error.message && error.message.includes('does not exist')) {
        
        return { exists: false, error: error.message };
      } else {
        
        return { exists: false, error: error.message };
      }
    }

    return {
      exists: true,
      data,
      message: '테이블이 존재하며 정상적으로 접근 가능합니다.'
    };

  } catch (error: any) {
    
    return { exists: false, error: error.message || '알 수 없는 오류' };
  }
};

// 브라우저 콘솔에서 직접 실행할 수 있도록 전역 객체에 함수 노출
declare global {
  interface Window {
    checkNotificationTable: typeof checkNotificationAggregatesTable;
  }
}

if (typeof window !== 'undefined') {
  window.checkNotificationTable = checkNotificationAggregatesTable;
}

interface TableInitializeResult {
  success: boolean;
  message: string;
  error?: string;
}

// 추가 유틸리티 함수: 알림 통계 테이블 확인 및 초기화
export const checkAndInitializeTable = async (): Promise<TableInitializeResult> => {
  try {
    // 1. 테이블 존재 여부 확인
    const result = await checkNotificationAggregatesTable();

    if (result.exists) {
      return { success: true, message: '테이블이 이미 존재하고 정상 작동 중입니다.' };
    }

    // 2. 테이블이 없는 경우: 메시지 출력
    
    return {
      success: false,
      message: 'notification_aggregates 테이블이 존재하지 않습니다. SQL 스크립트 실행이 필요합니다.'
    };

  } catch (error: any) {
    
    return { 
      success: false, 
      message: '테이블 확인 중 오류가 발생했습니다.',
      error: error.message || '알 수 없는 오류' 
    };
  }
};