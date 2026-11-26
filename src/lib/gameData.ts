// Navigation of the game content. Pure functions: no localStorage access, they
// work only on the static data and on the progress object passed in.

import worldsData from "@/data/worlds.json";
import type { GameProgress, Lesson, Unit, UnitsData } from "@/types/game";

const data = worldsData as UnitsData;

export interface LessonLocation {
  unit: Unit;
  lesson: Lesson;
}

export function getUnits(): Unit[] {
  return data.units;
}

export function getUnit(unitId: string): Unit | undefined {
  return data.units.find((u) => u.id === unitId);
}

export function getLesson(unitId: string, lessonId: string): Lesson | undefined {
  return getUnit(unitId)?.lessons.find((l) => l.id === lessonId);
}

/** Flat sequence of all lessons, in order, across units. */
export function getAllLessons(): LessonLocation[] {
  return data.units.flatMap((unit) =>
    unit.lessons.map((lesson) => ({ unit, lesson })),
  );
}

/**
 * Current lesson according to progress. Falls back to the first available
 * lesson if `currentUnit`/`currentLesson` cannot be resolved.
 */
export function getCurrentLesson(progress: GameProgress): LessonLocation {
  const all = getAllLessons();
  const match = all.find(
    ({ unit, lesson }) =>
      unit.id === progress.currentUnit && lesson.id === progress.currentLesson,
  );
  return match ?? all[0];
}

/**
 * Next lesson in the flat sequence after the current one.
 * `null` if the current one is the last (end of the available content).
 */
export function getNextLesson(progress: GameProgress): LessonLocation | null {
  const all = getAllLessons();
  const index = all.findIndex(
    ({ unit, lesson }) =>
      unit.id === progress.currentUnit && lesson.id === progress.currentLesson,
  );
  if (index === -1 || index + 1 >= all.length) return null;
  return all[index + 1];
}
