-- 006_reminder_config.sql
-- Rend les rappels SMS configurables par garage :
--   * intervalle révision (mois) au lieu du hardcodé 12 mois
--   * dates pneus hiver/été au lieu du 15 août / 15 mars
--   * templates SMS personnalisables avec placeholders
-- Bascule aussi le provider SMS de Brevo vers Twilio (renomme la colonne identifiant
-- en provider_message_id pour rester agnostique).

-- ==========================================
-- A. Backfill : ajouter reminder_frequencies aux garages existants
-- ==========================================
update public.garage_configs
set config = config || jsonb_build_object(
  'reminder_frequencies', jsonb_build_object(
    'revision', jsonb_build_object(
      'enabled', true,
      'interval_months', 12,
      'sms_template', 'Bonjour {client_name}, votre {vehicle} a ete revise chez {garage_name} il y a 1 an. C''est le moment de planifier votre prochaine revision ! Tel: {phone}. STOP au 36180.'
    ),
    'pneus_hiver', jsonb_build_object(
      'enabled', true,
      'send_month', 10,
      'send_day', 1,
      'sms_template', 'Bonjour {client_name}, l''hiver approche ! Pensez a monter vos pneus hiver. {garage_name} vous accueille. Tel: {phone}. STOP au 36180.'
    ),
    'pneus_ete', jsonb_build_object(
      'enabled', true,
      'send_month', 4,
      'send_day', 1,
      'sms_template', 'Bonjour {client_name}, le printemps arrive ! Pensez a remonter vos pneus ete. {garage_name} vous accueille. Tel: {phone}. STOP au 36180.'
    )
  )
)
where not (config ? 'reminder_frequencies');

-- ==========================================
-- B. Modifier le trigger révision : intervalle depuis la config
-- ==========================================
create or replace function public.create_revision_reminder()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  config_services jsonb;
  reminder_cfg jsonb;
  matched_type text;
  client_consent boolean;
  interval_months int := 12;
  revision_enabled boolean := true;
begin
  if new.status = 'completed' and (old.status is distinct from 'completed') then
    if new.client_id is null or new.service is null then
      return new;
    end if;

    select config->'services', config->'reminder_frequencies'->'revision'
      into config_services, reminder_cfg
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
      -- Lire l'intervalle + on/off depuis la config du garage (fallback : 12 mois, activé)
      if reminder_cfg is not null then
        interval_months := coalesce((reminder_cfg->>'interval_months')::int, 12);
        revision_enabled := coalesce((reminder_cfg->>'enabled')::boolean, true);
      end if;

      if not revision_enabled then
        return new;
      end if;

      insert into public.reminders (
        garage_id, client_id, vehicle, service_label,
        reminder_type, scheduled_at, status, source_rdv_id
      ) values (
        new.garage_id, new.client_id, new.vehicle, new.service,
        'revision',
        new.scheduled_at + (interval_months || ' months')::interval,
        'pending',
        new.id
      )
      on conflict (source_rdv_id, reminder_type) where source_rdv_id is not null do nothing;
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function public.create_revision_reminder() from public, anon, authenticated;

-- ==========================================
-- C. Renommer brevo_message_id → provider_message_id (agnostique provider)
-- ==========================================
alter table public.reminders rename column brevo_message_id to provider_message_id;
