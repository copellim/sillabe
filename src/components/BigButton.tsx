"use client";

import { useRef, type ReactNode } from "react";

/**
 * Main action button: large, fully round, soft shadow. Used on the home
 * screen ("Gioca") and to move on during play.
 *
 * Three modes, same look:
 * - `href`    → navigation link (<a>);
 * - `onClick` → in-page action (e.g. moving to the next exercise);
 * - neither   → non-interactive placeholder.
 */

type BigButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  ariaLabel?: string;
};

// Double-tap guard window: a second tap within this interval is ignored, so a
// "next" button never skips two steps or navigates twice.
const TAP_GUARD_MS = 500;

const CLASSNAME =
  "flex min-h-16 w-full max-w-xs items-center justify-center rounded-full " +
  "border-b-4 border-black/15 " +
  "bg-[var(--unit-accent,var(--color-vocali-accent))] px-8 py-3 text-center text-2xl leading-tight " +
  "font-extrabold text-[var(--color-ink)] shadow-lg shadow-black/15 " +
  "active:translate-y-0.5 active:scale-95 transition-transform";

export default function BigButton({
  children,
  href,
  onClick,
  ariaLabel,
}: BigButtonProps) {
  // Timestamp of the last accepted tap: later taps within TAP_GUARD_MS are
  // dropped (leading-edge debounce). A ref causes no re-render.
  const lastTap = useRef(0);

  function handleClick() {
    if (!onClick) return;
    const now = Date.now();
    if (now - lastTap.current < TAP_GUARD_MS) return;
    lastTap.current = now;
    onClick();
  }

  if (href) {
    return (
      <a href={href} aria-label={ariaLabel} className={CLASSNAME}>
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      className={CLASSNAME}
    >
      {children}
    </button>
  );
}
