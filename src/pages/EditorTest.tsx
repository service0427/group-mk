import React, { useState } from 'react';
import { TipTapEditor, TipTapViewer } from '@/components/rich-text-editor';

const EditorTest: React.FC = () => {
  const [content, setContent] = useState<string>('');

  const handleContentChange = (html: string) => {
    setContent(html);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">리치 텍스트 에디터 테스트</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">에디터</h2>
        <TipTapEditor
          content={content}
          onChange={handleContentChange}
          placeholder="내용을 입력하세요..."
        />
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">미리보기</h2>
        <div className="border rounded-lg p-4 bg-white">
          <TipTapViewer content={content} />
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">HTML 코드</h2>
        <div className="border rounded-lg p-4 bg-gray-100 overflow-auto max-h-60">
          <pre>{content}</pre>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">사용 가이드</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>텍스트 입력: 에디터 영역에 직접 텍스트를 입력합니다.</li>
          <li>서식 지정: 텍스트를 선택한 후 서식 옵션을 클릭합니다.</li>
          <li>이미지 삽입: 이미지 업로드 버튼을 클릭하여 이미지를 추가합니다.</li>
          <li>링크 삽입: 텍스트를 선택한 후 링크 아이콘을 클릭합니다.</li>
        </ul>
      </div>
    </div>
  );
};

export default EditorTest;