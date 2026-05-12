import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Reveal from "@/components/motion/Reveal";
import RevealGroup from "@/components/motion/RevealGroup";
import TiltCard from "@/components/motion/TiltCard";
import { fadeUp } from "@/components/motion/motion";

type Plan = {
  name: string;
  price: string;
  tagline: string;
  features: string[];
  cta: string;
  plan: string;
  highlight?: boolean;
};

const plans: Plan[] = [
  {
    name: "Starter",
    price: "399",
    tagline: "Pour démarrer sans risque.",
    features: [
      "Chatbot IA sur votre site",
      "50 devis automatiques / mois",
      "50 RDV / mois",
      "Support par email",
    ],
    cta: "Choisir Starter",
    plan: "starter",
  },
  {
    name: "Pro",
    price: "549",
    tagline: "Le plus choisi par les garagistes.",
    features: [
      "Chatbot IA sur tous vos canaux",
      "200 devis / mois",
      "SMS de rappel RDV",
      "Relances SMS révisions & pneus hiver",
      "Support prioritaire",
    ],
    cta: "Choisir Pro",
    plan: "pro",
    highlight: true,
  },
  {
    name: "Premium",
    price: "799",
    tagline: "Pour les garages qui scalent.",
    features: [
      "Tout Pro, +",
      "Prise d'appels téléphoniques par l'IA",
      "Devis & RDV illimités",
      "WhatsApp Business",
      "Widget white-label",
      "Account manager dédié",
    ],
    cta: "Choisir Premium",
    plan: "premium",
  },
];

const Pricing = () => (
  <section id="tarifs" className="border-b border-border bg-surface py-20 md:py-28">
    <div className="container-page">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Tarifs
        </span>
        <h2 className="text-display mt-3 text-[34px] sm:text-[44px]">
          Un prix fixe. Pas de surprise.
        </h2>
        <p className="mt-4 text-[16px] text-muted-foreground">
          14 jours gratuits sur tous les plans. Annulable à tout moment.
        </p>
      </Reveal>

      <RevealGroup className="mt-14 grid gap-5 lg:grid-cols-3" stagger={0.12}>
        {plans.map((p) => (
          <motion.div
            key={p.name}
            variants={fadeUp}
            className={p.highlight ? "lg:-translate-y-2" : ""}
          >
            <TiltCard
              max={p.highlight ? 5 : 3}
              scale={p.highlight ? 1.02 : 1.01}
              className={[
                "relative flex h-full flex-col rounded-xl border bg-background p-7 transition-shadow duration-200",
                p.highlight
                  ? "border-primary shadow-card-hover"
                  : "border-border hover:shadow-card-hover",
              ].join(" ")}
            >
              {p.highlight && (
                <>
                  {/* Conic gradient sweep — runs once on view */}
                  <motion.span
                    aria-hidden
                    initial={{ opacity: 1, rotate: 0 }}
                    whileInView={{ rotate: 360 }}
                    viewport={{ once: true, margin: "-10% 0px" }}
                    transition={{ duration: 1.5, ease: "linear" }}
                    onAnimationComplete={() => {}}
                    className="pointer-events-none absolute -inset-[1px] rounded-xl opacity-60"
                    style={{
                      background:
                        "conic-gradient(from 0deg at 50% 50%, transparent 0deg, hsl(var(--primary)) 60deg, transparent 120deg, transparent 360deg)",
                      WebkitMask:
                        "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      WebkitMaskComposite: "xor",
                      mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      maskComposite: "exclude",
                      padding: "1px",
                    }}
                  />
                  <span className="absolute -top-3 left-7 overflow-hidden rounded-full bg-primary px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-primary-foreground">
                    <span className="relative z-10">Le plus populaire</span>
                    <span
                      aria-hidden
                      className="absolute inset-0 -z-0 shimmer-bg animate-shimmer opacity-80"
                    />
                  </span>
                </>
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

              <div className="mt-8 flex-1" />
              <div className="mt-2">
                <Button
                  className="w-full"
                  size="lg"
                  variant={p.highlight ? "default" : "outline"}
                  asChild
                >
                  <a href="#contact">{p.cta}</a>
                </Button>
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </RevealGroup>
    </div>
  </section>
);

export default Pricing;
