const benefits = [
  {
    metric: "+30%",
    title: "de RDV pris en plus",
    body: "Plus aucune demande perdue. Le bot répond même la nuit, le dimanche, pendant les vacances.",
  },
  {
    metric: "−10h",
    title: "de paperasse par semaine",
    body: "Devis, relances, RDV : tout est automatisé. Vous récupérez vos soirées.",
  },
  {
    metric: "0",
    title: "stress du téléphone",
    body: "Vous travaillez tranquille. Vous regardez l'agenda quand vous voulez.",
  },
  {
    metric: "3 min",
    title: "pour démarrer",
    body: "Aucune installation compliquée. Pas besoin d'être à l'aise avec l'informatique.",
  },
];

const Benefices = () => (
  <section className="border-b border-border bg-background py-20 md:py-28">
    <div className="container-page">
      <div className="max-w-2xl">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Bénéfices
        </span>
        <h2 className="text-display mt-3 text-[34px] sm:text-[44px]">
          Ce que vous gagnez vraiment.
        </h2>
        <p className="mt-4 text-[16px] text-muted-foreground">
          Pas des fonctionnalités. Des résultats concrets, mesurables dès le premier mois.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {benefits.map((b) => (
          <div
            key={b.title}
            className="rounded-lg border border-border bg-surface p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <p className="font-display text-[40px] font-bold leading-none tracking-tight text-primary">
              {b.metric}
            </p>
            <h3 className="mt-4 text-[16px] font-semibold">{b.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{b.body}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Benefices;
