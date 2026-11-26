"use client";

// Syllable tile of the composition phase.
// Draggable onto the slots (drag and drop, the main mechanic for children) and
// tappable as a fallback (accessibility, fine motor skills not ready yet).
// The syllable is always visible (usable without audio), target ≥48px, text
// ≥24px, with a slight 3D "building block" look.
// Releasing outside a slot sends the tile back to its place
// (`dragSnapToOrigin`), without any negative feedback.

import { motion, useReducedMotion } from "motion/react";

type SyllableButtonProps = {
  label: string;
  /** Plain tap (composition fallback: fills the next slot). */
  onTap: () => void;
  /** Release after a drag: viewport coordinates of the release point. */
  onDrop: (x: number, y: number) => void;
  ariaLabel?: string;
};

export default function SyllableButton({
  label,
  onTap,
  onDrop,
  ariaLabel,
}: SyllableButtonProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      aria-label={ariaLabel ?? label}
      // Separate gestures: motion cancels the tap when the pointer drags, so
      // drag and tap do not interfere.
      onTap={() => onTap()}
      drag
      dragSnapToOrigin
      dragMomentum={false}
      dragElastic={0.2}
      whileDrag={{ scale: 1.2, zIndex: 30, boxShadow: "0 12px 24px rgba(0,0,0,0.2)" }}
      whileTap={reduceMotion ? undefined : { scale: 0.92 }}
      onDragEnd={(event, info) => {
        // `info.point` is in page coordinates: normalised to the viewport to
        // compare it with the slots' getBoundingClientRect.
        onDrop(info.point.x - window.scrollX, info.point.y - window.scrollY);
      }}
      className={
        "relative flex min-h-16 min-w-20 touch-none items-center justify-center " +
        "rounded-2xl border-b-4 border-black/10 bg-white px-5 text-3xl " +
        "font-extrabold leading-none text-[var(--color-ink)] shadow-lg " +
        "shadow-black/10"
      }
    >
      {label}
    </motion.button>
  );
}
