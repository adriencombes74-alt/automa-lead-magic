-- Enrichissement de la table rendez_vous pour la prise de RDV via chatbot
-- + affichage agenda complet pour le garagiste

-- Note libre / contexte de la demande client (rempli par Gemini)
alter table public.rendez_vous add column if not exists notes text;

-- Contact client dénormalisé pour affichage rapide et notification email
-- (la jointure clients reste la source de vérité, mais ces colonnes évitent
--  les joins systématiques et permettent à la fonction d'envoi d'email
--  d'avoir tout le contexte sans charger clients séparément)
alter table public.rendez_vous add column if not exists client_name text;
alter table public.rendez_vous add column if not exists client_phone text;
alter table public.rendez_vous add column if not exists client_email text;

-- Tracking de l'envoi de la confirmation au client
alter table public.rendez_vous add column if not exists confirmation_sent_at timestamptz;

-- Référence unique par garage (évite les collisions sur RDV-YYYY-NNNN aléatoire)
create unique index if not exists rendez_vous_garage_reference_uniq
  on public.rendez_vous(garage_id, reference);
