# 메모이제이션(Memoization)이란?

메모이제이션은 이전에 계산한 결과를 저장해두고 동일한 입력이 주어질 경우 저장해둔 결과를 재사용하는 최적화 기법입니다. React 애플리케이션에서는 불필요한 렌더링과 계산을 방지하여 성능을 향상시키는 데 중요한 역할을 합니다.

## React에서의 메모이제이션 기법

### 1. useMemo

`useMemo`는 계산 비용이 큰 값의 계산 결과를 메모이제이션합니다. 의존성 배열이 변경될 때만 값을 재계산합니다.

```jsx
import { useMemo } from 'react';

// 예시: 계산 비용이 큰 데이터 필터링
const filteredData = useMemo(() => {
  console.log('Expensive calculation running...');
  return data.filter(item => item.status === activeStatus);
}, [data, activeStatus]); // 의존성 배열
```

### 2. useCallback

`useCallback`은 함수 자체를 메모이제이션합니다. 의존성 배열이 변경될 때만 함수를 재생성합니다.

```jsx
import { useCallback } from 'react';

// 예시: 이벤트 핸들러 메모이제이션
const handleClick = useCallback(() => {
  console.log('Button clicked!');
  performAction(id);
}, [id]); // 의존성 배열
```

### 3. React.memo

`React.memo`는 컴포넌트 자체를 메모이제이션합니다. 컴포넌트의 props가 변경되지 않으면 리렌더링을 방지합니다.

```jsx
import React from 'react';

const ExpensiveComponent = React.memo(({ data }) => {
  console.log('ExpensiveComponent rendering');
  // 렌더링 로직...
  return <div>{/* JSX */}</div>;
});
```

## AuthProvider에서의 메모이제이션 적용

AuthProvider에서는 `useMemo`를 사용하여 컨텍스트 값을 메모이제이션합니다:

```jsx
// 메모이제이션된 컨텍스트 값
const contextValue = useMemo(() => ({
  loading,
  setLoading,
  auth,
  currentUser,
  login,
  logout,
  verify,
  isAuthenticated,
  userRole,
  refreshToken
}), [
  loading, auth, currentUser, 
  logout, verify, isAuthenticated, userRole, 
  refreshToken
]);
```

이렇게 하면 다음과 같은 이점이 있습니다:

1. **불필요한 리렌더링 방지**: 의존성 배열의 값이 변경되지 않으면 동일한 객체 참조가 유지되어, 컨텍스트를 사용하는 하위 컴포넌트들의 불필요한 리렌더링을 방지합니다.

2. **성능 최적화**: 특히 큰 컴포넌트 트리에서 중요합니다. 상태 변경이 있을 때마다 새 객체를 생성하면 불필요한 렌더링이 발생할 수 있습니다.

3. **안정적인 참조**: 함수와 객체가 렌더링마다 재생성되지 않아 `useEffect`의 의존성으로 사용될 때 무한 루프를 방지합니다.

## 주의사항

1. **의존성 배열 누락**: 의존성 배열에서 사용되는 값을 빠뜨리면 오래된 클로저 문제가 발생할 수 있습니다.

2. **과도한 메모이제이션**: 단순한 계산이나 작은 컴포넌트에서는 메모이제이션 자체가 오버헤드가 될 수 있습니다.

3. **깊은 비교 필요성**: 객체나 배열의 내용이 변경되었는지 확인하기 위해 때로는 커스텀 비교 함수가 필요할 수 있습니다.
