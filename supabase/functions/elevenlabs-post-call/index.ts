// Post-call webhook ElevenLabs Conversational AI -> Supabase.
// Reçoit le payload `post_call_transcription` après chaque appel (transcript +
// résumé + analyse), vérifie la signature HMAC, résout le garage (1 agent partagé)
// et upsert l'appel dans `voice_calls`. Idempotent : rejoue sans doublon.
//
// Déploiement : supabase functions deploy elevenlabs-post-call --no-verify-jwt
// Secret requis : ELEVENLABS_WEBHOOK_SECRET (généré à la création du webhook côté ElevenLabs).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, elevenlabs-signature',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const WEBHOOK_SECRET = Deno.env.get('ELEVENLABS_WEBHOOK_SECRET')
const MAX_SIGNATURE_AGE_SECS = 30 * 60 // 30 min — anti-rejeu

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

type TranscriptItem = {
  role?: string
  message?: string | null
  time_in_call_secs?: number
}

type PostCallPayload = {
  type?: string
  event_timestamp?: number
  data?: {
    conversation_id?: string
    agent_id?: string
    status?: string
    transcript?: TranscriptItem[]
    metadata?: {
      start_time_unix_secs?: number
      call_duration_secs?: number
      cost?: number
      phone_call?: {
        direction?: string
        external_number?: string
        agent_number?: string
      }
    }
    analysis?: {
      call_successful?: string
      transcript_summary?: string
      evaluation_criteria_results?: unknown
      data_collection_results?: unknown
    }
    conversation_initiation_client_data?: {
      dynamic_variables?: Record<string, unknown>
    }
  }
}

function normalizePhoneFr(raw: string | null | undefined): string | null {
  if (!raw) return null
  const digits = raw.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return digits
  if (digits.startsWith('0033')) return '+' + digits.slice(2)
  if (digits.startsWith('33') && digits.length >= 11) return '+' + digits
  if (digits.startsWith('0') && digits.length === 10) return '+33' + digits.slice(1)
  return null
}

// Comparaison constant-time pour éviter les timing attacks.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Header `ElevenLabs-Signature` : "t=<unix>,v0=<hmac_sha256(`${t}.${body}`)>".
async function verifySignature(rawBody: string, header: string | null): Promise<{ ok: boolean; reason?: string }> {
  if (!WEBHOOK_SECRET) return { ok: false, reason: 'ELEVENLABS_WEBHOOK_SECRET non configuré' }
  if (!header) return { ok: false, reason: 'Signature manquante' }

  const parts = Object.fromEntries(
    header.split(',').map((p) => {
      const idx = p.indexOf('=')
      return [p.slice(0, idx).trim(), p.slice(idx + 1).trim()]
    }),
  )
  const ts = parts['t']
  const provided = parts['v0']
  if (!ts || !provided) return { ok: false, reason: 'Format de signature invalide' }

  const ageSecs = Math.abs(Math.floor(Date.now() / 1000) - Number(ts))
  if (!Number.isFinite(ageSecs) || ageSecs > MAX_SIGNATURE_AGE_SECS) {
    return { ok: false, reason: 'Signature expirée' }
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${ts}.${rawBody}`))
  const expected = toHex(mac)

  return timingSafeEqual(expected, provided.toLowerCase())
    ? { ok: true }
    : { ok: false, reason: 'Signature invalide' }
}

async function resolveGarageId(data: NonNullable<PostCallPayload['data']>): Promise<string | null> {
  const fromVar = data.conversation_initiation_client_data?.dynamic_variables?.garage_id
  if (typeof fromVar === 'string' && fromVar) return fromVar

  const agentNumber = normalizePhoneFr(data.metadata?.phone_call?.agent_number)
  if (agentNumber) {
    const { data: mapping } = await supabase
      .from('phone_numbers')
      .select('garage_id')
      .eq('twilio_number', agentNumber)
      .eq('active', true)
      .maybeSingle()
    if (mapping) return mapping.garage_id
  }
  return null
}

async function matchClientId(garageId: string | null, callerPhone: string | null): Promise<string | null> {
  if (!garageId || !callerPhone) return null
  // Les numéros clients sont stockés nettoyés (sans +/espaces) par autolead-agent.
  const clean = callerPhone.replace(/[\s.\-()+]/g, '')
  if (!clean) return null
  const { data } = await supabase
    .from('clients')
    .select('id')
    .eq('garage_id', garageId)
    .ilike('phone', `%${clean.slice(-9)}%`)
    .limit(1)
    .maybeSingle()
  return data?.id ?? null
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const rawBody = await req.text()

  const sig = await verifySignature(rawBody, req.headers.get('elevenlabs-signature'))
  if (!sig.ok) {
    console.warn('[elevenlabs-post-call] signature rejetée:', sig.reason)
    return json({ error: 'Unauthorized', reason: sig.reason }, 401)
  }

  let payload: PostCallPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  // On ne traite que la transcription ; on acquitte les autres événements.
  if (payload.type !== 'post_call_transcription' || !payload.data) {
    return json({ ok: true, ignored: payload.type ?? 'unknown' })
  }

  try {
    const data = payload.data
    const conversationId = data.conversation_id
    if (!conversationId) return json({ error: 'conversation_id manquant' }, 400)

    const garageId = await resolveGarageId(data)
    const callerPhone = data.metadata?.phone_call?.external_number ?? null
    const clientId = await matchClientId(garageId, callerPhone)
    const startUnix = data.metadata?.start_time_unix_secs

    const row = {
      garage_id: garageId,
      elevenlabs_conversation_id: conversationId,
      elevenlabs_agent_id: data.agent_id ?? null,
      caller_phone: callerPhone,
      called_number: data.metadata?.phone_call?.agent_number ?? null,
      direction: data.metadata?.phone_call?.direction ?? null,
      status: data.status ?? null,
      call_successful: data.analysis?.call_successful ?? null,
      duration_secs: data.metadata?.call_duration_secs ?? null,
      cost: data.metadata?.cost ?? null,
      started_at: startUnix ? new Date(startUnix * 1000).toISOString() : null,
      transcript: data.transcript ?? [],
      summary: data.analysis?.transcript_summary ?? null,
      data_collected: data.analysis?.data_collection_results ?? null,
      evaluation: data.analysis?.evaluation_criteria_results ?? null,
      client_id: clientId,
      message_count: data.transcript?.length ?? 0,
      raw: payload,
    }

    const { error } = await supabase
      .from('voice_calls')
      .upsert(row, { onConflict: 'elevenlabs_conversation_id' })

    if (error) throw error

    console.log('[elevenlabs-post-call] OK', conversationId, '| garage:', garageId ?? 'NON RÉSOLU')
    return json({ ok: true, conversation_id: conversationId, garage_resolved: !!garageId })
  } catch (err) {
    console.error('[elevenlabs-post-call] erreur:', err)
    return json({ error: err instanceof Error ? err.message : 'Erreur interne' }, 500)
  }
})
