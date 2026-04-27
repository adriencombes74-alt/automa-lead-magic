type Msg = { from: "client" | "bot"; text: string; time: string; tone?: "success" };

const conversation: Msg[] = [
  { from: "client", text: "Bonsoir, mon embrayage patine sur ma Golf VII essence.", time: "21:42" },
  { from: "bot", text: "Bonsoir 👋 Garage Martin. Quel kilométrage et année ?", time: "21:42" },
  { from: "client", text: "2016, 132 000 km", time: "21:43" },
  {
    from: "bot",
    text:
      "Merci. Remplacement embrayage Golf VII essence : devis estimatif entre 780 € et 920 € (pièces + 4h main d'œuvre). Confirmation après diagnostic.",
    time: "21:43",
  },
  { from: "client", text: "Ok, vous avez de la place cette semaine ?", time: "21:44" },
  {
    from: "bot",
    text: "Disponibilités : mardi 8h, mercredi 14h, vendredi 8h. Lequel vous arrange ?",
    time: "21:44",
  },
  { from: "client", text: "Mardi 8h c'est parfait", time: "21:45" },
  {
    from: "bot",
    text: "✅ RDV confirmé mardi 8h. SMS de rappel à J-1. Bonne soirée !",
    time: "21:45",
    tone: "success",
  },
];

const Demo = () => (
  <section id="demo" className="border-b border-border bg-surface py-20 md:py-28">
    <div className="container-page grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <div>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Démo conversation
        </span>
        <h2 className="text-display mt-3 text-[34px] sm:text-[44px]">
          Du premier message au RDV confirmé.
        </h2>
        <p className="mt-4 text-[16px] text-muted-foreground">
          Une vraie conversation, gérée à 21h45 un dimanche soir. Sans que vous touchiez votre téléphone.
        </p>

        <dl className="mt-8 grid grid-cols-2 gap-4">
          <Stat value="3 min" label="de la 1ère question au RDV" />
          <Stat value="0" label="appel manqué" />
          <Stat value="780 €" label="de chiffre récupéré" />
          <Stat value="24/7" label="toujours disponible" />
        </dl>
      </div>

      <div className="rounded-xl border border-border bg-background p-5 shadow-card-hover">
        <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">G</div>
            <div>
              <p className="text-[13px] font-semibold leading-tight">Garage Martin</p>
              <p className="text-[11px] text-muted-foreground">En ligne · répond instantanément</p>
            </div>
          </div>
          <span className="rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">● Live</span>
        </div>

        <div className="space-y-2.5">
          {conversation.map((m, i) => (
            <div key={i} className={`flex ${m.from === "bot" ? "justify-end" : "justify-start"}`}>
              <div
                className={[
                  "max-w-[78%] rounded-lg px-3.5 py-2 text-[14px] leading-snug",
                  m.from === "bot"
                    ? m.tone === "success"
                      ? "bg-success/10 text-foreground"
                      : "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                ].join(" ")}
              >
                {m.text}
                <div
                  className={`mt-1 font-mono text-[10px] ${
                    m.from === "bot" && m.tone !== "success" ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {m.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const Stat = ({ value, label }: { value: string; label: string }) => (
  <div className="rounded-md border border-border bg-background p-4">
    <dt className="font-display text-[26px] font-bold tracking-tight text-foreground">{value}</dt>
    <dd className="mt-1 text-[12px] text-muted-foreground">{label}</dd>
  </div>
);

export default Demo;
