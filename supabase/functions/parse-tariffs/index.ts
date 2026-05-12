import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

type ExtractedService = {
  label: string
  base_price: number
  labor_hours: number
  duration_min: number
}

type ServiceConfig = ExtractedService & { id: string }

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'service'
  )
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  for (let i = 0; i < buffer.length; i++) binary += String.fromCharCode(buffer[i])
  return btoa(binary)
}

async function extractServicesFromPdf(pdfBase64: string): Promise<ExtractedService[]> {
  const prompt = `Tu es un expert en extraction de données structurées depuis des grilles tarifaires de garage automobile en français.

À partir du PDF fourni, extrais TOUS les services/prestations qui ont un prix explicite.

Pour chaque service :
- "label" : libellé du service en français, tel qu'écrit dans le PDF (ex: "Vidange standard", "Plaquettes avant").
- "base_price" : prix des pièces ou prix forfaitaire en euros (nombre, sans symbole). Si la grille donne un prix TTC sans détail main d'œuvre, mets le prix complet ici et "labor_hours" à 0.
- "labor_hours" : nombre d'heures de main d'œuvre si indiqué (ex: "1h" -> 1, "30 min" -> 0.5). Sinon 0.
- "duration_min" : durée d'immobilisation du véhicule en minutes si indiquée. Sinon estime raisonnablement (vidange ~30, freins ~60, embrayage ~240). Entier.

IGNORE :
- Les mentions sans prix (ex: "diagnostic offert", "devis sur demande").
- Les en-têtes, notes de bas de page, conditions générales.
- Les promotions ou remises ponctuelles.

Réponds en JSON strict : { "services": [...] }`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            { inline_data: { mime_type: 'application/pdf', data: pdfBase64 } },
            { text: prompt },
          ],
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              services: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['label', 'base_price', 'labor_hours', 'duration_min'],
                  properties: {
                    label: { type: 'string' },
                    base_price: { type: 'number' },
                    labor_hours: { type: 'number' },
                    duration_min: { type: 'integer' },
                  },
                },
              },
            },
            required: ['services'],
          },
        },
      }),
    }
  )

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gemini API error (${res.status}): ${errText}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
  const parsed = JSON.parse(text)
  return Array.isArray(parsed.services) ? parsed.services : []
}

function normalizeAndDedupe(raw: ExtractedService[]): { services: ServiceConfig[]; warnings: string[] } {
  const warnings: string[] = []
  const seen = new Set<string>()
  const services: ServiceConfig[] = []

  for (const item of raw) {
    if (!item.label || typeof item.label !== 'string') continue

    const cleanLabel = item.label.trim()
    if (!cleanLabel) continue

    const base_price = Math.max(0, Number(item.base_price) || 0)
    const labor_hours = Math.max(0, Number(item.labor_hours) || 0)
    const duration_min = Math.max(0, Math.round(Number(item.duration_min) || 0))

    if (base_price === 0 && labor_hours === 0) {
      warnings.push(`"${cleanLabel}" : aucun prix détecté, ligne ignorée`)
      continue
    }

    let id = slugify(cleanLabel)
    let suffix = 2
    const baseId = id
    while (seen.has(id)) {
      id = `${baseId}-${suffix++}`
    }
    seen.add(id)

    services.push({ id, label: cleanLabel, base_price, labor_hours, duration_min })
  }

  return { services, warnings }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization requise' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData.user) {
      return new Response(
        JSON.stringify({ error: 'Token invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { storage_path } = await req.json()
    if (!storage_path || typeof storage_path !== 'string') {
      return new Response(
        JSON.stringify({ error: 'storage_path requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const folder = storage_path.split('/')[0]
    if (folder !== userData.user.id) {
      return new Response(
        JSON.stringify({ error: 'Accès refusé à ce fichier' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: blob, error: dlErr } = await adminClient.storage
      .from('tariffs')
      .download(storage_path)

    if (dlErr || !blob) {
      return new Response(
        JSON.stringify({ error: 'PDF introuvable' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const base64 = await blobToBase64(blob)
    const raw = await extractServicesFromPdf(base64)
    const { services, warnings } = normalizeAndDedupe(raw)

    return new Response(
      JSON.stringify({ services, warnings }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('parse-tariffs error:', err)
    const message = err instanceof Error ? err.message : 'Erreur interne'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
