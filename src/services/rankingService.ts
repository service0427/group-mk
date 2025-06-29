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

    // 5. shopping_rankings_current 테이블에서 순위 데이터 검색
    console.log('순위 조회 파라미터:', {
      keyword_uuid: keywordData.id,
      keyword_text: keyword,
      product_id: productId,
      slotId
    });
    
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
    console.log('getBulkSlotRankingData - 캠페인 ID들:', campaignIds);
    
    const { data: campaigns, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, ranking_field_mapping, service_type')
      .in('id', campaignIds);

    if (campaignError || !campaigns) {
      console.error('캠페인 조회 오류:', campaignError);
      return rankingMap;
    }
    
    console.log('getBulkSlotRankingData - 캠페인 매핑 정보:', campaigns.map(c => ({
      id: c.id,
      has_mapping: !!c.ranking_field_mapping,
      mapping: c.ranking_field_mapping
    })));

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

      console.log('필드 매핑 확인:', {
        slotId: slot.id,
        mapping,
        keywordField,
        productIdField
      });

      if (!keywordField || !productIdField) {
        console.log('필드 매핑 누락:', { slotId: slot.id });
        continue;
      }

      const inputData = slotInfo.input_data || slot.inputData;
      console.log('입력 데이터:', {
        slotId: slot.id,
        inputData,
        필드명들: Object.keys(inputData || {})
      });
      
      const keyword = inputData?.[keywordField] || inputData?.mainKeyword;
      const productId = inputData?.[productIdField] || inputData?.mid;
      
      console.log('추출된 값:', {
        slotId: slot.id,
        keyword,
        productId,
        keywordField,
        productIdField,
        allInputData: inputData
      });

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

    // 5. shopping_rankings_current 테이블에서 순위 데이터 일괄 조회
    console.log('일괄 순위 조회 조건:', searchConditions);
    
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
        
        console.log('순위 데이터 찾음:', { 
          slot_id: condition.slot_id, 
          keyword: condition.keyword,
          rank: rankingData.rank,
          prev_rank: rankingData.prev_rank,
          yesterday_rank: rankingData.yesterday_rank,
          collected_at: rankingData.collected_at,
          updated_at: rankingData.updated_at
        });
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