import React from 'react';
import BasicTemplate from './components/BasicTemplate';

const ChargePage = () => {
  return React.createElement(BasicTemplate, {
    title: "캐쉬 충전",
    description: "캐쉬/포인트 관리 > 캐쉬 충전"
  });
};

export { ChargePage };
