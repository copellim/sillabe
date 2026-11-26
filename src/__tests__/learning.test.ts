import { describe, it, expect } from "vitest";
import {
  choicePool,
  knownExercises,
  observe,
  reviewTargets,
} from "@/lib/learning";
import { getDefaultProgress } from "@/lib/progress";
import { getAllLessons } from "@/lib/gameData";
import { wordPictures } from "@/data/wordPictures";

describe("learning support without competition", () => {
  it("never introduces an unknown consonant as a distractor", () => {
    for (const { lesson } of getAllLessons())
      lesson.exercises.forEach((exercise, i) => {
        const known = knownExercises(lesson.id, i);
        const options = choicePool(exercise, known, true);
        expect(options).toContain(exercise.target);
        expect(options.length).toBeLessThanOrEqual(2);
        for (const option of options)
          expect([
            ...known.map((e) => e.target),
            "A",
            "E",
            "I",
            "O",
            "U",
          ]).toContain(option);
      });
  });
  it("keeps assisted completion separate from independent recognition", () => {
    const helped = observe(undefined, true, 1);
    expect(helped).toMatchObject({
      independent: 0,
      assisted: 1,
      needsReview: true,
    });
    const independent = observe(helped, false, 4);
    expect(independent).toMatchObject({
      independent: 1,
      assisted: 1,
      needsReview: false,
    });
  });
  it("waits for other practice before revisiting, and caps reviews at two", () => {
    const progress = getDefaultProgress();
    progress.practiceTurn = 6;
    progress.practice = {
      MA: observe(undefined, true, 1),
      MO: observe(undefined, true, 2),
      ME: observe(undefined, true, 3),
      MI: observe(undefined, true, 5),
    };
    expect(reviewTargets(progress)).toEqual(["MA", "MO"]);
  });
  it("has a meaning and discovery for every curriculum word", () => {
    for (const { lesson } of getAllLessons())
      for (const e of lesson.exercises) {
        if (e.type === "word")
          expect(wordPictures[e.target]?.sentence).toBeTruthy();
      }
  });
});
