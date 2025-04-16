import React from 'react';
import { CampaignTemplate } from './components';

const NaverTrafficPage = () => {
  return React.createElement(CampaignTemplate, {
    title: "NAVER 트래픽 관리",
    description: "관리자 메뉴 > 캠페인 관리 > NAVER 트래픽",
    serviceCode: "N 트래픽"
  });
};

export { NaverTrafficPage };