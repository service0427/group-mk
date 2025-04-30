import React from 'react';
import { CommonTemplate } from '@/components/pageTemplate';

const HistoryPage = () => {
  return React.createElement(CommonTemplate, {
    title: "포인트 사용내역",
    description: "캐쉬/포인트 관리 > 포인트 사용내역"
  });
};

export { HistoryPage };
