import { supabase } from '@/supabase';
import { CampaignServiceType } from '@/components/campaign-modals/types';

/**
 * 서비스 타입을 데이터베이스에서 사용하는 코드로 변환
 */
export const getServiceTypeCode = (serviceType: string | CampaignServiceType): string => {
  // CampaignServiceType enum 값을 그대로 반환
  if (Object.values(CampaignServiceType).includes(serviceType as CampaignServiceType)) {
    return serviceType as string;
  }
  
  // kebab-case를 CamelCase로 변환
  const camelCase = serviceType.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  const capitalizedCamelCase = camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
  
  // 특별 케이스 처리
  if (serviceType === 'naver-shopping-traffic') {
    return CampaignServiceType.NAVER_SHOPPING_TRAFFIC;
  }
  if (serviceType === 'naver-shopping-fakesale') {
    return CampaignServiceType.NAVER_SHOPPING_FAKESALE;
  }
  if (serviceType === 'naver-place-traffic') {
    return CampaignServiceType.NAVER_PLACE_TRAFFIC;
  }
  if (serviceType === 'naver-place-save') {
    return CampaignServiceType.NAVER_PLACE_SAVE;
  }
  if (serviceType === 'naver-place-share') {
    return CampaignServiceType.NAVER_PLACE_SHARE;
  }
  if (serviceType === 'naver-traffic') {
    return CampaignServiceType.NAVER_TRAFFIC;
  }
  if (serviceType === 'naver-auto') {
    return CampaignServiceType.NAVER_AUTO;
  }
  if (serviceType === 'coupang-traffic') {
    return CampaignServiceType.COUPANG_TRAFFIC;
  }
  if (serviceType === 'coupang-fakesale') {
    return CampaignServiceType.COUPANG_FAKESALE;
  }
  if (serviceType === 'ohouse-traffic') {
    return CampaignServiceType.OHOUSE_TRAFFIC;
  }
  
  return capitalizedCamelCase;
};

/**
 * 캠페인 상세 정보를 가져오는 서비스 함수
 * @param campaignId 캠페인 ID
 * @returns 캠페인 상세 정보 (상세 설명 포함)
 */
export const getCampaignDetail = async (campaignId: string | number) => {
  try {
    // Supabase에서 캠페인 상세 정보 가져오기
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (error) {
      return null;
    }

    // add_info가 문자열로 저장되어 있으면 JSON으로 파싱
    const parsedData = { ...data };
    if (typeof parsedData.add_info === 'string' && parsedData.add_info) {
      try {
        parsedData.add_info = JSON.parse(parsedData.add_info);
      } catch (error) {
        // 파싱에 실패했지만 logo_url이 문자열 안에 있는 경우
        const logoUrlMatch = parsedData.add_info.match(/"logo_url":\s*"([^"]+)"/);
        if (logoUrlMatch && logoUrlMatch[1]) {
          parsedData.add_info_logo_url = logoUrlMatch[1];
        }
      }
    }

    return parsedData;
  } catch (error) {
    return null;
  }
};

/**
 * 서비스 타입으로 활성화된 캠페인 목록을 가져오는 함수
 * 오직 활성화된 캠페인만 가져오기 위해 사용
 * @param serviceType 서비스 타입 코드
 * @returns 해당 서비스 타입의 활성화된 캠페인 목록
 */
export const getActiveCampaignsByServiceType = async (serviceType: string) => {
  try {
    const serviceTypeCode = getServiceTypeCode(serviceType);
    
    // Supabase에서 서비스 타입에 해당하는 활성화된 캠페인 목록 가져오기
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('service_type', serviceTypeCode)
      .eq('status', 'active') // 오직 'active' 상태인 캠페인만 표시
      .order('id', { ascending: true });

    if (error) {
      return [];
    }

    // DB 데이터를 프론트엔드에서 사용하는 형태로 변환
    return data.map(item => {
      // add_info가 문자열로 저장되어 있으면 JSON으로 파싱
      const parsedItem = { ...item };

      // add_info 필드 처리
      if (typeof parsedItem.add_info === 'string' && parsedItem.add_info) {
        try {
          parsedItem.add_info = JSON.parse(parsedItem.add_info);
        } catch (error) {
          // 파싱에 실패했지만 logo_url이 문자열 안에 있는 경우
          const logoUrlMatch = parsedItem.add_info.match(/"logo_url":\s*"([^"]+)"/);
          if (logoUrlMatch && logoUrlMatch[1]) {
            parsedItem.add_info_logo_url = logoUrlMatch[1];
          }
        }
      }

      return {
        id: parsedItem.id.toString(),
        campaignName: parsedItem.campaign_name,
        description: parsedItem.description || '',
        detailed_description: parsedItem.detailed_description || '',
        logo: parsedItem.logo,
        efficiency: parsedItem.efficiency ? `${parsedItem.efficiency}%` : '-',
        minQuantity: parsedItem.min_quantity ? `${parsedItem.min_quantity}개` : '-',
        deadline: parsedItem.deadline || '22:00',
        unit_price: parsedItem.unit_price,
        status: parsedItem.status,
        service_type: parsedItem.service_type,
        additional_logic: parsedItem.additional_logic ? parsedItem.additional_logic.toString() : '',
        add_info: parsedItem.add_info,
        // 원본 데이터도 포함
        originalData: parsedItem
      };
    });
  } catch (error) {
    return [];
  }
};

/**
 * 서비스 타입으로 모든 캠페인 목록을 가져오는 함수
 * 어드민 페이지와 동일한 로직으로 캠페인 목록을 가져옴
 * @param serviceType 서비스 타입 코드
 * @param userId 사용자 ID (있으면 해당 사용자의 캠페인만 필터링)
 * @param includeAllStatus 모든 상태의 캠페인을 가져올지 여부 (기본값: false)
 * @returns 해당 서비스 타입의 캠페인 목록
 */
export const fetchCampaignsByServiceType = async (serviceType: string, userId?: string, includeAllStatus: boolean = false) => {
  const serviceTypeCode = getServiceTypeCode(serviceType);

  // 기본 쿼리 생성
  let query = supabase.from('campaigns').select('*');

  // 서비스 타입이 있을 때만 필터링 추가
  if (serviceTypeCode && serviceTypeCode.trim() !== '') {
    query = query.eq('service_type', serviceTypeCode);
  }

  // 사용자 ID가 있으면 본인 캠페인만 필터링
  if (userId) {
    query = query.eq('mat_id', userId);
  }

  // 일반 소개 페이지에서는 active 상태만 보여줌 (includeAllStatus가 false일 때)
  if (!includeAllStatus) {
    query = query.eq('status', 'active');
  }

  // 정렬 적용
  const { data, error } = await query.order('id', { ascending: true });

  if (error) {
    return [];
  }

  // DB 데이터를 프론트엔드에서 사용하는 형태로 변환
  return data.map(item => {
    // add_info가 문자열로 저장되어 있으면 JSON으로 파싱
    const parsedItem = { ...item };

    // add_info 필드 처리
    if (typeof parsedItem.add_info === 'string' && parsedItem.add_info) {
      try {
        parsedItem.add_info = JSON.parse(parsedItem.add_info);
      } catch (error) {
        // 파싱에 실패했지만 logo_url이 문자열 안에 있는 경우
        const logoUrlMatch = parsedItem.add_info.match(/"logo_url":\s*"([^"]+)"/);
        if (logoUrlMatch && logoUrlMatch[1]) {
          parsedItem.add_info_logo_url = logoUrlMatch[1];
        }
      }
    }

    return {
      id: parsedItem.id.toString(),
      campaignName: parsedItem.campaign_name,
      description: parsedItem.description || '',
      detailedDescription: parsedItem.detailed_description || '',
      logo: parsedItem.logo,
      efficiency: parsedItem.efficiency ? `${parsedItem.efficiency}%` : '-',
      minQuantity: parsedItem.min_quantity ? `${parsedItem.min_quantity}개` : '-',
      deadline: parsedItem.deadline || '22:00', // 이미 HH:MM 형식으로 저장됨
      status: {
        label: getStatusLabel(parsedItem.status),
        color: getStatusColor(parsedItem.status)
      },
      unitPrice: parsedItem.unit_price,
      serviceType: parsedItem.service_type,
      additionalLogic: parsedItem.additional_logic ? parsedItem.additional_logic.toString() : '',
      // 상세 설명을 분리해서 명시적으로 가져오기
      // 원본 데이터도 포함 (파싱된 add_info 포함)
      originalData: parsedItem
    };
  });
};

// 상태값에 따른 라벨 반환
export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'active': return '진행중';
    case 'pending': return '준비중';
    case 'pause': return '표시안함';
    case 'waiting_approval': return '승인 대기중';
    case 'rejected': return '반려됨';
    default: return '준비중';
  }
};

// 상태값에 따른 색상 반환
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active': return 'success';
    case 'pause': return 'warning';
    case 'pending': return 'info';
    case 'completed': return 'primary';
    case 'rejected': return 'danger';
    case 'waiting_approval': return 'warning'; // 승인 대기중은 warning 색상으로 변경
    default: return 'info';
  }
};