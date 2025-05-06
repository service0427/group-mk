import { type TLanguageCode } from '@/i18n';

export interface AuthModel {
  access_token: string;
  refreshToken?: string;
  api_token: string;
}

export interface UserModel {
  id: number;
  username: string;
  password: string | undefined;
  email: string;
  first_name: string;
  last_name: string;
  fullname?: string;
  occupation?: string;
  companyName?: string;
  phone?: string;
  roles?: number[];
  pic?: string;
  language?: TLanguageCode;
  auth?: AuthModel;
}

export interface CustomUser {
  id?: string;
  email?: string;
  password?: string | undefined;
  full_name?: string;
  phone_number?: string;
  role?: string;
  status?: string;
  create_at?: string;
  update_dt?: string;
  raw_user_meta_data?: any; // Supabase 사용자 메타데이터 저장
  business?: {
    business_number: string;
    business_name: string;
    representative_name: string;
    verified: boolean;
    verification_date?: string;
    business_email?: string;
    business_image_url?: string;
    business_image_storage_type?: string;
    business_image_bucket?: string;
  };
  //auth?: AuthModel;
}
