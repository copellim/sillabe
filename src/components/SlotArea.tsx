"use client";

// Drop area of the composition phase.
// Presentational: it receives the slots (filled or empty, in any order with
// drag and drop) and exposes them to the parent component via `registerSlot`
// to compute the drop. Empty slots are dashed boxes that "breathe" to invite
// dragging; filled ones show the syllable with a pop-in.
// `highlight` pulses the slot during the final syllable-by-syllable read-back.
// Syllables always stay visible on screen (usable without audio).

import { motion, useReducedMotion } from "motion/react";

type SlotAreaProps = {
  /** Content per slot, in order: the placed syllable, or `null` if empty. */
  filled: (string | null)[];
  /** Index of the slot highlighted during the final read-back, if any. */
  highlight?: number | null;
  /** Exposes each slot's DOM element to compute the drop point. */
  registerSlot?: (index: number, el: HTMLDivElement | null) => void;
};

export default function SlotArea({
  filled,
  highlight = null,
  registerSlot,
}: SlotAreaProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {filled.map((syllable, i) => (
        <motion.div
          key={i}
          ref={(el: HTMLDivElement | null) => registerSlot?.(i, el)}
          animate={
            highlight === i && !reduceMotion ? { scale: [1, 1.15, 1] } : { scale: 1 }
          }
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={
            "flex h-20 min-w-24 items-center justify-center rounded-2xl px-4 " +
            "text-4xl font-extrabold leading-none text-[var(--color-ink)] " +
            "transition-colors duration-200 " +
            (syllable
              ? "bg-white shadow-lg shadow-black/10 "
              : "border-4 border-dashed border-[var(--color-ink)]/25 bg-white/20 ") +
            (highlight === i
              ? "ring-4 ring-[var(--unit-accent,var(--color-vocali-accent))]"
              : "")
          }
        >
          {syllable && (
            <motion.span
              initial={reduceMotion ? false : { scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
            >
              {syllable}
            </motion.span>
          )}
        </motion.div>
      ))}
    </div>
  );
}
