import { Link } from "react-router-dom";
import Reveal from "@/components/motion/Reveal";
import { fadeIn } from "@/components/motion/motion";
import { openCookieBanner } from "@/components/CookieBanner";

type FooterLink = {
  label: string;
  href?: string;
  to?: string;
  onClick?: () => void;
};

const links: FooterLink[] = [
  { label: "Mentions légales", to: "/mentions-legales" },
  { label: "CGV", to: "/cgv" },
  { label: "Confidentialité", to: "/confidentialite" },
  { label: "Cookies", to: "/cookies" },
  { label: "Modifier mes cookies", onClick: openCookieBanner },
  { label: "Contact", href: "/#contact" },
];

const linkClass =
  "group relative transition-colors hover:text-foreground";
const underlineClass =
  "absolute -bottom-0.5 left-0 h-px w-0 bg-foreground transition-all duration-300 group-hover:w-full";

const Footer = () => (
  <Reveal variants={fadeIn}>
    <footer className="border-t border-border bg-surface py-10">
      <div className="container-page flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="AutoLead AI" className="h-6 w-6" />
          <span className="font-display text-[14px] font-semibold tracking-tight">AutoLead AI</span>
          <span className="ml-3 text-[12px] text-muted-foreground">© 2025 — Fait pour les garagistes.</span>
        </div>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[12px] text-muted-foreground">
          {links.map((link) => {
            if (link.to) {
              return (
                <Link key={link.label} to={link.to} className={linkClass}>
                  {link.label}
                  <span className={underlineClass} />
                </Link>
              );
            }
            if (link.onClick) {
              return (
                <button
                  key={link.label}
                  type="button"
                  onClick={link.onClick}
                  className={linkClass}
                >
                  {link.label}
                  <span className={underlineClass} />
                </button>
              );
            }
            return (
              <a key={link.label} href={link.href} className={linkClass}>
                {link.label}
                <span className={underlineClass} />
              </a>
            );
          })}
        </div>
      </div>
    </footer>
  </Reveal>
);

export default Footer;
