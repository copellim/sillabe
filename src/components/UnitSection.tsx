"use client";

// A unit's section on the map. A header band with the unit's pastel background
// (`unit.color`), followed by the lesson nodes in a column along the vertical
// path. Presentational: lesson state and taps come from the caller (the map
// page, which derives them from progress).

import LessonNode, { type LessonNodeState } from "@/components/LessonNode";
import type { Lesson, Unit } from "@/types/game";

type UnitSectionProps = {
  unit: Unit;
  stateOf: (lesson: Lesson) => LessonNodeState;
  onSelect: (unit: Unit, lesson: Lesson) => void;
};

export default function UnitSection({
  unit,
  stateOf,
  onSelect,
}: UnitSectionProps) {
  // Unit accent: defined in the content (`worlds.json`), like the colour.
  const accent = unit.accent;

  return (
    <section className="flex w-full flex-col items-center gap-4">
      {/* Unit header: full-width pastel band */}
      <div
        className="w-full rounded-2xl px-4 py-3 text-center shadow-sm shadow-black/5"
        style={{ backgroundColor: unit.color }}
      >
        <h2 className="text-lg font-extrabold text-[var(--color-ink)]">
          {unit.name}
        </h2>
        {/* The words the unit will build: a preview of the "reward", and for
            the parent an immediate map of the content */}
        {(() => {
          const words = [
            ...new Set(
              unit.lessons.flatMap((l) =>
                l.exercises
                  .filter((e) => e.type === "word")
                  .map((e) => e.target),
              ),
            ),
          ];
          return words.length > 0 ? (
            <p className="pt-0.5 text-xs font-bold text-[var(--color-ink)]/60">
              {words.join(" · ")}
            </p>
          ) : null;
        })()}
      </div>

      {/* Lesson nodes in a column */}
      <div className="flex flex-col items-center gap-3">
        {unit.lessons.map((lesson, i) => {
          const state = stateOf(lesson);
          const isReview = lesson.kind === "review";
          const label = String(i + 1);
          const ariaLabel =
            state === "locked"
              ? `Lezione bloccata`
              : `${isReview ? "Ripasso" : "Lezione"} ${label}${
                  state === "completed" ? ", completata" : ""
                }`;
          return (
            <LessonNode
              key={lesson.id}
              state={state}
              accent={accent}
              label={label}
              isReview={isReview}
              ariaLabel={ariaLabel}
              onClick={() => onSelect(unit, lesson)}
            />
          );
        })}
      </div>
    </section>
  );
}
