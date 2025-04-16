import React from 'react';
import BasicTemplate from './components/BasicTemplate';

const ProfilePage = () => {
  return React.createElement(BasicTemplate, {
    title: "내정보 관리",
    description: "기본 관리 > 내정보 관리"
  });
};

export { ProfilePage };
