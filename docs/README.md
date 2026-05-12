# AutoLead AI 🚗

> ⚠️ **Statut des docs** : ce dossier `docs/` contient la **spécification d'origine** (architecture cible Next.js 14 + backend Express séparé + GPT-4o + widget bundle CDN). L'implémentation actuelle diverge sensiblement :
> - **Stack réelle** : Vite + React SPA, **pas** de Next.js ni de backend Express. Toute la logique serveur vit dans des **edge functions Supabase** (`supabase/functions/chat`, `send-rdv-confirmation`, `send-reminders`, etc.)
> - **LLM** : Google **Gemini 2.0 Flash** (pas OpenAI / GPT-4o)
> - **Email/SMS** : **Brevo** (pas Resend)
> - **Widget** : composant React in-app (pas de bundle CDN séparé)
> - **Dev** : `npm run dev` sur **http://localhost:8080** (pas 5173)
>
> Pour l'état réel du code et les conventions à suivre, lire [`CLAUDE.md`](../CLAUDE.md) à la racine. Les fichiers de ce dossier restent utiles comme **référence de specs métier** (tarification, parcours utilisateurs, prompts) mais leurs sections techniques (chemins API REST, structure dossiers `backend/frontend/widget`, `.env` Express) sont à ignorer.

**Le SaaS qui remplit l'agenda des garagistes automatiquement.**

AutoLead AI est un SaaS B2B multi-tenant qui fournit aux garagistes :
- Un chatbot IA intégrable sur leur site web
- Un générateur de devis automatique
- Un système de prise de rendez-vous
- Un dashboard complet de gestion des leads

---

## 🏗️ Architecture

```
autolead-ai/
├── backend/     → API REST Express.js
├── frontend/    → Dashboard Next.js 14
├── widget/      → Widget JS intégrable (vanilla)
├── docs/        → Documentation complète
├── config/      → Exemples de configuration
└── supabase/    → Migrations SQL
```

---

## ⚡ Installation Rapide

### Prérequis

- Node.js 18+
- PostgreSQL (ou compte Supabase)
- Compte Stripe
- Clé API OpenAI

---

### 1. Cloner le projet

```bash
git clone https://github.com/your-org/autolead-ai.git
cd autolead-ai
```

---

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# → Remplir les variables dans .env
npm run dev
```

**Variables `.env` requises :**

```env
# Base de données
DATABASE_URL=postgresql://user:password@host:5432/autolead

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Email (Resend)
RESEND_API_KEY=re_...

# Application
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

---

### 3. Frontend (Dashboard)

```bash
cd frontend
npm install
cp .env.local.example .env.local
# → Remplir les variables
npm run dev
```

**Variables `.env.local` requises :**

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

### 4. Base de données

```bash
# Via Supabase CLI
supabase db push

# Ou directement
psql $DATABASE_URL < supabase/migrations/001_initial_schema.sql
```

---

### 5. Widget

```bash
cd widget
npm install
npm run build
# → Génère dist/autolead-widget.min.js
```

**Intégration sur le site du garagiste :**

```html
<script 
  src="https://cdn.autolead.ai/widget.min.js"
  data-garage-id="votre-garage-id"
  data-color="#e63946"
  data-name="Garage Martin"
></script>
```

---

## 🚀 Déploiement Production

### Frontend → Vercel

```bash
cd frontend
vercel deploy --prod
```

### Backend → Railway

```bash
# Connecter le repo GitHub à Railway
# Configurer les variables d'environnement dans Railway
# Deploy automatique sur push
```

### Widget → CDN

```bash
cd widget
npm run build
# Upload dist/autolead-widget.min.js vers votre CDN
```

---

## 💰 Plans Tarifaires

| Plan | Prix | Devis/mois | RDV/mois | PDF | Analytics |
|------|------|-----------|---------|-----|-----------|
| Starter | 29€/mois | 30 | 30 | ❌ | Basique |
| Pro | 79€/mois | 150 | 150 | ✅ | Avancé |
| Premium | 149€/mois | Illimité | Illimité | ✅ | Complet |

---

## 📚 Documentation

| Fichier | Contenu |
|---------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Diagrammes et architecture |
| [SAAS_STRATEGY.md](./SAAS_STRATEGY.md) | Stratégie commerciale |
| [MONETIZATION.md](./MONETIZATION.md) | Plans et upsells |
| [API.md](./API.md) | Documentation API |
| [DATABASE.md](./DATABASE.md) | Schéma base de données |
| [USER_FLOW.md](./USER_FLOW.md) | Parcours utilisateurs |
| [PROMPTS.md](./PROMPTS.md) | Prompts IA |
| [DEVIS_LOGIC.md](./DEVIS_LOGIC.md) | Logique de tarification |
| [MULTI_TENANT.md](./MULTI_TENANT.md) | Architecture multi-tenant |
| [CLAUDE.md](./CLAUDE.md) | Règles chatbot |

---

## 🛠️ Scripts Disponibles

```bash
# Backend
npm run dev        # Mode développement (nodemon)
npm run start      # Production
npm run test       # Tests unitaires

# Frontend
npm run dev        # Mode développement
npm run build      # Build production
npm run start      # Serveur Next.js production

# Widget
npm run build      # Bundle minifié
npm run dev        # Watch mode
```

---

## 📄 Licence

Propriétaire — AutoLead AI © 2024
