import { motion, useScroll, useTransform } from "framer-motion";

const AmbientBlob = () => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["-10vh", "85vh"]);
  const x = useTransform(scrollYProgress, [0, 0.5, 1], ["-5vw", "5vw", "-3vw"]);
  const opacity = useTransform(scrollYProgress, [0, 0.05, 0.95, 1], [0, 1, 1, 0]);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-1/2 top-0 -z-[1] hidden h-[28vw] w-[28vw] -translate-x-1/2 rounded-full bg-primary opacity-[0.08] blur-[80px] md:block"
      style={{ y, x, opacity }}
    />
  );
};

export default AmbientBlob;
