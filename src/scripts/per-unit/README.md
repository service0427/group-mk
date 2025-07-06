# 단건형(Per-Unit) 캠페인 데이터베이스 스크립트

이 디렉토리는 단건형 캠페인 시스템을 위한 Supabase 데이터베이스 스크립트를 포함합니다.

## 📁 파일 구조

```
per-unit/
├── 01_create_per_unit_tables.sql    # 테이블 생성 스크립트
├── 02_per_unit_rls_policies.sql     # RLS 정책 설정
├── 03_per_unit_functions.sql        # 함수 및 트리거
└── README.md                         # 이 문서
```

## 🚀 설치 방법

### 1. Supabase Dashboard를 통한 설치

1. [Supabase Dashboard](https://app.supabase.com)에 로그인
2. 프로젝트 선택
3. SQL Editor로 이동
4. 각 스크립트를 순서대로 실행:
   - `01_create_per_unit_tables.sql`
   - `02_per_unit_rls_policies.sql`
   - `03_per_unit_functions.sql`

### 2. Supabase CLI를 통한 설치

```bash
# 프로젝트 루트에서
supabase db push --include-all

# 또는 개별 스크립트 실행
supabase db push src/scripts/per-unit/01_create_per_unit_tables.sql
supabase db push src/scripts/per-unit/02_per_unit_rls_policies.sql
supabase db push src/scripts/per-unit/03_per_unit_functions.sql
```

## 📊 주요 테이블

### 1. **per_unit_campaigns**
- 단건형 캠페인의 기본 설정 정보
- 최소/최대 수량, 건당 단가, 협상 가능 여부 등

### 2. **per_unit_slot_requests**
- 사용자의 견적 요청 정보
- 협상 상태 및 최종 확정 가격

### 3. **per_unit_negotiations**
- 사용자와 총판 간의 협상 메시지

### 4. **per_unit_slots**
- 구매 확정된 슬롯 정보
- 진행 상태 및 완료 수량 추적

### 5. **per_unit_work_logs**
- 일별 작업 실적 및 증빙 자료

### 6. **per_unit_holdings**
- 홀딩 금액 관리

### 7. **per_unit_inquiries** & **per_unit_inquiry_messages**
- 1:1 문의 시스템

### 8. **per_unit_refund_requests**
- 환불 요청 및 처리

### 9. **per_unit_settlements**
- 정산 내역

### 10. **per_unit_transactions**
- 모든 금융 거래 기록

## 🔐 보안 및 권한

RLS(Row Level Security) 정책이 적용되어 있어 각 사용자는 자신의 권한에 맞는 데이터만 접근할 수 있습니다:

- **광고주**: 자신의 구매/문의 데이터
- **총판**: 담당 캠페인 및 슬롯 관리
- **운영자/개발자**: 전체 데이터 접근

## 🔧 주요 함수

### 캠페인 관리
- `create_per_unit_campaign()`: 단건형 캠페인 생성
- `create_per_unit_request()`: 견적 요청 생성
- `respond_per_unit_request()`: 견적 응답

### 슬롯 관리
- `purchase_per_unit_slot()`: 슬롯 구매
- `submit_per_unit_work_log()`: 작업 실적 등록
- `approve_per_unit_work_log()`: 작업 실적 승인

### 정산/환불
- `create_per_unit_settlement()`: 정산 생성
- `create_per_unit_refund()`: 환불 요청

## 📝 사용 예시

### 1. 캠페인 생성
```sql
-- 캠페인 기본 정보 생성 (campaigns 테이블)
INSERT INTO campaigns (campaign_name, service_type, slot_type, status, mat_id)
VALUES ('블로그 포스팅 대량 작업', 'BlogPosting', 'per-unit', 'active', [총판ID]);

-- 단건형 상세 정보 생성
SELECT create_per_unit_campaign(
    p_campaign_id => [캠페인ID],
    p_min_quantity => 300,
    p_unit_price => 1000,
    p_work_period => 30,
    p_is_negotiable => true,
    p_min_unit_price => 800,
    p_max_unit_price => 1200
);
```

### 2. 견적 요청
```sql
SELECT create_per_unit_request(
    p_campaign_id => [캠페인ID],
    p_quantity => 500,
    p_unit_price => 900,
    p_message => '500건 작업 시 할인 가능한가요?'
);
```

### 3. 작업 실적 등록
```sql
SELECT submit_per_unit_work_log(
    p_slot_id => [슬롯ID],
    p_work_date => '2025-01-06',
    p_completed_count => 50,
    p_work_urls => '["https://blog1.com", "https://blog2.com"]'::jsonb
);
```

## ⚠️ 주의사항

1. **순서대로 실행**: 스크립트는 반드시 번호 순서대로 실행해야 합니다.
2. **기존 테이블 확인**: campaigns, users 등 기존 테이블이 있어야 합니다.
3. **UUID 확장**: `uuid-ossp` 확장이 활성화되어 있어야 합니다.
4. **트랜잭션 사용**: 프로덕션 환경에서는 트랜잭션으로 묶어서 실행하세요.

## 🔄 업데이트 이력

- 2025-01-06: 초기 버전 생성

## 📞 문의

문제가 있거나 추가 기능이 필요한 경우 개발팀에 문의하세요.