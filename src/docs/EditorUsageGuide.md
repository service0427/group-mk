# 리치 텍스트 에디터 사용 가이드

## 개요

이 프로젝트에서는 두 가지 리치 텍스트 에디터를 지원합니다:

1. **ReactQuill**: 기존에 사용하던 에디터로, 일부 이미지 표시 문제가 있을 수 있습니다.
2. **TipTap**: 이미지 업로드 및 표시 기능이 더 안정적인 개선된 에디터입니다.

## 에디터 선택하기

### 방법 1: 기존 ReactQuill 사용

```tsx
import { RichTextEditor } from '@/components/rich-text-editor';

// 컴포넌트에서 사용
<RichTextEditor
  value={content}
  onChange={setContent}
  placeholder="내용을 입력하세요..."
/>
```

### 방법 2: TipTap 에디터 사용 (권장)

```tsx
import { TiptapEditor } from '@/components/rich-text-editor';
// OR
import { BetterRichTextEditor } from '@/components/rich-text-editor';

// 컴포넌트에서 사용
<TiptapEditor
  value={content}
  onChange={setContent}
  placeholder="내용을 입력하세요..."
/>
```

## TipTap 에디터의 장점

1. 더 안정적인 이미지 업로드 및 표시 기능
2. 향상된 마크다운 지원
3. 모던한 사용자 인터페이스
4. 다크 모드 완벽 지원
5. 이미지 리사이징 기능 지원

## 에디터 테스트 페이지

프로젝트에는 두 에디터를 비교 테스트할 수 있는 페이지가 포함되어 있습니다:

```
/editor-test
```

이 페이지에서 두 에디터의 이미지 업로드 및 표시 기능을 직접 비교해볼 수 있습니다.

## 공지사항 모듈

현재 관리자 페이지의 공지사항 관리 모듈은 TipTap 에디터를 사용하고 있으며, 공지사항 표시 모듈에서는 RichTextViewer를 사용하고 있습니다. 이 두 컴포넌트는 호환성을 보장하여 어느 에디터로 작성한 콘텐츠든 올바르게 표시됩니다.

## 이미지 업로드 문제 해결

ReactQuill에서 이미지 업로드 및 표시에 문제가 계속 발생한다면:

1. 브라우저 콘솔에서 오류 메시지 확인
2. 이미지 파일 크기와 형식 확인 (최대 30MB, jpg/png/gif/webp 형식만 지원)
3. TipTap 에디터로 전환
4. 개발자에게 문의

## 참고 사항

- CSS 수정 사항: `critical-fix.css`, `image-fix.css` 파일에 이미지 표시를 위한 스타일 규칙이 포함되어 있습니다.
- 이미지 업로드 핸들러: 이미지 업로드 성능을 향상시키기 위해 개선된 핸들러를 사용하고 있습니다.