const items = [
  {
    title: "Le téléphone sonne pendant que vous êtes sous une voiture.",
    body: "Vous ne pouvez pas répondre. Le client appelle le garage d'à côté.",
  },
  {
    title: "Le soir, 12 messages WhatsApp non lus.",
    body: "Devis à faire, RDV à caler, questions techniques… 1h30 après le service.",
  },
  {
    title: "Vous perdez 20 à 40% des demandes.",
    body: "Pas par manque de compétence. Par manque de temps pour répondre vite.",
  },
];

const Probleme = () => (
  <section id="probleme" className="border-b border-border bg-background py-20 md:py-28">
    <div className="container-page">
      <div className="max-w-2xl">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Le problème
        </span>
        <h2 className="text-display mt-3 text-[34px] sm:text-[44px]">
          Vous êtes mécano, <span className="text-muted-foreground">pas standardiste.</span>
        </h2>
        <p className="mt-4 text-[16px] text-muted-foreground">
          Chaque appel manqué, c'est un client qui va voir ailleurs. Et chaque devis fait à 21h, c'est du temps volé à votre famille.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {items.map((it) => (
          <div
            key={it.title}
            className="rounded-lg border border-border bg-surface p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <div className="grid h-9 w-9 place-items-center rounded-md bg-destructive/10 font-display text-destructive">
              ✕
            </div>
            <h3 className="mt-5 text-[18px] font-semibold leading-snug">{it.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{it.body}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Probleme;
