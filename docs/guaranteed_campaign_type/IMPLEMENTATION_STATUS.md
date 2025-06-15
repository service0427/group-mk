# 보장형 캠페인 구현 현황

## 문제 상황
보장형(guarantee) 캠페인이 일반형(standard)으로 표시되는 문제

## 원인 분석
1. 데이터베이스에는 `slot_type`, `guarantee_count`, `guarantee_unit`, `min_guarantee_price`, `max_guarantee_price` 등의 필드가 존재함
2. 프론트엔드 컴포넌트(CardAdCampaign, CardAdCampaignRow)에서는 rawData.slot_type을 체크하여 보장형 여부를 판단함
3. 데이터는 정상적으로 가져오고 있으나, 실제 캠페인 데이터가 모두 standard 타입으로 설정되어 있음

## 해결 방법
1. CampaignData 인터페이스에 보장형 관련 필드 추가 완료
2. 테스트용 보장형 캠페인 데이터 업데이트 스크립트 작성 (`/src/scripts/test-guarantee-campaigns.sql`)

## 테스트 방법
1. Supabase 또는 데이터베이스에서 test-guarantee-campaigns.sql 실행
2. 페이지 새로고침 후 보장형 캠페인 표시 확인

## 구현된 기능
- 보장형/일반형 배지 표시 (보라색/파란색)
- 보장형 캠페인의 경우:
  - 건당단가 → 가격범위 표시
  - 최소수량 → 보장 표시 (예: 10일, 20회)

## 데이터베이스 스키마
- `slot_type`: 'standard' 또는 'guarantee'
- `guarantee_count`: 보장 수량
- `guarantee_unit`: 보장 단위 ('일' 또는 '회')
- `min_guarantee_price`: 최소 보장 가격
- `max_guarantee_price`: 최대 보장 가격
- `is_guarantee`: 보장형 여부 (트리거로 자동 설정)
- `is_negotiable`: 가격 협상 가능 여부
- `target_rank`: 목표 순위