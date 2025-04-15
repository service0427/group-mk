import React from 'react';
import BasicTemplate from './templates/BasicTemplate';

const ProfilePage = () => {
  return React.createElement(BasicTemplate, {
    title: "내 정보 관리",
    description: "기본 관리 > 내 정보 관리"
  });
};

export { ProfilePage };