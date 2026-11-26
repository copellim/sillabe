"use client";

// Presentation phase for words, as guided reading.
// For a child who cannot read yet, seeing the whole word at once does not
// explain how it is built: here the syllables come in one at a time, each
// spoken while it pulses, then they "merge" into the whole word, read last
// ("ME… LA… MELA!"). Everything stays tappable to listen again: each syllable
// its own sound, the whole word its own. Usable without audio: the visual
// sequence has a minimum rhythm independent of speech.
// Audio only through `useAudio` (see CLAUDE.md). Mount with a `key` per word.

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useAudio } from "@/hooks/useAudio";

// Minimum rhythm of the sequence (also with muted audio).
const START_DELAY_MS = 400;
const SYLLABLE_STEP_MS = 650;

type WordRevealProps = {
  /** Target word, e.g. "MELA". */
  target: string;
  /** Syllables in order, e.g. ["ME", "LA"]. */
  syllables: string[];
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function WordReveal({ target, syllables }: WordRevealProps) {
  const { speak, stop } = useAudio();
  const reduceMotion = useReducedMotion();

  // How many syllables have been revealed; the whole word comes at the end.
  const [revealed, setRevealed] = useState(0);
  const [showWord, setShowWord] = useState(false);
  // Syllable pulsing because it is being spoken (sequence or replay).
  const generation = useRef(0);
  const [speaking, setSpeaking] = useState<number | null>(null);

  // Guided reading sequence, run once on mount (with an unmount guard for the
  // asynchronous steps). `speak`/`stop` change only with the settings: the
  // sequence must not run again, hence the ref.
  const audioRef = useRef({ speak, stop });
  useEffect(() => {
    audioRef.current = { speak, stop };
  }, [speak, stop]);
  useEffect(() => {
    const current = ++generation.current;
    const alive = () => current === generation.current;
    async function run() {
      await delay(START_DELAY_MS);
      for (let i = 0; i < syllables.length; i++) {
        if (!alive()) return;
        setRevealed(i + 1);
        setSpeaking(i);
        await Promise.all([
          audioRef.current.speak(syllables[i]),
          delay(SYLLABLE_STEP_MS),
        ]);
      }
      if (!alive()) return;
      setSpeaking(null);
      setShowWord(true);
      await audioRef.current.speak(`${target}!`);
    }
    void run();
    return () => {
      if (generation.current === current) generation.current = current + 1;
      audioRef.current.stop();
    };
  }, [target, syllables]);

  function replaySyllable(i: number) {
    const current = ++generation.current;
    setRevealed(syllables.length);
    setShowWord(true);
    setSpeaking(i);
    void speak(syllables[i]).then(() => {
      if (current === generation.current) setSpeaking(null);
    });
  }
  function replayWord() {
    generation.current++;
    setSpeaking(null);
    setRevealed(syllables.length);
    setShowWord(true);
    void speak(target);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8">
      {/* Syllables come in one at a time, spoken while they pulse */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {syllables.map((syll, i) => (
          <motion.button
            key={`${syll}-${i}`}
            type="button"
            disabled={i >= revealed}
            onClick={() => replaySyllable(i)}
            aria-label={`Riascolta ${syll}`}
            initial={reduceMotion ? false : { scale: 0.3, opacity: 0, y: 12 }}
            animate={
              i < revealed
                ? speaking === i && !reduceMotion
                  ? { scale: [1, 1.18, 1], opacity: 1, y: 0 }
                  : { scale: 1, opacity: 1, y: 0 }
                : { scale: 0.3, opacity: 0, y: 12 }
            }
            transition={
              speaking === i
                ? { duration: 0.45, ease: "easeOut" }
                : { type: "spring", stiffness: 400, damping: 20 }
            }
            className={
              "flex h-20 min-w-24 items-center justify-center rounded-2xl " +
              "border-b-4 border-black/10 bg-white px-4 text-4xl font-extrabold " +
              "leading-none text-[var(--color-ink)] shadow-lg shadow-black/10 " +
              (speaking === i
                ? "ring-4 ring-[var(--unit-accent,var(--color-vocali-accent))]"
                : "")
            }
          >
            {syll}
          </motion.button>
        ))}
      </div>

      {/* The whole word appears at the end, large and replayable */}
      <motion.button
        type="button"
        disabled={!showWord}
        onClick={replayWord}
        aria-label={`Riascolta ${target}`}
        initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
        animate={
          showWord ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }
        }
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
        whileTap={reduceMotion ? undefined : { scale: 0.95 }}
        style={{ pointerEvents: showWord ? "auto" : "none" }}
        className="flex h-32 w-full max-w-xs items-center justify-center rounded-[2.5rem] border-b-8 border-black/10 bg-white text-5xl font-extrabold leading-none tracking-wide text-[var(--color-ink)] shadow-xl shadow-black/10"
      >
        {target}
      </motion.button>
    </div>
  );
}
