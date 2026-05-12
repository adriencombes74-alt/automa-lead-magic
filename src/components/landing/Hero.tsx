import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import ScriptedChat, { type ChatBeat } from "@/components/motion/ScriptedChat";
import { EASE } from "@/components/motion/motion";

const beats: ChatBeat[] = [
  { side: "left", text: "Bonjour, ma Clio fait un bruit étrange au freinage 🙈" },
  { side: "right", text: "Bonjour ! Probablement les plaquettes. Quel est votre kilométrage ?", typing: true, thinkingMs: 700, speed: 18 },
  { side: "left", text: "85 000 km" },
  {
    side: "right",
    text: "Devis estimatif : 189 € (plaquettes + main d'œuvre, 1h30). Je peux vous proposer jeudi 14h ou vendredi 9h ?",
    typing: true,
    thinkingMs: 900,
    speed: 16,
  },
  { side: "left", text: "Parfait pour jeudi 14h !" },
  {
    side: "right",
    text: "✅ Rendez-vous confirmé. SMS de rappel envoyé. Relance révision programmée dans 6 mois.",
    typing: true,
    thinkingMs: 500,
    tone: "success",
    speed: 22,
  },
];

const Hero = () => (
  <section className="relative overflow-hidden border-b border-border bg-surface">
    {/* Aurora gradient mesh */}
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "linear-gradient(135deg, hsl(239 84% 67% / 0.10) 0%, hsl(264 84% 60% / 0.08) 50%, hsl(239 84% 67% / 0.10) 100%)",
      }}
    />
    <div
      aria-hidden
      className="pointer-events-none absolute -inset-[20%] animate-aurora-drift"
      style={{
        background:
          "radial-gradient(50% 50% at 30% 40%, hsl(239 84% 67% / 0.55) 0%, transparent 65%)",
      }}
    />
    <div
      aria-hidden
      className="pointer-events-none absolute -inset-[20%] animate-aurora-drift-alt"
      style={{
        background:
          "radial-gradient(45% 45% at 75% 60%, hsl(264 84% 65% / 0.50) 0%, transparent 65%)",
      }}
    />
    <div
      aria-hidden
      className="pointer-events-none absolute -inset-[20%] animate-aurora-drift-alt"
      style={{
        background:
          "radial-gradient(40% 40% at 90% 30%, hsl(220 90% 65% / 0.40) 0%, transparent 65%)",
        animationDelay: "-8s",
      }}
    />

    {/* dot grid */}
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.5]"
      style={{
        backgroundImage:
          "radial-gradient(hsl(var(--border)) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
        maskImage:
          "radial-gradient(ellipse at center, black 40%, transparent 75%)",
      }}
    />

    <div className="container-page relative grid gap-16 py-20 md:py-28 lg:grid-cols-[1.1fr_1fr] lg:items-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-dot-ping" />
          Fait pour les garagistes indépendants
        </span>

        <h1 className="text-display mt-6 text-[44px] sm:text-[56px] lg:text-[72px]">
          Gagnez plus de clients <br className="hidden sm:block" />
          <span className="underline-draw text-primary">sans répondre</span> au téléphone.
        </h1>

        <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
          AutoLead AI répond à vos clients et décroche vos appels 24/7, génère leurs devis, remplit votre agenda et relance vos clients pour leurs révisions et pneus hiver — pendant que vous travaillez sur les voitures.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button size="xl" className="group shadow-primary-glow transition-all hover:shadow-[0_8px_24px_rgba(99,102,241,0.55)]" asChild>
            <a href="#contact">
              Nous contacter
              <span className="ml-1 inline-block transition-transform group-hover:translate-x-1">→</span>
            </a>
          </Button>
          <Button size="xl" variant="outline" asChild>
            <a href="#demo">Voir une démo</a>
          </Button>
        </div>

        <p className="mt-5 text-sm text-muted-foreground">
          ✓ Réponse sous 24h &nbsp;·&nbsp; ✓ Sans engagement &nbsp;·&nbsp; ✓ Essai gratuit après contact
        </p>
      </motion.div>

      {/* Live scripted chat */}
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
        className="rounded-xl border border-border bg-background/90 p-4 shadow-card-hover backdrop-blur sm:p-6"
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
          </div>
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            garage-martin.fr
          </span>
        </div>

        <ScriptedChat
          beats={beats}
          className="flex h-[340px] flex-col gap-3 overflow-hidden py-5 scroll-smooth sm:h-[360px]"
        />

        <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-muted-foreground">
          <span>Écrire un message…</span>
          <span className="ml-auto rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">↵</span>
        </div>
      </motion.div>
    </div>
  </section>
);

export default Hero;
