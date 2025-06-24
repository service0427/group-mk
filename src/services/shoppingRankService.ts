import { supabase } from '@/supabase';

export interface ShoppingRankData {
  keyword_id: string;
  product_id: string;
  rank: number;
  title: string;
  lprice: number;
  image?: string;
  mall_name?: string;
  brand?: string;
  category1?: string;
  category2?: string;
  link?: string;
}

class ShoppingRankService {
  /**
   * 현재 순위 데이터 저장
   */
  async saveCurrentRankings(keywordId: string, items: any[]): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      // 이전 순위 조회 (순위 변동 확인용)
      const { data: prevRankings } = await supabase
        .from('shopping_rankings_current')
        .select('product_id, rank')
        .eq('keyword_id', keywordId);
      
      const prevRankMap = new Map(
        prevRankings?.map(item => [item.product_id, item.rank]) || []
      );

      // 현재 순위 데이터 준비
      const currentRankings = items.map(item => ({
        keyword_id: keywordId,
        product_id: item.productId,
        rank: item.rank,
        prev_rank: prevRankMap.get(item.productId) || null,
        title: item.title,
        lprice: parseInt(item.lprice),
        image: item.image,
        mall_name: item.mallName,
        brand: item.brand,
        category1: item.category1,
        category2: item.category2,
        link: item.link,
        collected_at: now,
      }));

      // 현재 순위 테이블 업데이트 (upsert)
      const { error: currentError } = await supabase
        .from('shopping_rankings_current')
        .upsert(currentRankings, {
          onConflict: 'keyword_id,product_id',
        });

      if (currentError) throw currentError;

      // 시간별 데이터 저장
      const currentHour = new Date(now);
      currentHour.setMinutes(0, 0, 0); // 정시로 맞춤 (분, 초, 밀리초)
      
      const hourlyData = items.map(item => ({
        keyword_id: keywordId,
        product_id: item.productId,
        hour: currentHour.toISOString(), // ISO 문자열로 변환
        rank: item.rank,
        title: item.title,
        lprice: parseInt(item.lprice),
        image: item.image,
        mall_name: item.mallName,
        brand: item.brand,
        category1: item.category1,
        category2: item.category2,
        link: item.link,
      }));

      const { error: hourlyError } = await supabase
        .from('shopping_rankings_hourly')
        .upsert(hourlyData, {
          onConflict: 'keyword_id,product_id,hour',
        });

      if (hourlyError) throw hourlyError;

    } catch (error) {
      console.error('순위 데이터 저장 오류:', error);
      throw error;
    }
  }

  /**
   * 시간별 순위 데이터 조회
   */
  async getHourlyRankings(keywordId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('shopping_rankings_hourly')
        .select('*')
        .eq('keyword_id', keywordId)
        .gte('hour', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 최근 24시간
        .order('hour', { ascending: false })
        .order('rank', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('시간별 순위 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 일별 순위 데이터 조회
   */
  async getDailyRankings(keywordId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('shopping_rankings_daily')
        .select('*')
        .eq('keyword_id', keywordId)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // 최근 30일
        .order('date', { ascending: false })
        .order('rank', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('일별 순위 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 현재 순위 데이터 조회
   */
  async getCurrentRankings(keywordId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('shopping_rankings_current')
        .select('*')
        .eq('keyword_id', keywordId)
        .order('rank', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('현재 순위 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 상위 10개 제품의 주간 트렌드 조회
   */
  async getWeeklyTrend(keywordId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('shopping_top_products_weekly_trend')
        .select('*')
        .eq('keyword_id', keywordId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('주간 트렌드 조회 오류:', error);
      throw error;
    }
  }
}

export const shoppingRankService = new ShoppingRankService();