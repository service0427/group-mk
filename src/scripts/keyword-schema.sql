-- 키워드 그룹 테이블
CREATE TABLE keyword_groups (
  id SERIAL PRIMARY KEY, -- 자동증가 정수형 ID
  user_id UUID NOT NULL, -- 사용자 ID (기존 users 테이블과 연결)
  name VARCHAR(100) NOT NULL, -- 그룹 이름
  is_default BOOLEAN DEFAULT FALSE, -- 기본 그룹 여부
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 추가
CREATE INDEX idx_keyword_groups_user_id ON keyword_groups(user_id);

-- 키워드 테이블
CREATE TABLE keywords (
  id SERIAL PRIMARY KEY, -- 자동증가 정수형 ID
  group_id INTEGER NOT NULL REFERENCES keyword_groups(id) ON DELETE CASCADE,
  main_keyword VARCHAR(100) NOT NULL, -- 메인 키워드
  mid INTEGER, -- MID (숫자)
  url VARCHAR(500), -- URL
  keyword1 VARCHAR(100), -- 키워드1
  keyword2 VARCHAR(100), -- 키워드2
  keyword3 VARCHAR(100), -- 키워드3
  description TEXT, -- 선택적 설명
  is_active BOOLEAN DEFAULT TRUE, -- 활성 상태
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 추가
CREATE INDEX idx_keywords_group_id ON keywords(group_id);
CREATE INDEX idx_keywords_main_keyword ON keywords(main_keyword);
CREATE INDEX idx_keywords_mid ON keywords(mid);

-- 동일 사용자 내에서 그룹 이름 중복 방지를 위한 유니크 제약조건
CREATE UNIQUE INDEX idx_unique_group_name_per_user ON keyword_groups(user_id, name) WHERE (name IS NOT NULL);

-- 동일 그룹 내에서 메인 키워드 중복 방지를 위한 유니크 제약조건
CREATE UNIQUE INDEX idx_unique_main_keyword_per_group ON keywords(group_id, main_keyword) WHERE (main_keyword IS NOT NULL);

-- 참고: 이 스키마는 기존 users 테이블이 있다고 가정합니다.
-- 만약 users 테이블이 다른 구조를 가지고 있다면 적절히 수정해야 합니다.