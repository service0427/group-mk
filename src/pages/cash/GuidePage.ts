import React from 'react';
import BasicTemplate from './templates/BasicTemplate';

const GuidePage = () => {
  return React.createElement(BasicTemplate, {
    title: "캐쉬/포인트 이용안내",
    description: "캐쉬/포인트 관리 > 캐쉬/포인트 이용안내"
  });
};

export { GuidePage };