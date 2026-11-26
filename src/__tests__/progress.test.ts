import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

let storage: Record<string, string>;
beforeEach(() => {
  vi.resetModules();
  storage = {};
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (k: string) => storage[k] ?? null,
      setItem: (k: string, v: string) => {
        storage[k] = v;
      },
    },
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("progress compatibility and resume", () => {
  it("preserves old v2 saves and supplies the new learning defaults", async () => {
    storage["sillabe-game-progress"] = JSON.stringify({
      version: 2,
      currentUnit: "m",
      currentLesson: "m-1",
      completedLessons: ["vocali-1", "vocali-2"],
      caterpillarSegments: 2,
      settings: { volume: 0.66, audioEnabled: true },
    });
    const { loadProgress } = await import("@/lib/progress");
    expect(loadProgress()).toMatchObject({
      currentLesson: "m-1",
      completedLessons: ["vocali-1", "vocali-2"],
      practice: {},
      session: null,
      settings: { beginner: true, volume: 0.66 },
    });
  });
  it("resumes the exercise and clears its cursor only on lesson completion", async () => {
    const store = await import("@/lib/progress");
    store.saveSession({ lessonId: "vocali-1", index: 2, reviewTargets: [] });
    expect(store.loadProgress().session?.index).toBe(2);
    store.completeLesson("vocali-1");
    expect(store.loadProgress()).toMatchObject({
      currentLesson: "vocali-2",
      session: null,
      caterpillarSegments: 1,
    });
    store.completeLesson("vocali-1");
    expect(store.loadProgress().caterpillarSegments).toBe(1);
  });
  it("keeps in-memory learning when localStorage cannot be written", async () => {
    window.localStorage.setItem = () => {
      throw new Error("quota");
    };
    const store = await import("@/lib/progress");
    store.recordPractice("MA", true);
    store.recordPractice("MO", false);
    expect(store.getProgressSnapshot().practiceTurn).toBe(2);
    expect(store.getProgressSnapshot().practice.MA.needsReview).toBe(true);
  });
});
