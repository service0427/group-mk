import React from 'react';
import { CommonTemplate } from '@/components/pageTemplate';

const GuidePage = () => {
  return React.createElement(CommonTemplate, {
    title: "캐쉬/포인트 이용안내",
    description: "캐쉬/포인트 관리 > 캐쉬/포인트 이용안내",
    showPageMenu: false
  });
};

export { GuidePage };
