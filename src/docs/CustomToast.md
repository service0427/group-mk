# Custom Toast Component

이 문서는 커스텀 토스트 컴포넌트의 사용법을 설명합니다.

## 개요

커스텀 토스트 컴포넌트는 기존의 sonner 토스트 구현을 대체하기 위해 개발되었습니다. 이 컴포넌트는 알림 통계 페이지에서 사용되는 것과 동일한 디자인과 기능을 제공합니다.

## 컴포넌트 구조

- `CustomToast`: 토스트 UI 컴포넌트
- `ToastContainer`: 여러 토스트를 관리하는 컨테이너
- `ToastProvider`: 애플리케이션 전체에서 토스트를 관리하는 컨텍스트 제공자
- `useToast`: 토스트를 사용하기 위한 훅
- `useCustomToast`: 단일 컴포넌트에서 독립적인 토스트를 사용하기 위한 훅

## 사용 방법

### Context API를 통한 사용 (권장)

애플리케이션 전체에서 토스트를 관리하려면 `ToastProvider`와 `useToast` 훅을 사용하세요.

```tsx
import { useToast } from '@/providers/ToastProvider';

const MyComponent = () => {
  const toast = useToast();

  const handleClick = () => {
    toast.success('성공적으로 처리되었습니다.');
    // 또는
    toast.error('처리 중 오류가 발생했습니다.');
    // 또는
    toast.info('작업이 진행 중입니다.');
    // 또는
    toast.warning('주의가 필요한 작업입니다.');
  };

  return <button onClick={handleClick}>토스트 표시</button>;
};
```

### 독립적인 컴포넌트로 사용

단일 컴포넌트에서 독립적으로 토스트를 관리하려면 `useCustomToast` 훅을 사용하세요.

```tsx
import { useCustomToast } from '@/hooks';
import { CustomToast } from '@/components/ui/toast';

const MyComponent = () => {
  const { toast, showSuccess, showError, hideToast } = useCustomToast({
    duration: 5000,
    position: 'top-right'
  });

  const handleSuccess = () => {
    showSuccess('성공적으로 처리되었습니다.');
  };

  const handleError = () => {
    showError('처리 중 오류가 발생했습니다.');
  };

  return (
    <div>
      <button onClick={handleSuccess}>성공</button>
      <button onClick={handleError}>오류</button>
      
      {/* 토스트 컴포넌트 렌더링 */}
      <CustomToast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </div>
  );
};
```

## 옵션

토스트 컴포넌트는 다음과 같은 옵션을 지원합니다:

| 옵션명 | 타입 | 기본값 | 설명 |
|--------|------|--------|------|
| message | string | - | 토스트에 표시될 메시지 |
| type | 'success' \| 'error' \| 'info' \| 'warning' | 'success' | 토스트 유형 |
| duration | number | 5000 | 토스트가 표시되는 시간(ms) |
| position | 'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right' | 'top-right' | 토스트가 표시되는 위치 |

## 예제

전체 예제 컴포넌트는 `src/examples/CustomToastExample.tsx`에서 확인할 수 있습니다.

## 마이그레이션

기존 sonner 토스트에서 커스텀 토스트로 마이그레이션하려면:

1. `import { toast } from 'sonner';` 대신 `import { useToast } from '@/providers/ToastProvider';`를 사용하세요.
2. `toast('메시지')` 또는 `toast.success('메시지')` 대신 `toast.success('메시지')`를 사용하세요.
3. `toast.error('메시지')` 대신 `toast.error('메시지')`를 사용하세요.

Sonner에서 마이그레이션 예제:

```tsx
// 기존 코드
import { toast } from 'sonner';

const handleClick = () => {
  toast.success('성공 메시지');
};
```

```tsx
// 마이그레이션 후
import { useToast } from '@/providers/ToastProvider';

const MyComponent = () => {
  const toast = useToast();

  const handleClick = () => {
    toast.success('성공 메시지');
  };
};
```

## 알림 통계 페이지와 호환성

알림 통계 페이지에서 사용하는 기존 토스트 코드는 다음과 같이 마이그레이션할 수 있습니다:

```tsx
// 기존 코드
const [notification, setNotification] = useState<{ 
  show: boolean; 
  message: string; 
  type: 'success' | 'error' 
}>({
  show: false,
  message: '',
  type: 'success'
});

// 사용
setNotification({ 
  show: true, 
  message: '알림 통계가 성공적으로 업데이트되었습니다', 
  type: 'success' 
});
```

```tsx
// 마이그레이션 후
import { useToast } from '@/providers/ToastProvider';

const MyComponent = () => {
  const toast = useToast();

  // 사용
  toast.success('알림 통계가 성공적으로 업데이트되었습니다');
};
```