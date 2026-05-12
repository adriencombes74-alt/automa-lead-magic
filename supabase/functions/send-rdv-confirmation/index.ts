// Envoi un email de confirmation au client après création d'un RDV via le chatbot.
// Invoqué en fire-and-forget par la fonction `chat` quand un email client est présent.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
const BREVO_SENDER_EMAIL = Deno.env.get('BREVO_SENDER_EMAIL') ?? 'noreply@autolead.fr'
const BREVO_SENDER_NAME = Deno.env.get('BREVO_SENDER_NAME') ?? 'AutoLead'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

type RdvRow = {
  id: string
  reference: string
  service: string | null
  vehicle: { brand?: string; model?: string; year?: number } | null
  scheduled_at: string
  duration_min: number
  notes: string | null
  client_name: string | null
  client_email: string | null
  client_phone: string | null
  users: { garage_name: string; phone: string | null; address: string | null } | null
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

function formatFr(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function buildEmailHtml(rdv: RdvRow): string {
  const garage = rdv.users?.garage_name ?? 'Le garage'
  const garagePhone = rdv.users?.phone ?? null
  const garageAddress = rdv.users?.address ?? null
  const greeting = rdv.client_name ? `Bonjour ${escapeHtml(rdv.client_name.split(/\s+/)[0])}` : 'Bonjour'
  const vehicleParts = [rdv.vehicle?.brand, rdv.vehicle?.model, rdv.vehicle?.year].filter(Boolean)
  const vehicleText = vehicleParts.length ? escapeHtml(vehicleParts.join(' ')) : '—'

  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px">
  <h2 style="margin:0 0 16px;font-size:20px">Confirmation de votre rendez-vous</h2>
  <p>${greeting},</p>
  <p>Votre rendez-vous chez <strong>${escapeHtml(garage)}</strong> a bien été enregistré. Le garage le validera sous peu.</p>
  <table style="width:100%;border-collapse:collapse;margin:20px 0;background:#f6f7f9;border-radius:8px;overflow:hidden">
    <tr><td style="padding:10px 14px;color:#666;width:40%">Référence</td><td style="padding:10px 14px;font-family:monospace">${escapeHtml(rdv.reference)}</td></tr>
    <tr><td style="padding:10px 14px;color:#666">Date &amp; heure</td><td style="padding:10px 14px"><strong>${escapeHtml(formatFr(rdv.scheduled_at))}</strong></td></tr>
    <tr><td style="padding:10px 14px;color:#666">Durée estimée</td><td style="padding:10px 14px">${rdv.duration_min} minutes</td></tr>
    <tr><td style="padding:10px 14px;color:#666">Service</td><td style="padding:10px 14px">${escapeHtml(rdv.service ?? '—')}</td></tr>
    <tr><td style="padding:10px 14px;color:#666">Véhicule</td><td style="padding:10px 14px">${vehicleText}</td></tr>
  </table>
  ${rdv.notes ? `<p style="background:#fff8e1;padding:12px 14px;border-radius:6px;font-size:14px"><strong>Votre demande :</strong> ${escapeHtml(rdv.notes)}</p>` : ''}
  <p>Pour modifier ou annuler ce rendez-vous, contactez directement le garage${garagePhone ? ` au <a href="tel:${escapeHtml(garagePhone)}">${escapeHtml(garagePhone)}</a>` : ''}.</p>
  ${garageAddress ? `<p style="color:#666;font-size:14px">Adresse : ${escapeHtml(garageAddress)}</p>` : ''}
  <p style="color:#999;font-size:12px;margin-top:32px">Cet email a été envoyé suite à la prise de rendez-vous via notre assistant en ligne.</p>
</body></html>`
}

async function sendBrevoEmail(to: string, toName: string | null, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  if (!BREVO_API_KEY) {
    return { ok: false, error: 'BREVO_API_KEY non configurée' }
  }
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: BREVO_SENDER_EMAIL, name: BREVO_SENDER_NAME },
        to: [{ email: to, name: toName ?? to }],
        subject,
        htmlContent: html,
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { ok: false, error: data?.message ?? `HTTP ${res.status}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur réseau' }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { rdv_id } = await req.json()
    if (!rdv_id) {
      return new Response(JSON.stringify({ error: 'rdv_id requis' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: rdv, error } = await supabase
      .from('rendez_vous')
      .select(`
        id, reference, service, vehicle, scheduled_at, duration_min, notes,
        client_name, client_email, client_phone,
        users:garage_id(garage_name, phone, address)
      `)
      .eq('id', rdv_id)
      .single<RdvRow>()

    if (error || !rdv) {
      return new Response(JSON.stringify({ error: 'RDV introuvable' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!rdv.client_email) {
      return new Response(JSON.stringify({ ok: false, skipped: 'no_email' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const subject = `Confirmation de votre rendez-vous — ${rdv.users?.garage_name ?? 'votre garage'}`
    const html = buildEmailHtml(rdv)
    const sendResult = await sendBrevoEmail(rdv.client_email, rdv.client_name, subject, html)

    if (sendResult.ok) {
      await supabase
        .from('rendez_vous')
        .update({ confirmation_sent_at: new Date().toISOString() })
        .eq('id', rdv.id)
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: false, error: sendResult.error }), {
      status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('send-rdv-confirmation error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Erreur interne' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
