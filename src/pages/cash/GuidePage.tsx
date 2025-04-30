import React from 'react';
import { CommonTemplate } from '@/components/pageTemplate';

const GuidePage = () => {
  return (
    <CommonTemplate
      title="캐쉬/포인트 이용안내"
      description="캐쉬/포인트 관리 > 캐쉬/포인트 이용안내"
      showPageMenu={false}
    >
      <div className="grid gap-4 lg:gap-5">
        <div className="bg-card rounded-lg shadow-sm overflow-hidden">
          <div className="p-5 flex justify-between items-center border-b">
            <h3 className="text-lg font-medium text-card-foreground">
              캐쉬/포인트 이용안내
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

export { GuidePage };