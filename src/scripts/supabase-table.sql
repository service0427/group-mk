create table public.users (
  id uuid not null,
  email text not null,
  full_name text null,
  role text not null default 'advertiser'::text,
  password_hash text not null default ''::text,
  status text not null default 'active'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  last_login_at timestamp with time zone null,
  referral_code text null,
  bank_info jsonb null,
  business jsonb null,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_referral_code_key unique (referral_code),
  constraint users_id_fkey foreign KEY (id) references auth.users (id),
  constraint users_role_check check (
    (
      role = any (
        array[
          'advertiser'::text,
          'agency'::text,
          'distributor'::text,
          'operator'::text,
          'developer'::text,
          'beginner'::text
        ]
      )
    )
  ),
  constraint users_status_check check (
    (
      status = any (
        array[
          'active'::text,
          'inactive'::text,
          'suspended'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create table public.user_cash_history (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  transaction_type text not null,
  amount integer not null,
  description text null,
  transaction_at timestamp with time zone not null default now(),
  reference_id uuid null,
  ip_address inet null,
  user_agent text null,
  expired_dt timestamp with time zone null,
  mat_id uuid null,
  balance_type text null,
  constraint user_cash_history_pkey primary key (id),
  constraint fk_cash_history_user foreign KEY (user_id) references users (id) on delete RESTRICT,
  constraint check_valid_transaction_type check (
    (
      transaction_type = any (
        array[
          'charge'::text,
          'purchase'::text,
          'refund'::text,
          'withdrawal'::text,
          'referral_bonus'::text,
          'expire'::text,
          'free'::text,
          'work'::text,
          'buy'::text
        ]
      )
    )
  ),
  constraint user_cash_history_balance_type_check check (
    (
      (balance_type is null)
      or (
        (transaction_type <> 'withdrawal'::text)
        and (
          balance_type = any (array['free'::text, 'paid'::text, 'mixed'::text])
        )
      )
      or (transaction_type = 'withdrawal'::text)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_user_cash_history_balance_type on public.user_cash_history using btree (balance_type) TABLESPACE pg_default;

create index IF not exists idx_user_cash_history_transaction_at on public.user_cash_history using btree (transaction_at) TABLESPACE pg_default;

create index IF not exists idx_user_cash_history_transaction_type on public.user_cash_history using btree (transaction_type) TABLESPACE pg_default;

create index IF not exists idx_user_cash_history_user_balance_type on public.user_cash_history using btree (user_id, balance_type) TABLESPACE pg_default;

create index IF not exists idx_user_cash_history_user_id on public.user_cash_history using btree (user_id) TABLESPACE pg_default;

create table public.user_balances (
  user_id uuid not null,
  paid_balance numeric not null default 0,
  free_balance numeric not null default 0,
  total_balance numeric not null default 0,
  updated_at timestamp with time zone not null default now(),
  constraint user_balances_pkey primary key (user_id),
  constraint user_balances_user_id_fkey foreign KEY (user_id) references users (id)
) TABLESPACE pg_default;

create table public.slots (
  id uuid not null default gen_random_uuid (),
  mat_id uuid not null,
  product_id integer not null,
  user_id uuid not null,
  status text not null default 'draft'::text,
  submitted_at timestamp with time zone null default now(),
  processed_at timestamp with time zone null,
  rejection_reason text null,
  input_data jsonb null,
  is_auto_refund_candidate boolean null default false,
  is_auto_continue boolean null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  user_reason text null,
  mat_reason text null,
  keyword_id bigint null,
  quantity smallint null,
  start_date date null,
  end_date date null,
  user_slot_number integer null,
  constraint slots_pkey primary key (id),
  constraint unique_mat_slot_number unique (mat_id, user_slot_number),
  constraint slots_product_id_fkey foreign KEY (product_id) references campaigns (id) on delete CASCADE,
  constraint slots_user_id_fkey foreign KEY (user_id) references users (id)
) TABLESPACE pg_default;

create index IF not exists idx_slots_product_id on public.slots using btree (product_id) TABLESPACE pg_default;

create index IF not exists idx_slots_status on public.slots using btree (status) TABLESPACE pg_default;

create index IF not exists idx_slots_user_id on public.slots using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_slots_mat_slot_number on public.slots using btree (mat_id, user_slot_number) TABLESPACE pg_default;

create trigger set_user_slot_number BEFORE INSERT on slots for EACH row when (new.user_slot_number is null)
execute FUNCTION generate_user_slot_number ();

create table public.slot_works_info (
  id uuid not null default extensions.uuid_generate_v4 (),
  slot_id uuid not null,
  date date not null,
  work_cnt integer not null,
  notes text null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  created_by uuid null,
  constraint slot_works_info_pkey primary key (id),
  constraint slot_works_info_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete set null,
  constraint slot_works_info_slot_id_fkey foreign KEY (slot_id) references slots (id) on delete CASCADE,
  constraint slot_works_info_work_cnt_check check ((work_cnt > 0))
) TABLESPACE pg_default;

create index IF not exists idx_slot_works_info_slot_id on public.slot_works_info using btree (slot_id) TABLESPACE pg_default;

create index IF not exists idx_slot_works_info_date on public.slot_works_info using btree (date) TABLESPACE pg_default;

create index IF not exists idx_slot_works_info_created_by on public.slot_works_info using btree (created_by) TABLESPACE pg_default;

create unique INDEX IF not exists idx_slot_works_info_unique_slot_date on public.slot_works_info using btree (slot_id, date) TABLESPACE pg_default;

create table public.slot_pending_balances (
  id uuid not null default gen_random_uuid (),
  slot_id uuid not null,
  user_id uuid not null,
  product_id integer not null,
  amount numeric not null,
  status text not null,
  processor_id uuid null,
  notes text null,
  created_at timestamp with time zone not null default now(),
  processed_at timestamp with time zone null,
  constraint slot_pending_balances_pkey primary key (id),
  constraint slot_pending_balances_slot_id_key unique (slot_id),
  constraint slot_pending_balances_processor_id_fkey foreign KEY (processor_id) references auth.users (id),
  constraint slot_pending_balances_product_id_fkey foreign KEY (product_id) references campaigns (id) on delete CASCADE,
  constraint slot_pending_balances_slot_id_fkey foreign KEY (slot_id) references slots (id),
  constraint slot_pending_balances_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists idx_slot_pending_balances_created_at on public.slot_pending_balances using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_slot_pending_balances_product_id on public.slot_pending_balances using btree (product_id) TABLESPACE pg_default;

create index IF not exists idx_slot_pending_balances_status on public.slot_pending_balances using btree (status) TABLESPACE pg_default;

create index IF not exists idx_slot_pending_balances_user_id on public.slot_pending_balances using btree (user_id) TABLESPACE pg_default;


create table public.slot_history_logs (
  id uuid not null default gen_random_uuid (),
  slot_id uuid not null,
  user_id uuid not null,
  old_status text null,
  new_status text not null,
  action text not null,
  details jsonb null,
  created_at timestamp with time zone not null default now(),
  constraint slot_history_logs_pkey primary key (id),
  constraint slot_history_logs_slot_id_fkey foreign KEY (slot_id) references slots (id),
  constraint slot_history_logs_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists idx_slot_history_logs_action on public.slot_history_logs using btree (action) TABLESPACE pg_default;

create index IF not exists idx_slot_history_logs_created_at on public.slot_history_logs using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_slot_history_logs_slot_id on public.slot_history_logs using btree (slot_id) TABLESPACE pg_default;

create index IF not exists idx_slot_history_logs_user_id on public.slot_history_logs using btree (user_id) TABLESPACE pg_default;


create table public.cash_charge_requests (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  amount numeric not null,
  deposit_at timestamp with time zone null,
  free_cash_percentage numeric null default 0,
  status text not null default 'pending'::text,
  requested_at timestamp with time zone not null default now(),
  processed_at timestamp with time zone null,
  processor_id uuid null,
  rejection_reason text null,
  account_holder character varying(100) null,
  constraint cash_charge_requests_pkey primary key (id),
  constraint cash_charge_requests_processor_id_fkey foreign KEY (processor_id) references users (id),
  constraint cash_charge_requests_user_id_fkey foreign KEY (user_id) references users (id)
) TABLESPACE pg_default;

create index IF not exists idx_cash_charge_requests_status on public.cash_charge_requests using btree (status) TABLESPACE pg_default;

create index IF not exists idx_cash_charge_requests_user_id on public.cash_charge_requests using btree (user_id) TABLESPACE pg_default;

create table public.balance_audit_log (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  change_type text not null,
  old_paid_balance numeric not null default 0,
  new_paid_balance numeric not null default 0,
  old_free_balance numeric not null default 0,
  new_free_balance numeric not null default 0,
  change_amount numeric not null,
  details jsonb null,
  created_at timestamp with time zone not null default now(),
  constraint balance_audit_log_pkey primary key (id),
  constraint balance_audit_log_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists idx_balance_audit_log_change_type on public.balance_audit_log using btree (change_type) TABLESPACE pg_default;

create index IF not exists idx_balance_audit_log_created_at on public.balance_audit_log using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_balance_audit_log_user_id on public.balance_audit_log using btree (user_id) TABLESPACE pg_default;


create table public.notifications (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  type text not null,
  title text not null,
  message text not null,
  link text null,
  icon text null,
  priority text not null,
  status text not null default 'unread'::text,
  created_at timestamp with time zone null default now(),
  expires_at timestamp with time zone null,
  action_taken boolean null default false,
  constraint notifications_pkey primary key (id),
  constraint idx_notifications_user_status_created unique (user_id, status, created_at),
  constraint notifications_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint notifications_priority_check check (
    (
      priority = any (array['low'::text, 'medium'::text, 'high'::text])
    )
  ),
  constraint notifications_status_check check (
    (
      status = any (
        array['unread'::text, 'read'::text, 'archived'::text]
      )
    )
  ),
  constraint notifications_type_check check (
    (
      type = any (
        array[
          'system'::text,
          'transaction'::text,
          'service'::text,
          'slot'::text,
          'marketing'::text,
          'slot_created'::text,
          'slot_approved'::text,
          'slot_success'::text,
          'slot_refund'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists notifications_user_id_idx on public.notifications using btree (user_id) TABLESPACE pg_default;

create index IF not exists notifications_user_id_status_idx on public.notifications using btree (user_id, status) TABLESPACE pg_default;

create index IF not exists notifications_created_at_idx on public.notifications using btree (created_at) TABLESPACE pg_default;

create table public.keywords (
  id serial not null,
  group_id integer not null,
  main_keyword character varying(100) not null,
  mid integer null,
  url character varying(500) null,
  keyword1 character varying(100) null,
  keyword2 character varying(100) null,
  keyword3 character varying(100) null,
  description text null,
  is_active boolean null default true,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint keywords_pkey primary key (id),
  constraint keywords_group_id_fkey foreign KEY (group_id) references keyword_groups (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_keywords_group_id on public.keywords using btree (group_id) TABLESPACE pg_default;

create index IF not exists idx_keywords_main_keyword on public.keywords using btree (main_keyword) TABLESPACE pg_default;

create index IF not exists idx_keywords_mid on public.keywords using btree (mid) TABLESPACE pg_default;

create unique INDEX IF not exists idx_unique_main_keyword_per_group on public.keywords using btree (group_id, main_keyword) TABLESPACE pg_default
where
  (main_keyword is not null);

  create table public.keyword_groups (
  id serial not null,
  user_id uuid not null,
  name character varying(100) not null,
  is_default boolean null default false,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  campaign_name character varying(50) null,
  campaign_type character varying(50) null,
  constraint keyword_groups_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_keyword_groups_user_id on public.keyword_groups using btree (user_id) TABLESPACE pg_default;

create unique INDEX IF not exists idx_unique_group_name_per_user on public.keyword_groups using btree (user_id, name) TABLESPACE pg_default
where
  (name is not null);

create index IF not exists idx_keyword_groups_campaign on public.keyword_groups using btree (campaign_name, campaign_type) TABLESPACE pg_default;

create table public.keyword_groups (
  id serial not null,
  user_id uuid not null,
  name character varying(100) not null,
  is_default boolean null default false,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  campaign_name character varying(50) null,
  campaign_type character varying(50) not null,
  constraint keyword_groups_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_keyword_groups_user_id on public.keyword_groups using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_keyword_groups_campaign on public.keyword_groups using btree (campaign_name, campaign_type) TABLESPACE pg_default;

create unique INDEX IF not exists idx_unique_group_name_per_user on public.keyword_groups using btree (user_id, name, campaign_type) TABLESPACE pg_default;


create table public.service_keyword_field_mappings (
  id uuid not null default gen_random_uuid (),
  service_type text not null,
  field_mapping jsonb not null,
  ui_config jsonb not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint service_keyword_field_mappings_pkey primary key (id),
  constraint service_keyword_field_mappings_service_type_key unique (service_type)
) TABLESPACE pg_default;


create table public.user_activities (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  action text not null,
  occurred_at timestamp with time zone not null default now(),
  ip_address inet null,
  details jsonb null,
  constraint user_activities_pkey primary key (id),
  constraint user_activities_user_id_fkey foreign KEY (user_id) references users (id),
  constraint user_activities_action_check check (
    (
      action = any (
        array[
          'signup'::text,
          'login_success'::text,
          'login_failure'::text,
          'logout'::text,
          'deposit'::text,
          'withdrawal'::text,
          'profile_updated'::text,
          'password_changed'::text,
          'email_verification'::text,
          'password_reset_requested'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create table public.system_logs (
  id uuid not null default gen_random_uuid (),
  log_type text not null,
  message text not null,
  details jsonb null,
  created_at timestamp with time zone not null default now(),
  constraint system_logs_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_system_logs_created_at on public.system_logs using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_system_logs_log_type on public.system_logs using btree (log_type) TABLESPACE pg_default;

ccreate table public.campaigns (
  id serial not null,
  group_id character varying(30) null,
  service_type character varying(30) not null,
  campaign_name character varying(50) not null,
  status character varying(20) not null default '''waiting_approval''::character varying'::character varying,
  description text not null,
  detailed_description text null,
  logo character varying(100) not null,
  efficiency numeric(5, 2) null,
  min_quantity integer not null,
  unit_price numeric(10, 2) not null,
  additional_logic integer null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  deadline character varying(5) null,
  mat_id uuid null,
  add_info jsonb null,
  rejected_reason text null,
  slot_type character varying(20) null default 'standard'::character varying,
  guarantee_days integer null,
  is_guarantee boolean null default false,
  guarantee_count integer null,
  target_rank integer null,
  is_negotiable boolean null default false,
  min_guarantee_price numeric(10, 2) null,
  max_guarantee_price numeric(10, 2) null,
  guarantee_unit character varying(10) null default '일'::character varying,
  refund_settings jsonb null default '{"type": "immediate", "enabled": true, "delay_days": 0, "cutoff_time": "00:00", "refund_rules": {"refund_rate": 100, "min_usage_days": 0, "partial_refund": true, "max_refund_days": 7}, "approval_roles": ["distributor", "advertiser"], "requires_approval": false}'::jsonb,
  guarantee_period integer null,
  constraint campaigns_pkey_new primary key (id),
  constraint guarantee_count_check check (
    (
      (
        ((slot_type)::text = 'guarantee'::text)
        and (guarantee_count is not null)
        and (guarantee_count > 0)
      )
      or (
        ((slot_type)::text = 'standard'::text)
        and (guarantee_count is null)
      )
    )
  ),
  constraint guarantee_period_check check (
    (
      (
        ((slot_type)::text = 'guarantee'::text)
        and (guarantee_period is not null)
        and (guarantee_period > 0)
      )
      or (
        ((slot_type)::text = 'standard'::text)
        and (guarantee_period is null)
      )
    )
  ),
  constraint guarantee_price_check check (
    (
      (
        (is_negotiable = true)
        and (min_guarantee_price is not null)
        and (max_guarantee_price is not null)
        and (min_guarantee_price <= max_guarantee_price)
      )
      or (is_negotiable = false)
    )
  ),
  constraint guarantee_unit_check check (
    (
      (
        (guarantee_unit)::text = any (
          (
            array['일'::character varying, '회'::character varying]
          )::text[]
        )
      )
      or (guarantee_unit is null)
    )
  ),
  constraint slot_type_check check (
    (
      (slot_type)::text = any (
        (
          array[
            'standard'::character varying,
            'guarantee'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint target_rank_check check (
    (
      (
        ((slot_type)::text = 'guarantee'::text)
        and (target_rank is not null)
        and (target_rank > 0)
      )
      or (
        ((slot_type)::text = 'standard'::text)
        and (target_rank is null)
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_campaigns_slot_type on public.campaigns using btree (slot_type) TABLESPACE pg_default;

create index IF not exists idx_campaigns_is_guarantee on public.campaigns using btree (is_guarantee) TABLESPACE pg_default;

create index IF not exists idx_campaigns_guarantee_unit on public.campaigns using btree (guarantee_unit) TABLESPACE pg_default
where
  ((slot_type)::text = 'guarantee'::text);

create index IF not exists idx_campaigns_guarantee_period on public.campaigns using btree (guarantee_period) TABLESPACE pg_default
where
  ((slot_type)::text = 'guarantee'::text);

create trigger update_campaigns_is_guarantee BEFORE INSERT
or
update OF slot_type on campaigns for EACH row
execute FUNCTION update_is_guarantee_flag ();


create table public.slot_refund_approvals (
  id uuid not null default gen_random_uuid (),
  slot_id uuid not null,
  requester_id uuid not null,
  approver_id uuid null,
  status text not null default 'pending'::text,
  request_date timestamp with time zone null default now(),
  approval_date timestamp with time zone null,
  refund_amount numeric not null,
  refund_reason text null,
  approval_notes text null,
  constraint slot_refund_approvals_pkey primary key (id),
  constraint slot_refund_approvals_approver_id_fkey foreign KEY (approver_id) references users (id),
  constraint slot_refund_approvals_requester_id_fkey foreign KEY (requester_id) references users (id),
  constraint slot_refund_approvals_slot_id_fkey foreign KEY (slot_id) references slots (id),
  constraint slot_refund_approvals_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'approved'::text,
          'rejected'::text,
          'cancelled'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

-- Supabase 간소화 스키마
-- 대시보드에서 시간별/일별 순위 변화를 보여주기 위한 최소한의 테이블

-- 기존 테이블 삭제 (초기화)
DROP TABLE IF EXISTS shopping_rankings_hourly CASCADE;
DROP TABLE IF EXISTS shopping_rankings_daily CASCADE;
DROP TABLE IF EXISTS shopping_rankings_current CASCADE;
DROP VIEW IF EXISTS shopping_top_products_weekly_trend CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_shopping_rankings CASCADE;
DROP FUNCTION IF EXISTS create_daily_shopping_snapshot CASCADE;

-- 1. 시간별 순위 스냅샷 (당일 24시간 데이터)
CREATE TABLE IF NOT EXISTS shopping_rankings_hourly (
    keyword_id UUID NOT NULL REFERENCES search_keywords(id) ON DELETE CASCADE,
    product_id VARCHAR(255) NOT NULL,
    hour TIMESTAMP WITH TIME ZONE NOT NULL,
    rank INTEGER NOT NULL,
    title TEXT NOT NULL,
    lprice INTEGER NOT NULL,
    image TEXT,
    mall_name VARCHAR(255),
    brand VARCHAR(255),
    category1 VARCHAR(255),
    category2 VARCHAR(255),
    link TEXT,
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (keyword_id, product_id, hour)
);

-- 2. 일별 순위 스냅샷 (최근 30일 데이터)
CREATE TABLE IF NOT EXISTS shopping_rankings_daily (
    keyword_id UUID NOT NULL REFERENCES search_keywords(id) ON DELETE CASCADE,
    product_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    rank INTEGER NOT NULL,
    title TEXT NOT NULL,
    lprice INTEGER NOT NULL,
    image TEXT,
    mall_name VARCHAR(255),
    brand VARCHAR(255),
    category1 VARCHAR(255),
    category2 VARCHAR(255),
    link TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (keyword_id, product_id, date)
);

-- 3. 현재 순위 (실시간 표시용)
CREATE TABLE IF NOT EXISTS shopping_rankings_current (
    keyword_id UUID NOT NULL REFERENCES search_keywords(id) ON DELETE CASCADE,
    product_id VARCHAR(255) NOT NULL,
    rank INTEGER NOT NULL,
    prev_rank INTEGER, -- 이전 순위 (순위 변동 표시용)
    title TEXT NOT NULL,
    lprice INTEGER NOT NULL,
    image TEXT,
    mall_name VARCHAR(255),
    brand VARCHAR(255),
    category1 VARCHAR(255),
    category2 VARCHAR(255),
    link TEXT,
    collected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (keyword_id, product_id)
);

-- 인덱스 생성
CREATE INDEX idx_shopping_rankings_hourly_keyword_hour ON shopping_rankings_hourly(keyword_id, hour DESC);
CREATE INDEX idx_shopping_rankings_daily_keyword_date ON shopping_rankings_daily(keyword_id, date DESC);
CREATE INDEX idx_shopping_rankings_current_keyword_rank ON shopping_rankings_current(keyword_id, rank);

-- 오래된 데이터 자동 정리 함수
CREATE OR REPLACE FUNCTION cleanup_old_shopping_rankings()
RETURNS void AS $$
BEGIN
    -- 24시간 이상 된 시간별 데이터 삭제
    DELETE FROM shopping_rankings_hourly 
    WHERE hour < CURRENT_TIMESTAMP - INTERVAL '24 hours';
    
    -- 30일 이상 된 일별 데이터 삭제
    DELETE FROM shopping_rankings_daily 
    WHERE date < CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 일별 스냅샷 생성 함수 (매일 자정 실행)
CREATE OR REPLACE FUNCTION create_daily_shopping_snapshot()
RETURNS void AS $$
BEGIN
    -- 어제 날짜의 마지막 데이터를 일별 테이블에 저장
    INSERT INTO shopping_rankings_daily (keyword_id, product_id, date, rank, title, lprice, 
                               image, mall_name, brand, category1, category2, link)
    SELECT DISTINCT ON (keyword_id, product_id)
        keyword_id,
        product_id,
        (CURRENT_DATE - INTERVAL '1 day')::date as date,
        rank,
        title,
        lprice,
        image,
        mall_name,
        brand,
        category1,
        category2,
        link
    FROM shopping_rankings_current
    WHERE collected_at::date = CURRENT_DATE - INTERVAL '1 day'
    ORDER BY keyword_id, product_id, collected_at DESC
    ON CONFLICT (keyword_id, product_id, date) 
    DO UPDATE SET
        rank = EXCLUDED.rank,
        title = EXCLUDED.title,
        lprice = EXCLUDED.lprice,
        last_updated = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- 뷰: 상위 10개 제품의 주간 트렌드
CREATE OR REPLACE VIEW shopping_top_products_weekly_trend AS
SELECT 
    r.keyword_id,
    r.product_id,
    r.title,
    r.brand,
    r.current_rank,
    d1.rank as day_1_ago,
    d2.rank as day_2_ago,
    d3.rank as day_3_ago,
    d4.rank as day_4_ago,
    d5.rank as day_5_ago,
    d6.rank as day_6_ago,
    d7.rank as day_7_ago
FROM (
    SELECT DISTINCT ON (keyword_id, product_id)
        keyword_id, product_id, rank as current_rank, title, brand
    FROM shopping_rankings_current
    WHERE rank <= 10
    ORDER BY keyword_id, product_id, rank
) r
LEFT JOIN shopping_rankings_daily d1 ON r.keyword_id = d1.keyword_id 
    AND r.product_id = d1.product_id AND d1.date = CURRENT_DATE - 1
LEFT JOIN shopping_rankings_daily d2 ON r.keyword_id = d2.keyword_id 
    AND r.product_id = d2.product_id AND d2.date = CURRENT_DATE - 2
LEFT JOIN shopping_rankings_daily d3 ON r.keyword_id = d3.keyword_id 
    AND r.product_id = d3.product_id AND d3.date = CURRENT_DATE - 3
LEFT JOIN shopping_rankings_daily d4 ON r.keyword_id = d4.keyword_id 
    AND r.product_id = d4.product_id AND d4.date = CURRENT_DATE - 4
LEFT JOIN shopping_rankings_daily d5 ON r.keyword_id = d5.keyword_id 
    AND r.product_id = d5.product_id AND d5.date = CURRENT_DATE - 5
LEFT JOIN shopping_rankings_daily d6 ON r.keyword_id = d6.keyword_id 
    AND r.product_id = d6.product_id AND d6.date = CURRENT_DATE - 6
LEFT JOIN shopping_rankings_daily d7 ON r.keyword_id = d7.keyword_id 
    AND r.product_id = d7.product_id AND d7.date = CURRENT_DATE - 7;