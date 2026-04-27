import { Button } from "@/components/ui/button";

const FinalCta = () => (
  <section id="cta" className="bg-background py-24 md:py-32">
    <div className="container-page">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-foreground px-8 py-16 text-center sm:px-16 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(hsl(var(--background)) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-background/20 bg-background/5 px-3 py-1 text-xs font-medium text-background/80">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            14 jours offerts · sans carte bancaire
          </span>

          <h2
            className="text-display mx-auto mt-6 max-w-3xl text-[36px] sm:text-[56px]"
            style={{ color: "hsl(var(--background))" }}
          >
            Le prochain client qui vous écrit ce soir, <br className="hidden md:block" />
            <span className="text-primary">qui le récupère ?</span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-[16px]" style={{ color: "hsl(var(--neutral))" }}>
            Activez AutoLead AI en 3 minutes. Récupérez votre premier RDV avant ce week-end.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button size="xl">Essayer gratuitement →</Button>
            <Button
              size="xl"
              variant="outline"
              className="border-background/20 bg-transparent text-background hover:bg-background/10 hover:text-background"
            >
              Parler à un humain
            </Button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default FinalCta;
