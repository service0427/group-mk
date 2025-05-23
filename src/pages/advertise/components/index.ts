// campaigns 디렉토리로 모든 컴포넌트 이동
export { 
  CampaignInfoTemplate,
  IntroTemplate,
  CardAdCampaign,
  CardAdCampaignRow,
} from '../campaigns/components';

export { CampaignDetailViewModal, CampaignSlotWithKeywordModal } from '@/components/campaign-modals';

// 타입 내보내기
export type { 
  IAdCampaignItem, 
  IAdCampaignItems, 
  IAdCampaignProps 
} from '../campaigns/components/campaign-cards';