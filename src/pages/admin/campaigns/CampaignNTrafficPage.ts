import React from 'react';
import { CampaignTemplate } from './components';

const CampaignNTrafficPage = () => {
  return React.createElement(CampaignTemplate, {
    title: "N 트래픽 캠페인 관리",
    description: "관리자 메뉴 > 캠페인 관리 > N 트래픽",
    serviceCode: "NTraffic"
  });
};

export { CampaignNTrafficPage };