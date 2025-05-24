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

create table public.campaigns (
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
  constraint campaigns_pkey_new primary key (id)
) TABLESPACE pg_default;

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
          'marketing'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists notifications_user_id_idx on public.notifications using btree (user_id) TABLESPACE pg_default;

create index IF not exists notifications_user_id_status_idx on public.notifications using btree (user_id, status) TABLESPACE pg_default;

create index IF not exists notifications_created_at_idx on public.notifications using btree (created_at) TABLESPACE pg_default;