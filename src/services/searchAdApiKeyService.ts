import { supabase } from '@/supabase';

export interface ApiKeyData {
  id?: string;
  user_id?: string;
  customer_id: string;
  api_key: string;
  secret_key: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const searchAdApiKeyService = {
  // 활성 API 키 조회
  async getActiveApiKey(userId: string): Promise<ApiKeyData | null> {
    try {
      // 406 오류를 피하기 위해 다른 방식으로 시도
      const { data, error } = await supabase
        .from('naver_searchad_api_keys')
        .select('id, user_id, customer_id, api_key, secret_key, is_active, created_at, updated_at')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1);
      
      if (error) {
        console.error('API 키 조회 오류:', {
          error,
          message: error.message,
          code: error.code
        });
        
        // 406 오류인 경우 테이블이 없거나 권한 문제일 수 있음
        if (error.code === '42P01') {
          console.error('naver_searchad_api_keys 테이블이 존재하지 않습니다.');
        }
        return null;
      }
      
      // 데이터가 배열로 오므로 첫 번째 요소 반환
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('API 키 조회 예외:', error);
      return null;
    }
  },

  // API 키 저장 또는 업데이트
  async saveApiKey(userId: string, apiConfig: {
    customerId: string;
    apiKey: string;
    secretKey: string;
  }): Promise<ApiKeyData> {
    try {
      // 기존 활성 키 비활성화
      await supabase
        .from('naver_searchad_api_keys')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);

      // 새 키 저장
      const { data, error } = await supabase
        .from('naver_searchad_api_keys')
        .insert({
          user_id: userId,
          customer_id: apiConfig.customerId,
          api_key: apiConfig.apiKey,
          secret_key: apiConfig.secretKey,
          is_active: true
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('API 키 저장 오류:', error);
      throw error;
    }
  },

  // API 키 삭제
  async deleteApiKey(keyId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('naver_searchad_api_keys')
        .delete()
        .eq('id', keyId);
      
      if (error) throw error;
    } catch (error) {
      console.error('API 키 삭제 오류:', error);
      throw error;
    }
  },

  // 모든 API 키 조회 (히스토리)
  async getAllApiKeys(userId: string): Promise<ApiKeyData[]> {
    try {
      const { data, error } = await supabase
        .from('naver_searchad_api_keys')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('API 키 목록 조회 오류:', error);
      return [];
    }
  }
};