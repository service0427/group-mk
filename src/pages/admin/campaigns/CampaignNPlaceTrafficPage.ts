import React from 'react';
import { CampaignTemplate } from './components';

const CampaignNPlaceTrafficPage = () => {
  return React.createElement(CampaignTemplate, {
    title: "NP 트래픽 캠페인 관리",
    description: "관리자 메뉴 > 캠페인 관리 > NP 트래픽",
    serviceCode: "NPlaceTraffic"
  });
};

export { CampaignNPlaceTrafficPage };