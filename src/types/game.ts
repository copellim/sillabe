// The game's data model.
// The content in `data/worlds.json` must match these types.
// The JSON root uses the `units` key (type `UnitsData`); the file keeps the
// name `data/worlds.json`.

export type ExerciseType = "intro" | "letter" | "syllable" | "word";

/** Introduction of a consonant: presentation only, no quiz. */
export interface IntroExercise {
  type: "intro";
  /** The consonant, e.g. "M". */
  target: string;
}

/**
 * Vowel or syllable: presentation + recognition. The quiz builds its options
 * from already known content (`lib/learning.ts`).
 */
export interface SimpleExercise {
  type: "letter" | "syllable";
  target: string;
}

/** Word of 2-3 syllables: presentation + composition + recognition. */
export interface WordExercise {
  type: "word";
  target: string;
  /** Syllables that make up the word, in order (composition). */
  syllables: string[];
  /** Wrong syllables for composition, used only once the child knows them. */
  syllableDistractors: string[];
}

export type Exercise = IntroExercise | SimpleExercise | WordExercise;

export interface Lesson {
  id: string;
  /** Absent = regular lesson; "review" = mixed review (own copy and style). */
  kind?: "review";
  /** 2-6 exercises, played in order. Identified by position (no id). */
  exercises: Exercise[];
}

export interface Unit {
  id: string;
  name: string;
  /** The unit's pastel background colour. */
  color: string;
  /** The unit's accent colour (buttons, slots, map nodes). */
  accent: string;
  lessons: Lesson[];
}

/** Shape of the imported content JSON (`data/worlds.json`). */
export interface UnitsData {
  units: Unit[];
}

export interface Settings {
  /** 0..1 */
  volume: number;
  audioEnabled: boolean;
  beginner: boolean;
  voiceURI: string;
  speechRate: number;
}

export interface GameProgress {
  /** Schema version: changing it resets progress (no migration). */
  version: 2;
  currentUnit: string;
  currentLesson: string;
  completedLessons: string[];
  /** Segments earned by the caterpillar (= number of completed lessons). */
  caterpillarSegments: number;
  settings: Settings;
  practice: Record<string, Practice>;
  practiceTurn: number;
  session: LessonSession | null;
}

/** Private learning observations, never a score shown to the child. */
export interface Practice {
  independent: number;
  assisted: number;
  needsReview: boolean;
  lastSeen: number;
}

export interface LessonSession {
  lessonId: string;
  index: number;
  reviewTargets: string[];
}
