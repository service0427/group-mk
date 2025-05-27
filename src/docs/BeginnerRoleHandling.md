# Beginner Role 처리 가이드

비기너(beginner) 역할을 위한 기능 개발 및 구현 가이드입니다.

## 개요

비기너 역할은 시스템을 처음 사용하는 사용자를 위한 역할입니다. 이 역할은 다음과 같은 특징이 있습니다:

1. 제한된 기능만 접근 가능
2. 샘플 데이터 제공
3. 가이드 중심 UI 제공
4. 실제 데이터 접근에 대한 보안 제한

## 구현 방식

### 1. 대시보드 구조

비기너 대시보드는 다음 파일들로 구성됩니다:

- `src/pages/dashboards/beginner/DashboardPage.tsx`: 페이지 컴포넌트
- `src/pages/dashboards/beginner/DashboardContent.tsx`: 실제 내용 컴포넌트
- `src/pages/dashboards/beginner/index.ts`: 내보내기 파일

내보내기 파일은 다음과 같이 구성되어 있어 다양한 방식의 임포트를 지원합니다:

```typescript
// 이름을 변경하지 않고 직접 내보내기
export { DashboardPage } from './DashboardPage';
export { DashboardContent } from './DashboardContent';

// 기존 코드와의 호환성을 위한 별칭도 제공
export { DashboardPage as BeginnerDashboardPage } from './DashboardPage';
export { DashboardContent as BeginnerDashboardContent } from './DashboardContent';
```

### 2. 비기너 대시보드 특징

비기너 대시보드는 다음과 같은 특징이 있습니다:

1. **샘플 데이터 제공**: 기본 데이터는 샘플 데이터를 사용하되, 공지사항과 FAQ는 실제 데이터와 연동
2. **가이드 중심 UI**: 비기너가 시스템 사용법을 익힐 수 있도록 가이드 컴포넌트 제공
3. **안전한 기능 제한**: 비기너가 실수로 중요한 데이터를 손상시키지 않도록 일부 기능 제한

### 3. 데이터 접근 방식

비기너 역할은 다음과 같은 방식으로 데이터에 접근합니다:

1. **공지사항 및 FAQ**: 실제 DB 데이터를 읽기 전용으로 접근
2. **사용자 정보**: 샘플 데이터 사용 (DB 접근 없음)
3. **캐시 및 포인트**: 샘플 데이터 사용 (DB 접근 없음)

### 4. 데이터베이스 접근 제한

비기너 역할의 데이터베이스 접근 제한은 RLS(Row Level Security)를 통해 구현되었습니다:

```sql
-- 비기너 역할은 공지사항과 FAQ만 읽기 가능
CREATE POLICY "Beginners can read notices"
  ON "public"."notice"
  FOR SELECT
  TO authenticated
  USING (
    (auth.uid() IN ( SELECT users.id FROM users WHERE (users.role = 'beginner'::text) ))
    AND 
    (is_active = true)
  );

CREATE POLICY "Beginners can read FAQs"
  ON "public"."faq"
  FOR SELECT
  TO authenticated
  USING (
    (auth.uid() IN ( SELECT users.id FROM users WHERE (users.role = 'beginner'::text) ))
    AND 
    (is_active = true)
  );
```

## 주의사항

1. 비기너 역할이 접근할 수 있는 API 및 테이블을 추가할 때에는 반드시 RLS 정책을 검토하세요.
2. 비기너에게 제공되는 샘플 데이터는 최신 상태로 유지해야 합니다.
3. 비기너 UI는 항상 명확하고 사용하기 쉽게 유지해야 합니다.

## 향후 개선사항

1. 비기너 역할에서 일반 사용자 역할로 쉽게 전환할 수 있는 기능 추가
2. 더 많은 가이드 및 튜토리얼 컨텐츠 추가
3. 샘플 데이터의 다양성 증가
