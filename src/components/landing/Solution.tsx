import { motion } from "framer-motion";
import Reveal from "@/components/motion/Reveal";
import RevealGroup from "@/components/motion/RevealGroup";
import CountUp from "@/components/motion/CountUp";
import { fadeUp } from "@/components/motion/motion";

const features = [
  {
    n: 1,
    label: "Réponse instantanée",
    title: "Un assistant qui répond à votre place, 24/7.",
    body: "Sur votre téléphone, votre site, WhatsApp, Messenger ou Google Business. Il décroche, répond, parle comme vous, ne dort jamais et ne perd jamais un client.",
  },
  {
    n: 2,
    label: "Devis automatiques",
    title: "Des devis chiffrés en moins d'une minute.",
    body: "Vous renseignez vos tarifs une seule fois. L'IA pose les bonnes questions et envoie un devis estimatif clair au client.",
  },
  {
    n: 3,
    label: "Agenda rempli tout seul",
    title: "Les RDV se calent dans votre agenda.",
    body: "Le bot connaît vos disponibilités, propose les bons créneaux, envoie SMS de rappel et relance automatiquement vos clients pour leurs révisions et leurs pneus hiver — réduit les no-shows.",
  },
];

const Solution = () => (
  <section id="solution" className="border-b border-border bg-surface py-20 md:py-28">
    <div className="container-page">
      <Reveal className="max-w-2xl">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
          La solution
        </span>
        <h2 className="text-display mt-3 text-[34px] sm:text-[44px]">
          AutoLead AI gère la partie qui vous fait perdre du temps.
        </h2>
        <p className="mt-4 text-[16px] text-muted-foreground">
          Vous restez le mécano. L'IA s'occupe d'accueillir, chiffrer et caler les RDV.
        </p>
      </Reveal>

      <RevealGroup className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
        {features.map((f) => (
          <motion.div
            key={f.title}
            variants={fadeUp}
            whileHover={{ y: -2 }}
            className="group relative bg-surface p-7 transition-colors hover:bg-surface"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-primary">
              <CountUp to={f.n} prefix="0" /> — {f.label}
            </span>
            <h3 className="font-display mt-4 text-[22px] font-semibold leading-tight tracking-tight">
              {f.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            <span className="absolute bottom-0 left-0 h-px w-0 bg-primary transition-all duration-500 group-hover:w-full" />
          </motion.div>
        ))}
      </RevealGroup>
    </div>
  </section>
);

export default Solution;
