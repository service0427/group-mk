import React from 'react';
import { CommonTemplate } from '@/components/pageTemplate';

const HistoryPage = () => {
  return React.createElement(CommonTemplate, {
    title: "캐쉬 충전/사용내역",
    description: "캐쉬/포인트 관리 > 캐쉬 충전/사용내역",
    showPageMenu: false
  });
};

export { HistoryPage };
