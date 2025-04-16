import React from 'react';
import { CampaignTemplate } from './components';

const NaverPlaceSavePage = () => {
  return React.createElement(CampaignTemplate, {
    title: "NAVER 플레이스 관리",
    description: "관리자 메뉴 > 캠페인 관리 > NAVER 플레이스",
    serviceCode: "NPlaceTraffic"
  });
};

export { NaverPlaceSavePage };