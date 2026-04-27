import { Button } from "@/components/ui/button";

const Nav = () => (
  <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/80 backdrop-blur">
    <div className="container-page flex h-14 items-center justify-between">
      <a href="#" className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-foreground text-background font-display text-sm font-bold">A</span>
        <span className="font-display text-[15px] font-semibold tracking-tight">AutoLead AI</span>
      </a>

      <nav className="hidden items-center gap-7 md:flex">
        <a href="#probleme" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Le problème</a>
        <a href="#solution" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Solution</a>
        <a href="#tarifs" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Tarifs</a>
        <a href="#faq" className="text-sm text-muted-foreground transition-colors hover:text-foreground">FAQ</a>
      </nav>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Se connecter</Button>
        <Button size="sm" asChild>
          <a href="#cta">Essayer gratuitement</a>
        </Button>
      </div>
    </div>
  </header>
);

export default Nav;
