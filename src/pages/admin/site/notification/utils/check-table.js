// 테이블 존재 확인 유틸리티
import { supabaseAdmin } from '@/supabase';

/**
 * Supabase 테이블 존재 여부 확인
 */
export const checkNotificationAggregatesTable = async () => {
  try {

    // 테이블 존재 여부 확인
    const { data, error } = await supabaseAdmin
      .from('notification_aggregates')
      .select('id, updated_at')
      .limit(1);

    if (error) {
      if (error.message && error.message.includes('does not exist')) {
        console.error('❌ notification_aggregates 테이블이 존재하지 않습니다.');
        return { exists: false, error: error.message };
      } else {
        console.error('❌ 테이블 확인 중 오류 발생:', error.message);
        return { exists: false, error: error.message };
      }
    }


    return {
      exists: true,
      data,
      message: '테이블이 존재하며 정상적으로 접근 가능합니다.'
    };

  } catch (error) {
    console.error('테이블 확인 중 예외 발생:', error);
    return { exists: false, error: error.message || '알 수 없는 오류' };
  }
};

// 브라우저 콘솔에서 직접 실행할 수 있도록 전역 객체에 함수 노출
window.checkNotificationTable = checkNotificationAggregatesTable;

// 추가 유틸리티 함수: 알림 통계 테이블 확인 및 초기화
export const checkAndInitializeTable = async () => {
  try {
    // 1. 테이블 존재 여부 확인
    const result = await checkNotificationAggregatesTable();

    if (result.exists) {
      return { success: true, message: '테이블이 이미 존재하고 정상 작동 중입니다.' };
    }

    // 2. 테이블이 없는 경우: 메시지 출력
    console.error('테이블이 존재하지 않습니다. SQL 스크립트를 실행해야 합니다.');
    return {
      success: false,
      message: 'notification_aggregates 테이블이 존재하지 않습니다. SQL 스크립트 실행이 필요합니다.'
    };

  } catch (error) {
    console.error('테이블 확인 및 초기화 중 오류 발생:', error);
    return { success: false, error: error.message || '알 수 없는 오류' };
  }
};
