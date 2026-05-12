import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Reveal from "@/components/motion/Reveal";
import RevealGroup from "@/components/motion/RevealGroup";
import { fadeUp, EASE } from "@/components/motion/motion";

const steps = [
  {
    n: "1",
    title: "Installez le widget en 3 minutes.",
    body: "Une ligne de code à coller (ou on le fait pour vous). Ça marche aussi sans site web.",
  },
  {
    n: "2",
    title: "Le bot répond aux clients à votre place.",
    body: "Il décroche le téléphone, pose les bonnes questions, envoie un devis et propose des créneaux. Il relance même vos clients pour leurs révisions et pneus hiver.",
  },
  {
    n: "3",
    title: "Vous recevez des clients prêts à payer.",
    body: "Notification dans l'app : nouveau RDV confirmé. Vous n'avez qu'à ouvrir le capot.",
  },
];

const Comment = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 70%", "end 60%"],
  });
  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section className="border-b border-border bg-background py-20 md:py-28">
      <div className="container-page">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Comment ça marche
            </span>
            <h2 className="text-display mt-3 text-[34px] sm:text-[44px]">
              3 étapes. Aucune compétence technique.
            </h2>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            Si vous savez envoyer un SMS, vous savez utiliser AutoLead AI. C'est promis.
          </p>
        </Reveal>

        <div ref={ref} className="relative mt-12">
          {/* Connecting SVG line — desktop only */}
          <svg
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-5 hidden h-12 w-full md:block"
            viewBox="0 0 100 10"
            preserveAspectRatio="none"
          >
            <path
              d="M 16 5 L 50 5 L 84 5"
              stroke="hsl(var(--border))"
              strokeWidth="0.4"
              strokeDasharray="1.5 1.5"
              fill="none"
            />
            <motion.path
              d="M 16 5 L 50 5 L 84 5"
              stroke="hsl(var(--primary))"
              strokeWidth="0.6"
              fill="none"
              strokeLinecap="round"
              style={{ pathLength }}
            />
          </svg>

          <RevealGroup className="grid gap-6 md:grid-cols-3" stagger={0.12}>
            {steps.map((s) => (
              <motion.div
                key={s.n}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="group relative rounded-lg border border-border bg-surface p-7 transition-shadow duration-200 hover:shadow-card-hover"
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="relative z-10 flex h-10 w-10 items-center justify-center rounded-md border border-primary/20 bg-background font-display text-[18px] font-bold text-primary shadow-sm"
                >
                  {s.n}
                </motion.div>
                <h3 className="mt-5 text-[18px] font-semibold leading-snug">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </motion.div>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
};

export default Comment;
