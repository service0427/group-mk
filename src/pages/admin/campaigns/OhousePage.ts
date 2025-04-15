import React from 'react';
import BasicTemplate from '../templates/BasicTemplate';

const OhousePage = () => {
  return React.createElement(BasicTemplate, {
    title: "오늘의집 관리",
    description: "관리자 메뉴 > 캠페인 관리 > 오늘의집"
  });
};

export { OhousePage };