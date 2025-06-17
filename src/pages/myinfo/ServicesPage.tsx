import React from 'react';
import { CommonTemplate } from '@/components/pageTemplate';
import { MyGuaranteeQuotesContent } from './components/MyGuaranteeQuotesContent';

const ServicesPage = () => {
  return (
    <CommonTemplate 
      title="보장형 견적 내역"
      description="내 서비스 관리 > 이용 중인 서비스 > 보장형 견적 내역"
      showPageMenu={false}
    >
      <MyGuaranteeQuotesContent />
    </CommonTemplate>
  );
};

export { ServicesPage };