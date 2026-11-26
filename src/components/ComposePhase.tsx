"use client";

// Composition phase, used by `/play`. The child builds the word by DRAGGING
// syllable tiles into the slots (tapping remains as a fallback: it fills the
// first empty slot):
// - slots at the top (one per syllable), draggable tiles at the bottom;
// - one tile per occurrence of a syllable (PAPÀ has two PA tiles): a tile is
//   "used up" once it snaps in, as in a puzzle;
// - dropping on an empty slot with the right syllable for that place → pop in
//   the slot + the syllable is spoken; the place matters, so the child learns
//   where each piece goes;
// - mistakes are silent; after two attempts a model is shown, which is also
//   always available from the help button;
// - word complete: syllable-by-syllable read-back with the slots pulsing in
//   turn, then the whole word, then `onComplete()` (→ listening phase).
// Audio only through `useAudio` (see CLAUDE.md). For a clean state between
// words, mount with `key={word.target}`.

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import SlotArea from "@/components/SlotArea";
import SyllableButton from "@/components/SyllableButton";
import { useAudio } from "@/hooks/useAudio";
import { shuffle } from "@/lib/shuffle";

// Pause after the last tile snaps in, before the read-back (lets the pop show).
const WORD_PAUSE_MS = 500;
// Minimum time per syllable in the final read-back: keeps the rhythm even with
// muted audio or very fast speech, so the visual sequence stays readable.
const READBACK_STEP_MS = 550;
// Pause after the whole word before moving on.
const AFTER_WORD_MS = 500;
// Drop tolerance around each slot: generous aim for small fingers (the slot's
// rectangle is extended by this radius).
const DROP_TOLERANCE_PX = 16;

export interface ComposeWord {
  /** Target word, spoken whole once composition is complete. */
  target: string;
  /** Syllables that make up the word, in order. */
  syllables: string[];
  /** Wrong syllables mixed among the tiles. */
  distractors: string[];
}

type ComposePhaseProps = {
  word: ComposeWord;
  /** Called when the word is complete (→ listening phase in `/play`). */
  onComplete: () => void;
  guided?: boolean;
  onHelp?: () => void;
};

interface Tile {
  /** Stable key: the same syllable can appear on several tiles. */
  id: string;
  label: string;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function ComposePhase({
  word,
  onComplete,
  guided = false,
  onHelp,
}: ComposePhaseProps) {
  const { speak, stop, playPop, playSuccess } = useAudio();
  const reduceMotion = useReducedMotion();

  // Tiles: one per syllable occurrence plus the distractors, shuffled once.
  const [tiles] = useState<Tile[]>(() =>
    shuffle(
      [...word.syllables, ...word.distractors].map((label, i) => ({
        id: `${label}-${i}`,
        label,
      })),
    ),
  );

  // Content per slot (null = empty): dragging can fill slots in any order; the
  // right position is what teaches how the word is built.
  const [placed, setPlaced] = useState<(string | null)[]>(() =>
    word.syllables.map(() => null),
  );
  // Tiles already placed (used up, they leave the tray).
  const [usedIds, setUsedIds] = useState<string[]>([]);
  // The model word: shown from the start when guided, or after two mistakes.
  const [showModel, setShowModel] = useState(guided);
  const mistakes = useRef(0);
  const lastTap = useRef(0);
  const consumed = useRef(new Set<string>());
  // Slot pulsing during the final syllable-by-syllable read-back.
  const [highlight, setHighlight] = useState<number | null>(null);

  const isComplete = placed.every((s) => s !== null);

  // Slot DOM elements, used to resolve the drop point.
  const slotEls = useRef<(HTMLDivElement | null)[]>([]);

  // Unmount guard for the asynchronous read-back sequence.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // Initial prompt, always readable even without audio.
  useEffect(() => {
    void speak(word.target);
    return () => stop();
  }, [word.target, speak, stop]);

  // Read-back timeouts, cleared on unmount to avoid leaks.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
    };
  }, []);

  // Final read-back: each slot pulses while its syllable is spoken, then the
  // whole word — the moment when "the syllables become a word".
  async function readBack() {
    for (let i = 0; i < word.syllables.length; i++) {
      if (!alive.current) return;
      setHighlight(i);
      await Promise.all([speak(word.syllables[i]), delay(READBACK_STEP_MS)]);
    }
    if (!alive.current) return;
    setHighlight(null);
    playSuccess();
    await speak(`${word.target}!`);
    await delay(AFTER_WORD_MS);
    if (alive.current) onComplete();
  }

  function place(tile: Tile, slotIndex: number) {
    playPop();
    consumed.current.add(tile.id);
    const next = placed.map((s, i) => (i === slotIndex ? tile.label : s));
    setPlaced(next);
    setUsedIds((ids) => [...ids, tile.id]);

    if (next.every((s) => s !== null)) {
      timers.current.push(setTimeout(() => void readBack(), WORD_PAUSE_MS));
    } else {
      void speak(tile.label); // speak the syllable that just snapped in
    }
  }

  // Wrong attempt: no sound, the tile goes back to the tray by itself.
  function revealModel() {
    onHelp?.();
    setShowModel(true);
    void speak(word.target);
  }

  function reject() {
    onHelp?.();
    mistakes.current++;
    if (mistakes.current === 2) revealModel();
  }

  /** Tries to place `tile` in slot `slotIndex` (targeted drop or tap). */
  function attempt(tile: Tile, slotIndex: number, now: number) {
    if (
      isComplete ||
      consumed.current.has(tile.id) ||
      placed[slotIndex] !== null ||
      now - lastTap.current < 300
    )
      return;
    lastTap.current = now;
    if (tile.label === word.syllables[slotIndex]) place(tile, slotIndex);
    else reject();
  }

  /** Slot under the release point (viewport coordinates), with tolerance. */
  function slotAt(x: number, y: number): number {
    let nearest = -1;
    let distance = Infinity;
    slotEls.current.forEach((el, i) => {
      if (!el || placed[i] !== null) return;
      const r = el.getBoundingClientRect();
      if (
        x < r.left - DROP_TOLERANCE_PX ||
        x > r.right + DROP_TOLERANCE_PX ||
        y < r.top - DROP_TOLERANCE_PX ||
        y > r.bottom + DROP_TOLERANCE_PX
      )
        return;
      const d = Math.hypot(
        x - (r.left + r.width / 2),
        y - (r.top + r.height / 2),
      );
      if (d < distance) {
        distance = d;
        nearest = i;
      }
    });
    return nearest;
  }

  /* eslint-disable react-hooks/purity -- These handlers run only on a pointer gesture; the timestamp debounces input. */
  function handleDrop(tile: Tile, x: number, y: number) {
    if (isComplete) return;
    const idx = slotAt(x, y);
    // Released over nothing or over a full slot: the tile silently goes back,
    // it is not a mistake.
    if (idx === -1 || placed[idx] !== null) return;
    attempt(tile, idx, Date.now());
  }

  // Tap fallback: fills the first empty slot (reading order).
  function handleTap(tile: Tile) {
    if (isComplete) return;
    const idx = placed.findIndex((s) => s === null);
    if (idx !== -1) attempt(tile, idx, Date.now());
  }

  /* eslint-enable react-hooks/purity */
  return (
    <>
      {/* Prompt always visible (usable without audio) */}
      <p className="pt-8 text-2xl font-extrabold text-[var(--color-ink)]">
        Costruiamo{" "}
        {showModel ? (
          <span className="text-3xl">{word.target}</span>
        ) : (
          "la parola"
        )}
      </p>

      {!isComplete && (
        <div className="flex flex-wrap justify-center gap-3 pt-3">
          <button
            className="quiet-button px-4"
            onClick={() => void speak(word.target)}
          >
            🔊 Riascolta
          </button>
          <button className="quiet-button px-4" onClick={revealModel}>
            ☝️ Mi aiuti?
          </button>
        </div>
      )}
      {showModel && (
        <p className="pt-3 text-2xl font-extrabold">
          {word.syllables.join(" · ")}
        </p>
      )}
      {/* Target slots at the top */}
      <div className="pt-8">
        <SlotArea
          filled={placed}
          highlight={highlight}
          registerSlot={(i, el) => {
            slotEls.current[i] = el;
          }}
        />
      </div>

      {/* Usage hint, discreet and non-blocking */}
      {!isComplete && (
        <p className="pt-3 text-sm font-bold text-[var(--color-ink)]/50">
          Tocca o trascina le sillabe ✋
        </p>
      )}

      {/* Tray of draggable tiles at the bottom */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="flex flex-wrap items-center justify-center gap-4 px-2">
          <AnimatePresence>
            {tiles
              .filter((tile) => !usedIds.includes(tile.id))
              .map((tile) => (
                <motion.div
                  key={tile.id}
                  layout={!reduceMotion}
                  exit={
                    reduceMotion
                      ? { opacity: 0 }
                      : {
                          scale: 0.3,
                          opacity: 0,
                          transition: { duration: 0.25 },
                        }
                  }
                >
                  <SyllableButton
                    label={tile.label}
                    onTap={() => handleTap(tile)}
                    onDrop={(x, y) => handleDrop(tile, x, y)}
                  />
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
