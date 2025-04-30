import React from 'react';
import { CommonTemplate } from '@/components/pageTemplate';
import { DashboardContent } from './DashboardContent';

const DashboardPage: React.FC = () => {
  return (
    <CommonTemplate
      title="대행사 대시보드"
      description="대행사 대시보드 페이지입니다."
      hideDescription={true}
      showPageMenu={false}
    >
      <DashboardContent />
    </CommonTemplate>
  );
};

export { DashboardPage };