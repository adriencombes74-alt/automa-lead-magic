import type { Service, ReminderType } from './supabase'

export type CatalogEntry = Service & {
  default: boolean
  reminder_type?: ReminderType
}

export const SERVICE_CATALOG: CatalogEntry[] = [
  { id: 'vidange', label: 'Vidange', duration_min: 30, base_price: 65, labor_hours: 0.5, default: true, reminder_type: 'revision' },
  { id: 'freins', label: 'Freins', duration_min: 60, base_price: 180, labor_hours: 1, default: true },
  { id: 'pneus', label: 'Montage pneus', duration_min: 45, base_price: 60, labor_hours: 0.75, default: true, reminder_type: 'pneus' },
  { id: 'diagnostic', label: 'Diagnostic électronique', duration_min: 45, base_price: 50, labor_hours: 0.75, default: true },
  { id: 'climatisation', label: 'Climatisation', duration_min: 60, base_price: 120, labor_hours: 1, default: true },
  { id: 'embrayage', label: 'Embrayage', duration_min: 240, base_price: 800, labor_hours: 4, default: false },
  { id: 'distribution', label: 'Distribution', duration_min: 480, base_price: 750, labor_hours: 8, default: false },
  { id: 'carrosserie', label: 'Carrosserie', duration_min: 120, base_price: 200, labor_hours: 2, default: false },
]

export const DEFAULT_OPENING_HOURS = {
  lundi: { open: '08:00', close: '18:00', closed: false },
  mardi: { open: '08:00', close: '18:00', closed: false },
  mercredi: { open: '08:00', close: '18:00', closed: false },
  jeudi: { open: '08:00', close: '18:00', closed: false },
  vendredi: { open: '08:00', close: '18:00', closed: false },
  samedi: { open: '09:00', close: '12:00', closed: false },
  dimanche: { open: '08:00', close: '12:00', closed: true },
}
