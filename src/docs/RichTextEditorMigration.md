# Rich Text Editor Migration Guide

## Overview

이 프로젝트에서는 두 가지 리치 텍스트 에디터를 지원합니다:

1. **ReactQuill**: 기존에 사용하던 에디터
2. **TipTap**: 이미지 업로드 및 표시 기능이 더 안정적인 개선된 에디터

이 문서에서는 ReactQuill에서 TipTap으로 마이그레이션하는 방법을 설명합니다.

## 이미지 업로드 문제

ReactQuill 에디터를 사용할 때 발생한 이미지 업로드 문제:

1. 이미지가 삽입되었을 때 HTML 태그가 그대로 표시됨
2. 이미지가 보이지 않거나 깨지는 현상
3. 다크 모드에서 이미지가 제대로 표시되지 않는 문제

TipTap 에디터는 이러한 문제를 해결하며, 더 안정적인 이미지 업로드 및 표시 기능을 제공합니다.

## 마이그레이션 방법

### 1. import 문 변경

```tsx
// 기존 코드
import { RichTextEditor, RichTextViewer } from '@/components/rich-text-editor';

// 변경 코드 (TipTap 사용)
import { TiptapEditor, TiptapViewer } from '@/components/rich-text-editor';

// 또는 별칭 사용
import { BetterRichTextEditor, BetterRichTextViewer } from '@/components/rich-text-editor';
```

### 2. 컴포넌트 사용 변경

```tsx
// 기존 코드 (에디터)
<RichTextEditor
  value={content}
  onChange={setContent}
  placeholder="내용을 입력하세요..."
  height="400px"
/>

// 변경 코드 (TipTap 에디터)
<TiptapEditor
  value={content}
  onChange={setContent}
  placeholder="내용을 입력하세요..."
  height="400px"
/>

// 기존 코드 (뷰어)
<RichTextViewer content={content} />

// 변경 코드 (TipTap 뷰어)
<TiptapViewer content={content} />
```

### 3. ref 사용 시 타입 변경

```tsx
// 기존 코드
import { RichTextEditorHandle } from '@/components/rich-text-editor';
const editorRef = useRef<RichTextEditorHandle>(null);

// 변경 코드
import { TiptapEditorHandle } from '@/components/rich-text-editor';
const editorRef = useRef<TiptapEditorHandle>(null);
```

## 주요 컴포넌트 및 함수

### 에디터 컴포넌트

- **TiptapEditor**: 기본 TipTap 에디터 컴포넌트
- **TiptapViewer**: TipTap 콘텐츠 뷰어 컴포넌트
- **BetterRichTextEditor**: TiptapEditor의 별칭
- **BetterRichTextViewer**: TiptapViewer의 별칭

### 핸들 메서드

TiptapEditorHandle은 다음 메서드를 제공합니다:

- `getHTML()`: 현재 에디터 내용을 HTML 문자열로 반환
- `setHTML(html)`: HTML 문자열로 에디터 내용 설정
- `getEditor()`: 내부 TipTap 에디터 인스턴스 반환
- `insertImage(url)`: 이미지 URL을 에디터에 삽입
- `insertFile(name, url)`: 파일 링크를 에디터에 삽입
- `focus()`: 에디터에 포커스 설정

## 이미지 처리 개선

TipTap 에디터는 다음과 같은 이미지 처리 개선 사항을 제공합니다:

1. Base64 이미지 지원
2. 이미지 크기 자동 조정
3. 다크 모드 호환성
4. 이미지 로드 실패 시 오류 처리

## 권장 에디터 사용 방식

1. 새 프로젝트나 컴포넌트에서는 항상 TipTap 에디터 사용
2. 기존 ReactQuill 사용 코드는 점진적으로 TipTap으로 마이그레이션
3. 공통 컴포넌트에서는 BetterRichTextEditor 및 BetterRichTextViewer 사용 권장

## 참고 사항

- TipTap 에디터는 ProseMirror 기반으로 ReactQuill보다 더 나은 확장성 제공
- 스타일링은 CSS 모듈과 인라인 스타일 모두 지원
- 필요한 경우 특정 확장 기능만 선택적으로 사용 가능
- 성능상 ReactQuill보다 더 효율적, 특히 큰 문서 편집 시 성능 차이 체감