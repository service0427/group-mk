# StyledToolbar - 대시보드 스타일 툴바 사용 가이드

## 개요
대시보드 페이지에서 사용하는 색상 배경과 그라데이션이 적용된 스타일의 툴바 컴포넌트입니다. CommonTemplate을 수정하지 않고 필요한 페이지에서 개별적으로 사용할 수 있습니다.

## 특징
- 다양한 색상과 그라데이션 적용 가능
- 제목과 설명 텍스트 지원
- 액션 버튼 영역 지원
- 모든 화면 크기에 대응하는 반응형 디자인
- 다크 모드 지원

## 사용 방법
```tsx
import { StyledToolbar } from '@/partials/toolbar';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';

// 컴포넌트 내부에서 사용
<Container>
  <StyledToolbar
    title="대시보드 제목"
    description="대시보드에 대한 설명 텍스트"
    bgClass="bg-gradient-to-r from-blue-500 to-indigo-600"
    textClass="text-white"
    toolbarActions={
      <>
        <Button 
          variant="outline" 
          className="ml-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          액션 버튼
        </Button>
      </>
    }
  />

  {/* 컨텐츠 영역 */}
</Container>
```

## 속성
| 속성 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| title | string | 필수 | 툴바 제목 |
| description | string | - | 툴바 설명 (선택 사항) |
| bgClass | string | 'bg-gradient-to-r from-blue-500 to-indigo-600' | 배경 색상 클래스 |
| textClass | string | 'text-white' | 텍스트 색상 클래스 |
| hideDescription | boolean | false | 설명 숨김 여부 |
| toolbarActions | ReactNode | - | 툴바 우측에 표시할 액션 버튼 영역 |
| children | ReactNode | - | 추가 컨텐츠 (필요한 경우) |

## 색상 예제

### 파란색 그라데이션 (기본값)
```tsx
<StyledToolbar
  title="제목"
  description="설명"
  bgClass="bg-gradient-to-r from-blue-500 to-indigo-600"
  textClass="text-white"
/>
```

### 보라색
```tsx
<StyledToolbar
  title="제목"
  description="설명"
  bgClass="bg-purple-600"
  textClass="text-white"
/>
```

### 초록색
```tsx
<StyledToolbar
  title="제목"
  description="설명"
  bgClass="bg-green-600"
  textClass="text-white"
/>
```

### 빨간색
```tsx
<StyledToolbar
  title="제목"
  description="설명"
  bgClass="bg-red-600"
  textClass="text-white"
/>
```

### 회색/흰색
```tsx
<StyledToolbar
  title="제목"
  description="설명"
  bgClass="bg-gray-100"
  textClass="text-gray-800"
/>
```

## 예제 페이지
전체 예제 코드는 `/src/examples/StyledToolbarExample.tsx`에서 확인할 수 있습니다.