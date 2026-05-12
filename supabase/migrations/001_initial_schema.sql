-- AutoLead AI — Schéma initial
-- Multi-tenant : garage_id = auth.uid() sur toutes les tables

-- Extension pour UUID
create extension if not exists "pgcrypto";

-- ==========================================
-- Table: users (profil garage)
-- ==========================================
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  garage_name text not null,
  phone       text,
  address     text,
  created_at  timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "users: lecture propriétaire" on public.users
  for select using (auth.uid() = id);

create policy "users: mise à jour propriétaire" on public.users
  for update using (auth.uid() = id);

create policy "users: insertion propriétaire" on public.users
  for insert with check (auth.uid() = id);

-- ==========================================
-- Table: garage_configs
-- ==========================================
create table if not exists public.garage_configs (
  id           uuid primary key default gen_random_uuid(),
  garage_id    uuid not null references public.users(id) on delete cascade,
  widget_token uuid not null default gen_random_uuid(),
  config       jsonb not null default '{}',
  created_at   timestamptz not null default now(),
  unique(garage_id),
  unique(widget_token)
);

alter table public.garage_configs enable row level security;

-- Lecture publique (pour la résolution du widget_token)
create policy "garage_configs: lecture publique" on public.garage_configs
  for select using (true);

create policy "garage_configs: modification propriétaire" on public.garage_configs
  for all using (auth.uid() = garage_id);

-- ==========================================
-- Table: subscriptions
-- ==========================================
create table if not exists public.subscriptions (
  id              uuid primary key default gen_random_uuid(),
  garage_id       uuid not null references public.users(id) on delete cascade unique,
  plan            text not null default 'starter' check (plan in ('starter', 'pro', 'premium')),
  status          text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'canceled')),
  stripe_sub_id   text,
  trial_end       timestamptz,
  devis_count     int not null default 0,
  rdv_count       int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "subscriptions: propriétaire" on public.subscriptions
  for all using (auth.uid() = garage_id);

-- ==========================================
-- Table: clients
-- ==========================================
create table if not exists public.clients (
  id             uuid primary key default gen_random_uuid(),
  garage_id      uuid not null references public.users(id) on delete cascade,
  name           text,
  phone          text,
  email          text,
  vehicle_brand  text,
  vehicle_model  text,
  vehicle_year   int,
  created_at     timestamptz not null default now(),
  unique(garage_id, phone)
);

alter table public.clients enable row level security;

create policy "clients: propriétaire" on public.clients
  for all using (auth.uid() = garage_id);

-- ==========================================
-- Table: conversations
-- ==========================================
create table if not exists public.conversations (
  id          uuid primary key default gen_random_uuid(),
  garage_id   uuid not null references public.users(id) on delete cascade,
  session_id  text not null,
  client_id   uuid references public.clients(id) on delete set null,
  messages    jsonb not null default '[]',
  intent      text check (intent in ('devis', 'rdv', 'question', 'greeting', 'unknown')),
  status      text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  created_at  timestamptz not null default now(),
  unique(garage_id, session_id)
);

alter table public.conversations enable row level security;

create policy "conversations: propriétaire" on public.conversations
  for all using (auth.uid() = garage_id);

create index conversations_garage_id_idx on public.conversations(garage_id);
create index conversations_session_id_idx on public.conversations(session_id);

-- ==========================================
-- Table: leads
-- ==========================================
create table if not exists public.leads (
  id               uuid primary key default gen_random_uuid(),
  garage_id        uuid not null references public.users(id) on delete cascade,
  client_id        uuid references public.clients(id) on delete set null,
  conversation_id  uuid references public.conversations(id) on delete set null,
  score            int not null default 0 check (score between 0 and 100),
  status           text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'lost')),
  created_at       timestamptz not null default now(),
  unique(garage_id, client_id)
);

alter table public.leads enable row level security;

create policy "leads: propriétaire" on public.leads
  for all using (auth.uid() = garage_id);

-- ==========================================
-- Table: devis
-- ==========================================
create table if not exists public.devis (
  id               uuid primary key default gen_random_uuid(),
  garage_id        uuid not null references public.users(id) on delete cascade,
  client_id        uuid references public.clients(id) on delete set null,
  conversation_id  uuid references public.conversations(id) on delete set null,
  reference        text not null,
  vehicle          jsonb,
  service          text,
  items            jsonb not null default '[]',
  subtotal         numeric(10, 2) not null default 0,
  tva_rate         int not null default 20,
  tva_amount       numeric(10, 2) not null default 0,
  total_ttc        numeric(10, 2) not null default 0,
  status           text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'expired')),
  created_at       timestamptz not null default now()
);

alter table public.devis enable row level security;

create policy "devis: propriétaire" on public.devis
  for all using (auth.uid() = garage_id);

create index devis_garage_id_idx on public.devis(garage_id);

-- ==========================================
-- Table: rendez_vous
-- ==========================================
create table if not exists public.rendez_vous (
  id           uuid primary key default gen_random_uuid(),
  garage_id    uuid not null references public.users(id) on delete cascade,
  client_id    uuid references public.clients(id) on delete set null,
  devis_id     uuid references public.devis(id) on delete set null,
  reference    text not null,
  service      text,
  vehicle      jsonb,
  scheduled_at timestamptz not null,
  duration_min int not null default 60,
  status       text not null default 'confirmed' check (status in ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  created_at   timestamptz not null default now()
);

alter table public.rendez_vous enable row level security;

create policy "rendez_vous: propriétaire" on public.rendez_vous
  for all using (auth.uid() = garage_id);

create index rendez_vous_garage_id_idx on public.rendez_vous(garage_id);
create index rendez_vous_scheduled_at_idx on public.rendez_vous(scheduled_at);

-- ==========================================
-- Table: usage_logs
-- ==========================================
create table if not exists public.usage_logs (
  id         uuid primary key default gen_random_uuid(),
  garage_id  uuid not null references public.users(id) on delete cascade,
  action     text not null,
  metadata   jsonb,
  created_at timestamptz not null default now()
);

alter table public.usage_logs enable row level security;

create policy "usage_logs: propriétaire" on public.usage_logs
  for all using (auth.uid() = garage_id);
