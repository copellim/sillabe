"use client";

// Lesson node on the map. A tappable circle along a unit's vertical path.
// Three visual and interaction states:
// - "completed": filled with the unit accent + check mark, replayable;
// - "current":   pulsing node (accent ring), the point reached so far;
// - "locked":    faded + padlock, not tappable (sequential unlocking).
// Review lessons show a dedicated marker (a star) instead of the number.

import { motion, useReducedMotion } from "motion/react";

export type LessonNodeState = "completed" | "current" | "locked";

type LessonNodeProps = {
  state: LessonNodeState;
  /** Unit accent colour (CSS color, e.g. "var(--color-sillabe-m-accent)"). */
  accent: string;
  /** Label inside the node (e.g. its number). Replaced by ⭐ for a review. */
  label: string;
  isReview?: boolean;
  onClick?: () => void;
  ariaLabel: string;
};

export default function LessonNode({
  state,
  accent,
  label,
  isReview = false,
  onClick,
  ariaLabel,
}: LessonNodeProps) {
  const reduceMotion = useReducedMotion();
  const tappable = state !== "locked";

  // Tap target ≥ 56px (product minimum ≥ 48px), fully round, soft shadow.
  const base =
    "relative flex h-16 w-16 items-center justify-center rounded-full " +
    "text-2xl font-extrabold leading-none shadow-lg shadow-black/10 " +
    "transition-transform";

  const byState =
    state === "completed"
      ? "text-white active:scale-95"
      : state === "current"
        ? "bg-white/70 text-[var(--color-ink)] active:scale-95"
        : "bg-black/5 text-[var(--color-ink)]/30"; // locked

  // Content: a check mark if completed, a padlock if locked, otherwise ⭐ for
  // reviews or the lesson's number/label.
  const content =
    state === "completed" ? "✓" : state === "locked" ? "🔒" : isReview ? "⭐" : label;

  return (
    <motion.button
      type="button"
      onClick={tappable ? onClick : undefined}
      disabled={!tappable}
      aria-label={ariaLabel}
      aria-disabled={!tappable}
      whileTap={reduceMotion || !tappable ? undefined : { scale: 0.95 }}
      // Soft pulse on the current node to say "play here".
      animate={
        state === "current" && !reduceMotion
          ? { scale: [1, 1.08, 1] }
          : undefined
      }
      transition={
        state === "current"
          ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
          : undefined
      }
      className={`${base} ${byState}`}
      style={{
        backgroundColor: state === "completed" ? accent : undefined,
        boxShadow:
          state === "current" ? `0 0 0 4px ${accent}` : undefined,
      }}
    >
      {/* Review badge on completed nodes (the ⭐ replaces the number only
          when the node does not already show a check mark or padlock). */}
      {isReview && state === "completed" && (
        <span aria-hidden className="absolute -right-1 -top-1 text-sm">
          ⭐
        </span>
      )}
      {content}
    </motion.button>
  );
}
