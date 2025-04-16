import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 설정
// .env 파일에서 환경 변수 사용
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key (first 10 chars):', supabaseAnonKey?.substring(0, 10) + '...');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing in environment variables!');
}

// Supabase 타입 정의 (선택 사항)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          role: string;
          status: string;
          created_at: string;
          updated_at: string;
          last_login_at: string | null;
          referral_code: string | null;
        };
      };
      user_balances: {
        Row: {
          user_id: string;
          paid_balance: number;
          free_balance: number;
          total_balance: number;
          updated_at: string;
        };
      };
      user_activities: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          occurred_at: string;
          ip_address: string | null;
          details: any | null;
        };
      };
    };
    Functions: {
      api_create_user: {
        Args: {
          p_email: string;
          p_password: string;
          p_role?: string;
        };
        Returns: {
          success: boolean;
          message: string;
          data?: {
            id: string;
            email: string;
            referral_code: string;
          };
        };
      };
      api_get_profile: {
        Args: Record<string, never>;
        Returns: {
          success: boolean;
          data?: any;
          message?: string;
        };
      };
      api_update_profile: {
        Args: {
          p_name?: string;
          p_role?: string;
        };
        Returns: {
          success: boolean;
          message: string;
        };
      };
      api_change_password: {
        Args: {
          p_current_password: string;
          p_new_password: string;
        };
        Returns: {
          success: boolean;
          message: string;
        };
      };
      api_get_registered_emails: {
        Args: {
          p_query?: string;
          p_limit?: number;
        };
        Returns: {
          success: boolean;
          data: {
            email: string;
          }[];
          message?: string;
        };
      };
    };
  };
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
