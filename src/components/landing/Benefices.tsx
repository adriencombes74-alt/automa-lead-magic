import { motion } from "framer-motion";
import Reveal from "@/components/motion/Reveal";
import RevealGroup from "@/components/motion/RevealGroup";
import CountUp from "@/components/motion/CountUp";
import { fadeUp } from "@/components/motion/motion";

type Benefit = {
  value: number | string;
  prefix?: string;
  suffix?: string;
  literal?: boolean;
  title: string;
  body: string;
};

const benefits: Benefit[] = [
  {
    value: 30,
    prefix: "+",
    suffix: "%",
    title: "de RDV pris en plus",
    body: "Plus aucune demande perdue. Le bot répond même la nuit, le dimanche, pendant les vacances.",
  },
  {
    value: 10,
    prefix: "−",
    suffix: "h",
    title: "de paperasse par semaine",
    body: "Devis, relances révisions et pneus hiver, RDV : tout est automatisé. Vous récupérez vos soirées.",
  },
  {
    value: 0,
    title: "stress du téléphone",
    body: "L'IA décroche à votre place. Vous travaillez tranquille, vous regardez l'agenda quand vous voulez.",
  },
  {
    value: "3 min",
    literal: true,
    title: "pour démarrer",
    body: "Aucune installation compliquée. Pas besoin d'être à l'aise avec l'informatique.",
  },
];

const Benefices = () => (
  <section className="border-b border-border bg-background py-20 md:py-28">
    <div className="container-page">
      <Reveal className="max-w-2xl">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Bénéfices
        </span>
        <h2 className="text-display mt-3 text-[34px] sm:text-[44px]">
          Ce que vous gagnez vraiment.
        </h2>
        <p className="mt-4 text-[16px] text-muted-foreground">
          Pas des fonctionnalités. Des résultats concrets, mesurables dès le premier mois.
        </p>
      </Reveal>

      <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {benefits.map((b) => (
          <motion.div
            key={b.title}
            variants={fadeUp}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group relative rounded-lg border border-border bg-surface p-6 transition-shadow duration-200 hover:shadow-card-hover"
          >
            <motion.p
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.2 }}
              className="font-display text-[40px] font-bold leading-none tracking-tight text-primary"
            >
              {b.literal ? (
                b.value
              ) : (
                <CountUp
                  to={b.value as number}
                  prefix={b.prefix ?? ""}
                  suffix={b.suffix ?? ""}
                />
              )}
            </motion.p>
            <h3 className="mt-4 text-[16px] font-semibold">{b.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{b.body}</p>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                boxShadow: "inset 0 0 0 1px hsl(var(--primary) / 0.3), 0 0 24px hsl(var(--primary) / 0.12)",
              }}
            />
          </motion.div>
        ))}
      </RevealGroup>
    </div>
  </section>
);

export default Benefices;
