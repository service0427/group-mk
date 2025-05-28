import { supabase } from '@/supabase';

export type SearchType = 'shop' | 'place';

export interface SearchLimitStatus {
  canSearch: boolean;
  dailyLimit: number;
  dailyUsed: number;
  dailyRemaining: number;
  monthlyLimit: number | null;
  monthlyUsed: number;
  monthlyRemaining: number;
  purchasedQuota: number;
  message: string;
}

export interface SearchStats {
  searchType: SearchType;
  totalSearches: number;
  uniqueQueries: number;
  avgDailySearches: number;
}

export interface SearchLog {
  id: string;
  searchType: SearchType;
  searchQuery: string;
  resultCount: number;
  searchedAt: string;
}

class SearchLimitService {
  /**
   * 사용자의 검색 가능 여부를 확인합니다.
   */
  async checkSearchLimit(searchType: SearchType): Promise<SearchLimitStatus> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error('인증되지 않은 사용자입니다.');
      }

      // 사용자 역할 조회
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', userData.user.id)
        .single();

      const userRole = userProfile?.role || 'beginner';

      // 검색 가능 여부 확인
      const { data, error } = await supabase
        .rpc('can_user_search', {
          p_user_id: userData.user.id,
          p_search_type: searchType,
          p_user_role: userRole
        });

      if (error) throw error;
      
      // 데이터가 없으면 기본값 반환
      if (!data) {
        return {
          canSearch: true,
          dailyLimit: -1,
          dailyUsed: 0,
          dailyRemaining: -1,
          monthlyLimit: null,
          monthlyUsed: 0,
          monthlyRemaining: -1,
          purchasedQuota: 0,
          message: '검색 제한 정보를 불러올 수 없습니다.'
        };
      }

      return data as SearchLimitStatus;
    } catch (error) {
      console.error('검색 제한 확인 오류:', error);
      // 오류 발생 시 기본값 반환
      return {
        canSearch: true,
        dailyLimit: 100,
        dailyUsed: 0,
        dailyRemaining: 100,
        monthlyLimit: 3000,
        monthlyUsed: 0,
        monthlyRemaining: 3000,
        purchasedQuota: 0,
        message: '검색 제한 확인 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 검색 로그를 추가합니다.
   */
  async addSearchLog(
    searchType: SearchType,
    searchQuery: string,
    resultCount: number = 0
  ): Promise<boolean> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error('인증되지 않은 사용자입니다.');
      }

      const { error } = await supabase
        .rpc('add_search_log', {
          p_user_id: userData.user.id,
          p_search_type: searchType,
          p_search_query: searchQuery,
          p_result_count: resultCount
        });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('검색 로그 추가 오류:', error);
      return false;
    }
  }

  /**
   * 사용자의 검색 통계를 조회합니다.
   */
  async getUserSearchStats(period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<SearchStats[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error('인증되지 않은 사용자입니다.');
      }

      const { data, error } = await supabase
        .rpc('get_user_search_stats', {
          p_user_id: userData.user.id,
          p_period: period
        });

      if (error) throw error;

      return (data || []).map((stat: any) => ({
        searchType: stat.search_type,
        totalSearches: Number(stat.total_searches),
        uniqueQueries: Number(stat.unique_queries),
        avgDailySearches: Number(stat.avg_daily_searches)
      }));
    } catch (error) {
      console.error('검색 통계 조회 오류:', error);
      return [];
    }
  }

  /**
   * 사용자의 검색 히스토리를 조회합니다.
   */
  async getSearchHistory(
    searchType?: SearchType,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ logs: SearchLog[]; total: number }> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error('인증되지 않은 사용자입니다.');
      }

      let query = supabase
        .from('search_logs')
        .select('*', { count: 'exact' })
        .eq('user_id', userData.user.id)
        .order('searched_at', { ascending: false });

      if (searchType) {
        query = query.eq('search_type', searchType);
      }

      const { data, error, count } = await query
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const logs = (data || []).map(log => ({
        id: log.id,
        searchType: log.search_type as SearchType,
        searchQuery: log.search_query,
        resultCount: log.result_count,
        searchedAt: log.searched_at
      }));

      return { logs, total: count || 0 };
    } catch (error) {
      console.error('검색 히스토리 조회 오류:', error);
      return { logs: [], total: 0 };
    }
  }

  /**
   * 오늘의 검색 횟수를 조회합니다.
   */
  async getTodaySearchCount(searchType: SearchType): Promise<number> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error('인증되지 않은 사용자입니다.');
      }

      const { data, error } = await supabase
        .rpc('get_daily_search_count', {
          p_user_id: userData.user.id,
          p_search_type: searchType
        });

      if (error) throw error;

      return data || 0;
    } catch (error) {
      console.error('일일 검색 횟수 조회 오류:', error);
      return 0;
    }
  }

  /**
   * 추가 검색 권한 구매 내역을 조회합니다.
   */
  async getQuotaPurchases(searchType?: SearchType): Promise<any[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error('인증되지 않은 사용자입니다.');
      }

      let query = supabase
        .from('search_quota_purchases')
        .select('*')
        .eq('user_id', userData.user.id)
        .gte('valid_until', new Date().toISOString().split('T')[0])
        .order('purchased_at', { ascending: false });

      if (searchType) {
        query = query.eq('search_type', searchType);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('검색 권한 구매 내역 조회 오류:', error);
      return [];
    }
  }

  /**
   * 회원 등급별 검색 제한 설정을 조회합니다.
   */
  async getSearchLimitsConfig(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('search_limits_config')
        .select('*')
        .order('user_role', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('검색 제한 설정 조회 오류:', error);
      return [];
    }
  }
}

// 싱글톤 인스턴스 생성
const searchLimitService = new SearchLimitService();

export default searchLimitService;