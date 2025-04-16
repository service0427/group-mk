import React from 'react';
import { CampaignTemplate } from './components';

const NaverShoppingPage = () => {
  return React.createElement(CampaignTemplate, {
    title: "NAVER 쇼핑 관리",
    description: "관리자 메뉴 > 캠페인 관리 > NAVER 쇼핑",
    serviceCode: "NS 트래픽"
  });
};

export { NaverShoppingPage };