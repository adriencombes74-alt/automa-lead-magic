# MONETIZATION.md — AutoLead AI

## Structure Tarifaire

### Plans & Prix

| Plan | Prix mensuel | Prix annuel (-20%) |
|------|-------------|-------------------|
| **Starter** | 29€/mois | 278€/an |
| **Pro** | 79€/mois | 758€/an |
| **Premium** | 149€/mois | 1 430€/an |

---

## Détail des Plans

### 🟢 Starter — 29€/mois

**Cible** : Petit garage solo, test du produit

| Feature | Limite |
|---------|--------|
| Devis générés | 30/mois |
| RDV pris | 30/mois |
| Conversations | 100/mois |
| Branding widget | "Powered by AutoLead" |
| Export PDF devis | ❌ |
| SMS notifications | ❌ |
| Google Calendar | ❌ |
| Analytics avancés | ❌ |
| Support | Email (48h) |

---

### 🔵 Pro — 79€/mois

**Cible** : Garage établi, 2-5 mécaniciens

| Feature | Limite |
|---------|--------|
| Devis générés | 150/mois |
| RDV pris | 150/mois |
| Conversations | 500/mois |
| Branding widget | Custom |
| Export PDF devis | ✅ |
| SMS notifications | ✅ (inclus 200 SMS) |
| Google Calendar | ✅ |
| Analytics avancés | ✅ |
| Support | Email (24h) + Chat |

---

### 🟡 Premium — 149€/mois

**Cible** : Groupe de garages, multi-sites

| Feature | Limite |
|---------|--------|
| Devis générés | Illimité |
| RDV pris | Illimité |
| Conversations | Illimité |
| Branding widget | White-label complet |
| Export PDF devis | ✅ |
| SMS notifications | ✅ (inclus 500 SMS) |
| WhatsApp Business | ✅ |
| Google Calendar | ✅ |
| Analytics avancés | ✅ |
| API accès | ✅ |
| Support | Prioritaire + Onboarding |

---

## Upsells & Add-ons

### Pack SMS — 9€/mois
- 200 SMS supplémentaires/mois
- Notifications RDV automatiques
- Rappels 24h avant

### WhatsApp Business — 19€/mois
- Chatbot sur WhatsApp
- Devis par WhatsApp
- Notifications clients

### Google Calendar Sync — 9€/mois
- Sync bidirectionnelle
- Blocage créneaux automatique
- Rappels intégrés

### Multi-site — 49€/mois par site additionnel
- Pour les groupes de garages
- Dashboard centralisé
- Stats consolidées

---

## Stripe Integration

### Price IDs (à créer dans Stripe Dashboard)

```javascript
const STRIPE_PRICES = {
  starter_monthly: 'price_starter_monthly_29',
  starter_yearly:  'price_starter_yearly_278',
  pro_monthly:     'price_pro_monthly_79',
  pro_yearly:      'price_pro_yearly_758',
  premium_monthly: 'price_premium_monthly_149',
  premium_yearly:  'price_premium_yearly_1430',
  // Add-ons
  sms_pack:        'price_sms_9',
  whatsapp:        'price_whatsapp_19',
  gcal:            'price_gcal_9',
  multisite:       'price_multisite_49',
};
```

### Webhooks Stripe à gérer

```
customer.subscription.created   → Activer compte
customer.subscription.updated   → Changer plan
customer.subscription.deleted   → Suspendre accès
invoice.payment_failed          → Email relance
invoice.paid                    → Renouvellement OK
```

---

## Métriques Financières

### CAC (Coût Acquisition Client) Cible
- SEO/Content : ~15€/client
- Google Ads : ~40€/client
- Partenariats carrossiers : ~20€/client

### LTV (Lifetime Value)

| Plan | MRR | Rétention moy. | LTV |
|------|-----|----------------|-----|
| Starter | 29€ | 8 mois | 232€ |
| Pro | 79€ | 18 mois | 1 422€ |
| Premium | 149€ | 30 mois | 4 470€ |

### LTV/CAC Ratio Cible : > 3x

### Expansion Revenue
- Upsell taux cible : 30% des clients Pro → Premium
- Add-ons taux cible : 20% des clients actifs

---

## Churn Reduction

### Stratégies anti-churn intégrées au produit

1. **Onboarding séquentiel** : Guided setup (5 étapes) le jour J
2. **Score d'engagement** : Alerter si garage n'utilise pas le widget
3. **Email J+3** : "Votre 1er lead AutoLead AI !" (social proof)
4. **Email J+30** : Rapport mensuel automatique (leads, RDV, CA estimé)
5. **Downgrade doux** : Si paiement échoue → Starter vs suspension brutale

---

## Projections Revenus (Scénario Base)

| Mois | Garages Starter | Garages Pro | Garages Premium | MRR |
|------|----------------|-------------|-----------------|-----|
| M1 | 10 | 3 | 1 | 676€ |
| M3 | 30 | 10 | 3 | 1 757€ |
| M6 | 80 | 30 | 10 | 5 242€ |
| M12 | 200 | 80 | 30 | 16 070€ |
| M18 | 400 | 150 | 60 | 30 410€ |

**Break-even** : ~M4 (avec coûts infra + 1 développeur)

---

## Trial & Conversion

- **Trial** : 14 jours gratuits (sans CB) sur plan Starter
- **Conversion trial → payant** : Objectif 25%
- **Freemium** : Pas de plan gratuit permanent (évite le "tire-au-flanc")

---

## Pricing Psychologique

- Afficher prix annuel en premier (économie visible)
- Plan Pro mis en avant (badge "Recommandé")
- Anchoring : Premium rend Pro plus attractif
- Prix en HT sur le dashboard (garagistes = professionnels)
