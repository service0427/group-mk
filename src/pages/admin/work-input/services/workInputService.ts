import { supabase } from '@/supabase';
import { SlotWorkInfo, WorkInputFormData, Slot, FilterOptions } from '../types';
import { toast } from 'sonner';

// 활성화된 슬롯 목록 가져오기
export const getActiveSlots = async (userId: string, filterOptions?: FilterOptions): Promise<Slot[]> => {
  try {
    // 1. 필터에 따라 campaigns 테이블 조회 쿼리 구성
    let campaignQuery = supabase
      .from('campaigns')
      .select('id, campaign_name, service_type, description')
      .in('status', ['pending','active']);
    
    // 서비스 타입으로 필터링
    if (filterOptions?.service_type) {
      campaignQuery = campaignQuery.eq('service_type', filterOptions.service_type);
    }
    
    // campaign_id로 필터링
    if (filterOptions?.campaign_id) {
      campaignQuery = campaignQuery.eq('id', filterOptions.campaign_id);
    }
    
    // mat_id로 직접 필터링 (campaigns 테이블에도 mat_id가 있는 경우)
    if (filterOptions?.mat_id) {
      campaignQuery = campaignQuery.eq('mat_id', filterOptions.mat_id);
    }
    
    // 검색어로 필터링
    if (filterOptions?.search) {
      campaignQuery = campaignQuery.ilike('campaign_name', `%${filterOptions.search}%`);
    }
    
    // 캠페인 데이터 조회
    const { data: campaignsData, error: campaignsError } = await campaignQuery;
    
    if (campaignsError) {
      console.error('캠페인 목록 조회 중 오류 발생:', campaignsError);
      throw campaignsError;
    }
    
    if (!campaignsData || campaignsData.length === 0) {
      return [];
    }
    
    // 2. 조회된 캠페인 ID를 기반으로 slots 테이블 조회 (사용자 정보 JOIN)
    let slotQuery = supabase
      .from('slots')
      .select(`
        id, 
        status, 
        quantity, 
        start_date, 
        end_date, 
        user_id, 
        mat_id,
        product_id,
        input_data,
        users!inner(
          email,
          full_name
        )
      `)
      .eq('status', 'approved')
      .eq('mat_id', userId)
      .in('product_id', campaignsData.map(c => c.id));
    
    
    const { data: slotsData, error: slotsError } = await slotQuery;
    
    if (slotsError) {
      console.error('슬롯 목록 조회 중 오류 발생:', slotsError);
      throw slotsError;
    }
    
    // 3. 캠페인 데이터를 Map으로 변환하여 빠르게 조회할 수 있게 함
    const campaignMap = new Map<number, typeof campaignsData[0]>();
    campaignsData.forEach(campaign => {
      campaignMap.set(campaign.id, campaign);
    });
    
    // 4. 슬롯 데이터와 캠페인 데이터 결합
    const formattedData = slotsData?.map(slot => {
      const campaign = campaignMap.get(slot.product_id);
      
      if (!campaign) {
        return null; // 캠페인 정보가 없는 경우 (비정상 데이터)
      }
      
      return {
        ...slot,
        campaign_name: campaign.campaign_name,
        campaign_id: campaign.id,
        service_type: campaign.service_type,
        description: campaign.description,
        // 사용자 정보 추가
        user_email: (slot.users as any)?.email,
        user_name: (slot.users as any)?.full_name || (slot.users as any)?.email,
        // input_data에서 키워드, MID, URL 추출
        keywords: (() => {
          try {
            const inputData = typeof slot.input_data === 'string' 
              ? JSON.parse(slot.input_data) 
              : slot.input_data;
            
            if (!inputData) return '';
            
            // 메인 키워드와 서브 키워드를 구분하여 포맷팅
            const mainKeyword = inputData.mainKeyword?.trim() || '';
            const subKeywords = [
              inputData.keyword1,
              inputData.keyword2,
              inputData.keyword3
            ].filter(keyword => keyword && keyword.trim());
            
            if (!mainKeyword && subKeywords.length === 0) return '';
            
            // 메인 키워드 + 줄바꿈 + 서브 키워드들
            let result = mainKeyword;
            if (subKeywords.length > 0) {
              result += '\n' + subKeywords.join(', ');
            }
            
            return result;
          } catch (e) {
            return '';
          }
        })(),
        mid: (() => {
          try {
            const inputData = typeof slot.input_data === 'string' 
              ? JSON.parse(slot.input_data) 
              : slot.input_data;
            
            return inputData?.mid || '';
          } catch (e) {
            return '';
          }
        })(),
        url: (() => {
          try {
            const inputData = typeof slot.input_data === 'string' 
              ? JSON.parse(slot.input_data) 
              : slot.input_data;
            
            return inputData?.url || '';
          } catch (e) {
            return '';
          }
        })()
      } as Slot;
    }).filter(slot => slot !== null) as Slot[] || [];

    return formattedData;
  } catch (error) {
    console.error('슬롯 목록 조회 중 오류 발생:', error);
    throw error;
  }
};

// 특정 슬롯의 작업 기록 가져오기
export const getSlotWorks = async (slotId: string): Promise<SlotWorkInfo[]> => {
  try {
    const { data, error } = await supabase
      .from('slot_works_info')
      .select('*')
      .eq('slot_id', slotId)
      .order('date', { ascending: false });

    if (error) {
      console.error('작업 기록 조회 중 오류 발생:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('작업 기록 조회 중 오류 발생:', error);
    throw error;
  }
};

// 작업 기록 추가
export const addSlotWork = async (workData: WorkInputFormData, userId: string): Promise<SlotWorkInfo> => {
  try {
    // 동일 날짜에 이미 기록이 있는지 확인
    const { data: existingData, error: checkError } = await supabase
      .from('slot_works_info')
      .select('id')
      .eq('slot_id', workData.slot_id)
      .eq('date', workData.date);

    if (checkError) {
      console.error('기존 작업 기록 확인 중 오류 발생:', checkError);
      throw checkError;
    }

    if (existingData && existingData.length > 0) {
      throw new Error('해당 날짜에 이미 작업 기록이 존재합니다. 수정하시려면 기존 기록을 편집해주세요.');
    }

    // 새 작업 기록 추가
    const { data, error } = await supabase
      .from('slot_works_info')
      .insert({
        slot_id: workData.slot_id,
        date: workData.date,
        work_cnt: workData.work_cnt,
        notes: workData.notes || null,
        created_by: userId
      })
      .select('*')
      .single();

    if (error) {
      console.error('작업 기록 추가 중 오류 발생:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('작업 기록 추가 중 오류 발생:', error);
    throw error;
  }
};

// 작업 기록 수정
export const updateSlotWork = async (id: string, workData: Partial<WorkInputFormData>): Promise<SlotWorkInfo> => {
  try {
    const { data, error } = await supabase
      .from('slot_works_info')
      .update({
        date: workData.date,
        work_cnt: workData.work_cnt,
        notes: workData.notes
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('작업 기록 수정 중 오류 발생:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('작업 기록 수정 중 오류 발생:', error);
    throw error;
  }
};

// 작업 기록 삭제
export const deleteSlotWork = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('slot_works_info')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('작업 기록 삭제 중 오류 발생:', error);
      throw error;
    }
  } catch (error) {
    console.error('작업 기록 삭제 중 오류 발생:', error);
    throw error;
  }
};

// 오늘 날짜 YYYY-MM-DD 형식으로 가져오기
export const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 서비스 타입 한글명 변환
export const getServiceTypeName = (serviceType: string): string => {
  const serviceTypes: Record<string, string> = {
    'NaverTraffic': '네이버 트래픽',
    'NaverAuto': '네이버 자동완성',
    'NaverShoppingTraffic': '네이버 쇼핑 트래픽',
    'NaverShoppingFakeSale': '네이버 쇼핑 가구매',
    'NaverPlaceTraffic': '네이버 플레이스 트래픽',
    'NaverPlaceSave': '네이버 플레이스 저장',
    'NaverPlaceShare': '네이버 플레이스 공유',
    'CoupangTraffic': '쿠팡 트래픽',
    'CoupangFakeSale': '쿠팡 가구매',
    // 이전 포맷 호환성 유지
    'ntraffic': '네이버 트래픽',
    'naver-traffic': '네이버 트래픽',
    'naver-auto': '네이버 자동완성',
    'naver-shopping-traffic': '네이버 쇼핑 트래픽',
    'naver-place-traffic': '네이버 플레이스 트래픽',
    'naver-place-save': '네이버 플레이스 저장',
    'naver-place-share': '네이버 플레이스 공유',
    'coupang-traffic': '쿠팡 트래픽',
    'ohouse-traffic': '오늘의집 트래픽'
  };
  
  return serviceTypes[serviceType] || serviceType;
};

// MAT ID에서 사용자 이름 가져오기 (예시)
export const getUserNameFromMatId = async (matId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('full_name, organization_name')
      .eq('id', matId)
      .single();

    if (error) {
      console.error('사용자 정보 조회 중 오류 발생:', error);
      return '알 수 없음';
    }

    return (data?.organization_name || data?.full_name || '알 수 없음') as string;
  } catch (error) {
    console.error('사용자 정보 조회 중 오류 발생:', error);
    return '알 수 없음';
  }
};

// 총판의 캠페인 그룹 가져오기
export interface CampaignGroup {
  mat_id: string;
  campaign_name: string;
  service_type: string;
  slot_count: number;
}

export const getCampaignGroups = async (userId: string, serviceType?: string, matId?: string): Promise<CampaignGroup[]> => {
  try {
    // 1. 먼저 campaigns 테이블에서 활성화된 캠페인 조회
    let campaignQuery = supabase
      .from('campaigns')
      .select('id, campaign_name, service_type, mat_id')
      .in('status', ['pending','active']);
      
    if (serviceType) {
      campaignQuery = campaignQuery.eq('service_type', serviceType);
    }
    
    if (matId) {
      campaignQuery = campaignQuery.eq('mat_id', matId);
    }
    
    const { data: campaignsData, error: campaignsError } = await campaignQuery;
    
    if (campaignsError) {
      console.error('캠페인 목록 조회 중 오류 발생:', campaignsError);
      throw campaignsError;
    }
    
    if (!campaignsData || campaignsData.length === 0) {
      return [];
    }
    
    // 2. 사용자가 가진 슬롯 정보 조회
    const { data: slotsData, error: slotsError } = await supabase
      .from('slots')
      .select('mat_id, product_id')
      .eq('status', 'approved')
      .eq('user_id', userId)
      .in('product_id', campaignsData.map(c => c.id));
      
    if (slotsError) {
      console.error('슬롯 목록 조회 중 오류 발생:', slotsError);
      throw slotsError;
    }
    
    // 3. 캠페인 ID별 슬롯 및 매트 정보 그룹화
    const campaignMap = new Map<number, {
      campaign: typeof campaignsData[0],
      mats: Map<string, number> // mat_id -> slot_count
    }>();
    
    // 캠페인 정보 초기화
    campaignsData.forEach(campaign => {
      campaignMap.set(campaign.id, {
        campaign,
        mats: new Map()
      });
    });
    
    // 슬롯 정보로 매트 카운트 업데이트
    slotsData?.forEach(slot => {
      const campaignInfo = campaignMap.get(slot.product_id);
      if (campaignInfo) {
        const matCount = campaignInfo.mats.get(slot.mat_id) || 0;
        campaignInfo.mats.set(slot.mat_id, matCount + 1);
      }
    });
    
    // 4. 결과 포맷에 맞춰 변환 (mat_id 기준 그룹화)
    const matGroups: CampaignGroup[] = [];
    
    campaignMap.forEach(info => {
      const { campaign, mats } = info;
      
      // 매트별로 캠페인 그룹 생성
      mats.forEach((slotCount, matId) => {
        matGroups.push({
          mat_id: matId,
          campaign_name: campaign.campaign_name,
          service_type: campaign.service_type,
          slot_count: slotCount
        });
      });
    });
    
    return matGroups;
  } catch (error) {
    console.error('캠페인 그룹 조회 중 오류 발생:', error);
    throw error;
  }
};

// 특정 서비스 유형의 캠페인 목록 가져오기
export interface Campaign {
  id: number;
  campaign_name: string;
  service_type: string;
  description: string;
  logo: string;
  slot_count?: number;
}

export const getCampaignsByServiceType = async (userId: string, serviceType: string, matId?: string): Promise<Campaign[]> => {
  try {
    // 1. 먼저 campaigns 테이블에서 해당 서비스 타입의 캠페인 조회
    let campaignQuery = supabase
      .from('campaigns')
      .select('id, campaign_name, service_type, description, logo')
      .eq('service_type', serviceType)
      .in('status', ['pending','active']);
    
    // mat_id로 필터링 (제공된 경우)
    if (matId) {
      campaignQuery = campaignQuery.eq('mat_id', matId);
    }

    const { data: campaignData, error: campaignError } = await campaignQuery;

    if (campaignError) {
      console.error('캠페인 목록 조회 중 오류 발생:', campaignError);
      throw campaignError;
    }

    if (!campaignData || campaignData.length === 0) {
      return [];
    }

    // 2. 슬롯 데이터 조회 (group 함수 대신 수동으로 카운팅)
    const { data: slotsData, error: slotsError } = await supabase
      .from('slots')
      .select('product_id')
      .eq('mat_id', userId)
      .eq('status', 'approved')
      .in('product_id', campaignData.map(c => c.id));

    if (slotsError) {
      console.error('슬롯 수 조회 중 오류 발생:', slotsError);
      throw slotsError;
    }

    console.log('campaigndata:', campaignData);
    console.log(slotsData);
    
    // 3. 수동으로 슬롯 개수 카운팅하여 Map으로 변환
    const slotCountMap = new Map<number, number>();
    slotsData?.forEach(item => {
      const count = slotCountMap.get(item.product_id) || 0;
      slotCountMap.set(item.product_id, count + 1);
    });

    // 4. 캠페인 데이터에 슬롯 카운트 정보 추가
    const campaignsWithSlotCount = campaignData.map(campaign => ({
      ...campaign,
      slot_count: slotCountMap.get(campaign.id) || 0
    }));

    // 모든 캠페인 반환 (슬롯이 없는 캠페인도 포함)
    return campaignsWithSlotCount;
  } catch (error) {
    console.error('캠페인 목록 조회 중 오류 발생:', error);
    throw error;
  }
};

// 일자 형식 YYYY-MM-DD를 한국어 형식으로 변환 (YYYY년 MM월 DD일)
export const formatDateToKorean = (dateString: string): string => {
  const [year, month, day] = dateString.split('-');
  return `${year}년 ${month}월 ${day}일`;
};