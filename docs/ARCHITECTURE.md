# ARCHITECTURE.md — AutoLead AI

## Vue d'Ensemble

AutoLead AI est un SaaS **multi-tenant** organisé en 3 couches indépendantes :

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Garagiste)                    │
│  ┌─────────────────┐    ┌──────────────────────────┐   │
│  │   Dashboard      │    │  Widget JS (son site web) │   │
│  │   Next.js 14     │    │  <script data-garage-id> │   │
│  └────────┬─────────┘    └─────────────┬────────────┘   │
└───────────┼──────────────────────────┼──────────────────┘
            │ HTTPS / REST             │ HTTPS / REST
┌───────────┼──────────────────────────┼──────────────────┐
│           │        API LAYER         │                   │
│  ┌────────▼─────────────────────────▼────────────────┐  │
│  │              Express.js REST API                   │  │
│  │  /auth  /chat  /devis  /rdv  /subscription        │  │
│  │  /dashboard  /config  /webhook                    │  │
│  └──────┬─────────┬──────────────┬───────────────────┘  │
│         │         │              │                       │
│  ┌──────▼──┐  ┌───▼────┐  ┌─────▼──────┐               │
│  │ OpenAI  │  │ Stripe │  │  Resend    │               │
│  │ GPT-4o  │  │  API   │  │  (emails)  │               │
│  └─────────┘  └────────┘  └────────────┘               │
└───────────────────────────────────────────────────────────┘
            │
┌───────────▼───────────────────────────────────────────────┐
│                    DATA LAYER (Supabase)                   │
│                                                            │
│  ┌────────┐ ┌──────────┐ ┌─────────┐ ┌──────────────┐   │
│  │ users  │ │ clients  │ │  devis  │ │ rendez_vous  │   │
│  │garages │ │          │ │         │ │              │   │
│  └────────┘ └──────────┘ └─────────┘ └──────────────┘   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐  │
│  │conversations │ │ subscriptions│ │  garage_configs  │  │
│  └──────────────┘ └──────────────┘ └──────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## Architecture Multi-Tenant

### Principe d'Isolation

Chaque garagiste (tenant) est identifié par un `garage_id` UUID unique.
Toutes les ressources sont scoped par ce `garage_id` :

```
users (garages)
    └── garage_id: UUID (PK)
         ├── clients.garage_id
         ├── conversations.garage_id
         ├── devis.garage_id
         ├── rendez_vous.garage_id
         ├── subscriptions.garage_id
         └── garage_configs.garage_id
```

### Row-Level Security (RLS) Supabase

```sql
-- Exemple : un garagiste ne voit que SES devis
CREATE POLICY "garage_isolation_devis" ON devis
  USING (garage_id = auth.uid());
```

### Middleware d'Isolation API

```javascript
// Chaque requête API vérifie l'appartenance
const authMiddleware = async (req, res, next) => {
  const { garage_id } = req.user; // extrait du JWT
  req.garageId = garage_id;       // injecté dans tous les handlers
  next();
};
```

---

## Flux de Données — Chat Widget

```
Visiteur site garage
    │
    ▼ POST /api/chat
API reçoit { message, session_id, garage_id }
    │
    ├── 1. Charger contexte conversation (DB)
    ├── 2. Charger config garage (garage_config.json)
    ├── 3. Construire prompt système (PROMPTS.md)
    ├── 4. Appel OpenAI GPT-4o
    ├── 5. Parser intention (question | devis | rdv)
    │
    ├── Si DEVIS → devisLogic.js → calcul estimation
    ├── Si RDV   → créneaux dispo → collecte client
    ├── Si QUESTION → réponse depuis config
    │
    ├── 6. Sauvegarder message en DB
    └── 7. Retourner réponse structurée
```

---

## Flux de Paiement (Stripe)

```
Garagiste signup
    │
    ▼ Sélection plan (Starter/Pro/Premium)
Frontend → Stripe Checkout Session
    │
    ▼ Webhook Stripe → /api/webhook
Mise à jour subscriptions table
    │
    ▼ Accès fonctionnalités débloqué
    │ (plan_check middleware)
```

---

## Composants Backend

### Routes

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/auth/signup` | POST | Inscription garagiste |
| `/api/auth/login` | POST | Connexion |
| `/api/auth/refresh` | POST | Renouvellement token |
| `/api/chat` | POST | Message chatbot |
| `/api/devis` | POST | Générer devis |
| `/api/devis/:id/pdf` | GET | Export PDF |
| `/api/rdv` | POST | Créer rendez-vous |
| `/api/rdv/slots` | GET | Créneaux disponibles |
| `/api/dashboard/stats` | GET | Analytics |
| `/api/dashboard/conversations` | GET | Liste conversations |
| `/api/dashboard/leads` | GET | Liste leads |
| `/api/subscription` | POST | Abonnement |
| `/api/config` | GET/PUT | Config garage |

### Services

| Service | Rôle |
|---------|------|
| `openai.js` | Appels GPT-4o, parsing intentions |
| `stripe.js` | Création checkout, webhooks |
| `pdf.js` | Génération PDF devis (PDFKit) |
| `email.js` | Envoi emails via Resend |
| `devisLogic.js` | Calcul tarifs, règles métier |

---

## Composants Frontend

### Pages Dashboard

```
/dashboard
├── /           → Analytics overview (leads, RDV, devis, CA)
├── /conversations → Liste + détail des conversations
├── /leads         → CRM leads qualifiés
├── /devis         → Devis générés (+ export PDF)
├── /rendez-vous   → Agenda des RDV
├── /settings      → Config garage (services, tarifs, horaires)
└── /subscription  → Plans, factures, upgrade
```

### Design System

- Variables CSS custom (`--color-primary`, `--color-surface`, etc.)
- Composants UI réutilisables (Button, Card, Modal, Table, Badge)
- Thème sombre par défaut (professionnel, moderne)

---

## Widget Intégrable

Le widget est un **bundle JS vanilla** (zéro dépendance) qui :

1. S'injecte dans `<body>` du site garagiste
2. Crée un iframe ou DOM shadowRoot isolé
3. Communique avec l'API via `garage_id` depuis `data-garage-id`
4. Persiste la session via `localStorage`

```html
<!-- Intégration en 1 ligne -->
<script 
  src="https://cdn.autolead.ai/widget.min.js"
  data-garage-id="abc-123"
  data-color="#e63946"
  data-name="Garage Martin"
  data-position="bottom-right"
></script>
```

---

## Sécurité

| Mesure | Implémentation |
|--------|----------------|
| Auth | Supabase Auth + JWT RS256 |
| CORS | Whitelist domaines par tenant |
| Rate limiting | express-rate-limit (100 req/min) |
| Isolation données | RLS Supabase + middleware |
| Secrets | Variables d'environnement (jamais en code) |
| HTTPS | Obligatoire en production |
| Validation | Joi / Zod sur toutes les entrées |

---

## Scalabilité

- **Stateless API** : horizontal scaling facile
- **Supabase** : PostgreSQL managé, scale automatique
- **Vercel** : Edge Functions, CDN global
- **Widget** : servi via CDN, 0 impact serveur
- **Queue** : Pour emails/PDF, utiliser Bull + Redis (v2)
