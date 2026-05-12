import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EASE } from "./motion";
import Typewriter from "./Typewriter";

export type ChatBeat = {
  side: "left" | "right";
  text: string;
  typing?: boolean;
  thinkingMs?: number;
  tone?: "success";
  speed?: number;
};

type ScriptedChatProps = {
  beats: ChatBeat[];
  className?: string;
  startDelay?: number;
  replayDelay?: number;
  maxReplays?: number;
};

const ScriptedChat = ({
  beats,
  className,
  startDelay = 600,
  replayDelay = 12000,
  maxReplays = 1,
}: ScriptedChatProps) => {
  const [step, setStep] = useState(-1);
  const [thinking, setThinking] = useState(false);
  const [replays, setReplays] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setStep(0), startDelay);
    return () => clearTimeout(t);
  }, [startDelay]);

  useEffect(() => {
    if (step < 0 || step >= beats.length) return;
    const beat = beats[step];

    if (beat.typing && beat.thinkingMs) {
      setThinking(true);
      const t = setTimeout(() => setThinking(false), beat.thinkingMs);
      return () => clearTimeout(t);
    }

    if (!beat.typing) {
      const t = setTimeout(() => setStep((s) => s + 1), 700);
      return () => clearTimeout(t);
    }
  }, [step, beats]);

  useEffect(() => {
    if (step >= beats.length && replays < maxReplays) {
      const t = setTimeout(() => {
        setStep(-1);
        setReplays((r) => r + 1);
        setTimeout(() => setStep(0), 200);
      }, replayDelay);
      return () => clearTimeout(t);
    }
  }, [step, beats.length, replays, maxReplays, replayDelay]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [step, thinking]);

  const visible = beats.slice(0, Math.max(0, step + 1));
  const showingThinking = thinking && step >= 0 && step < beats.length;

  return (
    <div ref={scrollerRef} className={className}>
      <AnimatePresence initial={false}>
        {visible.map((beat, i) => {
          const isCurrent = i === step;
          return (
            <motion.div
              key={`${replays}-${i}`}
              initial={{ opacity: 0, y: 8, scale: beat.tone === "success" ? 0.92 : 1 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className={`flex ${beat.side === "right" ? "justify-end" : "justify-start"}`}
            >
              <Bubble side={beat.side} tone={beat.tone}>
                {beat.typing && isCurrent && !showingThinking ? (
                  <Typewriter text={beat.text} speed={beat.speed ?? 22} onDone={() => setStep((s) => s + 1)} />
                ) : (
                  beat.text
                )}
              </Bubble>
            </motion.div>
          );
        })}

        {showingThinking && (
          <motion.div
            key={`thinking-${replays}-${step}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE }}
            className={`flex ${beats[step].side === "right" ? "justify-end" : "justify-start"}`}
          >
            <Bubble side={beats[step].side}>
              <TypingDots />
            </Bubble>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Bubble = ({
  children,
  side,
  tone,
}: {
  children: React.ReactNode;
  side: "left" | "right";
  tone?: "success";
}) => {
  const isRight = side === "right";
  return (
    <div
      className={[
        "max-w-[85%] rounded-lg px-3.5 py-2.5 leading-snug text-[14px]",
        isRight
          ? tone === "success"
            ? "bg-success/10 text-foreground ring-1 ring-success/30"
            : "bg-primary text-primary-foreground"
          : "bg-muted text-foreground",
      ].join(" ")}
    >
      {children}
    </div>
  );
};

const TypingDots = () => (
  <span className="flex items-center gap-1 py-0.5">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="h-1.5 w-1.5 rounded-full bg-foreground/50"
        animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut",
          delay: i * 0.15,
        }}
      />
    ))}
  </span>
);

export default ScriptedChat;
