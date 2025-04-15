import React from 'react';
import BasicTemplate from '../templates/BasicTemplate';

const CoupangPage = () => {
  return React.createElement(BasicTemplate, {
    title: "COUPANG 쇼핑 관리",
    description: "관리자 메뉴 > 캠페인 관리 > COUPANG 쇼핑"
  });
};

export { CoupangPage };