"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAudio } from "@/hooks/useAudio";
import { useProgress } from "@/hooks/useProgress";
import { knownExercises } from "@/lib/learning";
import { getAllLessons } from "@/lib/gameData";
import Discovery from "@/components/Discovery";
import ProgressCaterpillar from "@/components/ProgressCaterpillar";
import BigButton from "@/components/BigButton";

export default function Laboratory() {
  const { progress } = useProgress();
  const { speak, stop, playPop } = useAudio();
  const [pieces, setPieces] = useState<string[]>([]);
  const [last, setLast] = useState("");
  const [discovered, setDiscovered] = useState<string | null>(null);
  const [exploreOnly, setExploreOnly] = useState(true);
  const known = knownExercises(
    progress.currentLesson,
    Math.max(
      0,
      (progress.session?.index ?? 0) -
        (progress.session?.reviewTargets.length ?? 0),
    ),
  );
  const syllables = [
    ...new Set([
      "A",
      "E",
      "I",
      "O",
      "U",
      ...known.filter((e) => e.type === "syllable").map((e) => e.target),
    ]),
  ];
  const words = getAllLessons()
    .flatMap(({ lesson }) => lesson.exercises)
    .filter((e) => e.type === "word");
  useEffect(() => () => stop(), [stop]);
  function tap(syllable: string) {
    setLast(syllable);
    playPop();
    void speak(syllable);
    if (exploreOnly) return;
    const next = [...pieces, syllable].slice(-3);
    setPieces(next);
    const found = words.find((e) => e.syllables.join("") === next.join(""));
    setDiscovered(found?.target ?? null);
  }
  return (
    <main className="game-page">
      <Link href="/" onClick={stop} className="quiet-button self-start px-5">
        ← Giardino
      </Link>
      <div className="w-52">
        <ProgressCaterpillar />
      </div>
      <h1 className="text-3xl font-extrabold">Il laboratorio dei suoni</h1>
      <p className="max-w-sm text-center">
        Qui puoi ascoltare e provare quanto vuoi.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          className="quiet-button px-4"
          aria-pressed={exploreOnly}
          onClick={() => {
            setExploreOnly(true);
            setPieces([]);
            setDiscovered(null);
          }}
        >
          🔊 Ascolto
        </button>
        <button
          className="quiet-button px-4"
          aria-pressed={!exploreOnly}
          onClick={() => setExploreOnly(false)}
        >
          🧩 Unisco
        </button>
      </div>
      {exploreOnly ? (
        <p className="min-h-20 py-3 text-5xl font-extrabold" aria-live="polite">
          {last || "☝️"}
        </p>
      ) : (
        <div className="flex min-h-20 flex-wrap items-center justify-center gap-3 py-3">
          <p className="text-3xl font-extrabold">
            {pieces.length ? pieces.join(" · ") : "□ · □"}
          </p>
          <button
            className="quiet-button px-3"
            onClick={() => {
              setPieces((p) => p.slice(0, -1));
              setDiscovered(null);
            }}
          >
            ← Togli
          </button>
          <button
            className="quiet-button px-3"
            onClick={() => {
              stop();
              setPieces([]);
              setDiscovered(null);
            }}
          >
            Ricomincia
          </button>
        </div>
      )}
      {discovered && <Discovery key={discovered} word={discovered} />}
      <div className="grid w-full max-w-md grid-cols-3 gap-3 py-4">
        {syllables.map((s) => (
          <button
            key={s}
            className={`quiet-button min-h-20 text-3xl ${last === s ? "ring-2 ring-amber-600" : ""}`}
            onClick={() => tap(s)}
          >
            {s}
          </button>
        ))}
      </div>
      <BigButton href="/play">Giochiamo con il bruco →</BigButton>
    </main>
  );
}
