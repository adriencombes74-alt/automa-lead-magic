// Envoi un email de bienvenue au garagiste après inscription + une notification admin à Adrien.
// Invoqué en fire-and-forget par src/pages/Signup.tsx après que AuthContext.signUp() retourne sans erreur.

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
const WHATSAPP_NUMBER = Deno.env.get('WHATSAPP_NUMBER') ?? '+33767203484'
const ADMIN_NOTIFICATION_EMAIL = Deno.env.get('ADMIN_NOTIFICATION_EMAIL') ?? 'adriencombes74@gmail.com'
const APP_URL = (Deno.env.get('APP_URL') ?? 'https://app.autolead.fr').replace(/\/$/, '')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

function buildWhatsappLink(garageName: string): string {
  const digitsOnly = WHATSAPP_NUMBER.replace(/[^\d]/g, '')
  const message = `Bonjour Adrien, je viens d'inscrire ${garageName} sur AutoLead AI et j'aimerais qu'on cale un rendez-vous pour configurer mon assistant.`
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`
}

function buildGarageEmailHtml(garageName: string, widgetToken: string): string {
  const greetingName = escapeHtml(garageName)
  const safeToken = escapeHtml(widgetToken)
  const snippet = `<script src="https://cdn.autolead.ai/widget.js" data-widget-token="${safeToken}"></script>`
  const waLink = buildWhatsappLink(garageName)

  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px;background:#fff">
  <h1 style="margin:0 0 8px;font-size:22px">Bienvenue chez AutoLead AI</h1>
  <p style="margin:0 0 20px;color:#666;font-size:15px">${greetingName}, votre essai gratuit de 14 jours commence maintenant.</p>

  <div style="background:#f6f7f9;border-radius:8px;padding:18px 20px;margin:24px 0">
    <h2 style="margin:0 0 10px;font-size:16px">Étape 1 — Installez le widget sur votre site</h2>
    <p style="margin:0 0 12px;font-size:14px;color:#444">Copiez ce code et collez-le juste avant la balise <code style="font-family:monospace;background:#e7e9ec;padding:1px 4px;border-radius:3px">&lt;/body&gt;</code> de votre site :</p>
    <pre style="background:#1a1a1a;color:#e7e9ec;padding:14px;border-radius:6px;font-size:12px;overflow-x:auto;margin:0 0 12px;font-family:monospace;white-space:pre-wrap;word-break:break-all">${escapeHtml(snippet)}</pre>
    <a href="${APP_URL}/dashboard/settings" style="display:inline-block;background:#fff;border:1px solid #d0d4da;color:#1a1a1a;padding:8px 14px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:500">Personnaliser dans le dashboard →</a>
  </div>

  <div style="background:#e7f5ec;border-radius:8px;padding:18px 20px;margin:24px 0">
    <h2 style="margin:0 0 10px;font-size:16px">Besoin d'aide ? Prenons 15 minutes ensemble</h2>
    <p style="margin:0 0 14px;font-size:14px;color:#1a1a1a">On configure votre assistant ensemble, en 15 minutes chrono. Simple, rapide, on s'occupe de tout — vous gardez la main sur votre activité.</p>
    <a href="${waLink}" style="display:inline-block;background:#25D366;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-size:15px;font-weight:600">📱 Réservez votre rendez-vous sur WhatsApp</a>
    <p style="margin:12px 0 0;font-size:12px;color:#666">Un message pré-rempli s'ouvrira directement, vous n'avez qu'à l'envoyer.</p>
  </div>

  <div style="text-align:center;margin:32px 0 8px">
    <a href="${APP_URL}/dashboard" style="display:inline-block;background:#1a1a1a;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:15px;font-weight:600">Accéder à mon tableau de bord</a>
  </div>

  <p style="color:#999;font-size:12px;margin-top:32px;border-top:1px solid #eee;padding-top:16px">Cet email vous a été envoyé suite à votre inscription sur AutoLead AI. Pour toute question, répondez simplement à cet email.</p>
</body></html>`
}

function buildAdminEmailHtml(params: {
  garageName: string
  email: string
  phone: string | null
  widgetToken: string
  signedUpAt: string
}): string {
  const rows = [
    ['Nom du garage', params.garageName],
    ['Email', params.email],
    ['Téléphone', params.phone ?? '—'],
    ['Inscrit le', params.signedUpAt],
    ['Widget token', params.widgetToken],
  ]
  const rowsHtml = rows.map(([k, v]) =>
    `<tr><td style="padding:8px 12px;color:#666;width:35%;border-bottom:1px solid #eee">${escapeHtml(k)}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:${k === 'Widget token' ? 'monospace' : 'inherit'}">${escapeHtml(v)}</td></tr>`
  ).join('')

  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px">
  <h2 style="margin:0 0 16px;font-size:18px">Nouveau garage inscrit sur AutoLead AI</h2>
  <table style="width:100%;border-collapse:collapse;background:#f6f7f9;border-radius:8px;overflow:hidden">${rowsHtml}</table>
  <p style="color:#666;font-size:13px;margin-top:20px">Pense à le contacter rapidement pour caler le rendez-vous de configuration et maximiser la conversion en client payant.</p>
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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization manquante' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const jwt = authHeader.replace(/^Bearer\s+/i, '')
    const { data: userData, error: authErr } = await supabase.auth.getUser(jwt)
    if (authErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'JWT invalide' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userId = userData.user.id
    const userEmail = userData.user.email
    if (!userEmail) {
      return new Response(JSON.stringify({ error: 'Email utilisateur introuvable' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: row, error: dbErr } = await supabase
      .from('users')
      .select('garage_name, phone, garage_configs(widget_token)')
      .eq('id', userId)
      .single<{ garage_name: string; phone: string | null; garage_configs: { widget_token: string } | { widget_token: string }[] | null }>()

    if (dbErr || !row) {
      return new Response(JSON.stringify({ error: 'Garage introuvable' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const configRel = row.garage_configs
    const widgetToken = Array.isArray(configRel) ? configRel[0]?.widget_token : configRel?.widget_token
    if (!widgetToken) {
      return new Response(JSON.stringify({ error: 'widget_token introuvable' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const garageEmailSubject = 'Bienvenue chez AutoLead AI — votre essai gratuit a commencé'
    const garageEmailHtml = buildGarageEmailHtml(row.garage_name, widgetToken)
    const garageResult = await sendBrevoEmail(userEmail, row.garage_name, garageEmailSubject, garageEmailHtml)

    if (!garageResult.ok) {
      console.error('send-welcome-email: garage email failed', garageResult.error)
      return new Response(JSON.stringify({ ok: false, error: garageResult.error }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const signedUpAt = new Date().toLocaleString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
    const adminSubject = `[AutoLead] Nouveau garage inscrit : ${row.garage_name}`
    const adminHtml = buildAdminEmailHtml({
      garageName: row.garage_name,
      email: userEmail,
      phone: row.phone,
      widgetToken,
      signedUpAt,
    })
    const adminResult = await sendBrevoEmail(ADMIN_NOTIFICATION_EMAIL, 'Adrien', adminSubject, adminHtml)
    if (!adminResult.ok) {
      console.error('send-welcome-email: admin email failed', adminResult.error)
    }

    return new Response(JSON.stringify({ ok: true, admin_email_sent: adminResult.ok }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('send-welcome-email error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Erreur interne' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
