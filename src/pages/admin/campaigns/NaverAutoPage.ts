import React from 'react';
import BasicTemplate from '../templates/BasicTemplate';

const NaverAutoPage = () => {
  return React.createElement(BasicTemplate, {
    title: "NAVER 자동완성 관리",
    description: "관리자 메뉴 > 캠페인 관리 > NAVER 자동완성"
  });
};

export { NaverAutoPage };