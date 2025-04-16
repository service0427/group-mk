import React from 'react';
import BasicTemplate from './components/BasicTemplate';

const HistoryPage = () => {
  return React.createElement(BasicTemplate, {
    title: "캐쉬 충전/사용내역",
    description: "캐쉬/포인트 관리 > 캐쉬 충전/사용내역"
  });
};

export { HistoryPage };
