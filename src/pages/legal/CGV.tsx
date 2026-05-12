import LegalLayout from "./LegalLayout";

const CGV = () => (
  <LegalLayout title="Conditions Générales de Vente" updatedAt="12 mai 2026">
    <h2>Article 1 — Objet</h2>
    <p>
      Les présentes Conditions Générales de Vente (CGV) régissent l'utilisation du service <strong>AutoLead AI</strong>, plateforme logicielle en mode SaaS (Software as a Service) destinée aux professionnels de la réparation et de l'entretien automobile (ci-après « le Client » ou « l'Abonné ») et éditée par <strong>[À COMPLÉTER : raison sociale]</strong> (ci-après « l'Éditeur »).
    </p>
    <p>
      L'abonnement au service implique l'acceptation pleine et entière des présentes CGV.
    </p>

    <h2>Article 2 — Description du service</h2>
    <p>
      AutoLead AI met à disposition de l'Abonné un assistant conversationnel propulsé par intelligence artificielle, permettant la prise de rendez-vous, l'établissement de devis automatisés et la relance client par SMS et e-mail. Les fonctionnalités précises dépendent du plan souscrit (Starter, Pro, Premium) tel que décrit sur la page Tarifs du site.
    </p>

    <h2>Article 3 — Souscription et compte</h2>
    <p>
      La souscription s'effectue en ligne. L'Abonné garantit que les informations fournies lors de la création de son compte sont exactes. Il est responsable de la confidentialité de ses identifiants.
    </p>
    <p>
      Une période d'essai gratuite de quatorze (14) jours est proposée, sans engagement et sans communication de coordonnées bancaires.
    </p>

    <h2>Article 4 — Prix et paiement</h2>
    <p>
      Les prix sont indiqués en euros, hors taxes, et payables mensuellement par carte bancaire via notre prestataire de paiement Stripe Payments Europe, Ltd. Les factures sont émises automatiquement et accessibles depuis le tableau de bord.
    </p>
    <p>
      En cas d'incident de paiement, l'accès au service peut être suspendu après notification. L'Éditeur se réserve le droit de réviser les prix moyennant un préavis d'un (1) mois communiqué par e-mail.
    </p>

    <h2>Article 5 — Durée, résiliation</h2>
    <p>
      L'abonnement est conclu pour une durée indéterminée, renouvelable tacitement chaque mois. L'Abonné peut résilier à tout moment depuis son espace client. La résiliation prend effet à la fin de la période en cours ; aucun remboursement au prorata n'est dû.
    </p>

    <h2>Article 6 — Obligations de l'Abonné</h2>
    <p>
      L'Abonné s'engage à utiliser le service conformément à sa destination, dans le respect des lois en vigueur, et à ne pas l'utiliser pour des fins illicites, frauduleuses ou portant atteinte aux droits de tiers. Il est seul responsable du contenu qu'il configure dans la plateforme (tarifs, horaires, prestations) et des communications envoyées à ses propres clients via le service.
    </p>

    <h2>Article 7 — Propriété intellectuelle</h2>
    <p>
      L'Éditeur reste seul propriétaire de l'ensemble des éléments composant le service. L'Abonné bénéficie d'un droit d'usage personnel, non exclusif et non cessible pour la durée de l'abonnement.
    </p>

    <h2>Article 8 — Données personnelles</h2>
    <p>
      Le traitement des données personnelles est décrit dans la <a href="/confidentialite">Politique de confidentialité</a>. L'Abonné agit en qualité de responsable de traitement pour les données de ses propres clients finaux ; l'Éditeur agit en sous-traitant au sens du RGPD. Un accord de traitement (DPA) est disponible sur demande.
    </p>

    <h2>Article 9 — Responsabilité</h2>
    <p>
      L'Éditeur s'engage à fournir le service avec diligence selon une obligation de moyens. Le service repose sur des technologies tierces (Supabase, Google Gemini, ElevenLabs, Brevo, Stripe) dont les interruptions peuvent affecter ponctuellement la disponibilité.
    </p>
    <p>
      L'Éditeur ne saurait être tenu responsable des pertes indirectes (perte de chiffre d'affaires, perte de clientèle) liées à un dysfonctionnement du service. La responsabilité totale de l'Éditeur est en tout état de cause limitée au montant payé par l'Abonné au cours des trois (3) derniers mois.
    </p>

    <h2>Article 10 — Force majeure</h2>
    <p>
      Aucune des parties ne pourra être tenue responsable d'un manquement résultant d'un cas de force majeure tel que défini par la jurisprudence française.
    </p>

    <h2>Article 11 — Modifications</h2>
    <p>
      L'Éditeur se réserve le droit de modifier les présentes CGV. Toute modification substantielle sera notifiée à l'Abonné par e-mail au moins quinze (15) jours avant son entrée en vigueur.
    </p>

    <h2>Article 12 — Droit applicable et juridiction</h2>
    <p>
      Les présentes CGV sont régies par le droit français. En cas de litige, les parties s'efforceront de trouver une solution amiable. À défaut, le tribunal de commerce de <strong>[À COMPLÉTER : ville du siège]</strong> sera seul compétent.
    </p>
  </LegalLayout>
);

export default CGV;
