import React from 'react';
import BasicTemplate from '../components/BasicTemplate';

const FAQPage = () => {
  return React.createElement(BasicTemplate, {
    title: "FAQ 관리",
    description: "관리자 메뉴 > 사이트 관리 > FAQ 관리"
  });
};

export { FAQPage };