import React from 'react';
import { CampaignTemplate } from './components';

const NaverAutoPage = () => {
  return React.createElement(CampaignTemplate, {
    title: "NAVER 자동완성 관리",
    description: "관리자 메뉴 > 캠페인 관리 > NAVER 자동완성",
    serviceCode: "NAuto"
  });
};

export { NaverAutoPage };