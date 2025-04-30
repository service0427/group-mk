import { ICampaign } from '../components/CampaignContent';
import { naverShoppingData } from './naverShoppingData';
import { naverPlaceData } from './naverPlaceData';
import { naverTrafficData } from './naverTrafficData';
import { naverAutoData } from './naverAutoData';
import { coupangData } from './coupangData';
import { ohouseData } from './ohouseData';

// 기본 캠페인 데이터 (모든 데이터가 합쳐진 형태)
export const campaignData: ICampaign[] = [
  ...naverShoppingData,
  ...naverPlaceData,
  ...naverTrafficData,
  ...naverAutoData,
  ...coupangData,
  ...ohouseData
];

// 서비스 코드에 따라 데이터를 반환하는 함수 (모든 가능한 코드 변형 처리)
export const getCampaignsByService = (serviceCode: string): ICampaign[] => {
  // 코드가 없으면 전체 데이터 반환
  if (!serviceCode) return campaignData;
  
  // 서비스 코드를 대소문자 구분 없이 처리하기 위해 소문자로 변환
  const code = serviceCode.toLowerCase();
  
  // 네이버 쇼핑 트래픽
  if (code.includes('navershop') || code === 'navershoptraffic') {
    return naverShoppingData;
  }
  
  // 네이버 플레이스 관련 (트래픽, 저장, 공유)
  if (code.includes('naverplace') || code.includes('nplace')) {
    return naverPlaceData;
  }
  
  // 네이버 트래픽
  if (code.includes('navertraffic') || code === 'ntraffic') {
    return naverTrafficData;
  }
  
  // 네이버 자동완성
  if (code.includes('naverauto') || code === 'nauto') {
    return naverAutoData;
  }
  
  // 쿠팡 트래픽
  if (code.includes('coupang')) {
    return coupangData;
  }
  
  // 오늘의집 트래픽
  if (code.includes('ohouse')) {
    return ohouseData;
  }
  
  // 일치하는 코드가 없으면 전체 데이터 반환
  return campaignData;
};

export {
  naverShoppingData,
  naverPlaceData,
  naverTrafficData,
  naverAutoData,
  coupangData,
  ohouseData
};