import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type GarageProfile = {
  id: string
  garage_name: string
  phone: string | null
  address: string | null
  created_at: string
}

export type RevisionReminderConfig = {
  enabled: boolean
  interval_months: number
  sms_template: string
}

export type SeasonalReminderConfig = {
  enabled: boolean
  send_month: number
  send_day: number
  sms_template: string
}

export type ReminderFrequencies = {
  revision?: RevisionReminderConfig
  pneus_hiver?: SeasonalReminderConfig
  pneus_ete?: SeasonalReminderConfig
}

export type GarageConfig = {
  id: string
  garage_id: string
  widget_token: string
  config: {
    bot_name?: string
    widget_color?: string
    widget_position?: 'bottom-right' | 'bottom-left'
    labor_rate?: number
    services?: Service[]
    opening_hours?: OpeningHours
    reminder_frequencies?: ReminderFrequencies
  }
}

export type ReminderType = 'revision' | 'pneus' | 'aucun'

export type Service = {
  id: string
  label: string
  base_price: number
  labor_hours: number
  duration_min: number
  reminder_type?: ReminderType
}

export type Reminder = {
  id: string
  garage_id: string
  client_id: string
  vehicle: { brand?: string; model?: string } | null
  service_label: string | null
  reminder_type: 'revision' | 'pneus_hiver' | 'pneus_ete'
  scheduled_at: string
  sent_at: string | null
  status: 'pending' | 'sent' | 'cancelled' | 'failed'
  source_rdv_id: string | null
  season_year: number | null
  message_body: string | null
  error_message: string | null
  created_at: string
  clients?: Client
}

export type OpeningHours = {
  [day: string]: { open: string; close: string; closed: boolean }
}

export type Subscription = {
  id: string
  garage_id: string
  plan: 'starter' | 'pro' | 'premium'
  status: 'trialing' | 'active' | 'past_due' | 'canceled'
  trial_end: string | null
  devis_count: number
  rdv_count: number
}

export type Lead = {
  id: string
  garage_id: string
  client_id: string | null
  conversation_id: string | null
  score: number
  status: 'new' | 'contacted' | 'qualified' | 'lost'
  created_at: string
  clients?: Client
  conversations?: Conversation
}

export type Client = {
  id: string
  garage_id: string
  name: string | null
  phone: string | null
  email: string | null
  vehicle_brand: string | null
  vehicle_model: string | null
  vehicle_year: number | null
  sms_consent: boolean
  sms_consent_at: string | null
  created_at: string
}

export type Conversation = {
  id: string
  garage_id: string
  session_id: string
  client_id: string | null
  messages: Message[]
  intent: 'devis' | 'rdv' | 'question' | 'greeting' | 'unknown' | null
  status: 'active' | 'completed' | 'abandoned'
  created_at: string
  clients?: Client
}

export type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export type VoiceTranscriptItem = {
  role: 'agent' | 'user'
  message: string | null
  time_in_call_secs: number
}

// Appel de l'assistant vocal ElevenLabs (table `voice_calls`),
// alimentée par le post-call webhook `elevenlabs-post-call`.
export type VoiceCall = {
  id: string
  garage_id: string | null
  elevenlabs_conversation_id: string
  elevenlabs_agent_id: string | null
  caller_phone: string | null
  called_number: string | null
  direction: string | null
  status: string | null
  call_successful: 'success' | 'failure' | 'unknown' | null
  duration_secs: number | null
  cost: number | null
  started_at: string | null
  transcript: VoiceTranscriptItem[]
  summary: string | null
  data_collected: Record<string, unknown> | null
  evaluation: Record<string, unknown> | null
  client_id: string | null
  rdv_id: string | null
  message_count: number | null
  raw: unknown | null
  created_at: string
  clients?: Client
}

export type Devis = {
  id: string
  garage_id: string
  client_id: string | null
  conversation_id: string | null
  reference: string
  vehicle: { brand: string; model: string; year: number; mileage: number } | null
  service: string | null
  items: DevisItem[]
  subtotal: number
  tva_rate: number
  tva_amount: number
  total_ttc: number
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
  created_at: string
  clients?: Client
}

export type DevisItem = {
  label: string
  qty: number
  unit_price: number
  total: number
}

export type RendezVous = {
  id: string
  garage_id: string
  client_id: string | null
  devis_id: string | null
  reference: string
  service: string | null
  vehicle: { brand?: string; model?: string; year?: number } | null
  scheduled_at: string
  duration_min: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  notes: string | null
  client_name: string | null
  client_phone: string | null
  client_email: string | null
  confirmation_sent_at: string | null
  created_at: string
  clients?: Client
  conversations?: Conversation
}
