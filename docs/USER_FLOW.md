# USER_FLOW.md — AutoLead AI

## Flow 1 : Garagiste (Signup → Premier Lead)

```
[Garagiste visite autolead.ai]
        │
        ▼
[Landing page — voir plans]
        │
        ▼
[CTA "Essayer 14 jours gratuit"]
        │
        ▼
[Signup : email + mdp + nom garage]
        │ Supabase Auth
        ▼
[Onboarding guidé — 5 étapes]
  ① Nom + téléphone + adresse
  ② Services proposés (checkboxes)
  ③ Horaires d'ouverture
  ④ Personnalisation widget (couleur, prénom bot)
  ⑤ Code d'intégration — copier/coller
        │
        ▼
[Dashboard — vide au départ]
[Message : "Votre bot est prêt ! Intégrez-le sur votre site."]
        │
        ▼ (après intégration sur le site)
[Premier visiteur interagit avec le widget]
        │
        ▼
[Lead créé automatiquement dans le dashboard]
        │
        ▼
[Email garagiste : "🎉 Nouveau lead AutoLead !"]
        │
        ▼
[Garagiste consulte le dashboard]
[Rappelle le client depuis les infos du lead]
```

---

## Flow 2 : Client Final (Visiteur → RDV confirmé)

```
[Client visite le site du garage]
        │
        ▼
[Widget AutoLead s'affiche (coin bas-droite)]
[Avatar + "Bonjour ! Je suis Alex du Garage Martin..."]
        │
        ▼
[Client clique / écrit son message]
"Combien pour changer mes freins ?"
        │
        ▼
[GPT détecte : intent = "devis"]
[Bot répond : "Je vous prépare un devis ! Quelle est la marque de votre véhicule ?"]
        │
        ▼ [Collecte séquentielle]
① Marque → "Renault"
② Modèle + année → "Clio 4, 2019"
③ Kilométrage → "85 000 km"
④ Confirmation service → "Freins avant"
        │
        ▼
[devisLogic.js calcule depuis grille garage]
[Bot affiche devis estimé]
"🔧 Estimation freins avant Renault Clio 4 : 162€ TTC
 (plaquettes + main d'œuvre, hors disques)
 Valable 30 jours."
        │
        ▼
[Bot propose RDV]
"Souhaitez-vous prendre un rendez-vous pour cette intervention ?"
        │
        ├── "Oui" ──────────────────────────────────────────────┐
        │                                                       │
        ▼                                                       ▼
[Client refuse — fin]                          [Affichage créneaux disponibles]
[Lead sauvegardé quand même]                   "Mardi 20h ou Jeudi 9h ?"
                                                       │
                                                       ▼
                                              [Collecte coordonnées]
                                              ① Prénom + nom
                                              ② Téléphone
                                              ③ Email (optionnel)
                                                       │
                                                       ▼
                                              [RDV créé en DB]
                                              [Email confirmation → client]
                                              [Email notification → garagiste]
                                                       │
                                                       ▼
                                              [Bot confirme]
                                              "✅ RDV confirmé le mardi 21 jan à 10h
                                               Garage Martin - 12 rue de la Paix
                                               Un email de confirmation vous a été envoyé."
```

---

## Flow 3 : Upgrade Plan (Starter → Pro)

```
[Garagiste dans dashboard]
        │
        ▼
[Notification : "Vous avez utilisé 28/30 devis ce mois"]
        │
        ▼
[Banner upgrade : "Passez en Pro — 150 devis/mois"]
        │
        ▼
[Clic "Upgrade"]
        │
        ▼
[Stripe Checkout (CB déjà enregistrée)]
        │
        ▼
[Webhook Stripe → mise à jour plan en DB]
        │
        ▼
[Dashboard mis à jour — quotas recalculés]
[Email confirmation upgrade]
```

---

## Flow 4 : Gestion Lead (Dashboard)

```
[Nouveau lead créé par widget]
        │
        ▼
[Apparaît dans "Leads" avec score]
Score 90 = HOT (a rempli devis + demandé RDV)
Score 50 = WARM (devis seulement)
Score 20 = COLD (question uniquement)
        │
        ▼
[Garagiste peut :]
  → Voir détail conversation complète (replay)
  → Appeler directement (clic sur téléphone)
  → Marquer comme "Contacté"
  → Marquer comme "Converti"
  → Créer devis manuel
  → Créer RDV manuel
```

---

## États des Conversations

```
open        → conversation en cours
converted   → lead → devis ou RDV créé
abandoned   → client parti sans action (>30 min inactivité)
closed      → clôturée manuellement
```

---

## Notifications Garagiste

| Déclencheur | Canal | Message |
|-------------|-------|---------|
| Nouveau lead | Email | "🔔 Nouveau client via votre bot" |
| RDV confirmé | Email | "📅 Nouveau RDV — [nom client] le [date]" |
| Devis accepté | Email | "✅ Devis accepté par [nom client]" |
| 0 conversation 7 jours | Email | "⚠️ Votre bot n'a pas eu de visiteurs cette semaine" |
| Quota 80% atteint | Email + Banner | "Vous approchez de votre limite mensuelle" |
