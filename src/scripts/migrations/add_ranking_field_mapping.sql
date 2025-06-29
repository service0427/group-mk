-- Add ranking_field_mapping column to campaigns table
-- This column will store the mapping between campaign fields and ranking data fields
-- Only operators will set this mapping during campaign approval

ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS ranking_field_mapping JSONB;

-- Add comment to explain the column
COMMENT ON COLUMN public.campaigns.ranking_field_mapping IS 
'운영자가 캠페인 승인 시 설정하는 순위 데이터 필드 매핑 정보. 
Structure: {
  keyword_field: "캠페인의 키워드 필드명",
  product_id_field: "캠페인의 상품코드 필드명", 
  title_field: "캠페인의 상품명 필드명",
  link_field: "캠페인의 URL 필드명",
  rank_field: "캠페인의 순위 필드명"
}';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_campaigns_ranking_field_mapping 
ON public.campaigns USING GIN (ranking_field_mapping);