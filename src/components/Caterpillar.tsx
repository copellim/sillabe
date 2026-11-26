"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * The game's guide caterpillar. A body of round segments in a gently arched
 * row, a head with big eyes and a smile. It sways softly when idle.
 *
 * The `segments` prop is how it grows: the caterpillar gains a segment for
 * every completed lesson (see ProgressCaterpillar).
 */

type CaterpillarProps = {
  /** Number of body segments, head excluded. */
  segments?: number;
  className?: string;
};

// Pastel colours of the body segments (reusing the unit accents).
const BODY_COLORS = [
  "var(--color-vocali-accent)",
  "var(--color-sillabe-m-accent)",
  "var(--color-sillabe-p-accent)",
  "var(--color-sillabe-l-accent)",
  "var(--color-sillabe-t-accent)",
  "var(--color-sillabe-n-accent)",
  "var(--color-sillabe-s-accent)",
  "var(--color-parole-accent)",
];

const HEAD_COLOR = "var(--color-sillabe-l-accent)";

const SEGMENT_R = 18; // body segment radius
const HEAD_R = 24; // head radius (larger)
const STEP = 30; // horizontal distance between centres
const ARC = 7; // height of the body's vertical arch

export default function Caterpillar({
  segments = 3,
  className,
}: CaterpillarProps) {
  const reduceMotion = useReducedMotion();
  const bodyCount = Math.max(1, segments);

  // Growing the new segment: when the count increases, the last segment (next
  // to the head) enters with scale 0→1. The comparison with the previous render
  // uses the "adjust state during render" pattern (React docs), so `grew` is
  // already correct in this render: no flash.
  const [prevCount, setPrevCount] = useState(bodyCount);
  const [grew, setGrew] = useState(false);
  if (bodyCount !== prevCount) {
    setGrew(bodyCount > prevCount);
    setPrevCount(bodyCount);
  }

  // Body segment centres from the left; the head sits at the right end.
  const baseY = HEAD_R + ARC + 4;
  const bodyCenters = Array.from({ length: bodyCount }, (_, i) => {
    const x = HEAD_R + SEGMENT_R + i * STEP;
    // slight arch: the middle segments sit a little higher
    const t = bodyCount > 1 ? i / (bodyCount - 1) : 0;
    const y = baseY - Math.sin(t * Math.PI) * ARC;
    return { x, y };
  });

  const headX = (bodyCenters.at(-1)?.x ?? HEAD_R) + STEP;
  const headY = baseY;

  const width = headX + HEAD_R + 4;
  const height = baseY + HEAD_R + 4;

  return (
    <motion.svg
      role="img"
      aria-label="bruco"
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{
        width: "100%",
        maxWidth: width,
        height: "auto",
        // Sway around the base for a natural movement.
        transformOrigin: "bottom center",
      }}
      animate={undefined}
      transition={
        reduceMotion
          ? undefined
          : {
              duration: 3,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }
      }
    >
      {/* Body segments, from the farthest (left) towards the head */}
      {bodyCenters.map((c, i) => {
        // Only the newest segment grows, and only if the count went up.
        const isNewest = i === bodyCount - 1;
        const animateGrow = grew && isNewest && !reduceMotion;
        return (
          <motion.circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={SEGMENT_R}
            fill={BODY_COLORS[i % BODY_COLORS.length]}
            style={{ transformOrigin: `${c.x}px ${c.y}px` }}
            initial={animateGrow ? { scale: 0 } : false}
            animate={animateGrow ? { scale: 1 } : undefined}
            transition={
              animateGrow
                ? { type: "spring", stiffness: 320, damping: 18 }
                : undefined
            }
          />
        );
      })}

      {/* Head */}
      <circle cx={headX} cy={headY} r={HEAD_R} fill={HEAD_COLOR} />

      {/* Antennae */}
      <g stroke="var(--color-ink)" strokeWidth={2.5} strokeLinecap="round">
        <line
          x1={headX - 6}
          y1={headY - HEAD_R + 4}
          x2={headX - 12}
          y2={headY - HEAD_R - 8}
        />
        <line
          x1={headX + 6}
          y1={headY - HEAD_R + 4}
          x2={headX + 12}
          y2={headY - HEAD_R - 8}
        />
      </g>
      <circle cx={headX - 12} cy={headY - HEAD_R - 8} r={2.5} fill="var(--color-ink)" />
      <circle cx={headX + 12} cy={headY - HEAD_R - 8} r={2.5} fill="var(--color-ink)" />

      {/* Big eyes */}
      <circle cx={headX - 8} cy={headY - 5} r={6.5} fill="#fff" />
      <circle cx={headX + 8} cy={headY - 5} r={6.5} fill="#fff" />
      <circle cx={headX - 6} cy={headY - 4} r={3} fill="var(--color-ink)" />
      <circle cx={headX + 10} cy={headY - 4} r={3} fill="var(--color-ink)" />

      {/* Smile */}
      <path
        d={`M ${headX - 9} ${headY + 8} Q ${headX} ${headY + 16} ${headX + 9} ${headY + 8}`}
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </motion.svg>
  );
}
