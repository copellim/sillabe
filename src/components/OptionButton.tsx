"use client";

// Option of the listening (recognition) quiz.
// Full-width button in a column, with a "building block" look (thick bottom
// border) matching the composition tiles. The letter or syllable is always
// visible (usable without audio). Two visual states:
// - "idle":    neutral look;
// - "correct": pastel green + a small happy hop.

import { motion, useReducedMotion } from "motion/react";

export type OptionState = "idle" | "correct";

type OptionButtonProps = {
  label: string;
  onClick: () => void;
  state?: OptionState;
  disabled?: boolean;
  ariaLabel?: string;
};

export default function OptionButton({
  label,
  onClick,
  state = "idle",
  disabled = false,
  ariaLabel,
}: OptionButtonProps) {
  const reduceMotion = useReducedMotion();

  // Wide tap target (≥ 48px); large, readable letter in focus.
  const base =
    "flex min-h-16 w-full max-w-xs items-center justify-center rounded-3xl " +
    "border-b-4 text-5xl font-extrabold leading-none shadow-lg shadow-black/10 " +
    "transition-[background-color,border-color,opacity] duration-200";

  const byState =
    state === "correct"
      ? "border-[var(--color-sillabe-l-accent)]/40 bg-[var(--color-sillabe-l)] " +
        "text-[var(--color-ink)] ring-4 ring-[var(--color-sillabe-l-accent)]"
      : "border-black/10 bg-white text-[var(--color-ink)]";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel ?? label}
      whileTap={reduceMotion || disabled ? undefined : { scale: 0.95 }}
      // A small happy hop on the right answer makes success tangible.
      animate={
        state === "correct" && !reduceMotion
          ? { scale: [1, 1.08, 1], y: [0, -8, 0] }
          : { scale: 1, y: 0 }
      }
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`${base} ${byState}`}
    >
      {label}
    </motion.button>
  );
}
