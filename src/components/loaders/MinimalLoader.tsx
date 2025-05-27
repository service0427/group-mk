import React from 'react';

/**
 * 최소한의 로딩 인디케이터
 * 전체 화면을 가리지 않고 상단에 프로그레스 바만 표시
 */
export const MinimalLoader: React.FC = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-primary/20">
        <div className="h-full bg-primary animate-progress-loading" />
      </div>
    </div>
  );
};

/**
 * 콘텐츠 플레이스홀더
 * 실제 콘텐츠와 비슷한 레이아웃의 스켈레톤을 표시
 */
export const ContentPlaceholder: React.FC = () => {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
      </div>
    </div>
  );
};