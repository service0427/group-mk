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
  //auth?: AuthModel;
}
