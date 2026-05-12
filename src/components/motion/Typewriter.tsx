import { useEffect, useState } from "react";

type TypewriterProps = {
  text: string;
  speed?: number;
  start?: boolean;
  showCaret?: boolean;
  onDone?: () => void;
  className?: string;
};

const Typewriter = ({
  text,
  speed = 25,
  start = true,
  showCaret = true,
  onDone,
  className,
}: TypewriterProps) => {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!start) return;
    setShown("");
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        setDone(true);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, start, onDone]);

  return (
    <span className={className}>
      {shown}
      {showCaret && !done && (
        <span
          aria-hidden
          className="ml-0.5 inline-block h-[1em] w-[2px] -mb-0.5 bg-current align-middle animate-blink-caret"
        />
      )}
    </span>
  );
};

export default Typewriter;
