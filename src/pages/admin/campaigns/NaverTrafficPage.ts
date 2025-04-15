import React from 'react';
import BasicTemplate from '../templates/BasicTemplate';

const NaverTrafficPage = () => {
  return React.createElement(BasicTemplate, {
    title: "NAVER 트래픽 관리",
    description: "관리자 메뉴 > 캠페인 관리 > NAVER 트래픽"
  });
};

export { NaverTrafficPage };