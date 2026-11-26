// The only access point to localStorage (see CLAUDE.md).
// Every function is SSR-safe and never throws.

import { getAllLessons, getNextLesson } from "@/lib/gameData";
import { observe } from "@/lib/learning";
import type {
  GameProgress,
  Settings,
  LessonSession,
  Practice,
} from "@/types/game";

const STORAGE_KEY = "sillabe-game-progress";
const SCHEMA_VERSION = 2;

const DEFAULT_SETTINGS: Settings = {
  volume: 1,
  audioEnabled: true,
  beginner: true,
  voiceURI: "",
  speechRate: 0.85,
};

export function getDefaultProgress(): GameProgress {
  // The first available lesson is the starting point.
  const first = getAllLessons()[0];
  return {
    version: SCHEMA_VERSION,
    currentUnit: first.unit.id,
    currentLesson: first.lesson.id,
    completedLessons: [],
    caterpillarSegments: 0,
    settings: { ...DEFAULT_SETTINGS },
    practice: {},
    practiceTurn: 0,
    session: null,
  };
}

/**
 * Normalises a raw value from localStorage. If the schema is not the current
 * version (or the value is not a valid object) it returns the defaults: the
 * game is still in development, so progress is reset without a migration.
 * For v2 saves each field is still validated defensively.
 */
function normalize(raw: unknown): GameProgress {
  const def = getDefaultProgress();
  if (typeof raw !== "object" || raw === null) return def;
  const obj = raw as Partial<GameProgress>;
  if (obj.version !== SCHEMA_VERSION) return def; // incompatible schema → reset
  const rawSettings = (obj.settings ?? {}) as Partial<Settings>;
  const practice: Record<string, Practice> = {};
  if (obj.practice && typeof obj.practice === "object") {
    for (const [key, value] of Object.entries(obj.practice)) {
      if (
        value &&
        typeof value === "object" &&
        Number.isFinite(value.lastSeen)
      ) {
        practice[key] = {
          independent: Math.max(0, Number(value.independent) || 0),
          assisted: Math.max(0, Number(value.assisted) || 0),
          needsReview: value.needsReview === true,
          lastSeen: value.lastSeen,
        };
      }
    }
  }
  const session = obj.session;
  return {
    practice,
    practiceTurn: Math.max(0, Number(obj.practiceTurn) || 0),
    session:
      session &&
      typeof session.lessonId === "string" &&
      Number.isInteger(session.index) &&
      session.index >= 0 &&
      Array.isArray(session.reviewTargets)
        ? {
            lessonId: session.lessonId,
            index: session.index,
            reviewTargets: session.reviewTargets
              .filter((t) => typeof t === "string")
              .slice(0, 2),
          }
        : null,
    version: SCHEMA_VERSION,
    currentUnit:
      typeof obj.currentUnit === "string" ? obj.currentUnit : def.currentUnit,
    currentLesson:
      typeof obj.currentLesson === "string"
        ? obj.currentLesson
        : def.currentLesson,
    completedLessons: Array.isArray(obj.completedLessons)
      ? obj.completedLessons.filter(
          (id): id is string => typeof id === "string",
        )
      : def.completedLessons,
    caterpillarSegments:
      typeof obj.caterpillarSegments === "number"
        ? obj.caterpillarSegments
        : def.caterpillarSegments,
    settings: {
      beginner: rawSettings.beginner !== false,
      voiceURI:
        typeof rawSettings.voiceURI === "string" ? rawSettings.voiceURI : "",
      speechRate:
        typeof rawSettings.speechRate === "number"
          ? Math.min(1.1, Math.max(0.65, rawSettings.speechRate))
          : 0.85,
      volume:
        typeof rawSettings.volume === "number"
          ? Math.min(1, Math.max(0, rawSettings.volume))
          : def.settings.volume,
      audioEnabled:
        typeof rawSettings.audioEnabled === "boolean"
          ? rawSettings.audioEnabled
          : def.settings.audioEnabled,
    },
  };
}

export function loadProgress(): GameProgress {
  if (typeof window === "undefined") return getDefaultProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultProgress();
    return normalize(JSON.parse(raw));
  } catch {
    return getDefaultProgress();
  }
}

export function saveProgress(progress: GameProgress): void {
  cache = progress;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // localStorage unavailable (e.g. full private mode): keep the in-memory copy.
    }
  }
  emit();
}

// --- Reactive store for useSyncExternalStore (see hooks/useProgress.ts) ---
// Referentially stable cache: required by `getSnapshot`.

let cache: GameProgress | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

/** Stable snapshot for the server render and the initial hydration. */
const serverSnapshot = getDefaultProgress();

export function subscribeProgress(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cache = null; // invalidate: re-read on the next getSnapshot
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getProgressSnapshot(): GameProgress {
  if (cache === null) cache = loadProgress();
  return cache;
}

export function getProgressServerSnapshot(): GameProgress {
  return serverSnapshot;
}

/**
 * Marks a lesson as completed: adds it to the completed list (if new), adds a
 * caterpillar segment and moves on to the next lesson.
 *
 * In replay mode (a past lesson played again from the map) the current pointer
 * must NOT move: `currentUnit`/`currentLesson` advance only when the completed
 * lesson is actually the current one. Replaying a finished lesson is therefore
 * harmless (no segment, no duplicate, no advance).
 */
export function completeLesson(lessonId: string): GameProgress {
  const current = getProgressSnapshot();
  const alreadyDone = current.completedLessons.includes(lessonId);
  // Advance only when the current lesson was finished, never on a replay.
  const next =
    lessonId === current.currentLesson ? getNextLesson(current) : null;

  const updated: GameProgress = {
    ...current,
    session: lessonId === current.currentLesson ? null : current.session,
    completedLessons: alreadyDone
      ? current.completedLessons
      : [...current.completedLessons, lessonId],
    caterpillarSegments: alreadyDone
      ? current.caterpillarSegments
      : current.caterpillarSegments + 1,
    currentUnit: next ? next.unit.id : current.currentUnit,
    currentLesson: next ? next.lesson.id : current.currentLesson,
  };
  saveProgress(updated);
  return updated;
}

export function updateSettings(partial: Partial<Settings>): GameProgress {
  const current = getProgressSnapshot();
  const updated: GameProgress = {
    ...current,
    settings: { ...current.settings, ...partial },
  };
  saveProgress(updated);
  return updated;
}

export function resetProgress(): GameProgress {
  const fresh = getDefaultProgress();
  saveProgress(fresh);
  return fresh;
}

export function saveSession(session: LessonSession): void {
  const current = getProgressSnapshot();
  if (session.lessonId !== current.currentLesson) return;
  saveProgress({ ...current, session });
}

export function recordPractice(target: string, assisted: boolean): void {
  const current = getProgressSnapshot();
  const turn = current.practiceTurn + 1;
  saveProgress({
    ...current,
    practiceTurn: turn,
    practice: {
      ...current.practice,
      [target]: observe(current.practice[target], assisted, turn),
    },
  });
}
