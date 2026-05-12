import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Reveal from "@/components/motion/Reveal";
import { EASE } from "@/components/motion/motion";

const FinalCta = () => (
  <section id="cta" className="bg-background py-24 md:py-32">
    <div className="container-page">
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl border border-border bg-foreground px-8 py-16 text-center sm:px-16 sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "radial-gradient(hsl(var(--background)) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />
          {/* Animated indigo glow blob */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[60%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/30 blur-[80px]"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-background/20 bg-background/5 px-3 py-1 text-xs font-medium text-background/80">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-dot-ping" />
              Réponse sous 24h · sans engagement
            </span>

            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
              className="text-display mx-auto mt-6 max-w-3xl text-[36px] sm:text-[56px]"
              style={{ color: "hsl(var(--background))" }}
            >
              Le prochain client qui vous écrit ce soir, <br className="hidden md:block" />
              <span className="text-primary">qui le récupère ?</span>
            </motion.h2>

            <p className="mx-auto mt-5 max-w-xl text-[16px]" style={{ color: "hsl(var(--neutral))" }}>
              Un mail, quelques questions, un RDV. On s'occupe du reste.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <motion.div
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.1 }}
              >
                <Button
                  size="xl"
                  className="group animate-halo-pulse"
                  asChild
                >
                  <a href="#contact">
                    Nous contacter
                    <span className="ml-1 inline-block transition-transform group-hover:translate-x-1">→</span>
                  </a>
                </Button>
              </motion.div>
              <Button
                size="xl"
                variant="outline"
                className="border-background/20 bg-transparent text-background hover:bg-background/10 hover:text-background"
                asChild
              >
                <Link to="/login">Se connecter</Link>
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  </section>
);

export default FinalCta;
