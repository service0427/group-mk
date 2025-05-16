# 리치 텍스트 에디터 (Rich Text Editor) 컴포넌트

이 문서는 프로젝트에 통합된 리치 텍스트 에디터 컴포넌트의 사용법과 기능에 대해 설명합니다.

## 기능

- 텍스트 서식 (볼드, 이탤릭, 밑줄, 취소선 등)
- 텍스트 정렬 (왼쪽, 가운데, 오른쪽 정렬)
- 목록 (순서 있는 목록, 순서 없는 목록)
- 헤더 크기 조정 (H1 ~ H6)
- 링크 삽입
- 이미지 업로드 및 삽입 (Supabase Storage 사용)
- 파일 업로드 및 다운로드 링크 생성 (Supabase Storage 사용)
- 다크 모드 지원

## 사용 방법

### 기본 사용법

```tsx
import { RichTextEditor } from '@/components/rich-text-editor';

const MyComponent = () => {
  const [content, setContent] = useState('');

  return (
    <RichTextEditor
      value={content}
      onChange={setContent}
      placeholder="내용을 입력하세요..."
    />
  );
};
```

### 속성

| 속성 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| value | string | '' | 에디터의 현재 내용 |
| onChange | (content: string) => void | 필수 | 내용이 변경될 때 호출되는 함수 |
| placeholder | string | '내용을 입력하세요...' | 내용이 없을 때 표시되는 텍스트 |
| readOnly | boolean | false | 읽기 전용 모드 활성화 |
| height | string | '300px' | 에디터의 높이 |

### 뷰어 컴포넌트 사용법

내용을 표시만 하려는 경우 RichTextViewer 컴포넌트를 사용합니다.

```tsx
import { RichTextViewer } from '@/components/rich-text-editor';

const NoticeViewer = ({ content }) => {
  return <RichTextViewer content={content} />;
};
```

## 파일 업로드 구성

이미지와 파일은 Supabase Storage에 업로드됩니다:

- 이미지: `{userId}/notices/{파일명}`
- 파일: `{userId}/notices/files/{파일명}`

파일 업로드 크기 제한: 30MB

## 알려진 이슈

1. ReactQuill 라이브러리의 오래된 API 사용으로 인한 콘솔 경고:
   - `findDOMNode` 사용 관련 경고
   - `DOMNodeInserted` mutation 이벤트 관련 경고

   이 경고들은 라이브러리 내부 구현의 문제이며, 추후 라이브러리 업데이트에서 해결될 것으로 예상됩니다. 현재는 개발 환경에서 경고 메시지를 억제하도록 설정되어 있습니다.

2. 모바일 환경에서의 UX 최적화가 필요할 수 있습니다.

## 관련 파일

- `/src/components/rich-text-editor/RichTextEditor.tsx`: 메인 에디터 컴포넌트
- `/src/components/rich-text-editor/RichTextViewer.tsx`: 읽기 전용 뷰어 컴포넌트
- `/src/components/rich-text-editor/useForwardedRef.ts`: ref 전달을 위한 유틸리티 훅
- `/src/utils/reactWarningSuppress.ts`: React 경고 메시지 억제 유틸리티