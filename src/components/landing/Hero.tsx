import { Button } from "@/components/ui/button";

const Hero = () => (
  <section className="relative overflow-hidden border-b border-border bg-surface">
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
      <div className="animate-fade-up">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Fait pour les garagistes indépendants
        </span>

        <h1 className="text-display mt-6 text-[44px] sm:text-[56px] lg:text-[72px]">
          Gagnez plus de clients <br className="hidden sm:block" />
          <span className="text-primary">sans répondre</span> au téléphone.
        </h1>

        <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
          AutoLead AI répond à vos clients 24/7, génère leurs devis et remplit votre agenda — pendant que vous travaillez sur les voitures.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button size="xl" asChild>
            <a href="#cta">Essayer gratuitement →</a>
          </Button>
          <Button size="xl" variant="outline" asChild>
            <a href="#demo">Voir une démo</a>
          </Button>
        </div>

        <p className="mt-5 text-sm text-muted-foreground">
          ✓ 14 jours offerts &nbsp;·&nbsp; ✓ Sans carte bancaire &nbsp;·&nbsp; ✓ Installation en 3 minutes
        </p>
      </div>

      {/* Mock chat preview */}
      <div className="animate-fade-up rounded-xl border border-border bg-background p-4 shadow-card-hover sm:p-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
          </div>
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">garage-martin.fr</span>
        </div>

        <div className="space-y-3 py-5 text-[14px]">
          <Bubble side="left">Bonjour, ma Clio fait un bruit étrange au freinage 🙈</Bubble>
          <Bubble side="right">Bonjour ! Probablement les plaquettes. Quel est votre kilométrage ?</Bubble>
          <Bubble side="left">85 000 km</Bubble>
          <Bubble side="right">
            Devis estimatif : <strong>189 €</strong> (plaquettes + main d'œuvre, 1h30).
            <br />Je peux vous proposer <strong>jeudi 14h</strong> ou <strong>vendredi 9h</strong> ?
          </Bubble>
          <Bubble side="left">Parfait pour jeudi 14h !</Bubble>
          <Bubble side="right" tone="success">
            ✅ Rendez-vous confirmé. SMS de rappel envoyé.
          </Bubble>
        </div>

        <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-muted-foreground">
          <span>Écrire un message…</span>
          <span className="ml-auto rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">↵</span>
        </div>
      </div>
    </div>
  </section>
);

const Bubble = ({
  children,
  side,
  tone,
}: {
  children: React.ReactNode;
  side: "left" | "right";
  tone?: "success";
}) => {
  const isRight = side === "right";
  return (
    <div className={`flex ${isRight ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[85%] rounded-lg px-3.5 py-2.5 leading-snug",
          isRight
            ? tone === "success"
              ? "bg-success/10 text-foreground"
              : "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
};

export default Hero;
