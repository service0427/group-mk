import { supabase } from '@/supabase';
import { SlotWorkInfo, WorkInputFormData, Slot, FilterOptions } from '../types';
import { toast } from 'sonner';

// 활성화된 슬롯 목록 가져오기
export const getActiveSlots = async (userId: string | undefined, filterOptions?: FilterOptions): Promise<Slot[]> => {
  try {
    // 1. 필터에 따라 campaigns 테이블 조회 쿼리 구성
    let campaignQuery = supabase
      .from('campaigns')
      .select('id, campaign_name, service_type, description, ranking_field_mapping, work_completion_mode, auto_completion_hour')
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
        user_slot_number,
        product_id,
        input_data,
        users!slots_user_id_fkey(
          email,
          full_name
        ),
        slot_works_info(
          work_cnt,
          date
        )
      `)
      .eq('status', 'approved')
      .in('product_id', campaignsData.map(c => c.id));
    
    // userId가 제공된 경우(일반 사용자)에만 mat_id 필터 적용
    if (userId) {
      slotQuery = slotQuery.eq('mat_id', userId);
    }
    
    
    const { data: slotsData, error: slotsError } = await slotQuery;
    
    if (slotsError) {
      throw slotsError;
    }
    
    
    // 3. 총판 정보를 가져오기 위해 mat_id 목록 추출
    const matIds = [...new Set(slotsData?.map(slot => slot.mat_id).filter(id => id) || [])];
    let matData: any[] = [];
    
    if (matIds.length > 0) {
      const { data: matUsers, error: matError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('id', matIds);
      
      if (!matError && matUsers) {
        matData = matUsers;
      }
    }
    
    // 총판 데이터를 Map으로 변환
    const matMap = new Map<string, typeof matData[0]>();
    matData.forEach(mat => {
      matMap.set(mat.id, mat);
    });
    
    // 4. 캠페인 데이터를 Map으로 변환하여 빠르게 조회할 수 있게 함
    const campaignMap = new Map<number, typeof campaignsData[0]>();
    campaignsData.forEach(campaign => {
      campaignMap.set(campaign.id, campaign);
    });
    
    // 5. 슬롯 데이터와 캠페인 데이터 결합
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
        // 작업 완료 방식 추가
        work_completion_mode: campaign.work_completion_mode,
        auto_completion_hour: campaign.auto_completion_hour,
        // 사용자 정보 추가
        user_email: (slot.users as any)?.email,
        user_name: (slot.users as any)?.full_name || (slot.users as any)?.email,
        // 총판 정보 추가
        mat_email: matMap.get(slot.mat_id)?.email,
        mat_name: matMap.get(slot.mat_id)?.full_name || matMap.get(slot.mat_id)?.email,
        user_slot_number: slot.user_slot_number, // 명시적으로 추가
        // input_data에서 키워드, MID, URL 추출 (ranking_field_mapping 사용)
        keywords: (() => {
          try {
            const inputData = typeof slot.input_data === 'string' 
              ? JSON.parse(slot.input_data) 
              : slot.input_data;
            
            if (!inputData) return '';
            
            // ranking_field_mapping에서 키워드 필드명 가져오기
            const mapping = campaign.ranking_field_mapping || {};
            const keywordField = mapping.keyword || '검색어';
            
            // 매핑된 필드명으로 키워드 추출
            const mainKeyword = inputData[keywordField]?.trim() || inputData.mainKeyword?.trim() || '';
            
            // 서브 키워드도 확인 (기존 방식 백업)
            const subKeywords = [
              inputData.keyword1,
              inputData.keyword2,
              inputData.keyword3
            ].filter(keyword => keyword && keyword.trim());
            
            if (!mainKeyword && subKeywords.length === 0) return '';
            
            // 메인 키워드 + 줄바꿈 + 각 서브 키워드를 개별 줄로
            let result = mainKeyword;
            if (subKeywords.length > 0 && !mainKeyword.includes(subKeywords[0])) {
              result += '\n' + subKeywords.join('\n');
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
            
            if (!inputData) return '';
            
            // ranking_field_mapping에서 product_id 필드명 가져오기
            const mapping = campaign.ranking_field_mapping || {};
            const productIdField = mapping.product_id || '코드';
            
            // 매핑된 필드명으로 MID 추출
            return inputData[productIdField] || inputData.mid || '';
          } catch (e) {
            return '';
          }
        })(),
        url: (() => {
          try {
            const inputData = typeof slot.input_data === 'string' 
              ? JSON.parse(slot.input_data) 
              : slot.input_data;
            
            if (!inputData) return '';
            
            // ranking_field_mapping에서 link 필드명 가져오기 (있다면)
            const mapping = campaign.ranking_field_mapping || {};
            const linkField = mapping.link || 'url';
            
            // 매핑된 필드명으로 URL 추출
            return inputData[linkField] || inputData.url || '';
          } catch (e) {
            return '';
          }
        })(),
        // 작업 진행률 계산
        workProgress: (() => {
          try {
            // slot_works_info 데이터 확인
            const worksInfo = (slot as any).slot_works_info || [];
            
            // 총 작업 수량 계산
            const totalWorkedQuantity = worksInfo.reduce((sum: number, work: any) => sum + (work.work_cnt || 0), 0);
            
            // 일일 요청 수량 계산 (우선순위: slots.quantity > input_data.quantity > input_data.타수 등)
            const inputData = typeof slot.input_data === 'string' ? JSON.parse(slot.input_data) : slot.input_data;
            const dailyQuantity = slot.quantity || 
                                inputData?.quantity || 
                                inputData?.['타수'] || 
                                inputData?.['일타수'] || 
                                inputData?.['일 타수'] || 
                                0;
            
            // 작업 일수 계산
            let requestedDays = 0;
            if (slot.start_date && slot.end_date) {
              const startDate = new Date(slot.start_date);
              const endDate = new Date(slot.end_date);
              requestedDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            } else {
              // input_data에서 작업일수 찾기
              requestedDays = inputData?.work_days || 
                            inputData?.['작업일수'] || 
                            inputData?.['작업 일수'] || 
                            inputData?.['작업기간'] || 
                            0;
            }
            
            // 총 요청 수량 계산
            const totalRequestedQuantity = dailyQuantity * requestedDays;
            
            // 완료율 계산
            const completionRate = totalRequestedQuantity > 0 
              ? Math.round((totalWorkedQuantity / totalRequestedQuantity) * 100) 
              : 0;
            
            // 실제 작업한 일수 계산
            const workedDays = new Set(worksInfo.map((work: any) => work.date)).size;
            
            return {
              totalWorkedQuantity,
              totalRequestedQuantity,
              completionRate,
              workedDays,
              requestedDays
            };
          } catch (e) {
            console.error('진행률 계산 오류:', e);
            return {
              totalWorkedQuantity: 0,
              totalRequestedQuantity: 0,
              completionRate: 0,
              workedDays: 0,
              requestedDays: 0
            };
          }
        })()
      } as Slot;
    }).filter(slot => slot !== null) as Slot[] || [];

    return formattedData;
  } catch (error) {
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
      throw error;
    }

    return data || [];
  } catch (error) {
    throw error;
  }
};

// 작업 기록 추가
export const addSlotWork = async (workData: WorkInputFormData, userId: string): Promise<SlotWorkInfo> => {
  try {
    // 슬롯 상태 확인
    const { data: slotData, error: slotError } = await supabase
      .from('slots')
      .select('status, start_date, end_date')
      .eq('id', workData.slot_id)
      .single();
    
    if (slotError || !slotData) {
      throw new Error('슬롯 정보를 확인할 수 없습니다.');
    }
    
    if (slotData.status !== 'approved') {
      throw new Error(`승인되지 않은 슬롯입니다. (현재 상태: ${slotData.status})`);
    }
    
    // 종료일 확인
    if (slotData.end_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date(slotData.end_date);
      
      if (endDate < today) {
        throw new Error('종료일이 지난 슬롯에는 작업을 입력할 수 없습니다.');
      }
    }
    
    // 작업 날짜 검증
    const workDate = new Date(workData.date);
    const today = new Date();
    
    workDate.setHours(0, 0, 0, 0);
    today.setHours(23, 59, 59, 999);
    
    // 미래 날짜 검증
    if (workDate > today) {
      throw new Error('미래 날짜의 작업은 입력할 수 없습니다.');
    }
    
    // 시작일 검증
    if (slotData.start_date) {
      const startDate = new Date(slotData.start_date);
      startDate.setHours(0, 0, 0, 0);
      
      if (workDate < startDate) {
        throw new Error(`작업 날짜는 시작일(${slotData.start_date}) 이후여야 합니다.`);
      }
    }
    
    // 동일 날짜에 이미 기록이 있는지 확인
    const { data: existingData, error: checkError } = await supabase
      .from('slot_works_info')
      .select('id')
      .eq('slot_id', workData.slot_id)
      .eq('date', workData.date);

    if (checkError) {
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
      throw error;
    }

    return data;
  } catch (error) {
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
      throw error;
    }

    return data;
  } catch (error) {
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
      throw error;
    }
  } catch (error) {
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
      return '알 수 없음';
    }

    return (data?.organization_name || data?.full_name || '알 수 없음') as string;
  } catch (error) {
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
      throw slotsError;
    }
    
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
    throw error;
  }
};

// 일자 형식 YYYY-MM-DD를 한국어 형식으로 변환 (YYYY년 MM월 DD일)
export const formatDateToKorean = (dateString: string): string => {
  const [year, month, day] = dateString.split('-');
  return `${year}년 ${month}월 ${day}일`;
};

// 매트별 슬롯 번호로 슬롯 ID 조회
export const getSlotIdByUserSlotNumber = async (matId: string, userSlotNumber: number): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('slots')
      .select('id')
      .eq('mat_id', matId)
      .eq('user_slot_number', userSlotNumber)
      .single();

    if (error) {
      return null;
    }

    return data?.id || null;
  } catch (error) {
    return null;
  }
};

// 엑셀 데이터 일괄 업로드
export const bulkUploadSlotWorks = async (workDataList: WorkExcelData[], userId: string): Promise<{ success: number; failed: number; errors: string[] }> => {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };

  for (const workData of workDataList) {
    try {
      // user_slot_number로 실제 slot_id 조회
      let slotId = workData.slot_id;
      let slotData: any = null;
      
      if (!slotId && workData.mat_id && workData.user_slot_number) {
        // 슬롯 정보 전체 조회 (시작일, 종료일 및 상태 확인용)
        const { data, error } = await supabase
          .from('slots')
          .select('id, start_date, end_date, status')
          .eq('mat_id', workData.mat_id)
          .eq('user_slot_number', workData.user_slot_number)
          .single();
          
        if (error || !data) {
          results.failed++;
          results.errors.push(`슬롯 번호 ${workData.user_slot_number}을(를) 찾을 수 없습니다.`);
          continue;
        }
        
        slotId = data.id;
        slotData = data;
      }
      
      // 슬롯 상태 검증
      if (slotData && slotData.status !== 'approved') {
        results.failed++;
        results.errors.push(`슬롯 번호 ${workData.user_slot_number}은(는) 승인되지 않은 상태입니다. (현재 상태: ${slotData.status})`);
        continue;
      }
      
      // 종료일 검증
      if (slotData && slotData.end_date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = new Date(slotData.end_date);
        
        if (endDate < today) {
          results.failed++;
          results.errors.push(`슬롯 번호 ${workData.user_slot_number}의 종료일(${slotData.end_date})이 지났습니다.`);
          continue;
        }
      }
      
      // 작업 날짜 검증
      const workDate = new Date(workData.date);
      const today = new Date();
      
      // 날짜만 비교하기 위해 시간 설정
      workDate.setHours(0, 0, 0, 0);
      today.setHours(23, 59, 59, 999);
      
      // 미래 날짜 검증
      if (workDate > today) {
        results.failed++;
        results.errors.push(`슬롯 번호 ${workData.user_slot_number}의 작업 날짜(${workData.date})는 미래일 수 없습니다.`);
        continue;
      }
      
      // 시작일 검증
      if (slotData && slotData.start_date) {
        const startDate = new Date(slotData.start_date);
        startDate.setHours(0, 0, 0, 0);
        
        if (workDate < startDate) {
          results.failed++;
          results.errors.push(`슬롯 번호 ${workData.user_slot_number}의 작업 날짜(${workData.date})는 시작일(${slotData.start_date}) 이후여야 합니다.`);
          continue;
        }
      }

      // 동일 날짜에 이미 기록이 있는지 확인
      const { data: existingData, error: checkError } = await supabase
        .from('slot_works_info')
        .select('id')
        .eq('slot_id', slotId)
        .eq('date', workData.date);

      if (checkError) {
        results.failed++;
        results.errors.push(`슬롯 번호 ${workData.user_slot_number} 확인 중 오류 발생`);
        continue;
      }

      if (existingData && existingData.length > 0) {
        results.failed++;
        results.errors.push(`슬롯 번호 ${workData.user_slot_number}의 ${workData.date} 날짜에 이미 작업 기록이 존재합니다. (중복 데이터)`);
        continue;
      }

      // 새 작업 기록 추가
      const { error: insertError } = await supabase
        .from('slot_works_info')
        .insert({
          slot_id: slotId,
          date: workData.date,
          work_cnt: workData.work_cnt,
          notes: workData.notes || null,
          created_by: userId
        });

      if (insertError) {
        results.failed++;
        results.errors.push(`슬롯 번호 ${workData.user_slot_number} 작업 기록 추가 실패`);
      } else {
        results.success++;
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`슬롯 번호 ${workData.user_slot_number} 처리 중 오류 발생`);
    }
  }

  return results;
};

// WorkExcelData 타입 정의 (import 필요)
interface WorkExcelData {
  slot_id: string;
  date: string;
  work_cnt: number;
  notes?: string;
  mat_id?: string;
  user_slot_number?: number;
}