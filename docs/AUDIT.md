# AUDIT.md — AutoLead AI — Analyse Critique & Corrections

## 1. AUDIT GLOBAL

### Points Solides ✅
- Multi-tenant via `garage_id` : bon pattern
- Séparation widget / dashboard / backend : architectural solide
- RLS Supabase : isolation données correcte
- Pricing 3 tiers (29/79/149€) : bien calibré marché FR
- Logique devis hybride (règles + IA) : bonne direction

### Risques Techniques ❌

| Risque | Sévérité | Explication |
|--------|---------|-------------|
| Express + Railway | Haute | Coût infra inutile pour MVP. Next.js API Routes suffisent. |
| IA décidant des prix | CRITIQUE | Hallucinations garanties. L'IA ne doit JAMAIS calculer de prix. |
| Widget bundle custom | Moyenne | Délai 2+ semaines. Iframe simple suffit pour V1. |
| PDFKit Node.js | Faible | Fonctionne mais @react-pdf/renderer plus simple en Next.js |
| Queue Bull + Redis | Hors MVP | Mentionné en "V2" mais distrait l'attention |

### Risques Business ❌

| Risque | Impact |
|--------|--------|
| Onboarding non défini | Churn élevé J1-J7 |
| Pas de table `leads` | Impossible de montrer ROI au garagiste |
| Analytics trop complexes pour MVP | Delai de mise sur marché |
| Trial sans CB | Conversion faible (mieux : CB requis + remboursement garanti) |

---

## 2. PROBLÈMES CRITIQUES

### 🔴 CRITIQUE : L'IA ne doit JAMAIS calculer de prix

**Problème initial :**
```
GPT-4o → génère devis complet avec prix
```

**Problème :** GPT peut inventer des prix, varier selon formulation, créer des incohérences.

**Solution correcte :**
```
Message client → GPT (intention + extraction entités) → devisLogic.js (calcul prix fixe)
```

```javascript
// MAUVAIS
const devis = await openai.chat("Calcule le prix pour des freins Renault Clio");

// BON
const { intent, entities } = await openai.extractIntent(message);
// entities = { service: "freins_avant", brand: "Renault", model: "Clio" }
const devis = devisLogic.calculate(entities, garageConfig.services);
// devisLogic utilise UNIQUEMENT la grille du garagiste
```

**Règle absolue :** GPT = compréhension + extraction. Business logic = calcul prix.

---

### 🔴 CRITIQUE : Stack trop lourde pour MVP

**Plan initial :** Next.js + Express (Railway) + Supabase + Stripe + OpenAI + Resend + PDFKit + Widget custom

**Problème :** 6+ services à configurer avant le premier client. Time-to-market = 3-4 semaines minimum.

**Stack MVP corrigée :**
```
Next.js 14 (App Router)     → Frontend + API Routes (tout en un)
Supabase                    → Auth + DB + Storage (PDF)
Stripe                      → Paiements
OpenAI                      → IA extraction seulement
Resend                      → Emails
```

**Gain :** Suppression de Railway, Express, PDFKit custom, widget bundle. Deploy Vercel en 1 commande.

---

### 🔴 MANQUANT : Table `leads`

La table `leads` est absente du schéma DB. C'est pourtant **le cœur de la valeur pour le garagiste**.

Un lead = visiteur qui a interagi avec le chatbot et laissé ses coordonnées.

**Ajout :**
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id UUID NOT NULL REFERENCES users(id),
  client_name TEXT,
  phone TEXT,
  email TEXT,
  vehicle TEXT,
  need TEXT,
  intent TEXT,           -- devis | rdv | question
  score INT DEFAULT 0,   -- 0-100 (hot/warm/cold)
  status TEXT DEFAULT 'new', -- new | contacted | converted | lost
  source TEXT DEFAULT 'widget',
  conversation_id UUID,
  devis_id UUID,
  rdv_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Lead Scoring :**
```javascript
function scoreLead(conversation) {
  let score = 0;
  if (conversation.intent === 'rdv') score += 40;
  if (conversation.intent === 'devis') score += 30;
  if (conversation.client?.phone) score += 20;
  if (conversation.client?.email) score += 10;
  // score 0-100 → cold/warm/hot
  return score;
}
```

---

### 🟡 SUR-INGÉNIERIE : Widget bundle custom

Pour le MVP, un simple **iframe** suffit :

```html
<!-- V1 : Iframe (2h de travail) -->
<iframe src="https://app.autolead.ai/widget/GARAGE_ID" />

<!-- V2 : Widget JS custom (2 semaines) -->
<script src="widget.min.js" data-garage-id="..."></script>
```

Lancer avec l'iframe → valider marché → construire le widget propre en V2.

---

## 3. CORRECTIONS APPLIQUÉES

### Architecture Corrigée

```
AVANT : Next.js + Express + Railway + Widget custom
APRÈS : Next.js (App Router + API Routes) + Supabase + Vercel
```

### Flux IA Corrigé

```
AVANT : GPT calcule les prix
APRÈS : GPT extrait l'intention → devisLogic.js calcule depuis grille garage
```

### Tables DB Corrigées

```
AJOUT : leads (avec score)
AJOUT : onboarding_steps (suivi progression setup)
```

---

## 4. MVP 7 JOURS — Plan Réaliste

### Objectif
**Signer 3 premiers clients payants** (Starter 29€/mois) en semaine 2.

### Fonctionnalités MVP (et SEULEMENT ça)

| Feature | Inclus MVP ? | Raison |
|---------|-------------|--------|
| Chatbot widget (iframe) | ✅ | Core produit |
| Détection intention (GPT) | ✅ | Core produit |
| Génération devis | ✅ | Valeur immédiate |
| Prise de RDV simple | ✅ | Conversion |
| Dashboard leads | ✅ | Valeur perçue |
| Auth (Supabase) | ✅ | Obligatoire |
| Stripe (1 plan) | ✅ | Revenu |
| Email confirmation RDV | ✅ | Professionnel |
| Export PDF | ❌ | V2 (Pro plan) |
| WhatsApp | ❌ | V3 |
| Google Calendar | ❌ | V2 |
| Analytics avancés | ❌ | V2 |
| Widget JS custom | ❌ | V2 |
| Multi-plans (3 tiers) | ❌ | 1 seul plan au départ |

### Roadmap 7 Jours

```
J1 : Supabase schema + Auth + Stripe setup
J2 : API chat (GPT extraction + devisLogic)
J3 : API devis + API rdv + emails
J4 : Dashboard leads + conversations
J5 : Page landing + pricing + signup flow
J6 : Widget iframe + intégration test
J7 : Deploy Vercel + tests end-to-end
```

---

## 5. RECOMMANDATIONS BUSINESS

### Acquisition rapide (semaine 2+)

1. **Approche directe** : Aller sur Google Maps, chercher 50 garages locaux, envoyer demo personnalisée
2. **Demo en live** : "Je configure votre bot en 5 min pendant qu'on est au téléphone"
3. **Offre lancement** : 3 premiers mois à 19€/mois (puis 29€)

### Onboarding qui convertit

5 étapes maximum, guidées :
1. Nom du garage + téléphone
2. Services proposés (checkboxes pré-remplies)
3. Horaires (template lun-ven 8h-18h)
4. Code widget (1 ligne à copier)
5. ✅ "Votre bot est live !"

### Métriques à tracker dès J1

- Nb de conversations/garage/semaine
- Nb leads générés
- Taux conversations → leads (objectif > 40%)
- MRR + churn

### Anti-churn critique

- Email automatique si 0 conversation depuis 7 jours → "Votre bot attend des clients"
- Rapport hebdomadaire auto : "5 leads cette semaine grâce à AutoLead"
