import React from 'react';
import { CampaignTemplate } from './components';

const CampaignNPlaceSharePage = () => {
  return React.createElement(CampaignTemplate, {
    title: "NP 블로그공유 캠페인 관리",
    description: "관리자 메뉴 > 캠페인 관리 > NP 블로그공유",
    serviceCode: "NPlaceShare"
  });
};

export { CampaignNPlaceSharePage };