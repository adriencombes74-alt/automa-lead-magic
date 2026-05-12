import type { Variants, Transition } from "framer-motion";

export const EASE = [0.22, 1, 0.36, 1] as const;

export const DUR = {
  hover: 0.2,
  entry: 0.6,
  long: 1.2,
} as const;

export const STAGGER = {
  default: 0.08,
  tight: 0.04,
} as const;

export const VIEWPORT = {
  once: true,
  margin: "-15% 0px",
} as const;

const baseTransition: Transition = {
  duration: DUR.entry,
  ease: EASE,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: baseTransition },
};

export const fadeUpSmall: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: baseTransition },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: baseTransition },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: baseTransition },
};

export const cardLay: Variants = {
  hidden: { opacity: 0, y: 12, rotate: -1 },
  visible: { opacity: 1, y: 0, rotate: 0, transition: baseTransition },
};

export const staggerParent = (stagger = STAGGER.default, delayChildren = 0): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: stagger,
      delayChildren,
    },
  },
});
