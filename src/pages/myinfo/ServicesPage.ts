import React from 'react';
import BasicTemplate from './templates/BasicTemplate';

const ServicesPage = () => {
  return React.createElement(BasicTemplate, {
    title: "이용 중 서비스 관리",
    description: "내 서비스 관리 > 이용 중 서비스 관리"
  });
};

export { ServicesPage };