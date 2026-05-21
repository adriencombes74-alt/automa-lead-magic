# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Vite dev server (http://localhost:8080 — port 8080 is set in vite.config.ts, NOT the Vite default 5173)
npm run build    # Production build (Vite)
npm run preview  # Preview production build
npm run lint     # ESLint
```

No test framework is configured. There is no Docker or CI/CD setup.

## Environment

Frontend env vars (loaded by Vite, must be prefixed `VITE_`):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GOOGLE_PLACES_API_KEY` — optional. Enables Google Places autocomplete on the signup address field ([src/components/signup/AddressAutocomplete.tsx](src/components/signup/AddressAutocomplete.tsx)). If absent the component falls back to 3 manual inputs (street/city/postal). Restrict the key to allowed HTTP referrers in Google Cloud Console.

Edge function secrets (set via Supabase Dashboard → Edge Functions → Secrets, never exposed to client):
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — auto-injected by Supabase
- `GEMINI_API_KEY` — Google Gemini 2.0 Flash
- `BREVO_API_KEY`, `BREVO_SENDER` (SMS), `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` — Brevo for SMS reminders + email confirmations. ⚠️ Brevo's IP allowlist must be disabled (https://app.brevo.com/security/authorised_ips) — Supabase Edge Functions use dynamic IPs.
- `CALENDLY_URL` (default `https://calendly.com/automobilelead-ia/configurer-mon-assistant-autolead-ai`), `ADMIN_NOTIFICATION_EMAIL` (default `adriencombes74@gmail.com`), `APP_URL` (default `https://autolead-nu.vercel.app`) — used by `send-welcome-email`
- Cron secret retrieved server-side via `get_reminder_cron_secret()` PG function

## Architecture

AutoLead AI is a multi-tenant B2B SaaS for French garage owners. **Stack: Vite + React + TypeScript + react-router-dom 6, Supabase (Postgres + Auth + Edge Functions), Google Gemini 2.0 Flash, Brevo (SMS + email), Stripe (planned).**

There is **no Next.js / no API routes layer**. The frontend is a single-page app served by Vite; backend logic lives in Supabase Edge Functions (`supabase/functions/`).

### Tenancy model

One Supabase user = one garage tenant. `garage_id` equals `auth.uid()` and is the partition key on every table. Row-Level Security policies enforce isolation at the database level — the authenticated client never needs to manually filter by tenant. Edge functions use the service role key (which bypasses RLS) and must filter by `garage_id` explicitly.

### Chatbot widget flow

The widget ([src/components/widget/ChatWidget.tsx](src/components/widget/ChatWidget.tsx)) calls the `chat` edge function via `supabase.functions.invoke('chat', { body: { message, session_id, widget_token } })`. This is a public function — no auth required.

[supabase/functions/chat/index.ts](supabase/functions/chat/index.ts):
1. Resolves garage config via `widget_token` (not raw `garage_id`) to prevent enumeration
2. Validates active subscription (`trialing` or `active`)
3. Loads/creates the conversation, fetches the next 14 days of upcoming RDVs (to prevent double-booking)
4. Calls Gemini 2.0 Flash at `temperature: 0.3` with a French system prompt that includes services + durations, opening hours, and already-booked slots. Gemini extracts intent + entities into `data_collected` (vehicle, service, contact, preferred_datetime, notes)
5. Routes to:
   - `calculateDevis()` for quotes (deterministic pricing, never inferred by Gemini)
   - RDV creation when intent=rdv (see below)
6. Persists the full conversation to `conversations` and upserts a `leads` record

**Pricing is always deterministic** — [supabase/functions/_shared/devisLogic.ts](supabase/functions/_shared/devisLogic.ts) computes `labor_hours × rate + parts_cost + modifiers`. Gemini is never used to generate or guess prices.

### RDV creation flow

When Gemini detects `intent: 'rdv'`, the chat function applies **server-side validation** before inserting (defense-in-depth — Gemini may ignore prompt constraints):

1. **Phone required** — refuses without `client_phone`
2. **Future datetime** — rejects past datetimes
3. **Within opening hours** — parses `garage_configs.config.opening_hours` and rejects out-of-hours slots
4. **No conflict** — checks overlap against the upcoming-14-days RDVs window
5. **Service-specific duration** — uses `services[].duration_min` from garage config (not a 60-min default)
6. **Status: `pending`** — garage owner confirms manually from the dashboard
7. **Reference collision retry** — 5 attempts on unique constraint violation (`23505`)
8. **Email confirmation** — fire-and-forget invocation of `send-rdv-confirmation` if `client_email` is present

`rendez_vous` rows store denormalized client contact (`client_name/phone/email`), `notes` (one-line summary of the client's request, extracted by Gemini), and `confirmation_sent_at`. The dashboard agenda ([src/pages/dashboard/Rdv.tsx](src/pages/dashboard/Rdv.tsx)) uses these fields directly so the garage owner sees full context without joins.

### Signup flow

5-step premium signup in [src/pages/Signup.tsx](src/pages/Signup.tsx):
1. **Compte** — email + password
2. **Garage** — name, phone (required, FR format), address (Google Places autocomplete with manual fallback), website (optional)
3. **Services** — multi-select from [src/lib/serviceCatalog.ts](src/lib/serviceCatalog.ts) (5 defaults pre-checked); skippable via "On le fait pour vous"
4. **Horaires** — 7-day editable schedule (defaults from `DEFAULT_OPENING_HOURS`); same skip option
5. **Démarrage** — success screen with inline Calendly embed for 15-min config call + dashboard CTA

`AuthContext.signUp(email, password, profile, config)` takes the full multi-step payload and inserts `users` + `garage_configs` + `subscriptions`. After success, [src/pages/Signup.tsx](src/pages/Signup.tsx) invokes `send-welcome-email` fire-and-forget with `{ help_requested: { services, hours } }` flags — when any flag is true, the admin notification email gets a warning banner so Adrien knows to follow up manually.

Form state is persisted in `localStorage` under `autolead-signup-draft` (passwords stripped before save). Cleared after successful signup.

### Edge functions

Located in [supabase/functions/](supabase/functions/):

| Function | Purpose |
|---|---|
| `chat` | Public chatbot entry point — Gemini orchestration + devis/RDV creation |
| `send-rdv-confirmation` | HTTP-invoked: sends email confirmation via Brevo when a RDV is created with a client email |
| `send-welcome-email` | JWT-required: sends garagiste welcome email (widget snippet + Calendly CTA) + admin notification on signup. Accepts `{ help_requested: { services?, hours? } }` body to flag accounts needing manual config |
| `send-reminders` | Cron-invoked (`x-cron-secret` header): sends maintenance SMS reminders via Brevo |
| `parse-tariffs` | Auth-required: parses uploaded tariff sheets |
| `plan-seasonal-tires` | Auth-required: schedules seasonal tire reminders |

Deploy with `supabase functions deploy <name>`. Migrations apply with `supabase db push`.

### Key data model

| Table | Purpose |
|---|---|
| `users` | Garage tenants — one row per garage, `id = auth.uid()`. Fields: `garage_name`, `phone` (NOT NULL, FR format), `address`, `city`, `postal_code`, `website` |
| `garage_configs` | JSONB blob per garage: services (with `duration_min`), labor rate, opening hours, widget branding, widget_token |
| `subscriptions` | Stripe subscription state + monthly usage counters |
| `clients` | Prospect contacts scoped to a garage; unique on `(garage_id, phone)` |
| `conversations` | Full chat sessions, messages stored as JSONB array, intent enum |
| `leads` | CRM pipeline; score 0-100 |
| `devis` | Estimates with vehicle + line items as JSONB |
| `rendez_vous` | Appointments — `scheduled_at`, `duration_min`, denormalized client contact, `notes`, `confirmation_sent_at`. Unique index on `(garage_id, reference)` |
| `reminders` | Scheduled SMS reminders (revision/pneus_hiver/pneus_ete), populated by trigger when RDV completed |
| `usage_logs` | Audit trail per garage |

Schema lives in [supabase/migrations/](supabase/migrations/): `001_initial_schema.sql`, `002_tariffs_storage.sql`, `003_reminders.sql`, `004_rdv_enhancements.sql`, `005_signup_fields.sql`. RLS policy on every tenant-scoped table: `auth.uid() = garage_id`.

### Frontend structure

- [src/App.tsx](src/App.tsx) — root router (react-router-dom)
- [src/pages/](src/pages/) — landing page, auth pages (Login, Signup, ForgotPassword, ResetPassword), [TestWidget.tsx](src/pages/TestWidget.tsx) (dev-only chatbot test page)
- [src/pages/dashboard/](src/pages/dashboard/) — protected dashboard pages: `Overview`, `Leads`, `Conversations`, `Devis`, `Rdv`, `Reminders`, `Settings`
- [src/components/dashboard/](src/components/dashboard/) — `DashboardLayout` with sidebar
- [src/components/widget/ChatWidget.tsx](src/components/widget/ChatWidget.tsx) — embeddable chatbot widget
- [src/components/landing/](src/components/landing/) — landing page sections
- [src/components/ui/](src/components/ui/) — shadcn/ui (base-nova style)
- [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx) — `useAuth()` hook (user, garageId, session)
- [src/lib/supabase.ts](src/lib/supabase.ts) — frontend Supabase client + all shared TypeScript types (`RendezVous`, `Client`, `Conversation`, `Devis`, `Lead`, `GarageConfig`, etc.)

Auth uses Supabase Auth with JWT. The dashboard layout reads `useAuth()` and redirects unauthenticated users.

### Testing the chatbot end-to-end

A dev-only neutral test page is wired at `/test-widget` ([src/pages/TestWidget.tsx](src/pages/TestWidget.tsx)). It renders `ChatWidget` with a hardcoded `widget_token` for the test garage account "TEST" on the remote Supabase project (which has 1 service "Vidange" + opening hours + an active trialing subscription). Run `npm run dev` then open **http://localhost:8080/test-widget** — no auth required.

Created RDVs land in the TEST garage's dashboard (`/dashboard/rdv`) with status `pending`. To inspect, log in with the TEST account and use the agenda Sheet detail view.

### Subscription plans

Starter (€29) / Pro (€79) / Premium (€149) per month. Limits enforced via `subscriptions.devis_count` and `subscriptions.rdv_count`. Monthly counters reset via `reset_monthly_usage()` PG trigger. Stripe webhook handler is **not yet wired** (no edge function for it).

## Sources of Truth

- Pricing rules → [docs/DEVIS_LOGIC.md](docs/DEVIS_LOGIC.md)
- Prompts → [docs/PROMPTS.md](docs/PROMPTS.md)
- Architecture → [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Database schema → [docs/DATABASE.md](docs/DATABASE.md)

Always refer to these files before making decisions.

## Business Priorities

1. Capture the lead (name, phone, email) as early as possible
2. Guide the user toward a quote or appointment
3. Keep responses simple and action-oriented
4. Avoid long explanations unless necessary

## Conventions

- Path alias `@/*` maps to `src/*`
- UI components: shadcn/ui (base-nova style) in `src/components/ui/`, animation primitives in `src/components/magicui/`
- Edge functions are Deno (not Node) — imports use `https://esm.sh/...` URLs
- Shared TS code between edge functions lives in [supabase/functions/_shared/](supabase/functions/_shared/)
- The `docs/` directory contains detailed references: `API.md`, `DATABASE.md`, `DEVIS_LOGIC.md`, `MULTI_TENANT.md`, `PROMPTS.md`
