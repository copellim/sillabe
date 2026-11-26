// Content validation. Walks the lessons in the game's flat order and checks
// that the spiral curriculum is consistent: no word uses a syllable not yet
// introduced, ids are unique, exercises and options stay within their limits,
// and words match their syllables.

import { describe, expect, it } from "vitest";
import worldsData from "@/data/worlds.json";
import { getAllLessons } from "@/lib/gameData";
import type { Exercise, UnitsData, WordExercise } from "@/types/game";

const data = worldsData as UnitsData;

/** À/È/Ì/Ò/Ù → A/E/I/O/U, to compare accented words with their syllables. */
function stripAccents(s: string): string {
  return s
    .replace(/À/g, "A")
    .replace(/È/g, "E")
    .replace(/Ì/g, "I")
    .replace(/Ò/g, "O")
    .replace(/Ù/g, "U");
}

describe("spiral curriculum", () => {
  it("has the expected structure: 12 units, 19 lessons", () => {
    expect(data.units).toHaveLength(12);
    const lessonCount = data.units.reduce((n, u) => n + u.lessons.length, 0);
    expect(lessonCount).toBe(19);
  });

  it("gives every unit a hexadecimal colour and accent", () => {
    for (const u of data.units) {
      expect(u.color, `color of ${u.id}`).toMatch(/^#[0-9A-F]{6}$/i);
      expect(u.accent, `accent of ${u.id}`).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  it("has unique unit and lesson ids", () => {
    const unitIds = data.units.map((u) => u.id);
    expect(new Set(unitIds).size).toBe(unitIds.length);

    const lessonIds = data.units.flatMap((u) => u.lessons.map((l) => l.id));
    expect(new Set(lessonIds).size).toBe(lessonIds.length);
  });

  it("gives every lesson 2-6 exercises", () => {
    for (const { unit, lesson } of getAllLessons()) {
      expect(
        lesson.exercises.length,
        `${unit.id}/${lesson.id} outside the 2-6 range`,
      ).toBeGreaterThanOrEqual(2);
      expect(lesson.exercises.length).toBeLessThanOrEqual(6);
    }
  });

  it("keeps every word consistent with its syllables and syllable distractors", () => {
    const words = getAllLessons().flatMap(({ lesson }) =>
      lesson.exercises.filter((e): e is WordExercise => e.type === "word"),
    );
    for (const w of words) {
      // Joining the syllables (accents normalised) must give the target.
      expect(stripAccents(w.syllables.join("")), `join of ${w.target}`).toBe(
        stripAccents(w.target),
      );
      // Composition: 2 wrong syllables, not present in the word.
      expect(
        w.syllableDistractors,
        `syllable distractors of ${w.target}`,
      ).toHaveLength(2);
      for (const d of w.syllableDistractors) {
        expect(w.syllables, `${d} is already in the word ${w.target}`).not.toContain(
          d,
        );
      }
    }
  });

  it("never uses a syllable before it is introduced (spiral constraint)", () => {
    const introduced = new Set<string>();
    for (const { lesson } of getAllLessons()) {
      for (const ex of lesson.exercises) {
        if (ex.type === "word") {
          for (const syll of ex.syllables) {
            expect(
              introduced.has(syll),
              `${lesson.id}: ${ex.target} uses "${syll}" before it is unlocked`,
            ).toBe(true);
          }
        }
        // Syllables (and vowels) unlock only AFTER the words that precede
        // them in the flat order have been checked.
        if (ex.type === "letter" || ex.type === "syllable") {
          introduced.add(ex.target);
        }
      }
    }
  });

  it("shows the first word in the first consonant lesson (m-1)", () => {
    const flat = getAllLessons();
    const firstWordIdx = flat.findIndex(({ lesson }) =>
      lesson.exercises.some((e: Exercise) => e.type === "word"),
    );
    expect(firstWordIdx).toBeGreaterThanOrEqual(0);
    expect(flat[firstWordIdx].lesson.id).toBe("m-1");
    expect(flat[firstWordIdx].unit.id).toBe("m");
  });

  it("has every consonant unit compose at least one word", () => {
    const consonantUnits = data.units.filter((u) =>
      u.lessons.some((l) => l.exercises.some((e) => e.type === "intro")),
    );
    expect(consonantUnits.length).toBeGreaterThan(0);
    for (const u of consonantUnits) {
      const hasWord = u.lessons.some((l) =>
        l.exercises.some((e) => e.type === "word"),
      );
      expect(hasWord, `${u.id} composes no word`).toBe(true);
    }
  });

  it("ends with the final review unit (→ butterfly)", () => {
    expect(data.units.at(-1)?.id).toBe("gran-ripasso");
  });
});
