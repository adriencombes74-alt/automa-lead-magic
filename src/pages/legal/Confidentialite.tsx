import LegalLayout from "./LegalLayout";

const Confidentialite = () => (
  <LegalLayout title="Politique de confidentialité" updatedAt="12 mai 2026">
    <h2>1. Responsable de traitement</h2>
    <p>
      Le responsable du traitement des données collectées via le site et le service AutoLead AI est <strong>[À COMPLÉTER : raison sociale]</strong>, dont le siège est situé <strong>[À COMPLÉTER : adresse]</strong>. Contact : <strong>[À COMPLÉTER : email DPO ou contact RGPD]</strong>.
    </p>
    <p>
      Pour les données des clients finaux du garagiste collectées via le chatbot, l'éditeur agit en qualité de <strong>sous-traitant</strong> au sens du RGPD ; le garagiste en est le responsable de traitement.
    </p>

    <h2>2. Données collectées</h2>
    <p>
      Les catégories de données suivantes peuvent être collectées :
    </p>
    <ul>
      <li><strong>Compte Abonné :</strong> e-mail, mot de passe haché, nom du garage, numéro de téléphone, informations de facturation.</li>
      <li><strong>Configuration du garage :</strong> services, tarifs, horaires d'ouverture, branding du widget.</li>
      <li><strong>Données conversationnelles :</strong> messages échangés avec le chatbot (texte, voix), transcriptions, métadonnées (canal, horodatage).</li>
      <li><strong>Données des clients finaux :</strong> nom, téléphone, e-mail, véhicule, demande de prestation, rendez-vous.</li>
      <li><strong>Données techniques :</strong> adresse IP, type de navigateur, données de log et de mesure d'audience (sous réserve de consentement).</li>
    </ul>

    <h2>3. Finalités et bases légales</h2>
    <ul>
      <li><strong>Fourniture du service</strong> (exécution du contrat) — gestion du compte, traitement des conversations, prise de RDV, devis, relances SMS et e-mail.</li>
      <li><strong>Facturation et comptabilité</strong> (obligation légale).</li>
      <li><strong>Amélioration du service</strong> (intérêt légitime) — mesure d'audience, détection d'incidents, qualité de l'IA.</li>
      <li><strong>Communications commerciales</strong> (consentement) — newsletter et offres, uniquement en cas d'opt-in.</li>
    </ul>

    <h2>4. Durées de conservation</h2>
    <ul>
      <li>Compte Abonné : pendant toute la durée de l'abonnement, puis 3 ans à des fins de prospection ; les données de facturation sont conservées 10 ans pour obligation comptable.</li>
      <li>Conversations chatbot : 24 mois à compter du dernier échange.</li>
      <li>Rendez-vous et devis : 5 ans à compter de leur création.</li>
      <li>Données techniques (logs) : 12 mois.</li>
    </ul>

    <h2>5. Sous-traitants et destinataires</h2>
    <p>
      Pour fournir le service, l'Éditeur recourt aux sous-traitants suivants :
    </p>
    <ul>
      <li><strong>Supabase Inc.</strong> — hébergement de la base de données et authentification (région UE).</li>
      <li><strong>Vercel Inc. / Netlify Inc.</strong> — hébergement du frontend [À CONFIRMER selon hébergeur retenu].</li>
      <li><strong>Google LLC (Gemini API)</strong> — modèle d'intelligence artificielle générative. Transfert vers les États-Unis encadré par les Clauses Contractuelles Types de la Commission européenne et le cadre Data Privacy Framework.</li>
      <li><strong>ElevenLabs Inc.</strong> — synthèse et reconnaissance vocale pour l'assistant téléphonique. Transfert vers les États-Unis encadré par les CCT.</li>
      <li><strong>Sendinblue / Brevo (France)</strong> — envoi de SMS et d'e-mails transactionnels.</li>
      <li><strong>Stripe Payments Europe, Ltd.</strong> — traitement des paiements (Irlande / UE).</li>
    </ul>
    <p>
      Un Data Processing Agreement (DPA) est disponible sur demande.
    </p>

    <h2>6. Vos droits</h2>
    <p>
      Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, d'opposition, de limitation et de portabilité de vos données. Vous pouvez également définir des directives relatives à leur sort après votre décès.
    </p>
    <p>
      Pour exercer ces droits, écrivez à <strong>[À COMPLÉTER : email DPO]</strong>. Vous pouvez également introduire une réclamation auprès de la CNIL (<a href="https://www.cnil.fr" rel="noopener noreferrer">www.cnil.fr</a>).
    </p>

    <h2>7. Sécurité</h2>
    <p>
      L'Éditeur met en œuvre les mesures techniques et organisationnelles appropriées pour garantir un niveau de sécurité adapté au risque : chiffrement en transit (TLS), chiffrement au repos, contrôle d'accès, journalisation, sauvegardes.
    </p>

    <h2>8. Cookies</h2>
    <p>
      L'utilisation des cookies est détaillée dans la <a href="/cookies">politique cookies</a>.
    </p>
  </LegalLayout>
);

export default Confidentialite;
