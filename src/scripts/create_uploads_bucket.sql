-- 새로운 통합 업로드 버킷 생성 스크립트
-- Supabase SQL Editor에서 실행

-- 1. uploads 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  true,
  52428800, -- 50MB in bytes
  ARRAY[
    'image/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]
);

-- 2. RLS (Row Level Security) 정책 생성
-- 모든 인증된 사용자가 업로드 가능
CREATE POLICY "Authenticated users can upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'uploads' 
  AND auth.role() = 'authenticated'
);

-- 모든 사용자가 파일 조회 가능 (공개)
CREATE POLICY "Anyone can view files" ON storage.objects
FOR SELECT USING (bucket_id = 'uploads');

-- 파일 소유자만 삭제 가능
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 파일 소유자만 업데이트 가능
CREATE POLICY "Users can update own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

COMMENT ON TABLE storage.buckets IS 'uploads 버킷: 협상 파일, 프로필 이미지, 문서 등 통합 관리';