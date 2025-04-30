import React from 'react';
import { CommonTemplate } from '@/components/pageTemplate';

const InfoPage = () => {
  return React.createElement(CommonTemplate, {
    title: "슬롯 정보 관리",
    description: "관리자 메뉴 > 슬롯 관리 > 슬롯 정보 관리",
    showPageMenu: false
  });
};

export { InfoPage };