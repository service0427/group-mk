-- 키워드 그룹 및 키워드 테이블의 RLS 정책

-- RLS 활성화
ALTER TABLE keyword_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;

-- keyword_groups 정책
-- 사용자는 자신의 그룹만 볼 수 있음
CREATE POLICY "Users can view own keyword groups" ON keyword_groups
    FOR SELECT
    USING (auth.uid() = user_id);

-- 사용자는 자신의 그룹만 생성할 수 있음
CREATE POLICY "Users can create own keyword groups" ON keyword_groups
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 그룹만 수정할 수 있음
CREATE POLICY "Users can update own keyword groups" ON keyword_groups
    FOR UPDATE
    USING (auth.uid() = user_id);

-- 사용자는 자신의 그룹만 삭제할 수 있음
CREATE POLICY "Users can delete own keyword groups" ON keyword_groups
    FOR DELETE
    USING (auth.uid() = user_id);

-- keywords 정책
-- 사용자는 자신의 그룹에 속한 키워드만 볼 수 있음
CREATE POLICY "Users can view keywords in own groups" ON keywords
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM keyword_groups 
            WHERE keyword_groups.id = keywords.group_id 
            AND keyword_groups.user_id = auth.uid()
        )
    );

-- 사용자는 자신의 그룹에만 키워드를 추가할 수 있음
CREATE POLICY "Users can insert keywords in own groups" ON keywords
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM keyword_groups 
            WHERE keyword_groups.id = keywords.group_id 
            AND keyword_groups.user_id = auth.uid()
        )
    );

-- 사용자는 자신의 그룹에 속한 키워드만 수정할 수 있음
CREATE POLICY "Users can update keywords in own groups" ON keywords
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 
            FROM keyword_groups 
            WHERE keyword_groups.id = keywords.group_id 
            AND keyword_groups.user_id = auth.uid()
        )
    );

-- 사용자는 자신의 그룹에 속한 키워드만 삭제할 수 있음
CREATE POLICY "Users can delete keywords in own groups" ON keywords
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 
            FROM keyword_groups 
            WHERE keyword_groups.id = keywords.group_id 
            AND keyword_groups.user_id = auth.uid()
        )
    );

-- 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('keyword_groups', 'keywords')
ORDER BY tablename, policyname;