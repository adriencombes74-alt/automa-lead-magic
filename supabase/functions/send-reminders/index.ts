// Envoi horaire des SMS de rappels via Twilio.
// Cron: '0 * * * *' déclenche cette fonction avec un header X-Cron-Secret.
// Récupère les reminders pending échus, compose le SMS depuis le template du garage,
// envoie via Twilio, et met à jour le statut (sent/failed) dans `reminders`.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
const TWILIO_FROM_NUMBER = Deno.env.get('TWILIO_FROM_NUMBER')
const BATCH_LIMIT = 100

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

type ReminderType = 'revision' | 'pneus_hiver' | 'pneus_ete'

type Reminder = {
  id: string
  garage_id: string
  client_id: string
  vehicle: { brand?: string; model?: string } | null
  service_label: string | null
  reminder_type: ReminderType
  scheduled_at: string
  clients: { name: string | null; phone: string | null; sms_consent: boolean } | null
  users: { garage_name: string; phone: string | null } | null
}

type ReminderTemplateConfig = {
  enabled?: boolean
  sms_template?: string
}

type GarageConfigRow = {
  config: {
    reminder_frequencies?: Partial<Record<ReminderType, ReminderTemplateConfig>>
  } | null
}

// Fallback templates si le garage n'a pas de config (compte ancien jamais migré, etc.)
const FALLBACK_TEMPLATES: Record<ReminderType, string> = {
  revision: "Bonjour {client_name}, votre {vehicle} a ete revise chez {garage_name} il y a 1 an. Pensez au prochain entretien. Tel: {phone}. STOP au 36180.",
  pneus_hiver: "Bonjour {client_name}, l'hiver approche ! Pensez a monter vos pneus hiver chez {garage_name}. Tel: {phone}. STOP au 36180.",
  pneus_ete: "Bonjour {client_name}, le printemps est la ! Pensez a remonter vos pneus ete chez {garage_name}. Tel: {phone}. STOP au 36180.",
}

function normalizePhoneFr(raw: string | null): string | null {
  if (!raw) return null
  const digits = raw.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return digits
  if (digits.startsWith('0033')) return '+' + digits.slice(2)
  if (digits.startsWith('33') && digits.length >= 11) return '+' + digits
  if (digits.startsWith('0') && digits.length === 10) return '+33' + digits.slice(1)
  return null
}

function firstName(full: string | null): string {
  if (!full) return ''
  return full.trim().split(/\s+/)[0]
}

function vehicleLabel(vehicle: Reminder['vehicle']): string {
  if (!vehicle) return 'votre vehicule'
  const parts = [vehicle.brand, vehicle.model].filter(Boolean)
  return parts.length ? parts.join(' ') : 'votre vehicule'
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '')
}

function buildMessage(reminder: Reminder, template: string): string {
  return renderTemplate(template, {
    client_name: firstName(reminder.clients?.name ?? null),
    garage_name: reminder.users?.garage_name ?? 'votre garage',
    vehicle: vehicleLabel(reminder.vehicle),
    phone: reminder.users?.phone ?? '',
  })
}

async function loadGarageTemplate(garageId: string, type: ReminderType): Promise<string> {
  const { data, error } = await supabase
    .from('garage_configs')
    .select('config')
    .eq('garage_id', garageId)
    .single<GarageConfigRow>()

  if (error || !data?.config?.reminder_frequencies?.[type]?.sms_template) {
    return FALLBACK_TEMPLATES[type]
  }
  return data.config.reminder_frequencies[type]!.sms_template!
}

async function sendTwilioSms(to: string, body: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    return { success: false, error: 'Twilio non configuré (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM_NUMBER manquants)' }
  }
  try {
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)
    const form = new URLSearchParams({ To: to, From: TWILIO_FROM_NUMBER, Body: body })
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form,
      },
    )
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { success: false, error: data?.message ?? `HTTP ${res.status}` }
    }
    return { success: true, sid: data?.sid ?? null }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erreur réseau' }
  }
}

async function verifyCronSecret(provided: string | null): Promise<boolean> {
  if (!provided) return false
  const { data, error } = await supabase.rpc('get_reminder_cron_secret')
  if (error || !data) return false
  return data === provided
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const cronSecret = req.headers.get('x-cron-secret')
  const isAuthorized = await verifyCronSecret(cronSecret)
  if (!isAuthorized) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select(`
        id, garage_id, client_id, vehicle, service_label, reminder_type, scheduled_at,
        clients(name, phone, sms_consent),
        users:garage_id(garage_name, phone)
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .limit(BATCH_LIMIT)
      .returns<Reminder[]>()

    if (error) throw error

    const results = { sent: 0, failed: 0, skipped: 0 }

    for (const reminder of reminders ?? []) {
      if (!reminder.clients?.sms_consent) {
        await supabase.from('reminders').update({
          status: 'cancelled',
          error_message: 'Consentement SMS retiré',
        }).eq('id', reminder.id)
        results.skipped++
        continue
      }

      const phone = normalizePhoneFr(reminder.clients?.phone ?? null)
      if (!phone) {
        await supabase.from('reminders').update({
          status: 'failed',
          error_message: 'Numéro de téléphone invalide',
        }).eq('id', reminder.id)
        results.failed++
        continue
      }

      const template = await loadGarageTemplate(reminder.garage_id, reminder.reminder_type)
      const message = buildMessage(reminder, template)
      const sendResult = await sendTwilioSms(phone, message)

      if (sendResult.success) {
        await supabase.from('reminders').update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          message_body: message,
          provider_message_id: sendResult.sid ?? null,
        }).eq('id', reminder.id)
        results.sent++
      } else {
        await supabase.from('reminders').update({
          status: 'failed',
          message_body: message,
          error_message: sendResult.error ?? 'Erreur inconnue',
        }).eq('id', reminder.id)
        results.failed++
      }
    }

    return new Response(
      JSON.stringify({ ok: true, ...results, processed: reminders?.length ?? 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('send-reminders error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Erreur interne' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
