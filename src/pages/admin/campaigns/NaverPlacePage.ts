import React from 'react';
import BasicTemplate from '../templates/BasicTemplate';

const NaverPlacePage = () => {
  return React.createElement(BasicTemplate, {
    title: "NAVER 플레이스 관리",
    description: "관리자 메뉴 > 캠페인 관리 > NAVER 플레이스"
  });
};

export { NaverPlacePage };