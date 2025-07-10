import { supabase } from '@/supabase';
import { SERVICE_TYPE_TO_KEYWORD_TYPE, RANKING_TABLE_MAPPING, RANKING_SUPPORT_STATUS, getKeywordTypeFromServiceType } from '@/config/campaign.config';

// 캐시 관련 설정
const CACHE_DURATION = 30 * 1000; // 30초
const rankingCache = new Map<string, { data: Map<string, RankingData>; timestamp: number }>();

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
  status?: 'checked' | 'no-rank' | 'not-target' | 'not-checked'; // 순위 체크 상태
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
      return null;
    }

    const keyword = slot.input_data[keywordField] || slot.input_data.mainKeyword;
    const productId = slot.input_data[productIdField] || slot.input_data.mid;
    
    if (!keyword || !productId) {
      return null;
    }

    // keyword type 결정
    const keywordType = getKeywordTypeFromServiceType(campaign.service_type);
    
    // 4. 먼저 search_keywords 테이블에서 키워드와 type으로 UUID 찾기
    const { data: keywordData, error: keywordError } = await supabase
      .from('search_keywords')
      .select('id')
      .eq('keyword', keyword)
      .eq('type', keywordType)
      .single();
    
    if (keywordError || !keywordData) {
      return null;
    }
    
    // type에 맞는 테이블 선택
    const tableMapping = RANKING_TABLE_MAPPING[keywordType] || RANKING_TABLE_MAPPING.shopping;
    
    const { data: rankingData, error: rankingError } = await supabase
      .from(tableMapping.current)
      .select('*')
      .eq('keyword_id', keywordData.id)
      .eq('product_id', productId)
      .maybeSingle();

    if (rankingError) {
      console.error('순위 데이터 조회 오류:', rankingError);
      return null;
    }
    
    if (!rankingData) {
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
  
  // 캐시 키 생성 (슬롯 ID들을 정렬하여 일관된 키 생성)
  const cacheKey = slots.map(s => s.id).sort().join('|');
  
  // 캐시 확인
  const cached = rankingCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

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
    const searchConditions: Array<{ keyword: string; product_id: string; slot_id: string; campaign_id: number; keyword_type: string }> = [];
    const notTargetSlots = new Set<string>(); // 순위 체크 대상이 아닌 슬롯

    for (const slot of slots) {
      const slotInfo = slotMap.get(slot.id);
      if (!slotInfo) continue;

      const campaign = campaignMap.get(slot.campaignId);
      if (!campaign) continue;
      
      // 순위 체크 지원 여부 확인
      const keywordType = getKeywordTypeFromServiceType(campaign.service_type);
      if (!RANKING_SUPPORT_STATUS[keywordType]) {
        // 순위 체크를 지원하지 않는 타입은 건너뛰기
        continue;
      }

      // 매핑이 없으면 기본 매핑 사용
      const mapping = campaign.ranking_field_mapping || {
        keyword: '검색어',
        product_id: '코드',
        title: '상품명'
      };
      const keywordField = mapping.keyword;
      const productIdField = mapping.product_id;

      if (!keywordField || !productIdField) {
        continue;
      }

      const inputData = slotInfo.input_data || slot.inputData;
      const rawKeyword = inputData?.[keywordField] || inputData?.mainKeyword;
      const keyword = rawKeyword ? rawKeyword.replace(/\r/g, '').trim() : '';
      const rawProductId = inputData?.[productIdField] || inputData?.mid;
      const productId = rawProductId ? String(rawProductId).replace(/\r/g, '').trim() : '';

      if (keyword && productId) {
        searchConditions.push({
          keyword,
          product_id: productId,
          slot_id: slot.id,
          campaign_id: campaign.id,
          keyword_type: keywordType  // 이미 위에서 선언됨
        });
      } else {
        // 키워드나 상품ID를 찾지 못한 경우 (매핑 문제)
        rankingMap.set(slot.id, {
          keyword_id: '',
          product_id: '',
          title: '',
          link: '',
          rank: 0,
          status: 'not-target'  // 미확인으로 표시
        } as RankingData);
      }
    }

    // 순위 체크 대상이 아닌 슬롯들 표시 - 제거
    // notTargetSlots.forEach(slotId => {
    //   rankingMap.set(slotId, {
    //     keyword_id: '',
    //     product_id: '',
    //     title: '',
    //     link: '',
    //     rank: 0,
    //     status: 'not-target'
    //   } as RankingData);
    // });
    
    if (searchConditions.length === 0) {
      return rankingMap;
    }

    // 4. type별로 키워드 그룹화하여 UUID 찾기
    const keywordsByType = new Map<string, Set<string>>();
    searchConditions.forEach(condition => {
      if (!keywordsByType.has(condition.keyword_type)) {
        keywordsByType.set(condition.keyword_type, new Set());
      }
      keywordsByType.get(condition.keyword_type)!.add(condition.keyword);
    });
    
    // type별로 search_keywords 조회
    const keywordMap = new Map<string, string>(); // keyword + type을 키로 사용
    
    for (const [type, keywords] of keywordsByType) {
      const uniqueKeywords = [...keywords];
      if (uniqueKeywords.length > 0) {
        const { data: keywordData, error: keywordError } = await supabase
          .from('search_keywords')
          .select('id, keyword, type')
          .in('keyword', uniqueKeywords)
          .eq('type', type);
        
        if (!keywordError && keywordData) {
          keywordData.forEach(kw => {
            keywordMap.set(`${kw.keyword}:${type}`, kw.id);
          });
        }
      }
    }
    
    // 5. 고유한 keyword_id + product_id 조합 추출
    const uniqueRankingKeys = new Map<string, { keyword_id: string; product_id: string; keyword_type: string; slot_ids: string[] }>();
    
    for (const condition of searchConditions) {
      const keywordUuid = keywordMap.get(`${condition.keyword}:${condition.keyword_type}`);
      if (!keywordUuid) continue;
      
      const key = `${keywordUuid}:${condition.product_id}`;
      if (!uniqueRankingKeys.has(key)) {
        uniqueRankingKeys.set(key, {
          keyword_id: keywordUuid,
          product_id: condition.product_id,
          keyword_type: condition.keyword_type,
          slot_ids: []
        });
      }
      uniqueRankingKeys.get(key)!.slot_ids.push(condition.slot_id);
    }

    // 6. 각 타입별로 순위 데이터 일괄 조회
    const typeGroups = new Map<string, Array<{ keyword_id: string; product_id: string; key: string }>>(); 
    
    for (const [key, value] of uniqueRankingKeys) {
      const tableKey = value.keyword_type;
      if (!typeGroups.has(tableKey)) {
        typeGroups.set(tableKey, []);
      }
      typeGroups.get(tableKey)!.push({
        keyword_id: value.keyword_id,
        product_id: value.product_id,
        key: key
      });
    }

    // 전일 날짜 계산
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // 각 타입별로 순위 데이터 조회
    for (const [keywordType, items] of typeGroups) {
      const tableMapping = RANKING_TABLE_MAPPING[keywordType] || RANKING_TABLE_MAPPING.shopping;
      
      // 현재 순위와 전일 순위를 Promise.all로 병렬 처리
      if (items.length > 0) {
        const rankingPromises = items.map(async item => {
          // 현재 순위 조회
          const currentPromise = supabase
            .from(tableMapping.current)
            .select('*')
            .eq('keyword_id', item.keyword_id)
            .eq('product_id', item.product_id)
            .maybeSingle();
          
          // 전일 순위 조회
          const yesterdayPromise = supabase
            .from(tableMapping.daily)
            .select('rank')
            .eq('keyword_id', item.keyword_id)
            .eq('product_id', item.product_id)
            .eq('date', yesterdayStr)
            .maybeSingle();
          
          const [currentResult, yesterdayResult] = await Promise.all([
            currentPromise,
            yesterdayPromise
          ]);
          
          return {
            key: item.key,
            current: currentResult,
            yesterday: yesterdayResult
          };
        });
        
        const results = await Promise.all(rankingPromises);
        
        // 결과 처리
        results.forEach(result => {
          const info = uniqueRankingKeys.get(result.key);
          if (!info) return;
          
          if (!result.current.error && result.current.data) {
            const rankingData = result.current.data;
            
            // 전일 순위 추가
            if (!result.yesterday.error && result.yesterday.data) {
              rankingData.yesterday_rank = result.yesterday.data.rank;
            }
            
            rankingData.status = 'checked';
            
            // 모든 관련 슬롯에 동일한 순위 데이터 설정
            info.slot_ids.forEach(slotId => {
              rankingMap.set(slotId, rankingData);
            });
          } else {
            // 순위가 없는 경우
            info.slot_ids.forEach(slotId => {
              rankingMap.set(slotId, {
                keyword_id: info.keyword_id,
                product_id: info.product_id,
                title: '',
                link: '',
                rank: -1,
                status: 'no-rank'
              } as RankingData);
            });
          }
        });
      }
    }

    // 캐시에 저장
    rankingCache.set(cacheKey, {
      data: rankingMap,
      timestamp: Date.now()
    });
    
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
      .select('ranking_field_mapping, service_type')
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
      return null;
    }

    // 캠페인의 keyword type 결정
    const keywordType = getKeywordTypeFromServiceType(campaign.service_type || 'default');
    
    // 4. 키워드 UUID 조회
    const { data: keywordData, error: keywordError } = await supabase
      .from('search_keywords')
      .select('id')
      .eq('keyword', keyword)
      .eq('type', keywordType)
      .single();

    if (keywordError || !keywordData) {
      return null;
    }

    const keywordId = keywordData.id;

    // type에 맞는 테이블 선택
    const tableMapping = RANKING_TABLE_MAPPING[keywordType] || RANKING_TABLE_MAPPING.shopping;
    
    // 5. 작업 기간 내 일별 순위 데이터 조회
    const { data: rankingData, error: rankingError } = await supabase
      .from(tableMapping.daily)
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
      .from(tableMapping.current)
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
      .select('id, ranking_field_mapping, service_type')
      .in('id', campaignIds);

    if (campaignError || !campaigns) {
      console.error('캠페인 조회 오류:', campaignError);
      return rankingMap;
    }

    // 캠페인 매핑 정보를 Map으로 변환
    const campaignMap = new Map(campaigns.map(c => [c.id, c]));

    // 2. 각 슬롯에 대해 순위 데이터 검색을 위한 조건 준비
    const searchConditions: Array<{ keyword: string; product_id: string; slot_id: string; campaign_id: number; keyword_type: string }> = [];

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
        // 캠페인 정보가 필요하므로 service_type을 조회
        const { data: campaignData } = await supabase
          .from('campaigns')
          .select('service_type')
          .eq('id', slot.campaignId)
          .single();
          
        const keywordType = getKeywordTypeFromServiceType(campaignData?.service_type || 'default');
        
        searchConditions.push({
          keyword,
          product_id: productId,
          slot_id: slot.id,
          campaign_id: slot.campaignId,
          keyword_type: keywordType
        });
      }
    }

    if (searchConditions.length === 0) {
      return rankingMap;
    }

    // 3. type별로 키워드 그룹화하여 UUID 찾기
    const keywordsByType = new Map<string, Set<string>>();
    searchConditions.forEach(condition => {
      if (!keywordsByType.has(condition.keyword_type)) {
        keywordsByType.set(condition.keyword_type, new Set());
      }
      keywordsByType.get(condition.keyword_type)!.add(condition.keyword);
    });
    
    // type별로 search_keywords 조회
    const keywordMap = new Map<string, string>(); // keyword + type을 키로 사용
    
    for (const [type, keywords] of keywordsByType) {
      const uniqueKeywords = [...keywords];
      if (uniqueKeywords.length > 0) {
        const { data: keywordData, error: keywordError } = await supabase
          .from('search_keywords')
          .select('id, keyword')
          .in('keyword', uniqueKeywords)
          .eq('type', type);
        
        if (!keywordError && keywordData) {
          keywordData.forEach(kw => {
            keywordMap.set(`${kw.keyword}:${type}`, kw.id);
          });
        }
      }
    }

    // 4. type에 맞는 테이블에서 순위 데이터 일괄 조회
    for (const condition of searchConditions) {
      const keywordUuid = keywordMap.get(`${condition.keyword}:${condition.keyword_type}`);
      if (!keywordUuid) {
        continue;
      }
      
      // type에 맞는 테이블 선택
      const tableMapping = RANKING_TABLE_MAPPING[condition.keyword_type] || RANKING_TABLE_MAPPING.shopping;

      const { data: rankingData, error: rankingError } = await supabase
        .from(tableMapping.current)
        .select('*')
        .eq('keyword_id', keywordUuid)
        .eq('product_id', condition.product_id)
        .maybeSingle();

      if (!rankingError && rankingData) {
        // 전일 순위 조회
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        const { data: yesterdayData } = await supabase
          .from(tableMapping.daily)
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