import { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { EASE } from "./motion";

type CountUpProps = {
  to: number;
  from?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  separator?: string;
  className?: string;
};

const CountUp = ({
  to,
  from = 0,
  duration = 1.4,
  prefix = "",
  suffix = "",
  decimals = 0,
  separator = " ",
  className,
}: CountUpProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const motionValue = useMotionValue(from);
  const rounded = useTransform(motionValue, (latest) => {
    const n = Number(latest);
    const fixed = decimals > 0 ? n.toFixed(decimals) : Math.round(n).toString();
    if (separator && decimals === 0) {
      return fixed.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    }
    return fixed;
  });
  const [display, setDisplay] = useState(() => {
    const n = decimals > 0 ? from.toFixed(decimals) : Math.round(from).toString();
    return n;
  });

  useEffect(() => {
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return unsub;
  }, [rounded]);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(motionValue, to, {
      duration,
      ease: EASE,
    });
    return () => controls.stop();
  }, [inView, motionValue, to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
};

export default CountUp;
