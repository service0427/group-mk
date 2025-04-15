import React from 'react';
import BasicTemplate from '../templates/BasicTemplate';

const InfoPage = () => {
  return React.createElement(BasicTemplate, {
    title: "슬롯 정보 관리",
    description: "관리자 메뉴 > 슬롯 관리 > 슬롯 정보 관리"
  });
};

export { InfoPage };