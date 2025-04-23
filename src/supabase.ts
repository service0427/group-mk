import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY // 서비스 롤 키 추가

// 환경 변수 로드 확인
console.log('SUPABASE URL:', supabaseUrl);
console.log('SERVICE KEY EXISTS:', !!supabaseServiceKey);

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
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

// 일반 클라이언트와 어드민 클라이언트가 다른지 확인
console.log('CLIENTS DIFFERENT:', supabase !== supabaseAdmin);