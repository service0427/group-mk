import React from 'react';
import { AdMiscFaq } from './AdMiscFaq';
import { FaqModalButton } from './AdMiscFaqModal';
import { Button } from '@/components/ui/button';

// FAQ 사용 예제 컴포넌트
const FaqUsageExample: React.FC = () => {
  return (
    <div className="grid gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">FAQ 사용 예제</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {/* 일반 버튼으로 모달 FAQ 표시 */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium mb-3">1. 모달 형태로 FAQ 사용하기</h4>
            <FaqModalButton buttonText="FAQ 모달 열기" />
            <p className="mt-3 text-sm text-gray-600">
              버튼 클릭 시 모달 형태로 FAQ가 표시됩니다. 카테고리별로 필터링이 가능합니다.
            </p>
          </div>
          
          {/* 인라인 FAQ 사용 방법 */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium mb-3">2. 인라인 형태로 FAQ 사용하기</h4>
            <div className="flex items-center mb-3">
              <code className="bg-gray-200 p-1 rounded text-sm">{'<AdMiscFaq />'}</code>
            </div>
            <p className="text-sm text-gray-600">
              컴포넌트를 직접 페이지에 삽입하여 인라인 형태로 FAQ를 표시합니다.
            </p>
          </div>
        </div>
      </div>
      
      {/* 인라인 FAQ 예제 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">인라인 FAQ 예제</h3>
        <AdMiscFaq />
      </div>
    </div>
  );
};

export { FaqUsageExample };
