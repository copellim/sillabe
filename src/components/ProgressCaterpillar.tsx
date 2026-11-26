"use client";

import Caterpillar from "@/components/Caterpillar";
import { useProgress } from "@/hooks/useProgress";

// Base caterpillar segments before any progress.
const BASE_SEGMENTS = 3;

/**
 * Caterpillar bound to progress: shows the base segments plus those earned by
 * completing lessons. On the first render (server and hydration) progress has
 * its default values, then `useSyncExternalStore` switches to the real values
 * read from localStorage.
 *
 * Used by the home screen and the game screens.
 */
export default function ProgressCaterpillar({
  className,
  expanded = false,
}: {
  className?: string;
  expanded?: boolean;
}) {
  const { progress } = useProgress();
  const segments = BASE_SEGMENTS + progress.caterpillarSegments;

  return (
    <div className={`w-full max-w-[260px] ${className ?? ""}`}>
      <Caterpillar segments={Math.min(segments, 6)} />
      {expanded && (
        <div
          className="mt-4 flex max-w-[260px] flex-wrap justify-center gap-2"
          aria-label={`${progress.caterpillarSegments} lezioni scoperte`}
        >
          {Array.from({ length: progress.caterpillarSegments }, (_, i) => (
            <span key={i} className="text-2xl" aria-hidden>
              🌼
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
