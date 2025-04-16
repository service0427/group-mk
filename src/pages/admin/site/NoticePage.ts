import React from 'react';
import BasicTemplate from '../components/BasicTemplate';

const NoticePage = () => {
  return React.createElement(BasicTemplate, {
    title: "공지사항 관리",
    description: "관리자 메뉴 > 사이트 관리 > 공지사항 관리"
  });
};

export { NoticePage };