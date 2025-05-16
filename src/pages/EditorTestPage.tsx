import { ReactElement } from 'react';

/**
 * 에디터 테스트 페이지
 */
const EditorTestPage = (): ReactElement => {
  return (
    <div className="container mx-auto p-5">
      <h1 className="text-2xl font-bold mb-4">에디터 테스트 페이지</h1>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <p>에디터 기능을 테스트하기 위한 페이지입니다.</p>
      </div>
    </div>
  );
};

export { EditorTestPage };