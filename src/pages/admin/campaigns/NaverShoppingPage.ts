import React from 'react';
import BasicTemplate from '../templates/BasicTemplate';

const NaverShoppingPage = () => {
  return React.createElement(BasicTemplate, {
    title: "NAVER 쇼핑 관리",
    description: "관리자 메뉴 > 캠페인 관리 > NAVER 쇼핑"
  });
};

export { NaverShoppingPage };