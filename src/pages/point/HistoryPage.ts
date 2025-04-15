import React from 'react';
import BasicTemplate from './templates/BasicTemplate';

const HistoryPage = () => {
  return React.createElement(BasicTemplate, {
    title: "포인트 사용내역",
    description: "캐쉬/포인트 관리 > 포인트 사용내역"
  });
};

export { HistoryPage };