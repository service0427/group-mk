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
      currentHour.setMinutes(0); // 분을 0으로
      currentHour.setSeconds(0); // 초를 0으로
      currentHour.setMilliseconds(0); // 밀리초를 0으로
      
      console.log('시간별 데이터 저장 시간:', currentHour.toISOString(), '시간대:', currentHour.getHours() + '시');
      
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
      console.log('시간별 순위 조회 시작 - keyword_id:', keywordId);
      
      // 먼저 전체 데이터 개수 확인
      const { count } = await supabase
        .from('shopping_rankings_hourly')
        .select('*', { count: 'exact', head: true })
        .eq('keyword_id', keywordId);
      
      console.log('전체 시간별 데이터 개수:', count);
      
      // 시간대별 데이터 개수 확인
      const { data: hourStats } = await supabase
        .from('shopping_rankings_hourly')
        .select('hour')
        .eq('keyword_id', keywordId)
        .order('hour', { ascending: false });
      
      if (hourStats) {
        const hourCounts = new Map();
        const uniqueHours = new Set();
        hourStats.forEach(item => {
          const hourDate = new Date(item.hour);
          const hour = hourDate.getHours();
          hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
          uniqueHours.add(item.hour);
        });
        console.log('시간대별 데이터 분포:', Array.from(hourCounts.entries()).sort((a, b) => a[0] - b[0]));
        
        // 최초와 최근 데이터 시간 확인
        const sortedUniqueHours = Array.from(uniqueHours).sort();
        if (sortedUniqueHours.length > 0) {
          console.log('가장 오래된 데이터:', new Date(sortedUniqueHours[0] as string).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));
          console.log('가장 최근 데이터:', new Date(sortedUniqueHours[sortedUniqueHours.length - 1] as string).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));
        }
      }
      
      const { data, error } = await supabase
        .from('shopping_rankings_hourly')
        .select('*')
        .eq('keyword_id', keywordId)
        .gte('hour', new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()) // 72시간 전까지 조회 (3일간)
        .order('hour', { ascending: false })
        .order('rank', { ascending: true })
        .range(0, 1999); // 최대 2,000개 가져오기

      if (error) throw error;
      
      console.log('조회된 시간별 데이터:', data?.length || 0, '개');
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
      console.log('일별 순위 조회 시작 - keyword_id:', keywordId);
      
      // 먼저 전체 데이터 개수 확인
      const { count } = await supabase
        .from('shopping_rankings_daily')
        .select('*', { count: 'exact', head: true })
        .eq('keyword_id', keywordId);
      
      console.log('전체 일별 데이터 개수:', count);
      
      const { data, error } = await supabase
        .from('shopping_rankings_daily')
        .select('*')
        .eq('keyword_id', keywordId)
        // .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // 30일 제한 제거
        .order('date', { ascending: false })
        .order('rank', { ascending: true })
        .limit(5000); // 데이터 제한 추가

      if (error) throw error;
      
      console.log('조회된 일별 데이터:', data?.length || 0, '개');
      return data || [];
    } catch (error) {
      console.error('일별 순위 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 현재 순위 데이터 조회 (가장 최신 시간대만)
   */
  async getCurrentRankings(keywordId: string): Promise<any[]> {
    try {
      console.log('현재 순위 조회 시작 - keyword_id:', keywordId);
      
      // 먼저 가장 최신 시간 찾기
      const { data: latestHourData, error: latestError } = await supabase
        .from('shopping_rankings_hourly')
        .select('hour')
        .eq('keyword_id', keywordId)
        .order('hour', { ascending: false })
        .limit(1);
      
      if (latestError) throw latestError;
      
      if (!latestHourData || latestHourData.length === 0) {
        // hourly 데이터가 없으면 current 테이블에서 조회
        const { data, error } = await supabase
          .from('shopping_rankings_current')
          .select('*')
          .eq('keyword_id', keywordId)
          .order('rank', { ascending: true });

        if (error) throw error;
        
        console.log('조회된 현재 순위 데이터 (current):', data?.length || 0, '개');
        return data || [];
      }
      
      // 가장 최신 시간대의 데이터만 조회
      const latestHour = latestHourData[0].hour;
      console.log('가장 최신 시간:', latestHour);
      
      const { data, error } = await supabase
        .from('shopping_rankings_hourly')
        .select('*')
        .eq('keyword_id', keywordId)
        .eq('hour', latestHour)
        .order('rank', { ascending: true });

      if (error) throw error;
      
      // 이전 시간대 데이터도 가져와서 prev_rank 설정
      const prevHourDate = new Date(latestHour);
      prevHourDate.setHours(prevHourDate.getHours() - 1);
      
      const { data: prevData } = await supabase
        .from('shopping_rankings_hourly')
        .select('product_id, rank')
        .eq('keyword_id', keywordId)
        .lte('hour', prevHourDate.toISOString())
        .order('hour', { ascending: false })
        .limit(100);
      
      const prevRankMap = new Map(
        prevData?.map(item => [item.product_id, item.rank]) || []
      );
      
      // 데이터에 prev_rank 추가
      const dataWithPrevRank = data?.map(item => ({
        ...item,
        prev_rank: prevRankMap.get(item.product_id) || null,
        collected_at: item.hour // 수집 시간 표시용
      })) || [];
      
      console.log('조회된 현재 순위 데이터 (hourly):', dataWithPrevRank.length, '개');
      return dataWithPrevRank;
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