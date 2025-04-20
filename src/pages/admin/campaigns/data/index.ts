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

// 서비스 코드에 따라 데이터를 반환하는 함수
export const getCampaignsByService = (serviceCode: string): ICampaign[] => {
  switch (serviceCode) {
    case 'NaverShopping':
      return naverShoppingData;
    case 'NPlaceTraffic':
    case 'NPlaceSave':
    case 'NPlaceShare':
      return naverPlaceData;
    case 'NTraffic':
      return naverTrafficData;
    case 'NAuto':
      return naverAutoData;
    case 'Coupang':
      return coupangData;
    case 'Ohouse':
      return ohouseData;
    default:
      return campaignData;
  }
};

export {
  naverShoppingData,
  naverPlaceData,
  naverTrafficData,
  naverAutoData,
  coupangData,
  ohouseData
};