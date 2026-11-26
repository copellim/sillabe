import { getRecording } from "./recordings";

export interface TTSProvider {
  speak(text: string): Promise<void>;
  stop(): void;
  isSupported(): boolean;
}
export const LETTER_NAMES: Record<string, string> = {
  M: "emme",
  P: "pi",
  L: "elle",
  T: "ti",
  N: "enne",
  S: "esse",
};
export function audioKey(text: string): string {
  return text
    .trim()
    .replace(/[!.?]+$/, "")
    .toLocaleUpperCase("it-IT");
}

export class Narrator implements TTSProvider {
  private volume = 1;
  private rate = 0.85;
  private voiceURI = "";
  private generation = 0;
  private finish: (() => void) | null = null;
  private failed = false;
  private listeners = new Set<() => void>();
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getFailed = () => this.failed;
  private setFailed(value: boolean) {
    this.failed = value;
    this.listeners.forEach((fn) => fn());
  }

  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value));
  }
  configure(voiceURI: string, rate: number) {
    this.voiceURI = voiceURI;
    this.rate = rate;
  }
  isSupported() {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }
  getVoices(): SpeechSynthesisVoice[] {
    return this.isSupported()
      ? window.speechSynthesis
          .getVoices()
          .filter((v) => /^it(?:-|_)/i.test(v.lang) || v.lang === "it")
      : [];
  }
  subscribeVoices(listener: () => void): () => void {
    if (!this.isSupported()) return () => {};
    window.speechSynthesis.addEventListener("voiceschanged", listener);
    return () =>
      window.speechSynthesis.removeEventListener("voiceschanged", listener);
  }
  stop() {
    this.generation++;
    this.finish?.();
    this.finish = null;
    if (this.isSupported()) window.speechSynthesis.cancel();
  }
  async speak(text: string): Promise<void> {
    this.stop();
    const generation = this.generation;
    const clip = await getRecording(audioKey(text));
    if (generation !== this.generation) return;
    if (clip) {
      const played = await new Promise<boolean>((resolve) => {
        const url = URL.createObjectURL(clip);
        const audio = new Audio(url);
        audio.volume = this.volume;
        let done = false;
        const finish = (ok: boolean) => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          audio.pause();
          URL.revokeObjectURL(url);
          if (this.finish === cancel) this.finish = null;
          resolve(ok);
        };
        const cancel = () => finish(false);
        const timer = setTimeout(() => finish(false), 20000);
        this.finish = cancel;
        audio.onended = () => finish(true);
        audio.onerror = () => finish(false);
        void audio.play().catch(() => finish(false));
      });
      if (generation !== this.generation) return;
      if (played) {
        this.setFailed(false);
        return;
      }
    }
    if (!this.isSupported()) {
      this.setFailed(true);
      return;
    }
    const voices = this.getVoices();
    const voice =
      voices.find((v) => v.voiceURI === this.voiceURI) ??
      voices.find((v) => v.localService) ??
      voices[0];
    // Never silently substitute another language for teaching material.
    if (!voice) {
      this.setFailed(true);
      return;
    }
    return new Promise<void>((resolve) => {
      // Lowercase avoids acronym/spelling heuristics on short uppercase strings.
      const name = text.startsWith("lettera:")
        ? LETTER_NAMES[text.slice(8)]
        : undefined;
      const utterance = new SpeechSynthesisUtterance(
        name ?? text.toLocaleLowerCase("it-IT"),
      );
      utterance.lang = "it-IT";
      utterance.voice = voice;
      utterance.rate = this.rate;
      utterance.pitch = 1;
      utterance.volume = this.volume;
      let done = false;
      const finish = (failed = false) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        if (this.finish === cancel) this.finish = null;
        if (generation === this.generation) this.setFailed(failed);
        resolve();
      };
      const cancel = () => finish();
      const timer = setTimeout(() => {
        finish(true);
        window.speechSynthesis.cancel();
      }, 15000);
      this.finish = cancel;
      utterance.onend = () => finish();
      utterance.onerror = () => finish(true);
      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        finish(true);
      }
    }).catch(() => {
      if (generation === this.generation) this.setFailed(true);
    });
  }
}
export const tts = new Narrator();
