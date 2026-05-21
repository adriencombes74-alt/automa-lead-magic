import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { EASE } from "@/components/motion/motion";

const Nav = () => {
  const { scrollY } = useScroll();
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 1]);
  const blur = useTransform(scrollY, [0, 80], ["blur(8px)", "blur(14px)"]);

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: EASE }}
      style={{ backdropFilter: blur }}
      className="sticky top-0 z-40 w-full bg-surface/80"
    >
      <motion.div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px bg-border"
        style={{ opacity: borderOpacity }}
      />
      <div className="container-page flex h-14 items-center justify-between">
        <Link to="/" className="group flex items-center gap-2">
          <img
            src="/logo.svg"
            alt="AutoLead AI"
            className="h-7 w-7 transition-transform group-hover:scale-110"
          />
          <span className="font-display text-[15px] font-semibold tracking-tight">AutoLead AI</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {[
            { href: "#probleme", label: "Le problème" },
            { href: "#solution", label: "Solution" },
            { href: "#faq", label: "FAQ" },
            { href: "#contact", label: "Contact" },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="group relative text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-foreground transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
            <Link to="/login">Se connecter</Link>
          </Button>
          <Button size="sm" asChild>
            <a href="#contact">Nous contacter</a>
          </Button>
        </div>
      </div>
    </motion.header>
  );
};

export default Nav;
