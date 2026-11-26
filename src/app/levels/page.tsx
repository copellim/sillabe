"use client";

// Map of units and lessons. A vertical path of units (coloured sections) and
// lessons (nodes in a locked/current/completed state).
// The state is derived from reactive progress: a lesson is completed if it is
// in `completedLessons`, current if it is `currentLesson`, locked otherwise.
// Unlocking is sequential because only completed lessons and the current one
// can be reached. Tapping a playable node → /play with query params (a replay
// for completed lessons); locked nodes are not tappable.

import { useRouter } from "next/navigation";
import BigButton from "@/components/BigButton";
import ProgressCaterpillar from "@/components/ProgressCaterpillar";
import UnitSection from "@/components/UnitSection";
import { type LessonNodeState } from "@/components/LessonNode";
import { useProgress } from "@/hooks/useProgress";
import { getUnits } from "@/lib/gameData";
import type { Lesson, Unit } from "@/types/game";

export default function LevelsPage() {
  const router = useRouter();
  const { progress } = useProgress();
  const units = getUnits();

  function stateOf(lesson: Lesson): LessonNodeState {
    if (progress.completedLessons.includes(lesson.id)) return "completed";
    if (lesson.id === progress.currentLesson) return "current";
    return "locked";
  }

  function handleSelect(unit: Unit, lesson: Lesson) {
    // Only completed or current lessons are tappable (LessonNode disables the
    // locked ones); open them through the query params.
    router.push(`/play?unit=${unit.id}&lesson=${lesson.id}`);
  }

  return (
    <main className="flex flex-1 flex-col items-center px-6 pb-12">
      {/* Header: caterpillar + title */}
      <div className="flex w-full flex-col items-center gap-3 pt-4">
        <ProgressCaterpillar className="max-w-[140px]" />
        <h1 className="text-2xl font-extrabold text-[var(--color-ink)]">
          Scegli livello
        </h1>
      </div>

      {/* Vertical path of units and lessons */}
      <div className="mt-6 flex w-full max-w-xs flex-col items-center gap-8">
        {units.map((unit) => (
          <UnitSection
            key={unit.id}
            unit={unit}
            stateOf={stateOf}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* Back to home */}
      <div className="mt-10 flex w-full flex-col items-center">
        <BigButton href="/" ariaLabel="Torna alla home">
          ← Indietro
        </BigButton>
      </div>
    </main>
  );
}
