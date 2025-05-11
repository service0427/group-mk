import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY // 서비스 롤 키 추가

// 환경 변수 없으면 개발 모드에서는 에러 메시지만 표시
if (!supabaseUrl || !supabaseAnonKey) {
  

  if (import.meta.env.PROD) {
    // 프로덕션에서만 에러 발생
    throw new Error('Missing Supabase environment variables');
  }
}

// 일반 클라이언트 (RLS 정책 적용)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 관리자 클라이언트 (RLS 정책 우회)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  : supabase // 서비스 키가 없으면 일반 클라이언트로 폴백