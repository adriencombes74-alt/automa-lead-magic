const features = [
  {
    tag: "01 — Réponse instantanée",
    title: "Un assistant qui répond à votre place, 24/7.",
    body: "Sur votre site, WhatsApp, Messenger ou Google Business. Il parle comme vous, ne dort jamais et ne perd jamais un client.",
  },
  {
    tag: "02 — Devis automatiques",
    title: "Des devis chiffrés en moins d'une minute.",
    body: "Vous renseignez vos tarifs une seule fois. L'IA pose les bonnes questions et envoie un devis estimatif clair au client.",
  },
  {
    tag: "03 — Agenda rempli tout seul",
    title: "Les RDV se calent dans votre agenda.",
    body: "Le bot connaît vos disponibilités, propose les bons créneaux, envoie SMS de rappel — et réduit les no-shows.",
  },
];

const Solution = () => (
  <section id="solution" className="border-b border-border bg-surface py-20 md:py-28">
    <div className="container-page">
      <div className="max-w-2xl">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
          La solution
        </span>
        <h2 className="text-display mt-3 text-[34px] sm:text-[44px]">
          AutoLead AI gère la partie qui vous fait perdre du temps.
        </h2>
        <p className="mt-4 text-[16px] text-muted-foreground">
          Vous restez le mécano. L'IA s'occupe d'accueillir, chiffrer et caler les RDV.
        </p>
      </div>

      <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="bg-surface p-7">
            <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-primary">
              {f.tag}
            </span>
            <h3 className="font-display mt-4 text-[22px] font-semibold leading-tight tracking-tight">
              {f.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Solution;
