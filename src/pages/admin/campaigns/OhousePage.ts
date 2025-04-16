import React from 'react';
import { CampaignTemplate } from './components';

const OhousePage = () => {
  return React.createElement(CampaignTemplate, {
    title: "오늘의집 관리",
    description: "관리자 메뉴 > 캠페인 관리 > 오늘의집",
    serviceCode: "OH 트래픽"
  });
};

export { OhousePage };