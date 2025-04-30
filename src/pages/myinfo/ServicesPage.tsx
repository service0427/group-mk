import React from 'react';
import { CommonTemplate } from '@/components/pageTemplate';

const ServicesPage = () => {
  return (
    <CommonTemplate 
      title="이용 중 서비스 관리"
      description="내 서비스 관리 > 이용 중 서비스 관리"
      showPageMenu={false}
    >
      <div className="grid gap-4 lg:gap-5">
        <div className="bg-card rounded-lg shadow-sm overflow-hidden">
          <div className="p-5 flex justify-between items-center border-b">
            <h3 className="text-lg font-medium text-card-foreground">
              서비스 정보
            </h3>
          </div>
          <div className="p-5">
            <p className="text-foreground">
              이 페이지는 준비중입니다. 곧 서비스가 제공될 예정입니다
            </p>
          </div>
        </div>
      </div>
    </CommonTemplate>
  );
};

export { ServicesPage };