# Provider 최적화

## 주요 변경 내용

이 변경은 여러 개별 Provider를 하나의 통합된 UIProvider로 합치는 최적화를 구현했습니다:

- **Provider 통합**: LayoutProvider, LoadersProvider, MenusProvider가 하나의 UIProvider로 통합되었습니다.
- **렌더링 최적화**: 메모이제이션을 통해 불필요한 리렌더링을 방지합니다.
- **선택적 구독**: 필요한 상태만 구독할 수 있도록 특화된 훅을 제공합니다.
- **코드 중복 감소**: 유사한 패턴의 코드를 통합하여 중복을 제거했습니다.

## 사용 방법

### 기존 코드와 호환되는 방식

기존 코드는 변경 없이 계속 작동합니다. 이전에 사용하던 훅들을 그대로 사용할 수 있습니다:

```jsx
import { useLoaders, useLayout, useMenus } from '@/providers';

const MyComponent = () => {
  const { setContentLoader } = useLoaders();
  const { currentLayout } = useLayout();
  const { getCurrentMenuItem } = useMenus();
  
  // ...
};
```

### 통합된 컨텍스트 사용 (권장)

필요한 경우 통합된 `useUI` 훅을 사용하여 모든 상태와 함수에 접근할 수 있습니다:

```jsx
import { useUI } from '@/providers/UIProvider';

const MyComponent = () => {
  const { 
    setContentLoader, 
    currentLayout, 
    getCurrentMenuItem 
  } = useUI();
  
  // ...
};
```

## 성능 이점

이 변경으로 다음과 같은 성능 이점을 얻을 수 있습니다:

1. **Provider 중첩 감소**: Provider 중첩이 줄어들어 React 렌더링 깊이가 감소합니다.
2. **선택적 렌더링**: 필요한 상태만 구독하여 불필요한 리렌더링을 방지합니다.
3. **메모리 사용량 감소**: 중복 상태와 컨텍스트 객체가 줄어듭니다.
4. **유지보수성 향상**: 관련 상태와 함수가 한 곳에서 관리됩니다.

## 추가 최적화 가능성

추후 더 많은 최적화가 필요한 경우 다음과 같은 방법을 고려할 수 있습니다:

1. **Context Selector 패턴 도입**: `use-context-selector` 라이브러리를 사용하여 더 세밀한 리렌더링 제어
2. **상태 관리 라이브러리 도입**: Zustand 또는 Jotai 같은 라이브러리로 더 효율적인 상태 관리
3. **코드 분할**: 필요에 따라 동적으로 Provider를 로드하는 패턴 도입
