const Footer = () => (
  <footer className="border-t border-border bg-surface py-10">
    <div className="container-page flex flex-col items-center justify-between gap-4 md:flex-row">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded bg-foreground text-background font-display text-[11px] font-bold">A</span>
        <span className="font-display text-[14px] font-semibold tracking-tight">AutoLead AI</span>
        <span className="ml-3 text-[12px] text-muted-foreground">© 2025 — Fait pour les garagistes.</span>
      </div>
      <div className="flex gap-6 text-[12px] text-muted-foreground">
        <a href="#" className="transition-colors hover:text-foreground">Mentions légales</a>
        <a href="#" className="transition-colors hover:text-foreground">CGV</a>
        <a href="#" className="transition-colors hover:text-foreground">Contact</a>
      </div>
    </div>
  </footer>
);

export default Footer;
