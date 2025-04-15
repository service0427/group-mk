# Supabase 인증 시스템 통합 가이드

이 문서는 Metronic 템플릿 기반 프로젝트에 Supabase 인증 시스템을 통합하는 방법을 설명합니다.

## 1. 환경 설정

### 환경 변수 설정

`.env` 파일에 다음 변수를 추가합니다:

```
VITE_PUBLIC_SUPABASE_URL=your-supabase-project-url
VITE_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 2. 기존 JWT 인증과 병행하여 사용하기

현재 프로젝트에서는 기존의 JWT 인증 시스템과 새로운 Supabase 인증 시스템을 병행하여 사용할 수 있습니다. 

### 라우팅 통합

메인 라우팅 파일에 Supabase 인증 라우트를 추가합니다:

```tsx
import SupabaseAuthRoutes from '../auth/supabase/SupabaseAuthRoutes'

// 기존 라우팅 설정 내에서
<Route path='/auth/supabase/*' element={<SupabaseAuthRoutes />} />
```

## 3. Supabase 인증으로 완전히 전환하기

기존 JWT 인증 시스템을 제거하고 Supabase 인증 시스템으로 완전히 전환하려면 다음 단계를 따릅니다:

### 1. `SupabaseAuthProvider` 적용

애플리케이션의 루트 레벨 컴포넌트에 `SupabaseAuthProvider`를 적용합니다:

```tsx
import { SupabaseAuthProvider } from '../auth/supabase/SupabaseAuthProvider'

function App() {
  return (
    <SupabaseAuthProvider>
      {/* 애플리케이션 컴포넌트 */}
    </SupabaseAuthProvider>
  )
}
```

### 2. 기존 인증 훅 대체

기존에 사용하던 인증 관련 훅을 Supabase 인증 훅으로 대체합니다:

```tsx
// 기존 코드
import { useAuth } from '...'

// 새로운 코드
import { useSupabaseAuth } from '../auth/supabase/SupabaseAuthProvider'

function MyComponent() {
  // 기존 코드
  const { currentUser, logout } = useAuth()
  
  // 새로운 코드
  const { user, signOut } = useSupabaseAuth()
}
```

### 3. 인증이 필요한 라우트 보호

인증이 필요한 라우트를 보호하기 위해 `PrivateRoute` 컴포넌트를 사용합니다:

```tsx
import { PrivateRoute } from '../auth/supabase/PrivateRoute'

// 라우팅 설정
<Route 
  path="/dashboard" 
  element={
    <PrivateRoute>
      <DashboardPage />
    </PrivateRoute>
  } 
/>
```

### 4. 인증 API 호출 변경

기존의 인증 관련 API 호출을 Supabase 인증 함수로 대체합니다:

```tsx
// 기존 코드
const handleLogin = () => {
  login(email, password)
}

// 새로운 코드
const handleLogin = async () => {
  const { error } = await signIn(email, password)
  if (error) {
    // 에러 처리
  }
}
```

## 4. Supabase 데이터베이스 설정

### 프로필 테이블 생성

다음 SQL 쿼리를 Supabase SQL 편집기에서 실행하여 사용자 프로필 테이블을 생성합니다:

```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  email TEXT,
  role TEXT
);

-- 행 수준 보안 정책 설정
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 자신의 프로필만 조회 가능한 정책
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- 자신의 프로필만 업데이트 가능한 정책
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 새 사용자 등록 시 프로필 자동 생성 트리거
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 5. 추가 설정

### 이메일 인증 설정

Supabase 대시보드에서 이메일 인증을 설정합니다:

1. Authentication > Providers > Email 메뉴로 이동
2. "Enable Email Signup" 활성화
3. 필요에 따라 "Confirm email" 옵션 활성화

### 소셜 로그인 설정 (선택 사항)

소셜 로그인을 위한 추가 설정은 Supabase 대시보드의 Authentication > Providers 메뉴에서 설정할 수 있습니다.
