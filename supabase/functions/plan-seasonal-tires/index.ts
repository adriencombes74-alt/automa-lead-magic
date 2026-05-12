import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

type SeasonInfo = { type: 'pneus_hiver' | 'pneus_ete'; sendDate: Date; year: number } | null

function determineUpcomingSeason(today: Date): SeasonInfo {
  const month = today.getMonth() + 1
  const day = today.getDate()
  const year = today.getFullYear()

  if (month === 8 || (month === 9 && day <= 15)) {
    return { type: 'pneus_hiver', sendDate: new Date(Date.UTC(year, 8, 15, 9, 0, 0)), year }
  }
  if (month === 2 || (month === 3 && day <= 15)) {
    return { type: 'pneus_ete', sendDate: new Date(Date.UTC(year, 2, 15, 9, 0, 0)), year }
  }
  return null
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
    const today = new Date()
    const season = determineUpcomingSeason(today)
    if (!season) {
      return new Response(
        JSON.stringify({ ok: true, skipped: true, reason: 'Hors fenêtre saisonnière' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Récupérer tous les RDV "completed" sur les 12 derniers mois dont le service est de type pneus
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const { data: rdvs, error: rdvErr } = await supabase
      .from('rendez_vous')
      .select('garage_id, client_id, service, vehicle, scheduled_at, clients!inner(id, sms_consent, phone)')
      .eq('status', 'completed')
      .gte('scheduled_at', oneYearAgo.toISOString())
      .not('client_id', 'is', null)
      .returns<Array<{
        garage_id: string
        client_id: string
        service: string | null
        vehicle: { brand?: string; model?: string } | null
        scheduled_at: string
        clients: { id: string; sms_consent: boolean; phone: string | null }
      }>>()

    if (rdvErr) throw rdvErr

    // Récupérer les configs des garages pour mapper service -> reminder_type
    const garageIds = [...new Set((rdvs ?? []).map(r => r.garage_id))]
    const { data: configs } = await supabase
      .from('garage_configs')
      .select('garage_id, config')
      .in('garage_id', garageIds)

    const serviceTypeByGarage = new Map<string, Map<string, string>>()
    for (const c of configs ?? []) {
      const services = (c.config?.services ?? []) as Array<{ label: string; reminder_type?: string }>
      const map = new Map<string, string>()
      for (const svc of services) {
        if (svc.label && svc.reminder_type) {
          map.set(svc.label.toLowerCase(), svc.reminder_type)
        }
      }
      serviceTypeByGarage.set(c.garage_id, map)
    }

    // Sélectionner les clients éligibles (pneus + consent + phone)
    const eligibleClients = new Map<string, {
      garage_id: string
      client_id: string
      vehicle: { brand?: string; model?: string } | null
    }>()

    for (const rdv of rdvs ?? []) {
      if (!rdv.service || !rdv.clients?.sms_consent || !rdv.clients?.phone) continue
      const serviceMap = serviceTypeByGarage.get(rdv.garage_id)
      if (!serviceMap) continue
      const type = serviceMap.get(rdv.service.toLowerCase())
      if (type !== 'pneus') continue

      // Garder le rdv le plus récent par client
      const key = rdv.client_id
      if (!eligibleClients.has(key)) {
        eligibleClients.set(key, {
          garage_id: rdv.garage_id,
          client_id: rdv.client_id,
          vehicle: rdv.vehicle,
        })
      }
    }

    // Insérer les rappels (idempotent via unique index sur client_id + reminder_type + season_year)
    let created = 0
    let skipped = 0
    for (const entry of eligibleClients.values()) {
      const { error: insertErr } = await supabase.from('reminders').insert({
        garage_id: entry.garage_id,
        client_id: entry.client_id,
        vehicle: entry.vehicle,
        service_label: null,
        reminder_type: season.type,
        scheduled_at: season.sendDate.toISOString(),
        status: 'pending',
        season_year: season.year,
      })
      if (insertErr) {
        if (insertErr.code === '23505') {
          skipped++
        } else {
          console.error('Insert error:', insertErr)
        }
      } else {
        created++
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        season: season.type,
        season_year: season.year,
        send_date: season.sendDate.toISOString(),
        eligible: eligibleClients.size,
        created,
        skipped,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('plan-seasonal-tires error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Erreur interne' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
