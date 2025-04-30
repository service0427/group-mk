# CommonTemplate 마이그레이션 가이드

이 문서는 기존의 `BasicTemplate` 컴포넌트를 새로운 `CommonTemplate` 컴포넌트로 마이그레이션하는 방법을 설명합니다.

## 개요

`CommonTemplate`은 모든 페이지에서 일관된 레이아웃과 디자인을 제공하기 위해 만들어졌습니다. 이 템플릿은 '캠페인 소개' 하위 페이지의 레이아웃을 기준으로 제작되었으며, 페이지 타이틀이 잘리는 문제를 해결합니다. 또한 헤더(공지사항 라인 포함), 푸터, 페이지 영역 간의 경계선을 자동으로 계산하여 모든 화면 크기에서 일관된 레이아웃을 제공합니다.

## 장점

- **일관된 디자인**: 모든 페이지에서 동일한 디자인 유지
- **타이틀 영역 안정성**: 페이지 타이틀이 잘리는 문제 해결
- **유연한 구성**: 다양한 옵션으로 페이지 레이아웃 조정 가능
- **코드 중복 감소**: 공통 레이아웃 코드 중앙화
- **자동 경계선 계산**: 헤더(공지사항 포함)와 푸터 경계선 자동 계산
- **반응형 레이아웃**: 화면 크기 변경에 동적으로 대응

## 설치 위치

`CommonTemplate`은 `src/components/templates/` 폴더에 있으며, 다음과 같이 임포트할 수 있습니다:

```tsx
import { CommonTemplate } from '@/components/templates';
```

## 마이그레이션 방법

### 기본 사용법

기존의 `BasicTemplate` 사용 코드:

```tsx
import BasicTemplate from '@/pages/admin/components/BasicTemplate';

const MyPage = () => {
  return (
    <BasicTemplate
      title="페이지 제목"
      description="페이지 설명"
    >
      {/* 페이지 내용 */}
    </BasicTemplate>
  );
};
```

새로운 `CommonTemplate` 사용 코드:

```tsx
import { CommonTemplate } from '@/components/templates';

const MyPage = () => {
  return (
    <CommonTemplate
      title="페이지 제목"
      description="페이지 설명"
    >
      {/* 페이지 내용 */}
    </CommonTemplate>
  );
};
```

### 고급 사용법

`CommonTemplate`의 다양한 옵션을 활용하면 더 유연한 레이아웃을 구성할 수 있습니다:

```tsx
import { CommonTemplate } from '@/components/templates';
import { KeenIcon } from '@/components/keenicons';

const MyAdvancedPage = () => {
  // 툴바 액션 버튼
  const toolbarActions = (
    <>
      <button className="btn btn-sm btn-primary">
        <KeenIcon icon="plus" className="me-1.5" />
        추가하기
      </button>
      <button className="btn btn-sm btn-light">필터</button>
    </>
  );

  return (
    <CommonTemplate
      title="고급 페이지"
      description="고급 기능을 사용한 페이지입니다"
      showPageMenu={true}      // 페이지 메뉴 표시 (기본값: true)
      showBreadcrumb={true}    // 브레드크럼 형식 설명 표시 (기본값: true)
      toolbarActions={toolbarActions}  // 툴바 액션 버튼
      container={true}         // 컨테이너 사용 (기본값: true)
      fullWidth={true}         // 전체 너비 사용 (기본값: true)
      containerClassName="my-custom-container"  // 컨테이너 추가 클래스
      childrenClassName="grid grid-cols-1 gap-4"  // 컨텐츠 영역 클래스
    >
      {/* 페이지 내용 */}
    </CommonTemplate>
  );
};
```

## 속성(Props) 비교

| BasicTemplate 속성 | CommonTemplate 속성 | 설명 |
|-------------------|-------------------|------|
| `title` | `title` | 페이지 제목 |
| `description` | `description` | 페이지 설명 |
| `children` | `children` | 페이지 컨텐츠 |
| - | `showPageMenu` | 페이지 메뉴 표시 여부 (기본값: true) |
| - | `showBreadcrumb` | 브레드크럼 표시 여부 (기본값: true) |
| - | `toolbarActions` | 툴바 액션 버튼 영역 |
| - | `container` | 컨테이너 사용 여부 (기본값: true) |
| - | `fullWidth` | 전체 너비 사용 여부 (기본값: true) |
| - | `containerClassName` | 컨테이너에 추가할 클래스 |
| - | `childrenClassName` | 컨텐츠 영역에 추가할 클래스 |

## 예시 코드

전체 예시 코드는 `src/examples/CommonTemplateExample.tsx` 파일을 참조하세요.

## 마이그레이션 계획

1. 새로운 페이지를 개발할 때는 `CommonTemplate`을 사용합니다.
2. 기존 페이지는 점진적으로 `CommonTemplate`으로 변경합니다.
3. 페이지 타이틀이 잘리는 문제가 발생하는 페이지를 우선적으로 변경합니다.

## 지원 및 도움말

추가 질문이나 도움이 필요한 경우 개발팀에 문의하세요.