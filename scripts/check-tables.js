// 테이블 확인 스크립트
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

// Supabase 클라이언트 생성
const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkTables() {
  try {
    console.log('Supabase 테이블 확인 중...');
    
    // notification_aggregates 테이블 존재 여부 확인
    const { data: aggregateData, error: aggregateError } = await supabase
      .from('notification_aggregates')
      .select('id')
      .limit(1);
    
    if (aggregateError) {
      if (aggregateError.message.includes('does not exist')) {
        console.error('❌ notification_aggregates 테이블이 존재하지 않습니다.');
        console.log('SQL 스크립트를 실행하여 테이블을 생성해야 합니다.');
      } else {
        console.error('❌ 테이블 확인 중 오류 발생:', aggregateError.message);
      }
    } else {
      console.log('✅ notification_aggregates 테이블이 존재합니다!');
      console.log('데이터 샘플:', aggregateData);
    }
    
    // notifications 테이블 존재 여부 확인 (비교용)
    const { data: notificationData, error: notificationError } = await supabase
      .from('notifications')
      .select('id')
      .limit(1);
    
    if (notificationError) {
      if (notificationError.message.includes('does not exist')) {
        console.error('❌ notifications 테이블이 존재하지 않습니다.');
      } else {
        console.error('❌ notifications 테이블 확인 중 오류 발생:', notificationError.message);
      }
    } else {
      console.log('✅ notifications 테이블이 존재합니다!');
      console.log('개수:', notificationData.length);
    }
    
  } catch (error) {
    console.error('테이블 확인 중 예외 발생:', error);
  }
}

// 테이블 확인 실행
checkTables();
