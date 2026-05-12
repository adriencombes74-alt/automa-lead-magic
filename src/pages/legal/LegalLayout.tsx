import { ReactNode } from "react";
import Nav from "@/components/landing/Nav";
import Footer from "@/components/landing/Footer";

type Props = {
  title: string;
  updatedAt: string;
  children: ReactNode;
};

const LegalLayout = ({ title, updatedAt, children }: Props) => (
  <main className="min-h-screen bg-background text-foreground">
    <Nav />
    <section className="border-b border-border bg-surface py-16 md:py-24">
      <div className="container-page max-w-3xl">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Mentions
        </span>
        <h1 className="text-display mt-3 text-[34px] sm:text-[44px]">{title}</h1>
        <p className="mt-3 text-[13px] text-muted-foreground">
          Dernière mise à jour : {updatedAt}
        </p>
      </div>
    </section>
    <article className="container-page max-w-3xl py-12 md:py-16">
      <div className="legal-prose space-y-5">{children}</div>
    </article>
    <Footer />
  </main>
);

export default LegalLayout;
