import { createClient } from '@supabase/supabase-js';

// Production DB 설정 (순위 정보 전용)
const PRODUCTION_SUPABASE_URL = 'https://iiyzaaboinfezycblwnb.supabase.co';
const PRODUCTION_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpeXphYWJvaW5mZXp5Y2Jsd25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwODc2NDgsImV4cCI6MjA1ODY2MzY0OH0.HS0M34NmudjhhmRqbChqwz4bKMvbfIi6tLiwGAUxg9g';

// 순위 전용 Supabase 클라이언트
export const supabaseRanking = createClient(PRODUCTION_SUPABASE_URL, PRODUCTION_SUPABASE_ANON_KEY);