import React from 'react';
import { CampaignTemplate } from './components';

const CampaignNShopTrafficPage: React.FC = () => {
  return (
    <CampaignTemplate
      title="네이버 트래픽 캠페인 관리"
      description="관리자 메뉴 > 네이버 > 트래픽"
      serviceCode="ntraffic"
    />
  );
};

export { CampaignNShopTrafficPage };