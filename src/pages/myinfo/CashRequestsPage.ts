import React from 'react';
import BasicTemplate from './components/BasicTemplate';

const CashRequestsPage = () => {
  return React.createElement(BasicTemplate, {
    title: "캐쉬 충전 요청 확인",
    description: "캐쉬/포인트 관리 > 캐쉬 충전 요청 확인"
  });
};

export { CashRequestsPage };
