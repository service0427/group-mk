import React from 'react';
import { CampaignTemplate } from './components';

const CampaignCPTrafficPage = () => {
  return React.createElement(CampaignTemplate, {
    title: "CP 트래픽 캠페인 관리",
    description: "관리자 메뉴 > 캠페인 관리 > CP 트래픽",
    serviceCode: "CoupangTraffic" // 수정: Coupang -> CoupangTraffic
  });
};

export { CampaignCPTrafficPage };