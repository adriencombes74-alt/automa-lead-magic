const testimonials = [
  {
    quote:
      "J'ai récupéré 4 RDV le premier week-end, juste avec les messages reçus le samedi soir. Avant, je les voyais le lundi et ils étaient déjà partis ailleurs.",
    name: "Karim B.",
    role: "Garage K-Auto, Lyon",
    initials: "KB",
  },
  {
    quote:
      "Mes clients pensent que c'est moi qui réponds. L'IA chiffre tellement bien que je signe 1 devis sur 2 sans même décrocher.",
    name: "Sophie M.",
    role: "Méca-Express, Nantes",
    initials: "SM",
  },
  {
    quote:
      "+38% de RDV en 2 mois. Je le rentabilise dès la première semaine du mois. Le reste c'est du bénéf.",
    name: "Patrick L.",
    role: "Garage du Centre, Toulouse",
    initials: "PL",
  },
];

const Temoignages = () => (
  <section className="border-b border-border bg-background py-20 md:py-28">
    <div className="container-page">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Ils l'utilisent déjà
          </span>
          <h2 className="text-display mt-3 text-[34px] sm:text-[44px]">
            +200 garages remplissent leur agenda avec AutoLead.
          </h2>
        </div>
        <div className="flex gap-8">
          <Stat value="+30%" label="de RDV en moyenne" />
          <Stat value="4.9/5" label="satisfaction client" />
        </div>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {testimonials.map((t) => (
          <figure
            key={t.name}
            className="flex flex-col rounded-lg border border-border bg-surface p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <div className="flex gap-0.5 text-warning" aria-hidden>
              {"★★★★★"}
            </div>
            <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-foreground">
              « {t.quote} »
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-4">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-muted font-display text-[13px] font-semibold">
                {t.initials}
              </div>
              <div>
                <p className="text-[14px] font-semibold leading-tight">{t.name}</p>
                <p className="text-[12px] text-muted-foreground">{t.role}</p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  </section>
);

const Stat = ({ value, label }: { value: string; label: string }) => (
  <div>
    <p className="font-display text-[28px] font-bold leading-none tracking-tight text-primary">{value}</p>
    <p className="mt-1 text-[12px] text-muted-foreground">{label}</p>
  </div>
);

export default Temoignages;
