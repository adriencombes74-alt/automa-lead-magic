import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
const BREVO_SENDER = Deno.env.get('BREVO_SENDER') ?? 'AutoLead'
const BATCH_LIMIT = 100

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

type Reminder = {
  id: string
  garage_id: string
  client_id: string
  vehicle: { brand?: string; model?: string } | null
  service_label: string | null
  reminder_type: 'revision' | 'pneus_hiver' | 'pneus_ete'
  scheduled_at: string
  clients: { name: string | null; phone: string | null; sms_consent: boolean } | null
  users: { garage_name: string; phone: string | null } | null
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

function buildMessage(r: Reminder): string {
  const prenom = firstName(r.clients?.name ?? null)
  const greeting = prenom ? `Bonjour ${prenom}` : 'Bonjour'
  const garageName = r.users?.garage_name ?? 'votre garage'
  const garagePhone = r.users?.phone ?? ''
  const phoneSuffix = garagePhone ? ` Tel: ${garagePhone}` : ''
  const stop = ' STOP au 36180.'

  if (r.reminder_type === 'revision') {
    const vehicleName = r.vehicle?.brand ? r.vehicle.brand : 'votre vehicule'
    return `${greeting}, ${vehicleName} a ete revisee chez ${garageName} il y a 1 an. Pensez au prochain entretien.${phoneSuffix}${stop}`
  }
  if (r.reminder_type === 'pneus_hiver') {
    return `${greeting}, l'hiver approche ! Pensez a monter vos pneus hiver chez ${garageName}.${phoneSuffix}${stop}`
  }
  return `${greeting}, le printemps est la ! Pensez a remonter vos pneus ete chez ${garageName}.${phoneSuffix}${stop}`
}

async function sendBrevoSms(to: string, content: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!BREVO_API_KEY) {
    return { success: false, error: 'BREVO_API_KEY non configurée' }
  }
  try {
    const res = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: BREVO_SENDER,
        recipient: to,
        content,
        type: 'transactional',
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { success: false, error: data?.message ?? `HTTP ${res.status}` }
    }
    return { success: true, messageId: data?.reference ?? data?.messageId ?? null }
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

      const message = buildMessage(reminder)
      const sendResult = await sendBrevoSms(phone, message)

      if (sendResult.success) {
        await supabase.from('reminders').update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          message_body: message,
          brevo_message_id: sendResult.messageId ?? null,
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
