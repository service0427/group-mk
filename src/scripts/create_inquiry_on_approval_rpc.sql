-- 보장형 슬롯 승인 시 1:1 문의 자동 생성 RPC 함수
-- 실행 방법: Supabase Dashboard > SQL Editor에서 실행

CREATE OR REPLACE FUNCTION create_inquiry_on_approval(
  p_user_id uuid,
  p_distributor_id uuid,
  p_campaign_id integer,
  p_guarantee_slot_id uuid,
  p_title text,
  p_category text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_inquiry_id uuid;
  result json;
BEGIN
  -- 1:1 문의 생성
  INSERT INTO inquiries (
    user_id,
    distributor_id,
    campaign_id,
    guarantee_slot_id,
    title,
    category,
    priority,
    status,
    created_at
  ) VALUES (
    p_user_id,
    p_distributor_id,
    p_campaign_id,
    p_guarantee_slot_id,
    p_title,
    p_category,
    'normal',
    'open',
    now()
  ) RETURNING id INTO new_inquiry_id;

  result := json_build_object(
    'id', new_inquiry_id,
    'success', true,
    'message', '1:1 문의가 생성되었습니다.'
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', '1:1 문의 생성 중 오류가 발생했습니다.'
    );
END;
$$;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION create_inquiry_on_approval(uuid, uuid, integer, uuid, text, text) TO authenticated;