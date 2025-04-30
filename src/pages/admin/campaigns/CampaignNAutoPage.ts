import React from 'react';
import { CampaignTemplate } from './components';

const CampaignNAutoPage = () => {
  return React.createElement(CampaignTemplate, {
    title: "N 자동완성 캠페인 관리",
    description: "관리자 메뉴 > 캠페인 관리 > N 자동완성",
    serviceCode: "NaverAuto" // 수정: NAuto -> NaverAuto
  });
};

export { CampaignNAutoPage };