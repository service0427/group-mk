import React from 'react';
import BasicTemplate from './components/BasicTemplate';

const UsersPage = () => {
  return React.createElement(BasicTemplate, {
    title: "사용자 관리",
    description: "관리자 메뉴 > 사용자 관리"
  });
};

export { UsersPage };
