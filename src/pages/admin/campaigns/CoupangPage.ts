import React from 'react';
import { CampaignTemplate } from './components';

const CoupangPage = () => {
  return React.createElement(CampaignTemplate, {
    title: "COUPANG 쇼핑 관리",
    description: "관리자 메뉴 > 캠페인 관리 > COUPANG 쇼핑",
    serviceCode: "CoupangTraffic"
  });
};

export { CoupangPage };