-- Historique + analytics des appels de l'assistant vocal ElevenLabs.
-- Alimenté par le post-call webhook ElevenLabs (edge function `elevenlabs-post-call`).
-- Le transcript, le résumé et l'analyse arrivent dans le même payload post-appel
-- (aucun crédit ElevenLabs supplémentaire). 1 agent partagé : le garage est résolu
-- via la dynamic variable garage_id (repli : numéro appelé -> phone_numbers).

-- ==========================================
-- Table: voice_calls
-- ==========================================
create table if not exists public.voice_calls (
  id                         uuid primary key default gen_random_uuid(),
  garage_id                  uuid references public.users(id) on delete cascade,
  elevenlabs_conversation_id text not null,
  elevenlabs_agent_id        text,
  caller_phone               text,
  called_number              text,
  direction                  text,
  status                     text,
  call_successful            text,
  duration_secs              int,
  cost                       int,
  started_at                 timestamptz,
  transcript                 jsonb not null default '[]'::jsonb,
  summary                    text,
  data_collected             jsonb,
  evaluation                 jsonb,
  client_id                  uuid references public.clients(id) on delete set null,
  rdv_id                     uuid references public.rendez_vous(id) on delete set null,
  message_count              int,
  raw                        jsonb,
  created_at                 timestamptz not null default now()
);

alter table public.voice_calls enable row level security;

-- Lecture seule pour le garagiste propriétaire. Les inserts passent par la
-- service role (edge function webhook) qui bypass la RLS.
create policy "voice_calls: propriétaire (lecture)" on public.voice_calls
  for select using (auth.uid() = garage_id);

-- Idempotence : le webhook ElevenLabs peut rejouer le même appel.
create unique index if not exists voice_calls_conversation_id_idx
  on public.voice_calls (elevenlabs_conversation_id);

create index if not exists voice_calls_garage_started_idx
  on public.voice_calls (garage_id, started_at desc);

-- ==========================================
-- Correctif sécurité : RLS sur phone_numbers
-- (table créée hors-migrations, actuellement exposée à la clé anon).
-- L'edge function autolead-agent l'interroge en service role -> non impactée.
-- ==========================================
alter table public.phone_numbers enable row level security;

drop policy if exists "phone_numbers: propriétaire" on public.phone_numbers;
create policy "phone_numbers: propriétaire" on public.phone_numbers
  for all using (auth.uid() = garage_id);
