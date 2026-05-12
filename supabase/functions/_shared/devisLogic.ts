export type Vehicle = {
  brand: string
  model?: string
  year?: number
  mileage?: number
}

export type ServiceConfig = {
  id: string
  label: string
  base_price: number
  labor_hours: number
  duration_min: number
  reminder_type?: 'revision' | 'pneus' | 'aucun'
}

export type GarageConfigData = {
  labor_rate?: number
  services?: ServiceConfig[]
}

export type DevisResult = {
  service_label: string
  items: { label: string; qty: number; unit_price: number; total: number }[]
  subtotal: number
  tva_rate: number
  tva_amount: number
  total_ttc: number
  confidence: 'high' | 'medium' | 'low'
  notes: string[]
}

const PREMIUM_BRANDS = ['BMW', 'Mercedes', 'Audi', 'Volvo', 'Porsche', 'Jaguar', 'Land Rover', 'Lexus']

export function calculateDevis(vehicle: Vehicle, serviceId: string, config: GarageConfigData): DevisResult | null {
  const services = config.services ?? []
  const svc = services.find(s => s.id === serviceId || s.label.toLowerCase().includes(serviceId.toLowerCase()))

  if (!svc) return null

  const laborRate = config.labor_rate ?? 75
  let laborCost = svc.labor_hours * laborRate
  let partsCost = svc.base_price

  const notes: string[] = []

  if ((vehicle.mileage ?? 0) > 100000) {
    laborCost += 10
    notes.push('Supplément kilométrage élevé (+10€)')
  }

  const brandUpper = (vehicle.brand ?? '').toUpperCase()
  if (PREMIUM_BRANDS.some(b => brandUpper.includes(b.toUpperCase()))) {
    partsCost = partsCost * 1.3
    notes.push('Pièces marque premium (+30%)')
  }

  const subtotal = Math.round((laborCost + partsCost) * 100) / 100
  const tvaAmount = Math.round(subtotal * 0.20 * 100) / 100
  const totalTtc = Math.round((subtotal + tvaAmount) * 100) / 100

  const confidence: DevisResult['confidence'] =
    vehicle.brand && vehicle.mileage ? 'high' :
    vehicle.brand ? 'medium' : 'low'

  return {
    service_label: svc.label,
    items: [
      { label: `Pièces — ${svc.label}`, qty: 1, unit_price: partsCost, total: partsCost },
      { label: `Main d'œuvre (${svc.labor_hours}h × ${laborRate}€)`, qty: 1, unit_price: laborCost, total: laborCost },
    ],
    subtotal,
    tva_rate: 20,
    tva_amount: tvaAmount,
    total_ttc: totalTtc,
    confidence,
    notes,
  }
}
