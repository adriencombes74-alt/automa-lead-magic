import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { calculateDevis, Vehicle } from '../_shared/devisLogic.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

type GeminiResponse = {
  intent: 'devis' | 'rdv' | 'question' | 'greeting' | 'unknown'
  message: string
  next_action: 'collect_vehicle' | 'collect_service' | 'collect_contact' | 'collect_datetime' | 'collect_sms_consent' | 'confirm_devis' | 'confirm_rdv' | 'answer' | 'none'
  data_collected: {
    vehicle_brand?: string
    vehicle_model?: string
    vehicle_year?: number
    vehicle_mileage?: number
    service_id?: string
    service_label?: string
    client_name?: string
    client_phone?: string
    client_email?: string
    sms_consent?: boolean
    preferred_datetime?: string
    notes?: string
  }
}

type OpeningHours = Record<string, { open?: string; close?: string; closed?: boolean }>

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

function isWithinOpeningHours(dt: Date, hours?: OpeningHours): boolean {
  if (!hours) return true
  const day = DAY_KEYS[dt.getDay()]
  const slot = hours[day]
  if (!slot || slot.closed) return false
  if (!slot.open || !slot.close) return true
  const [oh, om] = slot.open.split(':').map(Number)
  const [ch, cm] = slot.close.split(':').map(Number)
  const minutes = dt.getHours() * 60 + dt.getMinutes()
  return minutes >= (oh * 60 + om) && minutes < (ch * 60 + cm)
}

function hasConflict(
  scheduled: Date,
  duration: number,
  upcoming: { scheduled_at: string; duration_min: number }[]
): boolean {
  const start = scheduled.getTime()
  const end = start + duration * 60_000
  return upcoming.some(r => {
    const rs = new Date(r.scheduled_at).getTime()
    const re = rs + (r.duration_min ?? 60) * 60_000
    return start < re && end > rs
  })
}

async function callGemini(prompt: string): Promise<GeminiResponse> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 512,
          responseMimeType: 'application/json',
        },
      }),
    }
  )
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
  try {
    return JSON.parse(text)
  } catch {
    return { intent: 'unknown', message: text, next_action: 'answer', data_collected: {} }
  }
}

function buildSystemPrompt(
  garageConfig: Record<string, unknown>,
  history: { role: string; content: string }[],
  upcoming: { scheduled_at: string; duration_min: number }[],
): string {
  const services = (garageConfig.services as { id: string; label: string; duration_min?: number }[] ?? [])
    .map(s => `- ${s.label} (id: ${s.id}${s.duration_min ? `, durée ${s.duration_min} min` : ''})`)
    .join('\n')

  const historyText = history
    .slice(-10)
    .map(m => `${m.role === 'user' ? 'Client' : 'Assistant'}: ${m.content}`)
    .join('\n')

  const hours = garageConfig.opening_hours as OpeningHours | undefined
  const dayLabels: Record<string, string> = {
    monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi', thursday: 'Jeudi',
    friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche',
  }
  const hoursText = hours
    ? Object.entries(dayLabels)
        .map(([key, label]) => {
          const slot = hours[key]
          if (!slot || slot.closed) return `- ${label} : fermé`
          return `- ${label} : ${slot.open ?? '?'} – ${slot.close ?? '?'}`
        })
        .join('\n')
    : '(non configurés — propose des créneaux en journée du lundi au vendredi 9h-18h)'

  const today = new Date()
  const upcomingText = upcoming.length
    ? upcoming
        .map(r => {
          const d = new Date(r.scheduled_at)
          return `- ${d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })} (${r.duration_min} min)`
        })
        .join('\n')
    : '(aucun)'

  return `Tu es un assistant intelligent pour le garage "${garageConfig.garage_name ?? 'ce garage'}".
Ton rôle : répondre en français, capturer les infos client (prénom, téléphone), générer des devis et prendre des RDV.

Date/heure actuelle : ${today.toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}

Services disponibles :
${services || 'Non configurés'}

Horaires d'ouverture du garage :
${hoursText}

Créneaux DÉJÀ PRIS dans les 14 prochains jours (à éviter absolument) :
${upcomingText}

Historique de la conversation :
${historyText || '(début de conversation)'}

RÈGLES IMPORTANTES :
- Réponds TOUJOURS en JSON valide avec exactement ces champs : intent, message, next_action, data_collected
- intent : "devis" | "rdv" | "question" | "greeting" | "unknown"
- next_action : "collect_vehicle" | "collect_service" | "collect_contact" | "collect_datetime" | "collect_sms_consent" | "confirm_devis" | "confirm_rdv" | "answer" | "none"
- message : ta réponse en français (2-3 phrases max, chaleureuse et directe)
- data_collected : les infos extraites (vehicle_brand, vehicle_model, vehicle_year, vehicle_mileage, service_id, service_label, client_name, client_phone, client_email, sms_consent, preferred_datetime, notes)
- preferred_datetime : format ISO 8601 strict (ex. "2026-05-15T14:30:00") — heure locale du garage, postérieure à maintenant
- notes : résume en UNE phrase ce que demande le client (problème décrit, urgence, contexte particulier). Ex. "Bruit anormal moteur depuis 3 jours" ou "Révision préventive avant départ en vacances"
- RÈGLE RDV : ne propose JAMAIS un créneau hors-horaires d'ouverture, ni un créneau déjà pris ci-dessus. Si le client demande un créneau invalide, propose le créneau libre le plus proche dans les horaires.
- TÉLÉPHONE OBLIGATOIRE : ne valide jamais un RDV sans téléphone client. Demande-le explicitement si manquant.
- Email facultatif mais demandé une fois pour envoyer la confirmation : "Quel est ton email pour la confirmation ?"
- Ne jamais inventer de prix — les prix sont calculés côté serveur
- APRÈS avoir collecté le téléphone, demande une seule fois : "Souhaites-tu recevoir un SMS de rappel pour tes prochains entretiens (révision, pneus) ? Tu peux te désinscrire à tout moment." → met next_action="collect_sms_consent"
- Si le client répond oui/d'accord → data_collected.sms_consent=true. Sinon → false
- Tutoyer le client`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { message, session_id, widget_token } = body

    if (!message || !session_id || !widget_token) {
      return new Response(
        JSON.stringify({ error: 'message, session_id et widget_token sont requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Résoudre le garage depuis le widget_token
    const { data: configRow, error: configErr } = await supabase
      .from('garage_configs')
      .select('garage_id, config')
      .eq('widget_token', widget_token)
      .single()

    if (configErr || !configRow) {
      return new Response(
        JSON.stringify({ error: 'Widget token invalide' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const garageId = configRow.garage_id
    const garageConfig = configRow.config ?? {}

    // 2. Valider subscription
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status, plan')
      .eq('garage_id', garageId)
      .single()

    if (!sub || !['active', 'trialing'].includes(sub.status)) {
      return new Response(
        JSON.stringify({ reply: "Ce service n'est pas disponible pour le moment. Veuillez contacter le garage directement.", session_id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Charger ou créer la conversation
    let conversation: { id: string; messages: { role: string; content: string; timestamp: string }[] } | null = null
    const { data: existing } = await supabase
      .from('conversations')
      .select('id, messages')
      .eq('session_id', session_id)
      .eq('garage_id', garageId)
      .maybeSingle()

    if (existing) {
      conversation = existing
    } else {
      const { data: created } = await supabase
        .from('conversations')
        .insert({ garage_id: garageId, session_id, messages: [], status: 'active' })
        .select('id, messages')
        .single()
      conversation = created
    }

    if (!conversation) throw new Error('Impossible de créer la conversation')

    const history = conversation.messages ?? []

    // 4. Charger les créneaux pris dans les 14 prochains jours pour les passer au prompt
    const now = new Date()
    const horizon = new Date(now.getTime() + 14 * 24 * 3600 * 1000)
    const { data: upcomingRdvs } = await supabase
      .from('rendez_vous')
      .select('scheduled_at, duration_min')
      .eq('garage_id', garageId)
      .gte('scheduled_at', now.toISOString())
      .lt('scheduled_at', horizon.toISOString())
      .neq('status', 'cancelled')
      .order('scheduled_at', { ascending: true })

    const upcoming = upcomingRdvs ?? []

    // 5. Appeler Gemini
    const prompt = buildSystemPrompt({ ...garageConfig, garage_name: garageConfig.garage_name }, history, upcoming) +
      `\n\nMessage du client : "${message}"\n\nRépondre en JSON valide uniquement.`

    const geminiResult = await callGemini(prompt)
    const { intent, message: reply, data_collected } = geminiResult

    let finalReply = reply
    let devisId: string | null = null
    let rdvId: string | null = null

    // 5. Router selon l'intent
    if (intent === 'devis' && data_collected.service_id && data_collected.vehicle_brand) {
      const vehicle: Vehicle = {
        brand: data_collected.vehicle_brand ?? '',
        model: data_collected.vehicle_model,
        year: data_collected.vehicle_year,
        mileage: data_collected.vehicle_mileage,
      }

      const devisResult = calculateDevis(vehicle, data_collected.service_id, garageConfig as Record<string, unknown> as Parameters<typeof calculateDevis>[2])

      if (devisResult) {
        const ref = `DEV-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`
        const { data: devisRow } = await supabase
          .from('devis')
          .insert({
            garage_id: garageId,
            conversation_id: conversation.id,
            reference: ref,
            vehicle: { brand: vehicle.brand, model: vehicle.model, year: vehicle.year, mileage: vehicle.mileage },
            service: devisResult.service_label,
            items: devisResult.items,
            subtotal: devisResult.subtotal,
            tva_rate: devisResult.tva_rate,
            tva_amount: devisResult.tva_amount,
            total_ttc: devisResult.total_ttc,
            status: 'pending',
          })
          .select('id')
          .single()

        devisId = devisRow?.id ?? null
        finalReply = `${reply}\n\n📋 Devis estimatif : **${devisResult.total_ttc.toFixed(2)} € TTC** (${devisResult.service_label}).${devisResult.notes.length ? ' ' + devisResult.notes.join(', ') + '.' : ''} Confirmation après diagnostic.`
      }
    }

    if (intent === 'rdv' && data_collected.preferred_datetime) {
      const scheduled = new Date(data_collected.preferred_datetime)
      const services = (garageConfig.services as { id: string; label: string; duration_min?: number }[] ?? [])
      const selectedService = services.find(s => s.id === data_collected.service_id)
      const duration = selectedService?.duration_min ?? 60

      // Validation côté serveur (defense-in-depth — Gemini peut ignorer les contraintes)
      if (!data_collected.client_phone) {
        finalReply = `Pour valider ton rendez-vous, j'ai besoin de ton numéro de téléphone. Tu peux me le donner ?`
      } else if (isNaN(scheduled.getTime()) || scheduled.getTime() < Date.now()) {
        finalReply = `Le créneau proposé n'est pas valide. Peux-tu me donner une autre date/heure ?`
      } else if (!isWithinOpeningHours(scheduled, garageConfig.opening_hours as OpeningHours | undefined)) {
        finalReply = `Ce créneau est en dehors de nos horaires d'ouverture. Peux-tu m'en proposer un autre ?`
      } else if (hasConflict(scheduled, duration, upcoming)) {
        finalReply = `Ce créneau est déjà pris. Peux-tu m'en proposer un autre ?`
      } else {
        // Upsert client
        const consentPatch = typeof data_collected.sms_consent === 'boolean'
          ? { sms_consent: data_collected.sms_consent, sms_consent_at: data_collected.sms_consent ? new Date().toISOString() : null }
          : {}
        const { data: clientRow } = await supabase
          .from('clients')
          .upsert({
            garage_id: garageId,
            name: data_collected.client_name ?? null,
            phone: data_collected.client_phone,
            email: data_collected.client_email ?? null,
            vehicle_brand: data_collected.vehicle_brand ?? null,
            vehicle_model: data_collected.vehicle_model ?? null,
            vehicle_year: data_collected.vehicle_year ?? null,
            ...consentPatch,
          }, { onConflict: 'garage_id,phone', ignoreDuplicates: false })
          .select('id')
          .single()
        const clientId = clientRow?.id ?? null

        // Insertion avec retry sur collision de référence (index unique garage_id+reference)
        const buildRef = () => `RDV-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`
        let rdvRow: { id: string } | null = null
        for (let attempt = 0; attempt < 5 && !rdvRow; attempt++) {
          const { data, error } = await supabase
            .from('rendez_vous')
            .insert({
              garage_id: garageId,
              client_id: clientId,
              reference: buildRef(),
              service: data_collected.service_label ?? null,
              vehicle: (data_collected.vehicle_brand || data_collected.vehicle_model || data_collected.vehicle_year)
                ? {
                    brand: data_collected.vehicle_brand ?? null,
                    model: data_collected.vehicle_model ?? null,
                    year: data_collected.vehicle_year ?? null,
                  }
                : null,
              scheduled_at: scheduled.toISOString(),
              duration_min: duration,
              status: 'pending',
              notes: data_collected.notes ?? null,
              client_name: data_collected.client_name ?? null,
              client_phone: data_collected.client_phone,
              client_email: data_collected.client_email ?? null,
            })
            .select('id')
            .single()
          if (data) rdvRow = data
          else if (error && error.code !== '23505') break
        }

        if (rdvRow) {
          rdvId = rdvRow.id
          finalReply = `✅ ${reply}`

          // Email de confirmation (fire-and-forget)
          if (data_collected.client_email) {
            supabase.functions.invoke('send-rdv-confirmation', {
              body: { rdv_id: rdvRow.id },
            }).catch(err => console.error('send-rdv-confirmation failed', err))
          }
        } else {
          finalReply = `Désolé, je n'ai pas pu enregistrer ton rendez-vous. Peux-tu réessayer ?`
        }
      }
    }

    // 6. Auto-créer/mettre à jour le lead si on a des infos client
    if (data_collected.client_phone || data_collected.client_name) {
      const consentPatch = typeof data_collected.sms_consent === 'boolean'
        ? { sms_consent: data_collected.sms_consent, sms_consent_at: data_collected.sms_consent ? new Date().toISOString() : null }
        : {}
      const { data: clientRow } = await supabase
        .from('clients')
        .upsert({
          garage_id: garageId,
          name: data_collected.client_name ?? null,
          phone: data_collected.client_phone ?? null,
          email: data_collected.client_email ?? null,
          vehicle_brand: data_collected.vehicle_brand ?? null,
          vehicle_model: data_collected.vehicle_model ?? null,
          vehicle_year: data_collected.vehicle_year ?? null,
          ...consentPatch,
        }, { onConflict: 'garage_id,phone', ignoreDuplicates: false })
        .select('id')
        .single()

      if (clientRow) {
        const score = (data_collected.client_phone ? 40 : 0) + (data_collected.client_name ? 20 : 0) + (intent === 'devis' ? 20 : 0) + (intent === 'rdv' ? 20 : 0)
        await supabase.from('leads').upsert({
          garage_id: garageId,
          client_id: clientRow.id,
          conversation_id: conversation.id,
          score,
          status: 'new',
        }, { onConflict: 'garage_id,client_id', ignoreDuplicates: false })
      }
    }

    // 7. Persister les messages
    const newMessages = [
      ...history,
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: finalReply, timestamp: new Date().toISOString() },
    ]

    await supabase.from('conversations').update({
      messages: newMessages,
      intent: intent !== 'unknown' && intent !== 'greeting' ? intent : undefined,
      status: 'active',
    }).eq('id', conversation.id)

    return new Response(
      JSON.stringify({ reply: finalReply, intent, session_id, conversation_id: conversation.id, devis_id: devisId, rdv_id: rdvId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error(err)
    return new Response(
      JSON.stringify({ error: 'Erreur interne', reply: "Désolé, une erreur s'est produite. Veuillez réessayer." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
