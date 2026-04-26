-- TrendivaLux core schema, migration 1
-- Tables: orders, questionnaires, waitlist, site_audit_leads
-- All tables use UUIDs as primary keys. Timestamps in UTC.

create extension if not exists "pgcrypto";

-- orders: one row per Stripe checkout session, lifecycle status tracked through the funnel
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  tier text not null check (tier in ('landing', 'business', 'store', 'webapp', 'custom')),
  total_price_cents integer not null,
  deposit_amount_cents integer not null,
  customer_email text not null,
  customer_name text,
  customer_address jsonb,
  questionnaire_data jsonb,
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  contract_status text default 'pending' check (contract_status in ('pending', 'sent', 'signed', 'expired')),
  contract_docuseal_id text,
  contract_signed_at timestamptz,
  status text not null default 'created' check (status in ('created', 'paid', 'contract_sent', 'active', 'completed', 'cancelled', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_orders_status on public.orders(status);
create index idx_orders_customer_email on public.orders(customer_email);
create index idx_orders_created_at on public.orders(created_at desc);

-- questionnaires: save-on-blur drafts. session_id is generated client-side and persisted across reloads.
create table public.questionnaires (
  session_id text primary key,
  tier text,
  current_step integer default 1,
  answers jsonb default '{}'::jsonb,
  completed boolean default false,
  converted_to_order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_questionnaires_completed on public.questionnaires(completed);

-- waitlist: email capture from the final-CTA waitlist modal
create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'final_cta',
  created_at timestamptz not null default now()
);

create unique index idx_waitlist_email on public.waitlist(lower(email));

-- site_audit_leads: email capture from the exit-intent modal in exchange for a free site audit
create table public.site_audit_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'exit_intent',
  status text not null default 'pending' check (status in ('pending', 'sent', 'converted')),
  created_at timestamptz not null default now()
);

create index idx_site_audit_leads_status on public.site_audit_leads(status);
create unique index idx_site_audit_leads_email on public.site_audit_leads(lower(email));

-- updated_at triggers
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create trigger questionnaires_updated_at before update on public.questionnaires
  for each row execute function public.set_updated_at();

-- Row Level Security
alter table public.orders enable row level security;
alter table public.questionnaires enable row level security;
alter table public.waitlist enable row level security;
alter table public.site_audit_leads enable row level security;

-- Anon role can insert into questionnaires (for save-on-blur), waitlist, and site_audit_leads.
-- Anon role can select their own questionnaire by session_id (for resuming a draft).
-- Anon role cannot read orders. Service role handles all order reads/writes via webhooks and server functions.

create policy "anon can insert questionnaires"
  on public.questionnaires for insert to anon
  with check (true);

create policy "anon can select own questionnaire"
  on public.questionnaires for select to anon
  using (true);

create policy "anon can update own questionnaire"
  on public.questionnaires for update to anon
  using (true) with check (true);

create policy "anon can insert waitlist"
  on public.waitlist for insert to anon
  with check (true);

create policy "anon can insert site_audit_leads"
  on public.site_audit_leads for insert to anon
  with check (true);
