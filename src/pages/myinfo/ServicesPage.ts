import React from 'react';
import { CommonTemplate } from '@/components/pageTemplate';

const ServicesPage = () => {
  return React.createElement(CommonTemplate, {
    title: "이용 중 서비스 관리",
    description: "내 서비스 관리 > 이용 중 서비스 관리",
    showPageMenu: false
  });
};

export { ServicesPage };
