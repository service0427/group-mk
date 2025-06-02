-- ========================================
-- 내키워드 서비스 타입 매핑 문제 해결 스크립트
-- ========================================

-- 1. 현재 keyword_groups의 campaign_type 데이터 확인
SELECT DISTINCT campaign_type, COUNT(*) as count 
FROM keyword_groups 
GROUP BY campaign_type 
ORDER BY campaign_type;

-- 2. 현재 service_keyword_field_mappings 데이터 확인
SELECT service_type, 
       jsonb_pretty(field_mapping) as field_mapping,
       jsonb_pretty(ui_config) as ui_config
FROM service_keyword_field_mappings;

-- 3. service_keyword_field_mappings 테이블에 서비스별 매핑 데이터 추가
-- 네이버 자동완성
INSERT INTO service_keyword_field_mappings (service_type, field_mapping, ui_config) VALUES
('NAVER_AUTO', 
'{
    "main_keyword": {
        "label": "메인 키워드", 
        "placeholder": "자동완성 키워드를 입력하세요",
        "order": 1,
        "required": true
    },
    "keyword1": {
        "label": "연관 키워드 1", 
        "placeholder": "연관 검색어 1",
        "order": 2
    },
    "keyword2": {
        "label": "연관 키워드 2", 
        "placeholder": "연관 검색어 2",
        "order": 3
    },
    "keyword3": {
        "label": "연관 키워드 3", 
        "placeholder": "연관 검색어 3",
        "order": 4
    },
    "description": {
        "label": "설명", 
        "placeholder": "키워드에 대한 설명",
        "order": 5
    }
}'::jsonb,
'{
    "listHeaders": ["메인 키워드", "연관1", "연관2", "연관3", "설명"],
    "listFieldOrder": ["main_keyword", "keyword1", "keyword2", "keyword3", "description"],
    "hiddenFields": ["mid", "url"],
    "requiredFields": ["main_keyword"],
    "description": "네이버 자동완성 키워드 관리"
}'::jsonb)
ON CONFLICT (service_type) DO UPDATE SET
    field_mapping = EXCLUDED.field_mapping,
    ui_config = EXCLUDED.ui_config,
    updated_at = now();

-- 네이버 쇼핑 트래픽
INSERT INTO service_keyword_field_mappings (service_type, field_mapping, ui_config) VALUES
('NAVER_SHOPPING_TRAFFIC',
'{
    "main_keyword": {
        "label": "상품명", 
        "placeholder": "상품명을 입력하세요",
        "order": 1,
        "required": true
    },
    "mid": {
        "label": "상품 ID (MID)", 
        "placeholder": "네이버 상품 ID",
        "order": 2,
        "required": true,
        "tooltip": "네이버 쇼핑 상품 고유 ID"
    },
    "url": {
        "label": "상품 URL", 
        "placeholder": "https://smartstore.naver.com/...",
        "order": 3,
        "required": true
    },
    "keyword1": {
        "label": "검색 키워드 1", 
        "placeholder": "구매자가 검색할 키워드",
        "order": 4
    },
    "keyword2": {
        "label": "검색 키워드 2", 
        "placeholder": "추가 검색 키워드",
        "order": 5
    },
    "description": {
        "label": "메모", 
        "placeholder": "상품에 대한 메모",
        "order": 6
    }
}'::jsonb,
'{
    "listHeaders": ["상품명", "MID", "URL", "검색어1", "검색어2"],
    "listFieldOrder": ["main_keyword", "mid", "url", "keyword1", "keyword2"],
    "hiddenFields": ["keyword3"],
    "requiredFields": ["main_keyword", "mid", "url"],
    "description": "네이버 쇼핑 트래픽 상품 관리"
}'::jsonb)
ON CONFLICT (service_type) DO UPDATE SET
    field_mapping = EXCLUDED.field_mapping,
    ui_config = EXCLUDED.ui_config,
    updated_at = now();

-- 네이버 쇼핑 가구매
INSERT INTO service_keyword_field_mappings (service_type, field_mapping, ui_config) VALUES
('NAVER_SHOPPING_FAKESALE',
'{
    "main_keyword": {
        "label": "상품명", 
        "placeholder": "상품명을 입력하세요",
        "order": 1,
        "required": true
    },
    "mid": {
        "label": "상품 ID (MID)", 
        "placeholder": "네이버 상품 ID",
        "order": 2,
        "required": true
    },
    "url": {
        "label": "상품 URL", 
        "placeholder": "https://smartstore.naver.com/...",
        "order": 3,
        "required": true
    },
    "keyword1": {
        "label": "옵션 1", 
        "placeholder": "상품 옵션 (색상, 사이즈 등)",
        "order": 4
    },
    "keyword2": {
        "label": "옵션 2", 
        "placeholder": "추가 옵션",
        "order": 5
    },
    "description": {
        "label": "구매 요청사항", 
        "placeholder": "특별 요청사항",
        "order": 6
    }
}'::jsonb,
'{
    "listHeaders": ["상품명", "MID", "URL", "옵션1", "옵션2"],
    "listFieldOrder": ["main_keyword", "mid", "url", "keyword1", "keyword2"],
    "hiddenFields": ["keyword3"],
    "requiredFields": ["main_keyword", "mid", "url"],
    "description": "네이버 쇼핑 가구매 상품 관리"
}'::jsonb)
ON CONFLICT (service_type) DO UPDATE SET
    field_mapping = EXCLUDED.field_mapping,
    ui_config = EXCLUDED.ui_config,
    updated_at = now();

-- 네이버 쇼핑 순위 확인
INSERT INTO service_keyword_field_mappings (service_type, field_mapping, ui_config) VALUES
('NaverShoppingRank',
'{
    "main_keyword": {
        "label": "상품명", 
        "placeholder": "순위 확인할 상품명",
        "order": 1,
        "required": true
    },
    "mid": {
        "label": "상품 ID (MID)", 
        "placeholder": "네이버 상품 ID",
        "order": 2,
        "required": true
    },
    "keyword1": {
        "label": "검색 키워드", 
        "placeholder": "순위 확인할 검색어",
        "order": 3,
        "required": true
    },
    "description": {
        "label": "메모", 
        "placeholder": "순위 확인 메모",
        "order": 4
    }
}'::jsonb,
'{
    "listHeaders": ["상품명", "MID", "검색 키워드", "메모"],
    "listFieldOrder": ["main_keyword", "mid", "keyword1", "description"],
    "hiddenFields": ["url", "keyword2", "keyword3"],
    "requiredFields": ["main_keyword", "mid", "keyword1"],
    "description": "네이버 쇼핑 순위 확인"
}'::jsonb)
ON CONFLICT (service_type) DO UPDATE SET
    field_mapping = EXCLUDED.field_mapping,
    ui_config = EXCLUDED.ui_config,
    updated_at = now();

-- 네이버 플레이스 트래픽
INSERT INTO service_keyword_field_mappings (service_type, field_mapping, ui_config) VALUES
('NAVER_PLACE_TRAFFIC',
'{
    "main_keyword": {
        "label": "업체명", 
        "placeholder": "업체명을 입력하세요",
        "order": 1,
        "required": true
    },
    "url": {
        "label": "플레이스 URL", 
        "placeholder": "https://map.naver.com/p/...",
        "order": 2,
        "required": true
    },
    "keyword1": {
        "label": "검색 키워드 1", 
        "placeholder": "지역 + 업종 (예: 강남 맛집)",
        "order": 3
    },
    "keyword2": {
        "label": "검색 키워드 2", 
        "placeholder": "추가 검색어",
        "order": 4
    },
    "description": {
        "label": "업체 설명", 
        "placeholder": "업체 특징이나 메모",
        "order": 5
    }
}'::jsonb,
'{
    "listHeaders": ["업체명", "URL", "검색어1", "검색어2"],
    "listFieldOrder": ["main_keyword", "url", "keyword1", "keyword2"],
    "hiddenFields": ["mid", "keyword3"],
    "requiredFields": ["main_keyword", "url"],
    "description": "네이버 플레이스 트래픽 관리"
}'::jsonb)
ON CONFLICT (service_type) DO UPDATE SET
    field_mapping = EXCLUDED.field_mapping,
    ui_config = EXCLUDED.ui_config,
    updated_at = now();

-- 네이버 플레이스 저장하기
INSERT INTO service_keyword_field_mappings (service_type, field_mapping, ui_config) VALUES
('NAVER_PLACE_SAVE',
'{
    "main_keyword": {
        "label": "업체명", 
        "placeholder": "저장할 업체명",
        "order": 1,
        "required": true
    },
    "url": {
        "label": "플레이스 URL", 
        "placeholder": "https://map.naver.com/p/...",
        "order": 2,
        "required": true
    },
    "description": {
        "label": "저장 목적", 
        "placeholder": "저장하는 이유나 메모",
        "order": 3
    }
}'::jsonb,
'{
    "listHeaders": ["업체명", "URL", "메모"],
    "listFieldOrder": ["main_keyword", "url", "description"],
    "hiddenFields": ["mid", "keyword1", "keyword2", "keyword3"],
    "requiredFields": ["main_keyword", "url"],
    "description": "네이버 플레이스 저장하기"
}'::jsonb)
ON CONFLICT (service_type) DO UPDATE SET
    field_mapping = EXCLUDED.field_mapping,
    ui_config = EXCLUDED.ui_config,
    updated_at = now();

-- 네이버 플레이스 블로그 공유
INSERT INTO service_keyword_field_mappings (service_type, field_mapping, ui_config) VALUES
('NAVER_PLACE_SHARE',
'{
    "main_keyword": {
        "label": "업체명", 
        "placeholder": "공유할 업체명",
        "order": 1,
        "required": true
    },
    "url": {
        "label": "플레이스 URL", 
        "placeholder": "https://map.naver.com/p/...",
        "order": 2,
        "required": true
    },
    "keyword1": {
        "label": "블로그 제목 키워드", 
        "placeholder": "블로그 포스팅 제목에 들어갈 키워드",
        "order": 3
    },
    "description": {
        "label": "공유 내용", 
        "placeholder": "블로그에 작성할 내용 요약",
        "order": 4
    }
}'::jsonb,
'{
    "listHeaders": ["업체명", "URL", "제목 키워드", "내용"],
    "listFieldOrder": ["main_keyword", "url", "keyword1", "description"],
    "hiddenFields": ["mid", "keyword2", "keyword3"],
    "requiredFields": ["main_keyword", "url"],
    "description": "네이버 플레이스 블로그 공유"
}'::jsonb)
ON CONFLICT (service_type) DO UPDATE SET
    field_mapping = EXCLUDED.field_mapping,
    ui_config = EXCLUDED.ui_config,
    updated_at = now();

-- 네이버 플레이스 순위 확인
INSERT INTO service_keyword_field_mappings (service_type, field_mapping, ui_config) VALUES
('NAVER_PLACE_RANK',
'{
    "main_keyword": {
        "label": "업체명", 
        "placeholder": "순위 확인할 업체명",
        "order": 1,
        "required": true
    },
    "keyword1": {
        "label": "검색 키워드", 
        "placeholder": "순위 확인할 검색어 (예: 강남 카페)",
        "order": 2,
        "required": true
    },
    "description": {
        "label": "메모", 
        "placeholder": "순위 확인 관련 메모",
        "order": 3
    }
}'::jsonb,
'{
    "listHeaders": ["업체명", "검색 키워드", "메모"],
    "listFieldOrder": ["main_keyword", "keyword1", "description"],
    "hiddenFields": ["mid", "url", "keyword2", "keyword3"],
    "requiredFields": ["main_keyword", "keyword1"],
    "description": "네이버 플레이스 순위 확인"
}'::jsonb)
ON CONFLICT (service_type) DO UPDATE SET
    field_mapping = EXCLUDED.field_mapping,
    ui_config = EXCLUDED.ui_config,
    updated_at = now();

-- 쿠팡 트래픽
INSERT INTO service_keyword_field_mappings (service_type, field_mapping, ui_config) VALUES
('COUPANG_TRAFFIC',
'{
    "main_keyword": {
        "label": "상품명", 
        "placeholder": "쿠팡 상품명",
        "order": 1,
        "required": true
    },
    "url": {
        "label": "상품 URL", 
        "placeholder": "https://www.coupang.com/...",
        "order": 2,
        "required": true
    },
    "keyword1": {
        "label": "검색 키워드 1", 
        "placeholder": "구매자가 검색할 키워드",
        "order": 3
    },
    "keyword2": {
        "label": "검색 키워드 2", 
        "placeholder": "추가 검색어",
        "order": 4
    },
    "description": {
        "label": "상품 메모", 
        "placeholder": "상품 관련 메모",
        "order": 5
    }
}'::jsonb,
'{
    "listHeaders": ["상품명", "URL", "검색어1", "검색어2"],
    "listFieldOrder": ["main_keyword", "url", "keyword1", "keyword2"],
    "hiddenFields": ["mid", "keyword3"],
    "requiredFields": ["main_keyword", "url"],
    "description": "쿠팡 트래픽 상품 관리"
}'::jsonb)
ON CONFLICT (service_type) DO UPDATE SET
    field_mapping = EXCLUDED.field_mapping,
    ui_config = EXCLUDED.ui_config,
    updated_at = now();

-- 쿠팡 가구매
INSERT INTO service_keyword_field_mappings (service_type, field_mapping, ui_config) VALUES
('COUPANG_FAKESALE',
'{
    "main_keyword": {
        "label": "상품명", 
        "placeholder": "구매할 상품명",
        "order": 1,
        "required": true
    },
    "url": {
        "label": "상품 URL", 
        "placeholder": "https://www.coupang.com/...",
        "order": 2,
        "required": true
    },
    "keyword1": {
        "label": "옵션 1", 
        "placeholder": "상품 옵션 (색상, 사이즈 등)",
        "order": 3
    },
    "keyword2": {
        "label": "옵션 2", 
        "placeholder": "추가 옵션",
        "order": 4
    },
    "description": {
        "label": "구매 요청사항", 
        "placeholder": "특별 요청사항",
        "order": 5
    }
}'::jsonb,
'{
    "listHeaders": ["상품명", "URL", "옵션1", "옵션2"],
    "listFieldOrder": ["main_keyword", "url", "keyword1", "keyword2"],
    "hiddenFields": ["mid", "keyword3"],
    "requiredFields": ["main_keyword", "url"],
    "description": "쿠팡 가구매 상품 관리"
}'::jsonb)
ON CONFLICT (service_type) DO UPDATE SET
    field_mapping = EXCLUDED.field_mapping,
    ui_config = EXCLUDED.ui_config,
    updated_at = now();

-- 4. keyword_groups의 campaign_type 한글 데이터를 영문으로 변환
UPDATE keyword_groups 
SET campaign_type = CASE campaign_type
    WHEN 'N자동완성' THEN 'NAVER_AUTO'
    WHEN 'NS트래픽' THEN 'NAVER_SHOPPING_TRAFFIC'
    WHEN 'NS가구매' THEN 'NAVER_SHOPPING_FAKESALE'
    WHEN 'NS순위확인' THEN 'NAVER_SHOPPING_RANK'
    WHEN 'NP트래픽' THEN 'NAVER_PLACE_TRAFFIC'
    WHEN 'NP저장하기' THEN 'NAVER_PLACE_SAVE'
    WHEN 'NP블로그공유' THEN 'NAVER_PLACE_SHARE'
    WHEN 'NP순위확인' THEN 'NAVER_PLACE_RANK'
    WHEN 'CP트래픽' THEN 'COUPANG_TRAFFIC'
    WHEN 'CP가구매' THEN 'COUPANG_FAKESALE'
    ELSE campaign_type
END
WHERE campaign_type IN (
    'N자동완성', 'NS트래픽', 'NS가구매', 'NS순위확인',
    'NP트래픽', 'NP저장하기', 'NP블로그공유', 'NP순위확인',
    'CP트래픽', 'CP가구매'
);

-- 5. 변환 후 데이터 확인
SELECT 
    kg.campaign_type, 
    COUNT(*) as group_count,
    CASE 
        WHEN sfm.service_type IS NOT NULL THEN '✅ 매핑 있음'
        ELSE '❌ 매핑 없음'
    END as mapping_status
FROM keyword_groups kg
LEFT JOIN service_keyword_field_mappings sfm ON kg.campaign_type = sfm.service_type
GROUP BY kg.campaign_type, sfm.service_type
ORDER BY kg.campaign_type;

-- 6. 매핑이 제대로 되었는지 샘플 확인
SELECT 
    service_type,
    field_mapping->'main_keyword'->>'label' as main_keyword_label,
    ui_config->'requiredFields' as required_fields,
    ui_config->'hiddenFields' as hidden_fields
FROM service_keyword_field_mappings
ORDER BY service_type;