"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * Celebration confetti. Pastel DOM particles that fall from the top with a
 * slight drift and rotation, then fade out. Full-screen, non-interactive
 * overlay.
 *
 * Rendered only while `active` is true; honours `prefers-reduced-motion`
 * (no animation → no confetti) like the other animated components.
 * Self-contained, reused by exercise and lesson celebrations.
 */

type ConfettiProps = {
  /** Starts the burst when true. */
  active: boolean;
  /** Number of particles. */
  count?: number;
  /** Fall duration in ms. */
  durationMs?: number;
  className?: string;
};

// Pastel colours from the unit tokens (see globals.css).
const COLORS = [
  "var(--color-vocali-accent)",
  "var(--color-sillabe-m-accent)",
  "var(--color-sillabe-p-accent)",
  "var(--color-sillabe-l-accent)",
  "var(--color-sillabe-t-accent)",
  "var(--color-sillabe-n-accent)",
  "var(--color-sillabe-s-accent)",
  "var(--color-parole-accent)",
];

type Particle = {
  left: number; // % horizontal start position
  drift: number; // px horizontal drift while falling
  size: number; // px
  color: string;
  delay: number; // s
  rotate: number; // total rotation in degrees
  rounded: boolean; // circle or small square
};

// Random generation kept outside render (like `lib/shuffle.ts`): the hooks
// purity rule forbids `Math.random()` in the component body.
function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, () => ({
    left: Math.random() * 100,
    drift: (Math.random() - 0.5) * 80,
    size: 8 + Math.random() * 8,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: Math.random() * 0.3,
    rotate: (Math.random() - 0.5) * 540,
    rounded: Math.random() < 0.5,
  }));
}

export default function Confetti({
  active,
  count = 24,
  durationMs = 2500,
  className,
}: ConfettiProps) {
  const reduceMotion = useReducedMotion();

  // Particles generated once per mount (client only: the component renders
  // after a tap, so there is no risk of a hydration mismatch).
  const [particles] = useState<Particle[]>(() => createParticles(count));

  if (!active || reduceMotion) return null;

  const duration = durationMs / 1000;

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
    >
      {particles.map((p, i) => (
        <motion.span
          key={i}
          style={{
            position: "absolute",
            top: -16,
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.rounded ? "50%" : 2,
          }}
          initial={{ y: 0, x: 0, opacity: 1, rotate: 0 }}
          animate={{
            y: "100vh",
            x: p.drift,
            opacity: [1, 1, 0],
            rotate: p.rotate,
          }}
          transition={{
            duration,
            delay: p.delay,
            ease: "easeIn",
            opacity: { duration, delay: p.delay, times: [0, 0.7, 1] },
          }}
        />
      ))}
    </div>
  );
}
