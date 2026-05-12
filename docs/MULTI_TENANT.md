# MULTI_TENANT.md — AutoLead AI

## Principe

Chaque garagiste = 1 tenant isolé via son `garage_id` (= son `user.id` Supabase Auth).

---

## Isolation des Données

### Au niveau DB (Row-Level Security)

```sql
-- Chaque table sensitive a une politique RLS
-- garage_id doit correspondre à auth.uid()

CREATE POLICY "tenant_isolation" ON leads
  FOR ALL USING (garage_id = auth.uid());

CREATE POLICY "tenant_isolation" ON conversations
  FOR ALL USING (garage_id = auth.uid());

CREATE POLICY "tenant_isolation" ON devis
  FOR ALL USING (garage_id = auth.uid());

CREATE POLICY "tenant_isolation" ON rendez_vous
  FOR ALL USING (garage_id = auth.uid());
```

### Exception : Config publique (pour le widget)

La `garage_config` est lisible publiquement (le widget n'est pas authentifié) :

```sql
-- Lecture publique de la config (nécessaire pour widget)
CREATE POLICY "config_public_read" ON garage_configs
  FOR SELECT USING (true);

-- Écriture restreinte au propriétaire
CREATE POLICY "config_owner_write" ON garage_configs
  FOR ALL USING (garage_id = auth.uid());
```

---

## Isolation au niveau API (Next.js)

```typescript
// middleware.ts — vérifie JWT sur toutes les routes /api/dashboard/*
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session && req.nextUrl.pathname.startsWith('/api/dashboard')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // garage_id injecté depuis le JWT — jamais depuis le body de la requête
  return res;
}
```

```typescript
// Toute route dashboard
export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  
  // garage_id = user.id — JAMAIS req.query.garage_id
  const garageId = user!.id;
  
  const { data } = await supabase
    .from('leads')
    .select('*')
    .eq('garage_id', garageId); // isolé
    
  return NextResponse.json(data);
}
```

**Règle critique** : Le `garage_id` vient toujours du JWT, jamais d'un paramètre URL ou body.

---

## Isolation Widget (endpoint public)

Le widget envoie un `garage_id` dans la requête chat. Le backend valide que ce garage existe et est actif :

```typescript
// api/chat/route.ts — endpoint public (pas d'auth requise)
export async function POST(req: Request) {
  const { message, session_id, garage_id } = await req.json();
  
  // Valider que le garage existe et son abonnement est actif
  const { data: garage } = await supabase
    .from('users')
    .select('id, garage_name, plan')
    .eq('id', garage_id)
    .single();
    
  if (!garage) {
    return NextResponse.json({ error: 'Garage not found' }, { status: 404 });
  }
  
  // Vérifier plan actif
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('garage_id', garage_id)
    .single();
    
  if (sub?.status !== 'active' && sub?.status !== 'trialing') {
    return NextResponse.json({ 
      reply: "Ce service est temporairement indisponible. Contactez le garage directement.",
      error: 'subscription_inactive'
    });
  }
  
  // Traitement normal...
}
```

---

## Identifiant Widget (sécurité)

Le `garage_id` dans le widget est un UUID public — **ce n'est pas un secret**.
Il permet uniquement de router les conversations vers le bon garage.

Pour sécuriser davantage en V2 : générer un `widget_token` distinct (opaque string) au lieu d'exposer le `garage_id` directement.

```sql
-- V2 : token widget dédié
ALTER TABLE garage_configs 
ADD COLUMN widget_token TEXT UNIQUE DEFAULT gen_random_uuid()::text;
```

---

## Quotas par Plan (Multi-Tenant)

```typescript
// lib/planCheck.ts
const PLAN_LIMITS = {
  starter: { devis: 30, rdv: 30 },
  pro: { devis: 150, rdv: 150 },
  premium: { devis: Infinity, rdv: Infinity },
};

export async function checkQuota(
  garageId: string, 
  type: 'devis' | 'rdv'
): Promise<{ allowed: boolean; used: number; limit: number }> {
  
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, devis_count, rdv_count')
    .eq('garage_id', garageId)
    .single();

  const limit = PLAN_LIMITS[sub!.plan][type];
  const used = type === 'devis' ? sub!.devis_count : sub!.rdv_count;
  
  return {
    allowed: used < limit,
    used,
    limit: limit === Infinity ? -1 : limit,
  };
}
```
