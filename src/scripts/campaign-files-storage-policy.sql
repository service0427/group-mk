-- campaign-files 버킷에 대한 RLS 정책 설정

-- 기존 정책 삭제 (있을 경우)
DROP POLICY IF EXISTS "Users can upload campaign files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view campaign files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own campaign files" ON storage.objects;

-- 1. 인증된 사용자는 자신의 폴더에 파일 업로드 가능
CREATE POLICY "Users can upload campaign files" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'campaign-files' AND
  (auth.uid())::text = (string_to_array(name, '/'))[2]
);

-- 2. 모든 사용자가 campaign-files 버킷의 파일을 볼 수 있음 (공개)
CREATE POLICY "Users can view campaign files" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'campaign-files');

-- 3. 사용자는 자신이 업로드한 파일만 삭제 가능
CREATE POLICY "Users can delete their own campaign files" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'campaign-files' AND
  (auth.uid())::text = (string_to_array(name, '/'))[2]
);

-- 4. 사용자는 자신의 파일을 업데이트 가능
CREATE POLICY "Users can update their own campaign files" ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'campaign-files' AND
  (auth.uid())::text = (string_to_array(name, '/'))[2]
);