const steps = [
  {
    n: "1",
    title: "Installez le widget en 3 minutes.",
    body: "Une ligne de code à coller (ou on le fait pour vous). Ça marche aussi sans site web.",
  },
  {
    n: "2",
    title: "Le bot répond aux clients à votre place.",
    body: "Il pose les bonnes questions, envoie un devis et propose des créneaux dans votre agenda.",
  },
  {
    n: "3",
    title: "Vous recevez des clients prêts à payer.",
    body: "Notification dans l'app : nouveau RDV confirmé. Vous n'avez qu'à ouvrir le capot.",
  },
];

const Comment = () => (
  <section className="border-b border-border bg-background py-20 md:py-28">
    <div className="container-page">
      <div className="flex flex-wrap items-end justify-between gap-6">
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
      </div>

      <ol className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map((s) => (
          <li
            key={s.n}
            className="relative rounded-lg border border-border bg-surface p-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background font-display text-[18px] font-bold text-primary">
              {s.n}
            </div>
            <h3 className="mt-5 text-[18px] font-semibold leading-snug">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
          </li>
        ))}
      </ol>
    </div>
  </section>
);

export default Comment;
