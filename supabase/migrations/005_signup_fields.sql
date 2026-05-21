-- 005_signup_fields.sql
-- Ajoute les champs collectés à l'inscription multi-étapes :
--   * city, postal_code, website (nullable, peuvent être complétés plus tard depuis Settings)
--   * phone passe en NOT NULL (obligatoire au signup pour SMS reminders et contact)
-- Les comptes existants sans téléphone sont backfillés avec un placeholder
-- (+33000000000) — au prochain login, le dashboard peut afficher un avertissement
-- invitant à mettre à jour leur numéro réel.

update public.users set phone = '+33000000000' where phone is null;

alter table public.users
  add column city text,
  add column postal_code text,
  add column website text,
  alter column phone set not null;
