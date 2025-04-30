import React from 'react';
import { CommonTemplate } from '@/components/pageTemplate';

const CashRequestsPage = () => {
  return React.createElement(CommonTemplate, {
    title: "캐쉬 충전 요청 확인",
    description: "캐쉬/포인트 관리 > 캐쉬 충전 요청 확인",
    showPageMenu: false
  });
};

export { CashRequestsPage };
