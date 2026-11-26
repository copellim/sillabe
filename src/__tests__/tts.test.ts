import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Narrator } from "@/lib/tts";
vi.mock("@/lib/recordings", () => ({ getRecording: vi.fn(async () => null) }));
let spoken: SpeechSynthesisUtterance[];
beforeEach(() => {
  vi.useFakeTimers();
  spoken = [];
  vi.stubGlobal("window", {
    speechSynthesis: {
      getVoices: () => [
        { lang: "en-US", voiceURI: "en" },
        { lang: "it-IT", voiceURI: "remote", localService: false },
        { lang: "it-IT", voiceURI: "local", localService: true },
      ],
      cancel: vi.fn(),
      speak: (u: SpeechSynthesisUtterance) => spoken.push(u),
    },
  });
  vi.stubGlobal(
    "SpeechSynthesisUtterance",
    class {
      constructor(public text: string) {}
    },
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("narration cancellation and pronunciation controls", () => {
  it("uses lowercase syllables, natural pitch and an Italian offline voice", async () => {
    const tts = new Narrator();
    const pending = tts.speak("MA");
    await Promise.resolve();
    expect(spoken[0]).toMatchObject({
      text: "ma",
      pitch: 1,
      voice: { voiceURI: "local" },
    });
    tts.stop();
    await pending;
  });
  it("honours the parent's selected voice and distinguishes letter names", async () => {
    const tts = new Narrator();
    tts.configure("remote", 0.75);
    const pending = tts.speak("lettera:M");
    await Promise.resolve();
    expect(spoken[0]).toMatchObject({
      text: "emme",
      rate: 0.75,
      voice: { voiceURI: "remote" },
    });
    tts.stop();
    await pending;
  });
  it("settles cancelled speech even when the browser sends no end event", async () => {
    const tts = new Narrator();
    const first = tts.speak("MA");
    await Promise.resolve();
    const second = tts.speak("MO");
    await first;
    await Promise.resolve();
    tts.stop();
    await second;
    expect(spoken).toHaveLength(2);
  });
  it("unblocks the game and enables visual support if speech hangs", async () => {
    const tts = new Narrator();
    const pending = tts.speak("MA");
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(15000);
    await pending;
    expect(tts.getFailed()).toBe(true);
  });
  it("never falls back to an unrelated language", async () => {
    window.speechSynthesis.getVoices = () => [];
    const tts = new Narrator();
    await tts.speak("MA");
    expect(spoken).toHaveLength(0);
    expect(tts.getFailed()).toBe(true);
  });
});
