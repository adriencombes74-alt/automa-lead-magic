import LegalLayout from "./LegalLayout";

const MentionsLegales = () => (
  <LegalLayout title="Mentions légales" updatedAt="12 mai 2026">
    <h2>1. Éditeur du site</h2>
    <p>
      Le site <strong>AutoLead AI</strong> (accessible à l'adresse <strong>[À COMPLÉTER : URL du site]</strong>) est édité par :
    </p>
    <ul>
      <li><strong>Raison sociale :</strong> [À COMPLÉTER : nom légal / dénomination sociale]</li>
      <li><strong>Forme juridique :</strong> [À COMPLÉTER : SAS, SARL, EURL, auto-entrepreneur, etc.]</li>
      <li><strong>Capital social :</strong> [À COMPLÉTER, si applicable]</li>
      <li><strong>Siège social :</strong> [À COMPLÉTER : adresse postale complète]</li>
      <li><strong>SIREN :</strong> [À COMPLÉTER]</li>
      <li><strong>RCS :</strong> [À COMPLÉTER : ville et numéro]</li>
      <li><strong>Numéro de TVA intracommunautaire :</strong> [À COMPLÉTER, si applicable]</li>
      <li><strong>Adresse e-mail :</strong> [À COMPLÉTER : contact@…]</li>
      <li><strong>Téléphone :</strong> [À COMPLÉTER, optionnel]</li>
    </ul>

    <h2>2. Directeur de la publication</h2>
    <p>
      [À COMPLÉTER : prénom, nom et qualité du directeur de la publication]
    </p>

    <h2>3. Hébergement</h2>
    <p>
      Le site est hébergé par :
    </p>
    <ul>
      <li><strong>Frontend :</strong> [À COMPLÉTER : Vercel Inc. — 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis / ou Netlify Inc., etc.]</li>
      <li>
        <strong>Backend &amp; base de données :</strong> Supabase Inc., 970 Toa Payoh North #07-04, Singapour 318992.
      </li>
    </ul>

    <h2>4. Propriété intellectuelle</h2>
    <p>
      L'ensemble des éléments composant le site (textes, graphismes, logo, icônes, images, code source) sont la propriété exclusive de l'éditeur ou de ses partenaires et sont protégés par le droit français et international de la propriété intellectuelle. Toute reproduction, représentation, modification, publication ou adaptation, totale ou partielle, est interdite sans autorisation écrite préalable.
    </p>

    <h2>5. Crédits</h2>
    <p>
      Conception &amp; développement : éditeur. Composants UI : shadcn/ui (MIT). Icônes : Lucide (ISC).
    </p>

    <h2>6. Contact</h2>
    <p>
      Pour toute question relative au site ou au service AutoLead AI, écrivez à <strong>[À COMPLÉTER : email contact]</strong>.
    </p>
  </LegalLayout>
);

export default MentionsLegales;
