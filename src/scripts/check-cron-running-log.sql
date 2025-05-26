  📊 Supabase Cron 모니터링 방법

  1. cron 관련 시스템 테이블들

  -- 현재 등록된 모든 크론 작업 확인
  SELECT * FROM cron.job;

  -- 크론 작업 실행 기록 확인 (최근 실행 내역)
  SELECT * FROM cron.job_run_details
  ORDER BY start_time DESC
  LIMIT 100;

  -- 특정 작업의 실행 기록만 보기
  SELECT
      jobid,
      job_pid,
      database,
      username,
      command,
      status,
      return_message,
      start_time,
      end_time,
      end_time - start_time as duration
  FROM cron.job_run_details
  WHERE command LIKE '%auto_complete_overdue_slots%'
  ORDER BY start_time DESC;

  -- 실패한 작업만 확인
  SELECT * FROM cron.job_run_details
  WHERE status = 'failed'
  ORDER BY start_time DESC;

  2. 함수에 로그 테이블 추가하기

  더 상세한 로그를 원한다면, 전용 로그 테이블을 만들어서 함수 내에서 기록하는 방법도 좋아:

  -- 로그 테이블 생성
  CREATE TABLE public.scheduler_logs (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      function_name text NOT NULL,
      executed_at timestamp with time zone DEFAULT now(),
      parameters jsonb,
      result jsonb,
      duration interval,
      status text CHECK (status IN ('success', 'failed', 'partial')),
      error_message text
  );

  -- 인덱스 추가
  CREATE INDEX idx_scheduler_logs_executed_at ON scheduler_logs(executed_at DESC);
  CREATE INDEX idx_scheduler_logs_function_name ON scheduler_logs(function_name);

  그리고 함수를 수정해서 로그를 남기도록 할 수 있어:

  -- 함수 시작 부분에 추가
  DECLARE
      v_start_time timestamp with time zone := clock_timestamp();
      v_log_id uuid;
  BEGIN
      -- 로그 시작
      INSERT INTO scheduler_logs (function_name, parameters, status)
      VALUES ('auto_complete_overdue_slots',
              jsonb_build_object('days_after_completion', days_after_completion),
              'running')
      RETURNING id INTO v_log_id;

      -- ... 기존 로직 ...

      -- 성공 시 로그 업데이트
      UPDATE scheduler_logs
      SET result = v_result,
          duration = clock_timestamp() - v_start_time,
          status = 'success'
      WHERE id = v_log_id;

  EXCEPTION WHEN OTHERS THEN
      -- 실패 시 로그 업데이트
      UPDATE scheduler_logs
      SET error_message = SQLERRM,
          duration = clock_timestamp() - v_start_time,
          status = 'failed'
      WHERE id = v_log_id;
      RAISE;
  END;

  3. Supabase Dashboard에서 확인

  1. SQL Editor에서 위 쿼리들 실행
  2. Table Editor에서 cron.job_run_details 테이블 직접 확인
  3. Logs 섹션에서 함수 실행 로그 확인 가능

  4. 알림 설정

  실패 시 알림을 받고 싶다면:

  -- 크론 실행 실패 시 관리자에게 알림
  CREATE OR REPLACE FUNCTION notify_cron_failure()
  RETURNS trigger AS $$
  BEGIN
      IF NEW.status = 'failed' THEN
          INSERT INTO notifications (
              user_id,
              type,
              title,
              message,
              priority
          )
          SELECT
              id,
              'system',
              '크론 작업 실패',
              format('크론 작업 실패: %s - %s', NEW.command, NEW.return_message),
              'high'
          FROM users
          WHERE role IN ('operator', 'developer');
      END IF;
      RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER trigger_cron_failure_notification
  AFTER INSERT ON cron.job_run_details
  FOR EACH ROW
  EXECUTE FUNCTION notify_cron_failure();

  5. 모니터링 대시보드 쿼리

  -- 크론 작업 상태 요약
  WITH cron_stats AS (
      SELECT
          command,
          COUNT(*) as total_runs,
          COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as success_count,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as fail_count,
          AVG(EXTRACT(EPOCH FROM (end_time - start_time))) as avg_duration_seconds,
          MAX(start_time) as last_run
      FROM cron.job_run_details
      WHERE start_time > NOW() - INTERVAL '7 days'
      GROUP BY command
  )
  SELECT
      command,
      total_runs,
      success_count,
      fail_count,
      round(success_count::numeric / total_runs * 100, 2) as success_rate,
      to_char(avg_duration_seconds * interval '1 second', 'HH24:MI:SS') as avg_duration,
      last_run
  FROM cron_stats
  ORDER BY last_run DESC;