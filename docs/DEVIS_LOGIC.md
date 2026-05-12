# DEVIS_LOGIC.md — AutoLead AI

## Logique de Tarification

La génération de devis repose sur 2 couches :
1. **Règles fixes** (catalogue de services) → rapide et prévisible
2. **IA GPT-4o** → affinage selon véhicule, kilométrage, symptômes

---

## Grille Tarifaire Standard

| Service | MO (h) | Pièces (€) | Total HT | TTC |
|---------|--------|-----------|----------|-----|
| Vidange standard | 0.5h | 25€ | 62€ | 74€ |
| Révision 30 000 km | 2h | 120€ | 270€ | 324€ |
| Distribution | 4h | 180€ | 480€ | 576€ |
| Plaquettes avant | 1h | 60€ | 135€ | 162€ |
| Disques + plaquettes 4 roues | 2.5h | 250€ | 437€ | 524€ |
| Recharge clim | 1h | 40€ | 115€ | 138€ |

---

## Algorithme de Calcul

```javascript
function calculateDevis(vehicle, service, config) {
  const svc = config.services.find(s => s.id === service);
  if (!svc) return null; // fallback GPT

  let laborCost = svc.labor_hours * config.labor_rate;
  let partsCost = svc.base_parts_price || 0;

  // Modificateurs kilométrage
  if (vehicle.mileage > 100000) laborCost += 10;
  // Modificateurs véhicule premium
  const premiumBrands = ['BMW', 'Mercedes', 'Audi', 'Volvo', 'Porsche'];
  if (premiumBrands.includes(vehicle.brand)) partsCost *= 1.3;

  const subtotal = laborCost + partsCost;
  const tva = subtotal * 0.20;

  return {
    items: buildLineItems(svc, laborCost, partsCost),
    subtotal: round2(subtotal),
    tva_rate: 20,
    tva_amount: round2(tva),
    total_ttc: round2(subtotal + tva),
    confidence: 'high'
  };
}
```

---

## Exemple de Devis Généré

```json
{
  "vehicle": { "brand": "Renault", "model": "Clio 4", "year": 2019, "mileage": 85000 },
  "service": "freins_avant",
  "items": [
    { "label": "Plaquettes de frein avant", "qty": 1, "unit_price": 65.00, "total": 65.00 },
    { "label": "Nettoyage étriers", "qty": 1, "unit_price": 15.00, "total": 15.00 },
    { "label": "Main d'œuvre (1h)", "qty": 1, "unit_price": 75.00, "total": 75.00 }
  ],
  "subtotal": 155.00,
  "tva_rate": 20,
  "tva_amount": 31.00,
  "total_ttc": 186.00,
  "note": "Prix indicatif. Disques à vérifier lors du contrôle.",
  "confidence": "high"
}
```

---

## Règles Spéciales

- **Km > 100 000** : Note systématique "contrôle des pièces adjacentes conseillé"
- **Véhicule > 15 ans** : Note "sous réserve de disponibilité des pièces"
- **Service complexe** (distribution, embrayage) : confidence = "medium"
- **Service inconnu** → Fallback GPT-4o avec prompt devis (voir PROMPTS.md)

---

## Configuration Taux Horaire

```json
{
  "labor_rate": 75,
  "currency": "EUR",
  "tva_rate": 20
}
```

Valeur par défaut : **75€/h HT** (moyenne nationale garage indépendant).
