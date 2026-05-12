import { Button } from "@/components/ui/button";
import { openCookieBanner } from "@/components/CookieBanner";
import LegalLayout from "./LegalLayout";

const Cookies = () => (
  <LegalLayout title="Politique cookies" updatedAt="12 mai 2026">
    <h2>1. Qu'est-ce qu'un cookie ?</h2>
    <p>
      Un cookie est un petit fichier déposé sur votre terminal lors de la consultation d'un site. Il permet, entre autres, de mémoriser vos préférences, de sécuriser votre session et de mesurer l'audience du site.
    </p>

    <h2>2. Cookies utilisés sur AutoLead AI</h2>

    <h3>Cookies essentiels (toujours actifs)</h3>
    <ul>
      <li>
        <strong>Session d'authentification Supabase</strong> — maintient votre connexion au tableau de bord. Durée : 1 heure (renouvelée automatiquement).
      </li>
      <li>
        <strong>cookie-consent</strong> (localStorage) — mémorise vos choix de consentement. Durée : 12 mois.
      </li>
      <li>
        <strong>sidebar:state</strong> — mémorise l'état ouvert/fermé de la barre latérale du tableau de bord. Durée : 7 jours.
      </li>
    </ul>

    <h3>Cookies de mesure d'audience (consentement requis)</h3>
    <p>
      Aucun cookie de mesure d'audience n'est déposé à ce jour. En cas d'ajout futur (Plausible, Matomo, ou équivalent), cette page sera mise à jour avant activation et votre consentement sera requis.
    </p>

    <h3>Cookies marketing (consentement requis)</h3>
    <p>
      Aucun cookie marketing n'est déposé à ce jour.
    </p>

    <h2>3. Gérer vos préférences</h2>
    <p>
      Vous pouvez à tout moment modifier vos choix de consentement en cliquant sur le bouton ci-dessous, ou via le lien « Modifier mes cookies » présent en bas de chaque page.
    </p>
    <p>
      <Button onClick={openCookieBanner}>Modifier mes préférences cookies</Button>
    </p>

    <h2>4. Désactivation depuis votre navigateur</h2>
    <p>
      Vous pouvez également configurer votre navigateur pour refuser ou supprimer les cookies. La marche à suivre est disponible dans l'aide de Chrome, Firefox, Safari ou Edge. La désactivation des cookies essentiels peut empêcher le bon fonctionnement du service.
    </p>
  </LegalLayout>
);

export default Cookies;
