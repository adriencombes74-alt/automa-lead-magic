# API.md — AutoLead AI REST API

**Base URL** : `https://api.autolead.ai/v1`

**Auth** : Bearer JWT Token (header `Authorization: Bearer <token>`)

**Format** : JSON

---

## Authentification — `/auth`

### POST /auth/signup
Inscription d'un nouveau garage.

**Body:**
```json
{
  "email": "contact@garage-martin.fr",
  "password": "motdepasse123",
  "garage_name": "Garage Martin",
  "phone": "+33612345678",
  "address": "12 rue de la Paix, 75001 Paris"
}
```

**Response 201:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "garage_id": "uuid",
    "email": "contact@garage-martin.fr",
    "garage_name": "Garage Martin"
  },
  "token": "eyJhbGci..."
}
```

---

### POST /auth/login
Connexion garagiste.

**Body:**
```json
{
  "email": "contact@garage-martin.fr",
  "password": "motdepasse123"
}
```

**Response 200:**
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "user": { "id": "uuid", "garage_id": "uuid", "plan": "pro" }
}
```

---

### POST /auth/refresh
Renouvellement du token JWT.

**Body:**
```json
{ "refresh_token": "eyJhbGci..." }
```

**Response 200:**
```json
{ "token": "eyJhbGci..." }
```

---

### POST /auth/logout
Révocation du token.

**Response 200:**
```json
{ "success": true }
```

---

## Chat — `/chat`

### POST /chat
Envoyer un message au chatbot. **Public** (utilisé par le widget).

**Body:**
```json
{
  "message": "Combien coûte un changement de freins ?",
  "session_id": "sess_abc123",
  "garage_id": "uuid-du-garage"
}
```

**Response 200:**
```json
{
  "reply": "Je vais vous préparer un devis personnalisé ! Quelle est la marque de votre véhicule ?",
  "intent": "devis",
  "session_id": "sess_abc123",
  "conversation_id": "uuid",
  "requires_input": {
    "field": "vehicle_brand",
    "prompt": "Marque du véhicule"
  },
  "quick_replies": ["Renault", "Peugeot", "Citroën", "Autre"]
}
```

---

### GET /chat/conversations
Liste les conversations du garage (dashboard). **Auth requis.**

**Query params :** `page=1&limit=20&status=open|closed`

**Response 200:**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "session_id": "sess_abc",
      "client_name": "Jean Dupont",
      "intent": "devis",
      "status": "converted",
      "messages_count": 12,
      "created_at": "2024-01-15T14:30:00Z",
      "last_message": "Merci, je confirme le RDV"
    }
  ],
  "total": 150,
  "page": 1,
  "pages": 8
}
```

---

### GET /chat/conversations/:id
Détail d'une conversation avec tous les messages.

**Response 200:**
```json
{
  "id": "uuid",
  "messages": [
    { "role": "user", "content": "Bonjour", "timestamp": "..." },
    { "role": "assistant", "content": "Bonjour !", "timestamp": "..." }
  ],
  "client": { "name": "Jean Dupont", "phone": "06..." },
  "devis_id": "uuid-devis-lié",
  "rdv_id": "uuid-rdv-lié"
}
```

---

## Devis — `/devis`

### POST /devis
Générer un devis. Peut être appelé via chatbot ou directement.

**Body:**
```json
{
  "vehicle": {
    "brand": "Renault",
    "model": "Clio 4",
    "year": 2019,
    "mileage": 85000
  },
  "service": "freins_avant",
  "symptoms": "Bruit de craquement au freinage",
  "garage_id": "uuid",
  "session_id": "sess_abc"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "reference": "DEV-2024-001",
  "vehicle": { "brand": "Renault", "model": "Clio 4", "year": 2019 },
  "items": [
    { "label": "Plaquettes de frein avant", "qty": 1, "unit_price": 65.00, "total": 65.00 },
    { "label": "Main d'œuvre (1h)", "qty": 1, "unit_price": 75.00, "total": 75.00 }
  ],
  "subtotal": 140.00,
  "tva": 28.00,
  "total_ttc": 168.00,
  "validity_days": 30,
  "created_at": "2024-01-15T14:35:00Z",
  "pdf_url": null
}
```

---

### GET /devis
Liste les devis du garage. **Auth requis.**

**Query params :** `page=1&limit=20&status=pending|accepted|rejected`

---

### GET /devis/:id
Détail d'un devis.

---

### GET /devis/:id/pdf
Télécharger le devis en PDF. **Plan Pro/Premium requis.**

**Response:** `application/pdf` (binary stream)

---

### PUT /devis/:id/status
Mettre à jour le statut d'un devis.

**Body:**
```json
{ "status": "accepted" }
```

---

## Rendez-vous — `/rdv`

### GET /rdv/slots
Obtenir les créneaux disponibles. **Public.**

**Query params :** `garage_id=uuid&date=2024-01-20&service=freins`

**Response 200:**
```json
{
  "slots": [
    { "date": "2024-01-20", "time": "09:00", "available": true },
    { "date": "2024-01-20", "time": "10:30", "available": true },
    { "date": "2024-01-20", "time": "14:00", "available": false }
  ]
}
```

---

### POST /rdv
Créer un rendez-vous. **Public** (widget).

**Body:**
```json
{
  "garage_id": "uuid",
  "session_id": "sess_abc",
  "client": {
    "name": "Jean Dupont",
    "phone": "0612345678",
    "email": "jean@email.com"
  },
  "service": "freins_avant",
  "vehicle": { "brand": "Renault", "model": "Clio 4" },
  "date": "2024-01-20",
  "time": "09:00",
  "devis_id": "uuid-optionnel"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "reference": "RDV-2024-001",
  "status": "confirmed",
  "client": { "name": "Jean Dupont", "email": "jean@email.com" },
  "date": "2024-01-20",
  "time": "09:00",
  "confirmation_sent": true
}
```

---

### GET /rdv
Liste les rendez-vous du garage. **Auth requis.**

**Query params :** `from=2024-01-01&to=2024-01-31&status=confirmed|cancelled`

---

### PUT /rdv/:id/status
Annuler ou confirmer un RDV.

**Body:**
```json
{ "status": "cancelled", "reason": "Client absent" }
```

---

## Dashboard — `/dashboard`

### GET /dashboard/stats
Analytics globaux du garage. **Auth requis.**

**Query params :** `period=7d|30d|90d|year`

**Response 200:**
```json
{
  "period": "30d",
  "leads": { "total": 145, "delta": "+23%" },
  "devis": { "total": 67, "accepted": 38, "conversion_rate": "56.7%" },
  "rdv": { "total": 54, "confirmed": 48, "cancelled": 6 },
  "revenue_estimated": 8750.00,
  "top_services": [
    { "service": "Freins", "count": 18 },
    { "service": "Vidange", "count": 15 }
  ]
}
```

---

### GET /dashboard/leads
Liste des leads qualifiés. **Auth requis.**

**Response 200:**
```json
{
  "leads": [
    {
      "id": "uuid",
      "client_name": "Jean Dupont",
      "phone": "0612345678",
      "email": "jean@email.com",
      "vehicle": "Renault Clio 4 (2019)",
      "need": "Freins avant",
      "source": "widget",
      "status": "hot",
      "created_at": "2024-01-15T14:30:00Z"
    }
  ]
}
```

---

## Configuration — `/config`

### GET /config
Lire la configuration du garage. **Auth requis.**

**Response 200:**
```json
{
  "garage_name": "Garage Martin",
  "phone": "+33612345678",
  "address": "12 rue de la Paix, 75001 Paris",
  "opening_hours": {
    "monday": { "open": "08:00", "close": "18:00" },
    "saturday": { "open": "09:00", "close": "12:00" },
    "sunday": null
  },
  "services": [
    { "id": "vidange", "label": "Vidange", "base_price": 89, "duration_min": 45 },
    { "id": "freins_avant", "label": "Freins avant", "base_price": 140, "duration_min": 90 }
  ],
  "widget": {
    "color": "#e63946",
    "name": "Alex",
    "position": "bottom-right"
  }
}
```

---

### PUT /config
Mettre à jour la configuration. **Auth requis.**

**Body :** Même structure que GET, champs partiels acceptés.

---

## Abonnements — `/subscription`

### GET /subscription
Statut de l'abonnement courant. **Auth requis.**

**Response 200:**
```json
{
  "plan": "pro",
  "status": "active",
  "current_period_end": "2024-02-15",
  "usage": {
    "devis_used": 67,
    "devis_limit": 150,
    "rdv_used": 54,
    "rdv_limit": 150
  },
  "stripe_customer_id": "cus_...",
  "invoices": [...]
}
```

---

### POST /subscription/checkout
Créer une session Stripe Checkout. **Auth requis.**

**Body:**
```json
{
  "plan": "pro",
  "billing": "monthly"
}
```

**Response 200:**
```json
{ "checkout_url": "https://checkout.stripe.com/..." }
```

---

### POST /subscription/portal
Accéder au portail client Stripe. **Auth requis.**

**Response 200:**
```json
{ "portal_url": "https://billing.stripe.com/..." }
```

---

### POST /webhook/stripe
Webhook Stripe (non authentifié, vérifié par signature).

---

## Codes d'Erreur

| Code | Description |
|------|-------------|
| 400 | Requête invalide (validation échouée) |
| 401 | Non authentifié |
| 403 | Accès refusé (plan insuffisant) |
| 404 | Ressource non trouvée |
| 429 | Trop de requêtes (rate limit) |
| 500 | Erreur serveur interne |

**Format erreur:**
```json
{
  "error": true,
  "code": "PLAN_LIMIT_EXCEEDED",
  "message": "Vous avez atteint votre limite de 30 devis/mois. Passez en Pro pour continuer.",
  "upgrade_url": "https://app.autolead.ai/subscription"
}
```
