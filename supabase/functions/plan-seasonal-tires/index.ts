// Planifie les reminders SMS saisonniers pneus (hiver/été) pour chaque garage.
// Cron: '0 5 * * *' déclenche cette fonction quotidiennement.
// Chaque garage choisit ses dates d'envoi (config.reminder_frequencies.pneus_hiver/ete.send_month/day).
// Le reminder est créé quand la date du jour tombe dans une fenêtre ±3 jours autour de la date configurée.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SEASONAL_WINDOW_DAYS = 3

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

type SeasonalType = 'pneus_hiver' | 'pneus_ete'

type SeasonalCfg = {
  enabled?: boolean
  send_month?: number
  send_day?: number
}

type GarageConfig = {
  garage_id: string
  config: {
    services?: Array<{ label: string; reminder_type?: string }>
    reminder_frequencies?: {
      pneus_hiver?: SeasonalCfg
      pneus_ete?: SeasonalCfg
    }
  } | null
}

type CompletedRdv = {
  garage_id: string
  client_id: string
  service: string | null
  vehicle: { brand?: string; model?: string } | null
  scheduled_at: string
  clients: { id: string; sms_consent: boolean; phone: string | null }
}

function isWithinWindow(today: Date, month: number, day: number, year: number): boolean {
  const target = new Date(Date.UTC(year, month - 1, day))
  const diffMs = Math.abs(today.getTime() - target.getTime())
  return diffMs <= SEASONAL_WINDOW_DAYS * 24 * 60 * 60 * 1000
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
    const year = today.getUTCFullYear()

    // Charger toutes les configs avec leurs reminder_frequencies
    const { data: configs, error: cfgErr } = await supabase
      .from('garage_configs')
      .select('garage_id, config')
      .returns<GarageConfig[]>()

    if (cfgErr) throw cfgErr

    // Déterminer pour chaque garage quel type de pneu (si applicable) doit être planifié aujourd'hui
    type GarageJob = { garageId: string; type: SeasonalType; sendDate: Date; year: number }
    const jobs: GarageJob[] = []

    for (const cfg of configs ?? []) {
      const freqs = cfg.config?.reminder_frequencies
      if (!freqs) continue

      for (const type of ['pneus_hiver', 'pneus_ete'] as const) {
        const seasonal = freqs[type]
        if (!seasonal?.enabled) continue
        const month = seasonal.send_month ?? (type === 'pneus_hiver' ? 10 : 4)
        const day = seasonal.send_day ?? 1
        if (!isWithinWindow(today, month, day, year)) continue

        // Schedule pour 9h UTC du jour cible
        const sendDate = new Date(Date.UTC(year, month - 1, day, 9, 0, 0))
        jobs.push({ garageId: cfg.garage_id, type, sendDate, year })
      }
    }

    if (jobs.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, skipped: true, reason: 'Aucun garage avec date saisonnière proche' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const garageIds = [...new Set(jobs.map(j => j.garageId))]

    // Map garage_id → set des labels de service marqués 'pneus'
    const tireServicesByGarage = new Map<string, Set<string>>()
    for (const cfg of configs ?? []) {
      if (!garageIds.includes(cfg.garage_id)) continue
      const set = new Set<string>()
      for (const svc of cfg.config?.services ?? []) {
        if (svc.label && svc.reminder_type === 'pneus') {
          set.add(svc.label.toLowerCase())
        }
      }
      tireServicesByGarage.set(cfg.garage_id, set)
    }

    // Récupérer les RDV completed des 12 derniers mois pour ces garages
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const { data: rdvs, error: rdvErr } = await supabase
      .from('rendez_vous')
      .select('garage_id, client_id, service, vehicle, scheduled_at, clients!inner(id, sms_consent, phone)')
      .eq('status', 'completed')
      .gte('scheduled_at', oneYearAgo.toISOString())
      .in('garage_id', garageIds)
      .not('client_id', 'is', null)
      .returns<CompletedRdv[]>()

    if (rdvErr) throw rdvErr

    // Pour chaque job (garage × type), trouver les clients éligibles et insérer les reminders
    let created = 0
    let skipped = 0

    for (const job of jobs) {
      const tireLabels = tireServicesByGarage.get(job.garageId)
      if (!tireLabels || tireLabels.size === 0) continue

      const eligibleClients = new Map<string, { vehicle: CompletedRdv['vehicle'] }>()

      for (const rdv of rdvs ?? []) {
        if (rdv.garage_id !== job.garageId) continue
        if (!rdv.service || !rdv.clients?.sms_consent || !rdv.clients?.phone) continue
        if (!tireLabels.has(rdv.service.toLowerCase())) continue

        if (!eligibleClients.has(rdv.client_id)) {
          eligibleClients.set(rdv.client_id, { vehicle: rdv.vehicle })
        }
      }

      for (const [clientId, entry] of eligibleClients) {
        const { error: insertErr } = await supabase.from('reminders').insert({
          garage_id: job.garageId,
          client_id: clientId,
          vehicle: entry.vehicle,
          service_label: null,
          reminder_type: job.type,
          scheduled_at: job.sendDate.toISOString(),
          status: 'pending',
          season_year: job.year,
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
    }

    return new Response(
      JSON.stringify({
        ok: true,
        jobs_evaluated: jobs.length,
        garages_targeted: garageIds.length,
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
