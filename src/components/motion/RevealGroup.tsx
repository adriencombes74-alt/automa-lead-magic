import { motion, type HTMLMotionProps } from "framer-motion";
import { staggerParent, STAGGER, VIEWPORT } from "./motion";

type RevealGroupProps = HTMLMotionProps<"div"> & {
  stagger?: number;
  delayChildren?: number;
};

const RevealGroup = ({
  children,
  stagger = STAGGER.default,
  delayChildren = 0,
  ...rest
}: RevealGroupProps) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={staggerParent(stagger, delayChildren)}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export default RevealGroup;
