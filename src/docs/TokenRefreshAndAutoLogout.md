# 토큰 자동 갱신과 자동 로그아웃의 관계

## 토큰 자동 갱신의 목적

토큰 자동 갱신 메커니즘의 주요 목적은 사용자가 애플리케이션을 사용하는 동안 로그인 상태를 유지하는 것입니다. JWT와 같은 인증 토큰은 보안상의 이유로 짧은 만료 시간(일반적으로 15분~1시간)을 가지고 있습니다. 토큰 자동 갱신 시스템은 다음과 같이 작동합니다:

1. 액세스 토큰이 만료되기 전에 자동으로 새로운 토큰을 요청
2. 리프레시 토큰을 사용하여 백엔드에서 새 액세스 토큰 발급
3. 새 액세스 토큰으로 기존 토큰 교체

이렇게 하면 사용자가 액티브하게 애플리케이션을 사용하는 한 로그아웃 없이 세션이 유지됩니다.

## 자동 로그아웃이 구현되지 않는 이유

현재 구현된 토큰 자동 갱신 시스템에서는 리프레시 토큰이 유효한 한 계속해서 새로운 액세스 토큰을 발급받을 수 있습니다. 따라서 다음과 같은 상황에서만 자동 로그아웃이 발생합니다:

1. 리프레시 토큰 자체가 만료된 경우
2. 백엔드에서 리프레시 토큰이 무효화된 경우 (예: 보안 사고 발생 시)
3. 네트워크 오류로 갱신 요청이 실패한 경우

기본적으로 Supabase의 리프레시 토큰은 약 60일의 긴 수명을 가지고 있습니다. 따라서 별도의 자동 로그아웃 메커니즘이 없다면, 사용자는 60일 동안 로그인 상태가 유지될 수 있습니다.

## 자동 로그아웃 기능 구현 방법

보안 요구사항에 따라 일정 시간 후 자동 로그아웃이 필요한 경우, 다음과 같은 방법으로 구현할 수 있습니다:

### 1. 절대 시간 기준 자동 로그아웃

특정 기간(예: 24시간) 후 강제 로그아웃하는 방법입니다:

```typescript
// AuthProvider.tsx 내부에 추가
const ABSOLUTE_SESSION_LIMIT = 24 * 60 * 60 * 1000; // 24시간 (밀리초)

// 초기 로그인 시간 저장
const [initialLoginTime, setInitialLoginTime] = useState<number | null>(null);

// 로그인 시 초기 시간 설정
const login = async (email: string, password: string) => {
  // 기존 로그인 로직...
  
  // 로그인 성공 시 초기 시간 설정
  setInitialLoginTime(Date.now());
  localStorage.setItem('login_timestamp', Date.now().toString());
};

// 절대 시간 체크 효과
useEffect(() => {
  if (!auth) return;
  
  // 로컬 스토리지에서 로그인 시간 복원
  if (!initialLoginTime) {
    const storedTime = localStorage.getItem('login_timestamp');
    if (storedTime) {
      setInitialLoginTime(parseInt(storedTime));
    } else {
      setInitialLoginTime(Date.now());
      localStorage.setItem('login_timestamp', Date.now().toString());
    }
  }

  const checkAbsoluteTimeout = () => {
    if (!initialLoginTime) return;
    
    const now = Date.now();
    const sessionDuration = now - initialLoginTime;
    
    if (sessionDuration > ABSOLUTE_SESSION_LIMIT) {
      console.log('절대 세션 시간 초과, 자동 로그아웃');
      localStorage.removeItem('login_timestamp');
      logout();
    }
  };
  
  const intervalId = setInterval(checkAbsoluteTimeout, 60000); // 1분마다 체크
  
  return () => clearInterval(intervalId);
}, [auth, initialLoginTime, logout]);
```

### 2. 비활성 시간 기준 자동 로그아웃

사용자가 일정 시간 동안 활동이 없으면 로그아웃하는 방법입니다:

```typescript
// AuthProvider.tsx 내부에 추가
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30분 (밀리초)
const [lastActivity, setLastActivity] = useState<number>(Date.now());

// 사용자 활동 감지
useEffect(() => {
  const updateLastActivity = () => {
    setLastActivity(Date.now());
    localStorage.setItem('last_activity', Date.now().toString());
  };
  
  // 사용자 활동 이벤트
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
  
  events.forEach(event => {
    window.addEventListener(event, updateLastActivity);
  });
  
  return () => {
    events.forEach(event => {
      window.removeEventListener(event, updateLastActivity);
    });
  };
}, []);

// 비활성 시간 체크
useEffect(() => {
  if (!auth) return;
  
  // 로컬 스토리지에서 마지막 활동 시간 복원
  const storedActivity = localStorage.getItem('last_activity');
  if (storedActivity) {
    setLastActivity(parseInt(storedActivity));
  }
  
  const checkInactivity = () => {
    const now = Date.now();
    const inactiveTime = now - lastActivity;
    
    if (inactiveTime > INACTIVITY_TIMEOUT) {
      console.log('사용자 비활성 시간 초과, 자동 로그아웃');
      localStorage.removeItem('last_activity');
      logout();
    }
  };
  
  const intervalId = setInterval(checkInactivity, 60000); // 1분마다 체크
  
  return () => clearInterval(intervalId);
}, [auth, lastActivity, logout]);
```

### 3. 서버 측 자동 로그아웃 구현

Supabase의 경우 세션/토큰 설정을 직접 구성할 수 있습니다:

```typescript
// 서버 측에서 리프레시 토큰 만료 시간 설정 (Supabase 대시보드)
// Authentication > Settings > JWT expiry time

// 클라이언트에서는 토큰 갱신 실패 시 로그아웃 처리
const refreshToken = useCallback(async (): Promise<boolean> => {
  try {
    // 기존 코드...
    
    if (error) {
      // 토큰 갱신 실패 시 로그아웃
      console.error('토큰 갱신 실패:', error.message);
      logout();
      return false;
    }
    
    // 기존 코드...
  } catch (error) {
    console.error('토큰 갱신 중 오류:', error);
    logout();
    return false;
  }
}, [auth, logout]);
```

## 권장 구현: 비활성 시간 + 절대 시간 조합

대부분의 애플리케이션에서는 두 접근 방식을 조합하는 것이 좋습니다:

1. **비활성 기준**: 사용자가 30분 동안 활동이 없으면 로그아웃
2. **절대 시간 기준**: 로그인 후 24시간이 지나면 재로그인 요구

이렇게 하면 보안과 사용자 경험 사이의 균형을 맞출 수 있습니다. 사용자가 활발히 애플리케이션을 사용하는 동안에는 세션이 유지되지만, 장시간 방치하거나 너무 오래 로그인 상태가 유지되는 것을 방지할 수 있습니다.
