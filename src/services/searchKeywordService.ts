import { supabase } from '@/supabase';
import { supabaseRanking } from '@/supabase-ranking'; // Production DB for search_keywords

export interface SearchKeyword {
  id?: string;
  user_id?: string;
  keyword: string;
  pc_count: number;
  mobile_count: number;
  total_count: number;
  pc_ratio: number;
  mobile_ratio: number;
  searched_at?: string;
}

export interface KeywordResult {
  keyword: string;
  pc: number;
  mobile: number;
  total: number;
  pcRatio: number;
  mobileRatio: number;
}

class SearchKeywordService {
  /**
   * 키워드들을 DB에 저장 (중복 방지)
   */
  async saveKeywords(userId: string, keywords: KeywordResult[]): Promise<void> {
    try {
      // 각 키워드를 개별적으로 저장 (중복 체크를 위해)
      for (const keyword of keywords) {
        // 먼저 해당 키워드가 이미 존재하는지 확인
        const { data: existing, error: checkError } = await supabaseRanking
          .from('search_keywords')
          .select('id')
          .eq('user_id', userId)
          .eq('keyword', keyword.keyword)
          .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116은 "no rows returned" 에러
          console.error('키워드 존재 확인 오류:', checkError);
          continue;
        }

        // 이미 존재하면 건너뛰기
        if (existing) {
          console.log(`키워드 "${keyword.keyword}"는 이미 저장되어 있습니다.`);
          continue;
        }

        // 새로운 키워드만 저장
        const { error: insertError } = await supabaseRanking
          .from('search_keywords')
          .insert({
            user_id: userId,
            keyword: keyword.keyword,
            pc_count: keyword.pc,
            mobile_count: keyword.mobile,
            total_count: keyword.total,
            pc_ratio: keyword.pcRatio,
            mobile_ratio: keyword.mobileRatio,
            searched_at: new Date().toISOString()
          });

        if (insertError) {
          console.error(`키워드 "${keyword.keyword}" 저장 오류:`, insertError);
        }
      }
    } catch (error) {
      console.error('키워드 저장 중 오류:', error);
      throw error;
    }
  }

  /**
   * 사용자의 저장된 키워드들 조회
   */
  async getUserKeywords(userId: string): Promise<SearchKeyword[]> {
    try {
      console.log('getUserKeywords 호출됨:', { userId });
      
      const { data, error } = await supabaseRanking
        .from('search_keywords')
        .select('*')
        // user_id 필터 제거 - 모든 키워드 조회
        .order('searched_at', { ascending: false });

      console.log('키워드 조회 결과:', { count: data?.length, error });

      if (error) {
        console.error('키워드 조회 오류:', error);
        throw new Error(`키워드 조회에 실패했습니다: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('키워드 조회 중 오류:', error);
      throw error;
    }
  }

  /**
   * 사용자가 이미 저장한 키워드인지 확인
   */
  async checkExistingKeywords(userId: string, keywords: string[]): Promise<string[]> {
    try {
      const { data, error } = await supabaseRanking
        .from('search_keywords')
        .select('keyword')
        .in('keyword', keywords);

      if (error) {
        console.error('키워드 중복 확인 오류:', error);
        throw new Error(`키워드 중복 확인에 실패했습니다: ${error.message}`);
      }

      return (data || []).map(item => item.keyword);
    } catch (error) {
      console.error('키워드 중복 확인 중 오류:', error);
      throw error;
    }
  }

  /**
   * 키워드 삭제
   */
  async deleteKeywords(userId: string, keywordIds: string[]): Promise<void> {
    try {
      const { error } = await supabaseRanking
        .from('search_keywords')
        .delete()
        .eq('user_id', userId)
        .in('id', keywordIds);

      if (error) {
        console.error('키워드 삭제 오류:', error);
        throw new Error(`키워드 삭제에 실패했습니다: ${error.message}`);
      }
    } catch (error) {
      console.error('키워드 삭제 중 오류:', error);
      throw error;
    }
  }

  /**
   * 특정 키워드 삭제 (키워드 텍스트로)
   */
  async deleteKeywordByText(userId: string, keyword: string): Promise<void> {
    try {
      console.log('deleteKeywordByText 호출됨:', { userId, keyword });
      
      const { data, error } = await supabaseRanking
        .from('search_keywords')
        .delete()
        .eq('keyword', keyword)  // user_id 필터 제거
        .select(); // 삭제된 행 반환을 위해 select() 추가

      console.log('삭제 쿼리 결과:', { data, error });

      if (error) {
        console.error('키워드 삭제 오류:', error);
        throw new Error(`키워드 삭제에 실패했습니다: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        console.warn('삭제된 키워드가 없습니다. 이미 삭제되었거나 존재하지 않을 수 있습니다.');
      }
    } catch (error) {
      console.error('키워드 삭제 중 오류:', error);
      throw error;
    }
  }

  /**
   * 사용자의 모든 저장된 키워드 삭제
   */
  async deleteAllUserKeywords(userId: string): Promise<void> {
    try {
      const { error } = await supabaseRanking
        .from('search_keywords')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('전체 키워드 삭제 오류:', error);
        throw new Error(`전체 키워드 삭제에 실패했습니다: ${error.message}`);
      }
    } catch (error) {
      console.error('전체 키워드 삭제 중 오류:', error);
      throw error;
    }
  }
}

export const searchKeywordService = new SearchKeywordService();