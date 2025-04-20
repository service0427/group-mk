import React from 'react';
import { CampaignTemplate } from './components';

const CampaignNPlaceSavePage = () => {
  return React.createElement(CampaignTemplate, {
    title: "NP 저장하기 캠페인 관리",
    description: "관리자 메뉴 > 캠페인 관리 > NP 저장하기",
    serviceCode: "NPlaceSave"
  });
};

export { CampaignNPlaceSavePage };