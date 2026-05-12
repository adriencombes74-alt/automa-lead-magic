import { Link } from 'react-router-dom'
import ChatWidget from '@/components/widget/ChatWidget'

// Token du garage de test "TEST" (1 service configuré, horaires définis, abonnement actif).
// Tout RDV pris ici apparaîtra dans le tableau de bord de ce garage de test.
const TEST_WIDGET_TOKEN = 'f806aa7f-510e-486b-9473-2b1129e0390a'

export default function TestWidget() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-16 space-y-6">
        <Link to="/" className="text-sm text-muted-foreground hover:underline">
          ← Retour
        </Link>

        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Test du chatbot</h1>
          <p className="mt-2 text-muted-foreground">
            Page neutre pour tester l'assistant. Clique sur la bulle bleue en bas à droite,
            puis essaie l'un des scénarios ci-dessous.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold">Scénarios à essayer</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Devis :</strong>{' '}
              "J'aimerais un devis pour une vidange sur ma Peugeot 208 de 2018, 80 000 km"
            </li>
            <li>
              <strong className="text-foreground">RDV valide :</strong>{' '}
              "J'aimerais prendre rendez-vous pour une vidange demain à 14h"{' '}
              <span className="text-xs">(le bot demandera nom, téléphone et email)</span>
            </li>
            <li>
              <strong className="text-foreground">RDV hors horaires :</strong>{' '}
              "Je veux un RDV demain à 3h du matin"{' '}
              <span className="text-xs">(le bot doit refuser)</span>
            </li>
            <li>
              <strong className="text-foreground">RDV sans téléphone :</strong>{' '}
              donne juste un prénom et une heure, le bot doit redemander le téléphone
            </li>
          </ul>
        </div>

        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
          <p className="font-medium">Où voir les résultats ?</p>
          <p className="mt-1">
            Les RDV créés apparaissent dans le dashboard du garage de test
            (statut <strong>"En attente"</strong>). Connecte-toi avec le compte du garage TEST
            puis va sur <code className="rounded bg-yellow-100 px-1">/dashboard/rdv</code> :
            tu verras le véhicule, le service, les notes du client et la conversation au clic.
          </p>
        </div>

        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <p>Le widget est ancré en bas à droite de l'écran ↘</p>
          <p className="mt-1 text-xs">(Position: bottom-right)</p>
        </div>
      </div>

      <ChatWidget
        widgetToken={TEST_WIDGET_TOKEN}
        botName="Assistant Garage TEST"
        color="#2563eb"
        position="bottom-right"
      />
    </div>
  )
}
