import React from 'react';
import BasicTemplate from '../templates/BasicTemplate';

const ApprovePage = () => {
  return React.createElement(BasicTemplate, {
    title: "슬롯 승인 관리",
    description: "관리자 메뉴 > 슬롯 관리 > 슬롯 승인 관리"
  });
};

export { ApprovePage };