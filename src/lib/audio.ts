// Feedback sounds synthesised with the Web Audio API.
// The only place that touches `AudioContext`: components always go through
// `hooks/useAudio.ts`. On iOS the context starts `suspended` and must be
// resumed by a user gesture: `resume()` is called inside the play functions.

type WindowWithWebkitAudio = Window &
  typeof globalThis & { webkitAudioContext?: typeof AudioContext };

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (context) return context;
  const w = window as WindowWithWebkitAudio;
  const Ctor = window.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) return null; // Web Audio not supported: silent no-op.
  context = new Ctor();
  return context;
}

/**
 * Plays a note with a soft envelope (no clicks): short attack and release on
 * the GainNode. `volume` (0..1) scales the peak; `delay` (s) delays the attack.
 */
function playNote(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine",
  delay = 0,
): void {
  const start = ctx.currentTime + delay;
  const peak = 0.2 * volume; // low ceiling: gentle, unobtrusive sounds
  const attack = 0.02;
  const release = Math.min(0.12, duration * 0.4);

  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = frequency;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + attack);
  gain.gain.setValueAtTime(peak, start + duration - release);
  gain.gain.linearRampToValueAtTime(0, start + duration);

  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration);
}

function withContext(volume: number, fn: (ctx: AudioContext) => void): void {
  if (volume <= 0) return;
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();
  fn(ctx);
}

// C major chord (C-E-G).
const C_MAJOR = [523.25, 659.25, 783.99];

/** Short major chord (~500ms) for a correct answer. */
export function playSuccess(volume: number): void {
  withContext(volume, (ctx) => {
    for (const f of C_MAJOR) playNote(ctx, f, 0.5, volume, "sine");
  });
}

/** Short, cheerful pop (~150ms) for a tile snapping into place. */
export function playPop(volume: number): void {
  withContext(volume, (ctx) => {
    playNote(ctx, 587.33, 0.1, volume, "triangle"); // D
    playNote(ctx, 880, 0.12, volume, "sine", 0.05); // high A
  });
}

/** Long major chord (~1500ms) for the end-of-lesson celebration. */
export function playCelebration(volume: number): void {
  withContext(volume, (ctx) => {
    // Rising arpeggio followed by a sustained chord.
    C_MAJOR.forEach((f, i) => playNote(ctx, f, 1.5 - i * 0.15, volume, "triangle", i * 0.12));
    playNote(ctx, 1046.5, 1.0, volume, "sine", 0.36); // high C to close
  });
}
