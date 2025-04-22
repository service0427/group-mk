import { supabase } from '@/supabase';
import { ICampaign } from '../components/CampaignContent';

// Supabase에서 캠페인 데이터 가져오기
export const fetchCampaigns = async (serviceType: string): Promise<ICampaign[]> => {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('service_type', serviceType)
    .order('id', { ascending: true }); // ID 순서대로 정렬

  if (error) {
    console.error('캠페인 데이터 조회 중 오류:', error);
    return [];
  }

  // DB 데이터를 프론트엔드에서 사용하는 형태로 변환
  return data.map(item => ({
    id: item.id.toString(),
    campaignName: item.campaign_name,
    description: item.description || '',
    logo: item.logo,
    efficiency: item.efficiency ? `${item.efficiency}%` : '-',
    minQuantity: item.min_quantity ? `${item.min_quantity}개` : '-',
    deadline: item.deadline || '22:00', // 이미 HH:MM 형식으로 저장됨
    status: {
      label: getStatusLabel(item.status),
      color: getStatusColor(item.status)
    },
    additionalLogic: item.additional_logic ? item.additional_logic.toString() : '',
    detailedDescription: item.detailed_description || '',
    // 원본 데이터도 포함
    originalData: item
  }));
};

// 상태값에 따른 라벨 반환
export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'active': return '진행중';
    case 'pending': return '준비중';
    case 'pause': return '표시안함';
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
    default: return 'info';
  }
};

// 캠페인 상태 업데이트
export const updateCampaignStatus = async (campaignId: number, newStatus: string): Promise<boolean> => {
  const { error } = await supabase
    .from('campaigns')
    .update({ status: newStatus })
    .eq('id', campaignId);

  if (error) {
    console.error('캠페인 상태 업데이트 중 오류:', error);
    return false;
  }

  return true;
};

// 캠페인 데이터 업데이트
export const updateCampaign = async (campaignId: number, data: any): Promise<boolean> => {
  // DB 컬럼명에 맞게 데이터 변환
  const updateData = {
    campaign_name: data.campaignName,
    description: data.description,
    detailed_description: data.detailedDescription,
    efficiency: parseFloat(data.efficiency.replace ? data.efficiency.replace('%', '') : data.efficiency),
    min_quantity: parseInt(data.minQuantity.replace ? data.minQuantity.replace('개', '') : data.minQuantity),
    unit_price: data.unitPrice ? parseFloat(data.unitPrice) : 100,
    deadline: formatTimeHHMM(data.deadline), // 시:분 형식만 저장
    additional_logic: parseInt(data.additionalLogic || '0')
  };

  const { error } = await supabase
    .from('campaigns')
    .update(updateData)
    .eq('id', campaignId);

  if (error) {
    console.error('캠페인 데이터 업데이트 중 오류:', error);
    return false;
  }

  return true;
};

// 시간을 HH:MM 형식으로 변환하는 헬퍼 함수
export const formatTimeHHMM = (timeStr: string): string => {
  if (!timeStr) return '';
  // 형식이 이미 HH:MM이면 그대로 반환
  if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
  // HH:MM:SS 형식이면 초 부분 제거
  if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) return timeStr.substring(0, 5);
  return timeStr;
};

// 서비스 타입 코드 변환 (UI 코드 -> DB 코드)
export const getServiceTypeCode = (uiCode: string): string => {
  switch (uiCode) {
    case 'naver-shopping': return 'NaverShopTraffic';
    case 'naver-place-traffic': return 'NaverPlaceTraffic';
    case 'naver-place-save': return 'NaverPlaceSave';
    case 'naver-place-share': return 'NaverPlaceShare';
    case 'naver-auto': return 'NaverAuto';
    case 'naver-traffic': return 'NaverTraffic';
    case 'coupang': return 'CoupangTraffic';
    case 'ohouse': return 'OhouseTraffic';
    default: return '';
  }
};

// 캠페인 생성
export const createCampaign = async (data: any): Promise<{success: boolean, id?: number, error?: string}> => {
  // 캠페인 ID 자동 생성 (날짜+랜덤번호)
  const generateCampaignId = () => {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `C${dateStr}${randomNum}`;
  };

  // DB 컬럼명에 맞게 데이터 변환
  const insertData = {
    campaign_id: data.campaignId || generateCampaignId(),
    campaign_name: data.campaignName,
    service_type: data.serviceType,
    description: data.description || '',
    detailed_description: data.detailedDescription || '',
    efficiency: data.efficiency ? parseFloat(data.efficiency.replace('%', '')) : null,
    min_quantity: data.minQuantity ? parseInt(data.minQuantity.replace('개', '')) : 0,
    unit_price: data.unitPrice || 100,
    deadline: formatTimeHHMM(data.deadline || '22:00'), // 시:분 형식으로 저장
    additional_logic: data.additionalLogic ? parseInt(data.additionalLogic) : 0,
    logo: data.logo || 'animal-default.svg',
    status: data.status || 'pending',
    created_at: new Date(),
    updated_at: new Date()
  };

  const { data: result, error } = await supabase
    .from('campaigns')
    .insert(insertData)
    .select('id')
    .single();

  if (error) {
    console.error('캠페인 생성 중 오류:', error);
    return { success: false, error: error.message };
  }

  return { success: true, id: result?.id };
};
