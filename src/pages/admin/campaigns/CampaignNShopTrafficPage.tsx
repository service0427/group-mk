import React from 'react';
import { CampaignTemplate } from './components';

const CampaignNShopTrafficPage: React.FC = () => {
  return (
    <CampaignTemplate
      title="NS 트래픽 캠페인 관리"
      description="관리자 메뉴 > 캠페인 관리 > NS 트래픽"
      serviceCode="NaverShopping"
    />
  );
};

export { CampaignNShopTrafficPage };