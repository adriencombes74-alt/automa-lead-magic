# DATABASE.md — AutoLead AI

## Schéma Complet PostgreSQL / Supabase

---

## Tables

### `users` (Garages / Tenants)

```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  garage_name     TEXT NOT NULL,
  phone           TEXT,
  address         TEXT,
  plan            TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'premium')),
  stripe_customer_id TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

**Note** : `id` = `garage_id` dans toutes les autres tables. Un user = un garage.

---

### `garage_configs`

```sql
CREATE TABLE garage_configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  config          JSONB NOT NULL DEFAULT '{}',
  -- Structure config :
  -- {
  --   "opening_hours": { "monday": { "open": "08:00", "close": "18:00" } },
  --   "services": [{ "id": "vidange", "label": "Vidange", "base_price": 89 }],
  --   "widget": { "color": "#e63946", "name": "Alex", "position": "bottom-right" }
  -- }
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(garage_id)
);
```

---

### `clients`

```sql
CREATE TABLE clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  phone           TEXT,
  email           TEXT,
  vehicle_brand   TEXT,
  vehicle_model   TEXT,
  vehicle_year    INT,
  vehicle_plate   TEXT,
  notes           TEXT,
  source          TEXT DEFAULT 'widget' CHECK (source IN ('widget', 'manual', 'import')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_garage_id ON clients(garage_id);
CREATE INDEX idx_clients_email ON clients(garage_id, email);
```

---

### `conversations`

```sql
CREATE TABLE conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES clients(id),
  session_id      TEXT NOT NULL,
  intent          TEXT CHECK (intent IN ('question', 'devis', 'rdv', 'unknown')),
  status          TEXT DEFAULT 'open' CHECK (status IN ('open', 'converted', 'abandoned', 'closed')),
  messages        JSONB NOT NULL DEFAULT '[]',
  -- Messages format :
  -- [{ "role": "user"|"assistant", "content": "...", "timestamp": "ISO" }]
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_garage_id ON conversations(garage_id);
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversations_status ON conversations(garage_id, status);
```

---

### `devis`

```sql
CREATE TABLE devis (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES clients(id),
  conversation_id UUID REFERENCES conversations(id),
  reference       TEXT NOT NULL UNIQUE, -- DEV-2024-001
  vehicle         JSONB NOT NULL,
  -- { "brand": "Renault", "model": "Clio 4", "year": 2019, "mileage": 85000 }
  service         TEXT NOT NULL,
  symptoms        TEXT,
  items           JSONB NOT NULL DEFAULT '[]',
  -- [{ "label": "Plaquettes", "qty": 1, "unit_price": 65.00, "total": 65.00 }]
  subtotal        NUMERIC(10,2) NOT NULL,
  tva_rate        NUMERIC(5,2) DEFAULT 20.00,
  tva_amount      NUMERIC(10,2) NOT NULL,
  total_ttc       NUMERIC(10,2) NOT NULL,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  validity_days   INT DEFAULT 30,
  pdf_url         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_devis_garage_id ON devis(garage_id);
CREATE INDEX idx_devis_status ON devis(garage_id, status);
CREATE INDEX idx_devis_client ON devis(client_id);
```

---

### `rendez_vous`

```sql
CREATE TABLE rendez_vous (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES clients(id),
  conversation_id UUID REFERENCES conversations(id),
  devis_id        UUID REFERENCES devis(id),
  reference       TEXT NOT NULL UNIQUE, -- RDV-2024-001
  service         TEXT NOT NULL,
  vehicle         JSONB,
  date            DATE NOT NULL,
  time            TIME NOT NULL,
  duration_min    INT DEFAULT 60,
  status          TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  notes           TEXT,
  confirmation_sent BOOLEAN DEFAULT false,
  reminder_sent   BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rdv_garage_id ON rendez_vous(garage_id);
CREATE INDEX idx_rdv_date ON rendez_vous(garage_id, date);
CREATE INDEX idx_rdv_status ON rendez_vous(garage_id, status);
```

---

### `subscriptions`

```sql
CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  plan            TEXT NOT NULL DEFAULT 'starter',
  status          TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled', 'paused')),
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  trial_end       TIMESTAMPTZ,
  cancel_at       TIMESTAMPTZ,
  -- Addons
  has_sms         BOOLEAN DEFAULT false,
  has_whatsapp    BOOLEAN DEFAULT false,
  has_gcal        BOOLEAN DEFAULT false,
  -- Usage counters (reset monthly)
  devis_count     INT DEFAULT 0,
  rdv_count       INT DEFAULT 0,
  usage_reset_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

### `usage_logs`

```sql
CREATE TABLE usage_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action          TEXT NOT NULL CHECK (action IN ('devis_created', 'rdv_created', 'chat_message', 'pdf_exported')),
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_garage_period ON usage_logs(garage_id, created_at);
```

---

## Row-Level Security (RLS)

```sql
-- Activer RLS sur toutes les tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE rendez_vous ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE garage_configs ENABLE ROW LEVEL SECURITY;

-- Policy : chaque garage ne voit que ses données
CREATE POLICY "garage_own_data" ON clients
  FOR ALL USING (garage_id = auth.uid());

CREATE POLICY "garage_own_data" ON conversations
  FOR ALL USING (garage_id = auth.uid());

CREATE POLICY "garage_own_data" ON devis
  FOR ALL USING (garage_id = auth.uid());

CREATE POLICY "garage_own_data" ON rendez_vous
  FOR ALL USING (garage_id = auth.uid());

-- Config garage : lecture publique (widget), écriture restreinte
CREATE POLICY "garage_config_read" ON garage_configs
  FOR SELECT USING (true);

CREATE POLICY "garage_config_write" ON garage_configs
  FOR ALL USING (garage_id = auth.uid());
```

---

## Limites par Plan

```sql
-- Vue des limites par plan
CREATE VIEW plan_limits AS
SELECT 
  'starter' AS plan,
  30 AS devis_limit,
  30 AS rdv_limit,
  100 AS conversations_limit
UNION ALL
SELECT 'pro', 150, 150, 500
UNION ALL
SELECT 'premium', 999999, 999999, 999999;
```

---

## Relations

```
users (garages)
  ├── garage_configs (1:1)
  ├── subscriptions (1:1)
  ├── clients (1:N)
  │     └── conversations (N:1)
  │     └── devis (N:1)
  │     └── rendez_vous (N:1)
  ├── conversations (1:N)
  │     ├── devis (1:1 optionnel)
  │     └── rendez_vous (1:1 optionnel)
  ├── devis (1:N)
  └── rendez_vous (1:N)
```

---

## Compteurs Usage Mensuels

Un CRON job (ou trigger) remet à zéro `devis_count` et `rdv_count` le 1er de chaque mois :

```sql
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET devis_count = 0,
      rdv_count = 0,
      usage_reset_at = NOW()
  WHERE DATE_TRUNC('month', usage_reset_at) < DATE_TRUNC('month', NOW());
END;
$$ LANGUAGE plpgsql;
```
