-- 보장형 슬롯 협상 메시지에 파일 첨부 기능 추가
-- 2025-06-16

-- guarantee_slot_negotiations 테이블에 파일 첨부 컬럼 추가
ALTER TABLE guarantee_slot_negotiations 
ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;

-- attachments 컬럼에 대한 설명 추가
COMMENT ON COLUMN guarantee_slot_negotiations.attachments IS 'JSON 배열 형태로 첨부파일 정보 저장 [{"url": "파일URL", "name": "파일명", "size": 크기, "type": "MIME타입", "uploaded_at": "업로드시간"}]';

-- 인덱스 추가 (선택사항 - 첨부파일이 있는 메시지를 빠르게 검색하려는 경우)
CREATE INDEX IF NOT EXISTS idx_guarantee_slot_negotiations_attachments 
ON guarantee_slot_negotiations 
USING GIN (attachments) 
WHERE attachments != '[]'::jsonb;