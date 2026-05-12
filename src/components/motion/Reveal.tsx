import { motion, type Variants, type HTMLMotionProps } from "framer-motion";
import { fadeUp, VIEWPORT } from "./motion";

type RevealProps = HTMLMotionProps<"div"> & {
  delay?: number;
  variants?: Variants;
};

const Reveal = ({
  children,
  delay = 0,
  variants = fadeUp,
  ...rest
}: RevealProps) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={variants}
      transition={{ delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export default Reveal;
