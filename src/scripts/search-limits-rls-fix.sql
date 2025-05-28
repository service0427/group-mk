-- Enable RLS for search_limits_config table
ALTER TABLE search_limits_config ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view search limits config
CREATE POLICY "Anyone can view search limits config" ON search_limits_config
    FOR SELECT USING (true);

-- Only admins can modify search limits config
CREATE POLICY "Only admins can insert search limits config" ON search_limits_config
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('operator', 'developer')
        )
    );

CREATE POLICY "Only admins can update search limits config" ON search_limits_config
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('operator', 'developer')
        )
    );

CREATE POLICY "Only admins can delete search limits config" ON search_limits_config
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('operator', 'developer')
        )
    );