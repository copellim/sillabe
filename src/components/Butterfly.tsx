"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Final butterfly: the game's climax, shown when the child completes the last
 * lesson. It is the caterpillar grown up: a segmented body and four pastel
 * wings that flap gently.
 *
 * A simple transformation (no segment morphing): on the final screen the
 * butterfly takes the caterpillar's place and scales in with a small flight.
 * With `prefers-reduced-motion` it stays static and readable.
 */

type ButterflyProps = {
  className?: string;
};

// Reuses the unit accents for the wings, so the butterfly "gathers" the colours
// collected along the way.
const WING_TOP = "var(--color-sillabe-p-accent)";
const WING_BOTTOM = "var(--color-sillabe-t-accent)";
const BODY_COLOR = "var(--color-sillabe-l-accent)";

export default function Butterfly({ className }: ButterflyProps) {
  const reduceMotion = useReducedMotion();

  const cx = 90;
  const cy = 70;

  // Looping wing flap: a slight horizontal squeeze.
  const flap = reduceMotion
    ? undefined
    : {
        scaleX: [1, 0.82, 1],
        transition: {
          duration: 1.6,
          repeat: Infinity,
          repeatType: "mirror" as const,
          ease: "easeInOut" as const,
        },
      };

  return (
    <motion.svg
      role="img"
      aria-label="farfalla"
      viewBox="0 0 180 140"
      className={className}
      style={{ width: "100%", maxWidth: 180, height: "auto" }}
      initial={reduceMotion ? false : { scale: 0.4, opacity: 0, y: 12 }}
      animate={
        reduceMotion
          ? undefined
          : {
              scale: 1,
              opacity: 1,
              y: [12, -8, 0],
            }
      }
      transition={
        reduceMotion ? undefined : { duration: 1.1, ease: "easeOut" }
      }
    >
      {/* Antennae */}
      <g
        stroke="var(--color-ink)"
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      >
        <path d={`M ${cx - 4} ${cy - 26} Q ${cx - 16} ${cy - 44} ${cx - 26} ${cy - 46}`} />
        <path d={`M ${cx + 4} ${cy - 26} Q ${cx + 16} ${cy - 44} ${cx + 26} ${cy - 46}`} />
      </g>
      <circle cx={cx - 26} cy={cy - 46} r={3} fill="var(--color-ink)" />
      <circle cx={cx + 26} cy={cy - 46} r={3} fill="var(--color-ink)" />

      {/* Wings (left/right), each a group that flaps around the body */}
      <motion.g style={{ transformOrigin: `${cx}px ${cy}px` }} animate={flap}>
        {/* Upper left wing */}
        <ellipse cx={cx - 34} cy={cy - 16} rx={34} ry={28} fill={WING_TOP} />
        {/* Lower left wing */}
        <ellipse cx={cx - 28} cy={cy + 22} rx={26} ry={22} fill={WING_BOTTOM} />
        {/* Upper right wing */}
        <ellipse cx={cx + 34} cy={cy - 16} rx={34} ry={28} fill={WING_TOP} />
        {/* Lower right wing */}
        <ellipse cx={cx + 28} cy={cy + 22} rx={26} ry={22} fill={WING_BOTTOM} />
        {/* Decorative dots on the wings */}
        <circle cx={cx - 36} cy={cy - 18} r={6} fill="#fff" opacity={0.7} />
        <circle cx={cx + 36} cy={cy - 18} r={6} fill="#fff" opacity={0.7} />
      </motion.g>

      {/* Segmented body */}
      <rect
        x={cx - 6}
        y={cy - 28}
        width={12}
        height={56}
        rx={6}
        fill={BODY_COLOR}
      />

      {/* Big smiling eyes on the head */}
      <circle cx={cx - 3} cy={cy - 20} r={2.6} fill="var(--color-ink)" />
      <circle cx={cx + 3} cy={cy - 20} r={2.6} fill="var(--color-ink)" />
      <path
        d={`M ${cx - 4} ${cy - 13} Q ${cx} ${cy - 9} ${cx + 4} ${cy - 13}`}
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </motion.svg>
  );
}
