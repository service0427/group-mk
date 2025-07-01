import { supabase } from '@/supabase';

interface RankingData {
  keyword_id: string;
  product_id: string;
  title: string;
  link: string;
  rank: number;
  prev_rank?: number;
  yesterday_rank?: number; // 전일 순위 추가
  lprice?: number;
  mall_name?: string;
  brand?: string;
  image?: string;
  [key: string]: any;
}

interface RankingFieldMapping {
  keyword?: string;
  product_id?: string;
  title?: string;
  link?: string;
  rank?: string;
}

// 슬롯의 순위 데이터를 가져오는 함수
export async function getSlotRankingData(
  slotId: string,
  campaignId: number,
  fieldMapping?: RankingFieldMapping
): Promise<RankingData | null> {
  try {
    // 1. 캠페인 정보와 매핑 정보 가져오기
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('ranking_field_mapping, service_type')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      console.error('캠페인 조회 오류:', campaignError);
      return null;
    }

    const mapping = fieldMapping || campaign.ranking_field_mapping;
    if (!mapping) {
      console.log('필드 매핑 정보가 없습니다');
      return null;
    }

    // 2. 슬롯의 입력 데이터와 키워드 ID 가져오기
    const { data: slot, error: slotError } = await supabase
      .from('slots')
      .select('input_data, keyword_id')
      .eq('id', slotId)
      .single();

    if (slotError || !slot || !slot.input_data) {
      console.error('슬롯 조회 오류:', slotError);
      return null;
    }

    // 3. 매핑된 필드를 사용하여 키워드와 상품 ID 가져오기
    const keywordField = mapping.keyword;
    const productIdField = mapping.product_id;
    
    if (!keywordField || !productIdField) {
      console.log('키워드 또는 상품ID 매핑이 없습니다');
      return null;
    }

    const keyword = slot.input_data[keywordField] || slot.input_data.mainKeyword;
    const productId = slot.input_data[productIdField] || slot.input_data.mid;
    
    if (!keyword || !productId) {
      console.log('키워드 또는 상품ID 값이 없습니다');
      return null;
    }

    // 4. 먼저 search_keywords 테이블에서 키워드로 UUID 찾기
    const { data: keywordData, error: keywordError } = await supabase
      .from('search_keywords')
      .select('id')
      .eq('keyword', keyword)
      .single();
    
    if (keywordError || !keywordData) {
      console.log('키워드 UUID 찾기 실패:', { keyword, error: keywordError?.code });
      return null;
    }
    
    const { data: rankingData, error: rankingError } = await supabase
      .from('shopping_rankings_current')
      .select('*')
      .eq('keyword_id', keywordData.id)
      .eq('product_id', productId)
      .single();

    if (rankingError) {
      if (rankingError.code !== 'PGRST116') { // 데이터가 없는 경우가 아니면 에러 로그
        console.error('순위 데이터 조회 오류:', rankingError);
      } else {
        console.log('순위 데이터 없음:', { keyword_id: slot.keyword_id, product_id: productId });
      }
      return null;
    }

    return rankingData;
  } catch (error) {
    console.error('순위 데이터 조회 중 오류:', error);
    return null;
  }
}

// 여러 슬롯의 순위 데이터를 한번에 가져오는 함수
export async function getBulkSlotRankingData(
  slots: Array<{ id: string; campaignId: number; inputData: any; keywordId?: string }>
): Promise<Map<string, RankingData>> {
  const rankingMap = new Map<string, RankingData>();

  try {
    // 1. 슬롯 ID로 키워드 ID 정보 가져오기
    const slotIds = slots.map(s => s.id);
    const { data: slotData, error: slotError } = await supabase
      .from('slots')
      .select('id, keyword_id, input_data')
      .in('id', slotIds);

    if (slotError || !slotData) {
      console.error('슬롯 조회 오류:', slotError);
      return rankingMap;
    }

    // 슬롯 데이터를 Map으로 변환
    const slotMap = new Map(slotData.map(s => [s.id, s]));

    // 2. 캠페인 매핑 정보 가져오기
    const campaignIds = [...new Set(slots.map(s => s.campaignId))];
    
    const { data: campaigns, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, ranking_field_mapping, service_type')
      .in('id', campaignIds);

    if (campaignError || !campaigns) {
      console.error('캠페인 조회 오류:', campaignError);
      return rankingMap;
    }

    // 캠페인 매핑 정보를 Map으로 변환
    const campaignMap = new Map(campaigns.map(c => [c.id, c]));

    // 3. 각 슬롯에 대해 순위 데이터 검색을 위한 조건 준비
    const searchConditions: Array<{ keyword: string; product_id: string; slot_id: string }> = [];

    for (const slot of slots) {
      const slotInfo = slotMap.get(slot.id);
      if (!slotInfo) continue;

      const campaign = campaignMap.get(slot.campaignId);
      if (!campaign) continue;

      // 매핑이 없으면 기본 매핑 사용
      const mapping = campaign.ranking_field_mapping || {
        keyword: '검색어',
        product_id: '코드',
        title: '상품명'
      };
      const keywordField = mapping.keyword;
      const productIdField = mapping.product_id;

      if (!keywordField || !productIdField) {
        console.log('필드 매핑 누락:', { slotId: slot.id });
        continue;
      }

      const inputData = slotInfo.input_data || slot.inputData;
      const keyword = inputData?.[keywordField] || inputData?.mainKeyword;
      const productId = inputData?.[productIdField] || inputData?.mid;

      if (keyword && productId) {
        searchConditions.push({
          keyword,
          product_id: productId,
          slot_id: slot.id
        });
      }
    }

    if (searchConditions.length === 0) {
      return rankingMap;
    }

    // 4. 키워드로 UUID 찾기 (중복 제거)
    const uniqueKeywords = [...new Set(searchConditions.map(c => c.keyword))];
    const keywordMap = new Map<string, string>();
    
    if (uniqueKeywords.length > 0) {
      const { data: keywordData, error: keywordError } = await supabase
        .from('search_keywords')
        .select('id, keyword')
        .in('keyword', uniqueKeywords);
      
      if (!keywordError && keywordData) {
        keywordData.forEach(kw => {
          keywordMap.set(kw.keyword, kw.id);
        });
      }
    }
    
    for (const condition of searchConditions) {
      const keywordUuid = keywordMap.get(condition.keyword);
      if (!keywordUuid) {
        console.log('키워드 UUID 없음:', condition.keyword);
        continue;
      }

      const { data: rankingData, error: rankingError } = await supabase
        .from('shopping_rankings_current')
        .select('*')
        .eq('keyword_id', keywordUuid)
        .eq('product_id', condition.product_id)
        .single();

      if (!rankingError && rankingData) {
        // 전일 순위 조회
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        const { data: yesterdayData, error: yesterdayError } = await supabase
          .from('shopping_rankings_daily')
          .select('rank')
          .eq('keyword_id', keywordUuid)
          .eq('product_id', condition.product_id)
          .eq('date', yesterdayStr)
          .single();
        
        if (!yesterdayError && yesterdayData) {
          rankingData.yesterday_rank = yesterdayData.rank;
        }

        rankingMap.set(condition.slot_id, rankingData);
      } else if (rankingError) {
        console.log('순위 데이터 조회 실패:', { 
          slot_id: condition.slot_id, 
          keyword: condition.keyword,
          keyword_uuid: keywordUuid, 
          product_id: condition.product_id,
          error: rankingError.code 
        });
      }
    }

    return rankingMap;
  } catch (error) {
    console.error('일괄 순위 데이터 조회 중 오류:', error);
    return rankingMap;
  }
}

// 보장형 슬롯용 순위 데이터 조회 인터페이스
interface GuaranteeRankingData {
  date: string;
  rank: number;
  isAchieved: boolean; // 목표 순위 달성 여부
}

interface GuaranteeRankingStats {
  targetRank: number;
  currentRank: number | null;
  firstRank: number | null;
  bestRank: number | null;
  averageRank: number | null;
  achievedDays: number;
  totalDays: number;
  achievementRate: number;
  dailyRankings: GuaranteeRankingData[];
}

// 보장형 슬롯의 작업 기간 내 순위 데이터 조회
export async function getGuaranteeSlotRankingData(
  slotId: string,
  campaignId: number,
  targetRank: number,
  startDate: string,
  endDate: string
): Promise<GuaranteeRankingStats | null> {
  try {

    // 1. 캠페인의 필드 매핑 정보 조회
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('ranking_field_mapping')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      console.error('[보장형 순위 조회] 캠페인 조회 오류:', campaignError);
      return null;
    }

    // 매핑이 없으면 기본 매핑 사용
    const mapping = campaign.ranking_field_mapping || {
      keyword: '검색어',
      product_id: '코드',
      title: '상품명'
    };

    // 2. 보장형 슬롯의 입력 데이터 조회
    const { data: slotData, error: slotError } = await supabase
      .from('guarantee_slots')
      .select('input_data')
      .eq('id', slotId)
      .single();

    if (slotError || !slotData) {
      console.error('[보장형 순위 조회] 슬롯 데이터 조회 오류:', slotError);
      return null;
    }


    // 3. 키워드와 상품ID 추출
    const inputData = slotData.input_data;
    const keywordField = mapping.keyword || '검색어';
    const productIdField = mapping.product_id || '코드';
    
    // 키워드 추출 (중첩 구조 처리)
    let keyword = inputData?.[keywordField] || inputData?.mainKeyword || inputData?.keyword;
    let productId = inputData?.[productIdField] || inputData?.mid || inputData?.product_id;
    
    // 중첩된 keywords 배열에서 추출 시도
    if (!keyword && inputData?.keywords && Array.isArray(inputData.keywords) && inputData.keywords.length > 0) {
      const firstKeywordItem = inputData.keywords[0];
      if (firstKeywordItem?.input_data) {
        keyword = firstKeywordItem.input_data.keyword || firstKeywordItem.input_data.mainKeyword;
        // productId도 중첩 구조에서 추출
        if (!productId) {
          productId = firstKeywordItem.input_data.mid || firstKeywordItem.input_data.product_id;
        }
      }
    }

    if (!keyword || !productId) {
      console.log('[보장형 순위 조회] 키워드 또는 상품ID가 없습니다');
      return null;
    }

    // 4. 키워드 UUID 조회
    const { data: keywordData, error: keywordError } = await supabase
      .from('search_keywords')
      .select('id')
      .eq('keyword', keyword)
      .single();

    if (keywordError || !keywordData) {
      console.log('[보장형 순위 조회] 키워드 UUID를 찾을 수 없습니다:', keyword);
      return null;
    }

    const keywordId = keywordData.id;

    // 5. 작업 기간 내 일별 순위 데이터 조회
    const { data: rankingData, error: rankingError } = await supabase
      .from('shopping_rankings_daily')
      .select('date, rank')
      .eq('keyword_id', keywordId)
      .eq('product_id', productId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (rankingError) {
      console.error('[보장형 순위 조회] 순위 데이터 조회 오류:', rankingError);
      return null;
    }


    // 6. 현재 순위 조회 (가장 최신)
    const { data: currentRankData } = await supabase
      .from('shopping_rankings_current')
      .select('rank')
      .eq('keyword_id', keywordId)
      .eq('product_id', productId)
      .single();

    // 7. 통계 계산
    const dailyRankings: GuaranteeRankingData[] = [];
    let firstRank: number | null = null;
    let bestRank: number | null = null;
    let totalRank = 0;
    let achievedDays = 0;
    let validDays = 0;

    if (rankingData && rankingData.length > 0) {
      rankingData.forEach((item, index) => {
        const rank = item.rank;
        const isAchieved = rank <= targetRank;
        
        dailyRankings.push({
          date: item.date,
          rank: rank,
          isAchieved: isAchieved
        });

        // 첫 번째 순위 (최초 순위)
        if (index === 0) {
          firstRank = rank;
        }

        // 최고 순위 (가장 낮은 숫자)
        if (bestRank === null || rank < bestRank) {
          bestRank = rank;
        }

        // 평균 계산용
        totalRank += rank;
        validDays++;

        // 목표 달성 일수
        if (isAchieved) {
          achievedDays++;
        }
      });
    }

    // 작업 기간 총 일수 계산
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const stats: GuaranteeRankingStats = {
      targetRank: targetRank,
      currentRank: currentRankData?.rank || null,
      firstRank: firstRank,
      bestRank: bestRank,
      averageRank: validDays > 0 ? Math.round((totalRank / validDays) * 10) / 10 : null,
      achievedDays: achievedDays,
      totalDays: totalDays,
      achievementRate: totalDays > 0 ? Math.round((achievedDays / totalDays) * 100) : 0,
      dailyRankings: dailyRankings
    };

    return stats;

  } catch (error) {
    console.error('[보장형 순위 조회] 오류:', error);
    return null;
  }
}

// 보장형 슬롯 일괄 순위 조회
export async function getBulkGuaranteeSlotRankingData(
  slots: Array<{ id: string; campaignId: number; inputData: any }>
): Promise<Map<string, RankingData>> {
  const rankingMap = new Map<string, RankingData>();

  try {
    // 1. 캠페인 매핑 정보 가져오기
    const campaignIds = [...new Set(slots.map(s => s.campaignId))];
    
    const { data: campaigns, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, ranking_field_mapping')
      .in('id', campaignIds);

    if (campaignError || !campaigns) {
      console.error('캠페인 조회 오류:', campaignError);
      return rankingMap;
    }

    // 캠페인 매핑 정보를 Map으로 변환
    const campaignMap = new Map(campaigns.map(c => [c.id, c]));

    // 2. 각 슬롯에 대해 순위 데이터 검색을 위한 조건 준비
    const searchConditions: Array<{ keyword: string; product_id: string; slot_id: string }> = [];

    for (const slot of slots) {
      const campaign = campaignMap.get(slot.campaignId);
      if (!campaign) continue;

      // 매핑이 없으면 기본 매핑 사용
      const mapping = campaign.ranking_field_mapping || {
        keyword: '검색어',
        product_id: '코드',
        title: '상품명'
      };
      
      const keywordField = mapping.keyword || '검색어';
      const productIdField = mapping.product_id || '코드';

      const inputData = slot.inputData;
      
      // 키워드 추출 (중첩 구조 처리)
      let keyword = inputData?.[keywordField] || inputData?.mainKeyword || inputData?.keyword;
      let productId = inputData?.[productIdField] || inputData?.mid || inputData?.product_id;
      
      // 중첩된 keywords 배열에서 추출 시도
      if (!keyword && inputData?.keywords && Array.isArray(inputData.keywords) && inputData.keywords.length > 0) {
        const firstKeywordItem = inputData.keywords[0];
        if (firstKeywordItem?.input_data) {
          keyword = firstKeywordItem.input_data.keyword || firstKeywordItem.input_data.mainKeyword;
          // productId도 중첩 구조에서 추출
          if (!productId) {
            productId = firstKeywordItem.input_data.mid || firstKeywordItem.input_data.product_id;
          }
        }
      }

      if (keyword && productId) {
        searchConditions.push({
          keyword,
          product_id: productId,
          slot_id: slot.id
        });
      }
    }

    if (searchConditions.length === 0) {
      return rankingMap;
    }

    // 3. 키워드로 UUID 찾기
    const uniqueKeywords = [...new Set(searchConditions.map(c => c.keyword))];
    const keywordMap = new Map<string, string>();
    
    if (uniqueKeywords.length > 0) {
      const { data: keywordData, error: keywordError } = await supabase
        .from('search_keywords')
        .select('id, keyword')
        .in('keyword', uniqueKeywords);
      
      if (!keywordError && keywordData) {
        keywordData.forEach(kw => {
          keywordMap.set(kw.keyword, kw.id);
        });
      }
    }

    // 4. shopping_rankings_current 테이블에서 순위 데이터 일괄 조회
    for (const condition of searchConditions) {
      const keywordUuid = keywordMap.get(condition.keyword);
      if (!keywordUuid) {
        continue;
      }

      const { data: rankingData, error: rankingError } = await supabase
        .from('shopping_rankings_current')
        .select('*')
        .eq('keyword_id', keywordUuid)
        .eq('product_id', condition.product_id)
        .single();

      if (!rankingError && rankingData) {
        // 전일 순위 조회
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        const { data: yesterdayData } = await supabase
          .from('shopping_rankings_daily')
          .select('rank')
          .eq('keyword_id', keywordUuid)
          .eq('product_id', condition.product_id)
          .eq('date', yesterdayStr)
          .single();
        
        if (yesterdayData) {
          rankingData.yesterday_rank = yesterdayData.rank;
        }
        
        rankingMap.set(condition.slot_id, rankingData);
      }
    }

    return rankingMap;
  } catch (error) {
    console.error('보장형 일괄 순위 데이터 조회 중 오류:', error);
    return rankingMap;
  }
}