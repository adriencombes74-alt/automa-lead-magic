-- Système de rappels SMS automatiques (révisions + pneus saisonniers).
-- Fournisseur SMS : Brevo (clé API à configurer via `supabase secrets set BREVO_API_KEY=...`).

create extension if not exists pg_cron with schema extensions;

-- ==========================================
-- Consentement SMS sur clients
-- ==========================================
alter table public.clients
  add column if not exists sms_consent boolean not null default false,
  add column if not exists sms_consent_at timestamptz;

-- ==========================================
-- Table: reminders
-- ==========================================
create table if not exists public.reminders (
  id              uuid primary key default gen_random_uuid(),
  garage_id       uuid not null references public.users(id) on delete cascade,
  client_id       uuid not null references public.clients(id) on delete cascade,
  vehicle         jsonb,
  service_label   text,
  reminder_type   text not null check (reminder_type in ('revision', 'pneus_hiver', 'pneus_ete')),
  scheduled_at    timestamptz not null,
  sent_at         timestamptz,
  status          text not null default 'pending' check (status in ('pending', 'sent', 'cancelled', 'failed')),
  source_rdv_id   uuid references public.rendez_vous(id) on delete set null,
  season_year     int,
  message_body    text,
  brevo_message_id text,
  error_message   text,
  created_at      timestamptz not null default now()
);

alter table public.reminders enable row level security;

create policy "reminders: propriétaire" on public.reminders
  for all using (auth.uid() = garage_id);

create index reminders_garage_id_idx on public.reminders(garage_id);
create index reminders_dispatch_idx on public.reminders(status, scheduled_at) where status = 'pending';

-- Idempotence : un seul rappel révision par RDV terminé
create unique index reminders_revision_idempotency_idx
  on public.reminders (source_rdv_id, reminder_type)
  where source_rdv_id is not null;

-- Idempotence : un seul rappel pneus par client par saison
create unique index reminders_seasonal_idempotency_idx
  on public.reminders (client_id, reminder_type, season_year)
  where season_year is not null;

-- ==========================================
-- Trigger : créer un rappel révision quand un RDV passe en 'completed'
-- ==========================================
create or replace function public.create_revision_reminder()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  config_services jsonb;
  matched_type text;
  client_consent boolean;
begin
  if new.status = 'completed' and (old.status is distinct from 'completed') then
    if new.client_id is null or new.service is null then
      return new;
    end if;

    select config->'services'
      into config_services
      from public.garage_configs
      where garage_id = new.garage_id;

    if config_services is null then
      return new;
    end if;

    select svc->>'reminder_type'
      into matched_type
      from jsonb_array_elements(config_services) svc
      where lower(svc->>'label') = lower(new.service)
      limit 1;

    if matched_type is null or matched_type = 'aucun' then
      return new;
    end if;

    select sms_consent
      into client_consent
      from public.clients
      where id = new.client_id;

    if client_consent is not true then
      return new;
    end if;

    if matched_type = 'revision' then
      insert into public.reminders (
        garage_id, client_id, vehicle, service_label,
        reminder_type, scheduled_at, status, source_rdv_id
      ) values (
        new.garage_id, new.client_id, new.vehicle, new.service,
        'revision',
        new.scheduled_at + interval '12 months',
        'pending',
        new.id
      )
      on conflict (source_rdv_id, reminder_type) where source_rdv_id is not null do nothing;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_create_revision_reminder on public.rendez_vous;
create trigger trg_create_revision_reminder
  after update on public.rendez_vous
  for each row
  execute function public.create_revision_reminder();

-- Empêcher l'exposition REST de la fonction trigger SECURITY DEFINER
revoke execute on function public.create_revision_reminder() from public, anon, authenticated;

-- ==========================================
-- Secret de cron (vault) + RPC pour le valider depuis les edge functions
-- ==========================================
do $$
declare
  v_secret text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  if not exists (select 1 from vault.secrets where name = 'reminder_cron_secret') then
    perform vault.create_secret(v_secret, 'reminder_cron_secret', 'Secret partagé entre pg_cron et les edge functions de rappels');
  end if;
end $$;

create or replace function public.get_reminder_cron_secret()
returns text
language sql
security definer
set search_path = public, vault
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'reminder_cron_secret'
$$;

revoke execute on function public.get_reminder_cron_secret() from public, anon, authenticated;

-- ==========================================
-- Cron jobs : envoi horaire + planification saisonnière quotidienne
-- ==========================================
-- Nettoyer d'anciens jobs si re-migration
do $$
begin
  if exists (select 1 from cron.job where jobname = 'send-reminders-hourly') then
    perform cron.unschedule('send-reminders-hourly');
  end if;
  if exists (select 1 from cron.job where jobname = 'plan-seasonal-tires-daily') then
    perform cron.unschedule('plan-seasonal-tires-daily');
  end if;
end $$;

select cron.schedule(
  'send-reminders-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://awxdtozpqdmusnrvwovh.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Cron-Secret', (select decrypted_secret from vault.decrypted_secrets where name = 'reminder_cron_secret')
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);

select cron.schedule(
  'plan-seasonal-tires-daily',
  '0 5 * * *',
  $$
  select net.http_post(
    url := 'https://awxdtozpqdmusnrvwovh.supabase.co/functions/v1/plan-seasonal-tires',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Cron-Secret', (select decrypted_secret from vault.decrypted_secrets where name = 'reminder_cron_secret')
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
