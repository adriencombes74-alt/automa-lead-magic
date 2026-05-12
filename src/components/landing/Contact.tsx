import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Reveal from "@/components/motion/Reveal";
import { EASE } from "@/components/motion/motion";

const EMAIL = "automobilelead.ia@gmail.com";

const MAILTO = `mailto:${EMAIL}?subject=${encodeURIComponent(
  "Demande de démo AutoLead AI",
)}&body=${encodeURIComponent(
  `Bonjour,

Je gère un garage et je souhaite en savoir plus sur AutoLead AI.

- Nom du garage :
- Ville :
- Nombre de mécanos :
- Outils actuels (téléphone, site, agenda) :
- Volume de demandes par semaine :
- Téléphone (si vous préférez qu'on vous rappelle) :

Merci !`,
)}`;

const reassurances = [
  "Réponse sous 24h",
  "Sans engagement",
  "Essai gratuit après le 1er échange",
];

const Contact = () => (
  <section id="contact" className="border-b border-border bg-surface py-20 md:py-28">
    <div className="container-page">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Nous contacter
        </span>
        <h2 className="text-display mt-3 text-[34px] sm:text-[44px]">
          Parlons de votre garage.
        </h2>
        <p className="mt-4 text-[16px] text-muted-foreground">
          Quelques questions, un RDV de 15 minutes, et votre essai gratuit démarre.
          Pas d'engagement.
        </p>
      </Reveal>

      <Reveal delay={0.1} className="relative mx-auto mt-12 max-w-2xl">
        {/* Glow indigo derrière la card */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/25 blur-[80px]"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <div className="relative rounded-2xl border border-border bg-background p-8 shadow-card-hover sm:p-10">
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-dot-ping" />
              Disponible — réponse sous 24h
            </span>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Écrivez-nous à
          </p>

          <motion.a
            href={MAILTO}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="mt-2 block break-all text-center font-display text-[28px] font-semibold tracking-tight text-primary underline-offset-4 hover:underline sm:text-[36px]"
          >
            {EMAIL}
          </motion.a>

          <div className="mt-8 flex justify-center">
            <motion.div whileTap={{ scale: 0.97 }} transition={{ duration: 0.1 }}>
              <Button
                size="xl"
                className="group shadow-primary-glow transition-all hover:shadow-[0_8px_24px_rgba(99,102,241,0.55)]"
                asChild
              >
                <a href={MAILTO}>
                  Envoyer un mail maintenant
                  <span className="ml-1 inline-block transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </a>
              </Button>
            </motion.div>
          </div>

          <ul className="mt-8 grid gap-3 border-t border-border pt-6 sm:grid-cols-3">
            {reassurances.map((r) => (
              <li
                key={r}
                className="flex items-center justify-center gap-2 text-center text-[14px] text-foreground"
              >
                <svg
                  className="h-4 w-4 flex-shrink-0 text-success"
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
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Plutôt à l'aise au téléphone ? Mentionnez votre numéro dans le mail, on
          vous rappelle.
        </p>
      </Reveal>
    </div>
  </section>
);

export default Contact;
