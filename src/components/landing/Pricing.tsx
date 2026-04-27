import { Button } from "@/components/ui/button";

type Plan = {
  name: string;
  price: string;
  tagline: string;
  features: string[];
  cta: string;
  highlight?: boolean;
};

const plans: Plan[] = [
  {
    name: "Starter",
    price: "99",
    tagline: "Pour démarrer sans risque.",
    features: [
      "Chatbot IA sur 1 canal (site OU WhatsApp)",
      "Devis automatiques (jusqu'à 50/mois)",
      "Prise de RDV simple",
      "Support par email",
    ],
    cta: "Choisir Starter",
  },
  {
    name: "Pro",
    price: "199",
    tagline: "Le plus choisi par les garagistes.",
    features: [
      "Chatbot IA sur tous vos canaux",
      "Devis illimités",
      "Agenda synchronisé + SMS de rappel",
      "Relance automatique des devis",
      "Support prioritaire",
    ],
    cta: "Choisir Pro",
    highlight: true,
  },
  {
    name: "Premium",
    price: "250",
    tagline: "Pour les garages qui scalent.",
    features: [
      "Tout Pro, +",
      "Multi-établissements",
      "IA entraînée sur vos tarifs précis",
      "Intégration logiciel garage (DMS)",
      "Account manager dédié",
    ],
    cta: "Choisir Premium",
  },
];

const Pricing = () => (
  <section id="tarifs" className="border-b border-border bg-surface py-20 md:py-28">
    <div className="container-page">
      <div className="mx-auto max-w-2xl text-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Tarifs
        </span>
        <h2 className="text-display mt-3 text-[34px] sm:text-[44px]">
          Un prix fixe. Pas de surprise.
        </h2>
        <p className="mt-4 text-[16px] text-muted-foreground">
          14 jours gratuits sur tous les plans. Annulable à tout moment.
        </p>
      </div>

      <div className="mt-14 grid gap-5 lg:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.name}
            className={[
              "relative flex flex-col rounded-xl border bg-background p-7 transition-all duration-200",
              p.highlight
                ? "border-primary shadow-card-hover lg:-translate-y-2"
                : "border-border hover:-translate-y-0.5 hover:shadow-card-hover",
            ].join(" ")}
          >
            {p.highlight && (
              <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-primary-foreground">
                Le plus populaire
              </span>
            )}

            <h3 className="font-display text-[20px] font-semibold tracking-tight">{p.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>

            <div className="mt-6 flex items-baseline gap-1">
              <span className="font-display text-[48px] font-bold tracking-tight">{p.price}€</span>
              <span className="text-sm text-muted-foreground">/mois</span>
            </div>

            <ul className="mt-6 space-y-3 border-t border-border pt-6">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[14px]">
                  <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 pt-2">
              <Button
                className="w-full"
                size="lg"
                variant={p.highlight ? "default" : "outline"}
                asChild
              >
                <a href="#cta">{p.cta}</a>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Pricing;
