import { Session, User } from '@supabase/supabase-js';

// Supabase 인증 관련 타입 정의
export interface SupabaseAuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
}

export interface UserProfile {
  id: string;
  name?: string;
  role?: string;
  email?: string;
  created_at?: string;
  avatar_url?: string;
}
