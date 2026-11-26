import { getAllLessons } from "./gameData";
import type { Exercise, GameProgress, Practice } from "@/types/game";

export function knownExercises(lessonId: string, index: number): Exercise[] {
  const known: Exercise[] = [];
  for (const { lesson } of getAllLessons()) {
    known.push(
      ...(lesson.id === lessonId
        ? lesson.exercises.slice(0, index + 1)
        : lesson.exercises),
    );
    if (lesson.id === lessonId) break;
  }
  return known;
}

export function choicePool(
  exercise: Exercise,
  known: Exercise[],
  beginner: boolean,
): string[] {
  const available = [
    ...new Set(
      known.filter((e) => e.type === exercise.type).map((e) => e.target),
    ),
  ];
  // Vowels are already familiar to this beginning reader. A first syllable
  // can be compared with a vowel; the first word remains a guided exercise.
  const fallback =
    exercise.type === "letter"
      ? ["A", "E", "I", "O", "U"]
      : exercise.type === "syllable"
        ? known.filter((e) => e.type === "letter").map((e) => e.target)
        : [];
  const peers = available.filter((t) => t !== exercise.target);
  const other = peers.length
    ? peers
    : fallback.filter((t) => t !== exercise.target);
  return [exercise.target, ...other.slice(-(beginner ? 1 : 2))];
}

export function observe(
  previous: Practice | undefined,
  assisted: boolean,
  turn: number,
): Practice {
  return {
    independent: (previous?.independent ?? 0) + (assisted ? 0 : 1),
    assisted: (previous?.assisted ?? 0) + (assisted ? 1 : 0),
    needsReview: assisted,
    lastSeen: turn,
  };
}

export function reviewTargets(progress: GameProgress): string[] {
  return Object.entries(progress.practice)
    .filter(([, p]) => p.needsReview && progress.practiceTurn - p.lastSeen >= 2)
    .sort((a, b) => a[1].lastSeen - b[1].lastSeen)
    .slice(0, 2)
    .map(([target]) => target);
}

export function exerciseFor(target: string): Exercise | undefined {
  return getAllLessons()
    .flatMap(({ lesson }) => lesson.exercises)
    .find((e) => e.type !== "intro" && e.target === target);
}
