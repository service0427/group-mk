import React from 'react';
import { CommonTemplate } from '@/components/pageTemplate';
import { KeenIcon } from '@/components/keenicons';

/**
 * CommonTemplate 사용 예시
 * 기존 BasicTemplate을 대체하는 방법을 보여줍니다.
 */
const CommonTemplateExample: React.FC = () => {
  // 툴바 액션 버튼 예시
  const toolbarActions = (
    <>
      <button className="btn btn-sm btn-primary">
        <KeenIcon icon="plus" className="me-1.5" />
        추가하기
      </button>
      <button className="btn btn-sm btn-light">
        <KeenIcon icon="filter" className="me-1.5" />
        필터
      </button>
    </>
  );

  return (
    <CommonTemplate
      title="예시 페이지"
      description="CommonTemplate 사용 예시 페이지입니다"
      toolbarActions={toolbarActions}
    >
      {/* 페이지 컨텐츠 영역 */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">컨텐츠 카드</h3>
        </div>
        <div className="card-body">
          <p>이것은 CommonTemplate을 사용한 예시 페이지입니다.</p>
          <p>기존의 BasicTemplate을 대체하여 모든 페이지에서 일관된 레이아웃을 제공합니다.</p>
        </div>
      </div>
      
      {/* 추가 섹션 */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">추가 정보</h3>
        </div>
        <div className="card-body">
          <p>CommonTemplate의 주요 특징:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>캠페인 소개 페이지 스타일 기반</li>
            <li>일관된 페이지 타이틀 및 설명 표시</li>
            <li>페이지 메뉴 표시 옵션</li>
            <li>툴바 액션 버튼 영역 지원</li>
            <li>컨테이너 사용 여부 설정 가능</li>
            <li>전체 너비 사용 여부 설정 가능</li>
            <li>커스텀 클래스 추가 가능</li>
          </ul>
        </div>
      </div>
    </CommonTemplate>
  );
};

export default CommonTemplateExample;