import React from 'react';
import { CommonTemplate } from '@/components/pageTemplate';
import SitemapContent from './components/SitemapContent';

const SitemapPage = () => {
  return (
    <CommonTemplate
      title="사이트맵"
      description="전체 서비스 구조를 확인하세요"
      showPageMenu={false}
    >
      <SitemapContent />
    </CommonTemplate>
  );
};

export { SitemapPage };