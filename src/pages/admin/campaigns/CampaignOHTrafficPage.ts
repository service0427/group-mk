import React from 'react';
import { CampaignTemplate } from './components';

const CampaignOHTrafficPage = () => {
  return React.createElement(CampaignTemplate, {
    title: "OH 트래픽 캠페인 관리",
    description: "관리자 메뉴 > 캠페인 관리 > OH 트래픽",
    serviceCode: "Ohouse"
  });
};

export { CampaignOHTrafficPage };