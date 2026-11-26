"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import BigButton from "@/components/BigButton";
import Butterfly from "@/components/Butterfly";
import ComposePhase from "@/components/ComposePhase";
import Confetti from "@/components/Confetti";
import Discovery from "@/components/Discovery";
import OptionButton from "@/components/OptionButton";
import ProgressCaterpillar from "@/components/ProgressCaterpillar";
import WordReveal from "@/components/WordReveal";
import WordPicture from "@/components/WordPicture";
import { useAudio } from "@/hooks/useAudio";
import { useProgress } from "@/hooks/useProgress";
import { getAllLessons, getCurrentLesson } from "@/lib/gameData";
import {
  choicePool,
  exerciseFor,
  knownExercises,
  reviewTargets,
} from "@/lib/learning";
import {
  completeLesson,
  getProgressSnapshot,
  recordPractice,
  saveSession,
} from "@/lib/progress";
import { shuffle } from "@/lib/shuffle";
import type { Exercise } from "@/types/game";

type Phase =
  "present" | "compose" | "guided" | "listen" | "meaning" | "success";

export default function PlayPage() {
  return (
    <Suspense fallback={<main className="p-8">Un momento…</main>}>
      <PlayGame />
    </Suspense>
  );
}

function PlayGame() {
  const params = useSearchParams();
  const router = useRouter();
  const { stop, speak, playCelebration } = useAudio();
  const [run, setRun] = useState<{
    lessonId: string;
    index: number;
    reviews: string[];
    replay: boolean;
  } | null>(null);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [resumeKey, setResumeKey] = useState(0);
  const all = getAllLessons();
  useEffect(() => {
    const progress = getProgressSnapshot();
    const requested = all.find(
      ({ unit, lesson }) =>
        unit.id === params.get("unit") && lesson.id === params.get("lesson"),
    );
    const selected =
      requested &&
      (requested.lesson.id === progress.currentLesson ||
        progress.completedLessons.includes(requested.lesson.id))
        ? requested
        : getCurrentLesson(progress);
    const replay =
      selected.lesson.id !== progress.currentLesson ||
      progress.completedLessons.includes(selected.lesson.id);
    const saved =
      !replay && progress.session?.lessonId === selected.lesson.id
        ? progress.session
        : null;
    const reviews =
      saved?.reviewTargets ?? (replay ? [] : reviewTargets(progress));
    const max =
      selected.lesson.exercises.length +
      reviews.filter((t) => exerciseFor(t)).length;
    // Only initialise at route changes; exercise navigation stays in this component.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRun({
      lessonId: selected.lesson.id,
      index: Math.min(saved?.index ?? 0, max - 1),
      reviews,
      replay,
    });
    setFinished(false);
    // `all` is static curriculum data; including the freshly flattened array resets play.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);
  useEffect(() => () => stop(), [stop]);
  useEffect(() => {
    function hide() {
      if (document.hidden) {
        stop();
        setPaused(true);
      }
    }
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, [stop]);
  useEffect(() => {
    if (run && !run.replay && !finished)
      saveSession({
        lessonId: run.lessonId,
        index: run.index,
        reviewTargets: run.reviews,
      });
  }, [run, finished]);
  if (!run) return <main className="p-8">Un momento…</main>;
  const location = all.find(({ lesson }) => lesson.id === run.lessonId)!;
  const reviewExercises = run.reviews
    .map(exerciseFor)
    .filter((e): e is Exercise => !!e);
  const exercises = [...reviewExercises, ...location.lesson.exercises];
  const exercise = exercises[run.index];
  const final = all.at(-1)?.lesson.id === run.lessonId;
  function advance() {
    stop();
    if (run!.index + 1 < exercises.length)
      setRun({ ...run!, index: run!.index + 1 });
    else {
      completeLesson(run!.lessonId);
      setFinished(true);
      playCelebration();
      void speak(
        final
          ? "Hai letto le tue prime parole!"
          : "Hai fatto crescere il tuo giardino di parole!",
      );
    }
  }
  function nextLesson() {
    stop();
    if (run!.replay || final) {
      router.push("/levels");
      return;
    }
    const progress = getProgressSnapshot();
    setRun({
      lessonId: progress.currentLesson,
      index: 0,
      reviews: reviewTargets(progress),
      replay: false,
    });
    setFinished(false);
  }
  const originalIndex = location.lesson.exercises.findIndex(
    (e) => e.target === exercise?.target && e.type === exercise?.type,
  );
  const known = knownExercises(
    run.lessonId,
    originalIndex < 0 ? 0 : originalIndex,
  );
  return (
    <main
      className="game-page"
      style={
        {
          "--unit-accent": location.unit.accent,
          backgroundColor: location.unit.color,
        } as React.CSSProperties
      }
    >
      <div className="flex w-full max-w-md items-center justify-between gap-3">
        <Link
          href="/"
          onClick={() => stop()}
          className="quiet-button"
          aria-label="Torna alla home"
        >
          ⌂
        </Link>
        <p className="text-sm font-bold">
          {run.index < reviewExercises.length
            ? "Ritroviamo una parola"
            : location.unit.name}
        </p>
        <button
          className="quiet-button"
          onClick={() => {
            stop();
            setPaused(true);
          }}
          aria-label="Pausa"
        >
          Ⅱ
        </button>
      </div>
      {paused ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <ProgressCaterpillar />
          <h1 className="text-3xl font-extrabold">Facciamo una pausa 🌿</h1>
          <p>Ripartiamo da questo esercizio quando vuoi.</p>
          <BigButton
            onClick={() => {
              setResumeKey((k) => k + 1);
              setPaused(false);
            }}
          >
            Riprendiamo ▶
          </BigButton>
          <BigButton href="/">Torna al giardino</BigButton>
        </div>
      ) : finished ? (
        <div className="relative flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <Confetti active count={30} durationMs={2000} />
          {final ? (
            <Butterfly className="w-52" />
          ) : (
            <ProgressCaterpillar expanded />
          )}
          <h1 className="text-3xl font-extrabold">
            {final
              ? "Hai letto le tue prime parole!"
              : "Il tuo giardino cresce!"}
          </h1>
          <p>Ogni parola è una nuova scoperta.</p>
          <BigButton onClick={nextLesson}>
            {run.replay || final ? "Torna al giardino" : "Continuiamo →"}
          </BigButton>
          <Link href="/" className="quiet-button px-6">
            Per oggi ci fermiamo 🌿
          </Link>
        </div>
      ) : (
        <>
          <div
            className="flex gap-2 py-3"
            role="img"
            aria-label={`Esercizio ${run.index + 1} di ${exercises.length}`}
          >
            {exercises.map((_, i) => (
              <span
                key={i}
                className={`h-2.5 w-2.5 rounded-full ${i <= run.index ? "bg-[var(--color-ink)]/70" : "bg-black/10"}`}
              />
            ))}
          </div>
          <ExerciseRound
            key={`${run.lessonId}-${run.index}-${resumeKey}`}
            exercise={exercise}
            known={known}
            onComplete={advance}
          />
        </>
      )}
    </main>
  );
}

function ExerciseRound({
  exercise,
  known,
  onComplete,
}: {
  exercise: Exercise;
  known: Exercise[];
  onComplete: () => void;
}) {
  const { progress } = useProgress();
  const { speak, stop, playSuccess, playPop, audioUnavailable } = useAudio();
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("present");
  const [help, setHelp] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [initial] = useState(() => ({
    beginner: progress.settings.beginner,
    seen: !!progress.practice[exercise.target],
  }));
  const [options] = useState(() =>
    shuffle(choicePool(exercise, known, initial.beginner)),
  );
  const [meaningOptions] = useState(() =>
    shuffle([
      exercise.target,
      ...known
        .filter((e) => e.type === "word" && e.target !== exercise.target)
        .map((e) => e.target)
        .filter((t, i, a) => a.indexOf(t) === i)
        .slice(-1),
    ]),
  );
  const assisted = useRef(!initial.seen);
  const lastTap = useRef(0);
  const correctLock = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const target = exercise.target;
  const visual = audioUnavailable || help || phase === "guided";
  useEffect(() => {
    if (phase === "listen" || phase === "guided") void speak(target);
    else if (phase === "present" && exercise.type !== "word")
      void speak(exercise.type === "intro" ? `lettera:${target}` : target);
    return stop;
  }, [phase, target, exercise.type, speak, stop]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    // Once the answer has been visible, a later recovery of the audio cannot
    // turn this attempt into independent recognition.
    if (audioUnavailable && (phase === "listen" || phase === "guided")) {
      assisted.current = true;
    }
  }, [audioUnavailable, phase]);
  function showHelp() {
    assisted.current = true;
    setHelp(true);
    void speak(target);
  }
  function startQuiz() {
    setHelp(false);
    setPhase(initial.beginner && !initial.seen ? "guided" : "listen");
  }
  function finishAnswer() {
    recordPractice(
      target,
      assisted.current || audioUnavailable || options.length < 2,
    );
    setPhase("success");
  }
  /* eslint-disable react-hooks/purity -- Called only by option click handlers; the timestamp debounces input, never rendering. */
  function choose(option: string) {
    if (correctLock.current || Date.now() - lastTap.current < 350) return;
    lastTap.current = Date.now();
    if (option !== target) {
      assisted.current = true;
      const next = mistakes + 1;
      setMistakes(next);
      if (next === 2) {
        setHelp(true);
        void speak(target);
      }
      return;
    }
    correctLock.current = true;
    setAnswered(true);
    playSuccess();
    timer.current = setTimeout(() => {
      if (phase === "guided" && options.length > 1 && !audioUnavailable) {
        assisted.current = true;
        setAnswered(false);
        correctLock.current = false;
        setHelp(false);
        setMistakes(0);
        setPhase("listen");
      } else if (
        phase === "listen" &&
        exercise.type === "word" &&
        initial.seen &&
        meaningOptions.length > 1
      ) {
        setAnswered(false);
        correctLock.current = false;
        setHelp(false);
        setMistakes(0);
        setPhase("meaning");
      } else finishAnswer();
    }, 1100);
  }
  /* eslint-enable react-hooks/purity */
  return (
    <div className="relative flex w-full max-w-md flex-1 flex-col items-center gap-4">
      <motion.div
        className="w-52"
        animate={
          answered && !reduced
            ? { y: [0, -18, 0, -9, 0], rotate: [0, -5, 5, 0] }
            : { y: 0, rotate: 0 }
        }
        transition={{ duration: 0.8 }}
      >
        <ProgressCaterpillar />
      </motion.div>
      <Confetti
        key={`${phase}-${answered}`}
        active={answered}
        count={18}
        durationMs={1100}
      />
      {phase === "present" && (
        <>
          <div className="flex flex-1 flex-col items-center justify-center gap-5 py-4">
            {exercise.type === "word" ? (
              <WordReveal target={target} syllables={exercise.syllables} />
            ) : (
              <>
                <p className="text-xl font-bold">
                  {exercise.type === "intro"
                    ? "Conosciamo questa lettera"
                    : "Tocca e ascolta"}
                </p>
                <button
                  className="focus-tile"
                  onClick={() => {
                    playPop();
                    void speak(
                      exercise.type === "intro" ? `lettera:${target}` : target,
                    );
                  }}
                  aria-label={`Ascolta ${target}`}
                >
                  {target}
                </button>
                {exercise.type === "syllable" && (
                  <p
                    className="text-3xl font-bold"
                    aria-label={`${target[0]} con ${target[1]} forma ${target}`}
                  >
                    {target[0]} + {target[1]} → {target}
                  </p>
                )}
                {exercise.type === "intro" && (
                  <button
                    className="quiet-button px-5 text-xl"
                    onClick={() => void speak(`${target}A`)}
                  >
                    Con A diventa <strong>{target}A</strong> 🔊
                  </button>
                )}
              </>
            )}
          </div>
          <BigButton
            onClick={() =>
              exercise.type === "intro"
                ? onComplete()
                : exercise.type === "word"
                  ? setPhase("compose")
                  : startQuiz()
            }
          >
            Proviamo insieme →
          </BigButton>
        </>
      )}
      {phase === "compose" && exercise.type === "word" && (
        <ComposePhase
          word={{
            target,
            syllables: exercise.syllables,
            distractors: initial.beginner
              ? []
              : exercise.syllableDistractors.filter((t) =>
                  known.some((e) => e.target === t),
                ),
          }}
          guided={initial.beginner && !initial.seen}
          onHelp={() => {
            assisted.current = true;
          }}
          onComplete={startQuiz}
        />
      )}
      {(phase === "guided" || phase === "listen") && (
        <>
          <h1 className="text-center text-2xl font-extrabold">
            {phase === "guided"
              ? "Troviamola insieme"
              : audioUnavailable
                ? "Guarda e scegli"
                : "Ascolta e scegli"}
          </h1>
          <button
            className="quiet-button gap-3 px-6 text-xl"
            onClick={() => void speak(target)}
            aria-label="Riascolta"
          >
            🔊 Riascolta
          </button>
          <div
            className="flex min-h-14 items-center justify-center"
            aria-live="polite"
          >
            {visual ? (
              <span className="text-4xl font-extrabold">{target}</span>
            ) : (
              <span className="text-base">Quale hai sentito?</span>
            )}
          </div>
          <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 py-3">
            {options.map((option) => (
              <OptionButton
                key={option}
                label={option}
                onClick={() => choose(option)}
                disabled={answered}
                state={answered && option === target ? "correct" : "idle"}
              />
            ))}
          </div>
          <p className="min-h-7 text-center text-lg font-bold" role="status">
            {answered
              ? `Hai trovato ${target}! 🌱`
              : help
                ? "Guardiamo e ascoltiamo insieme."
                : ""}
          </p>
          {!answered && (
            <button className="quiet-button px-6" onClick={showHelp}>
              ☝️ Mi aiuti?
            </button>
          )}
        </>
      )}
      {phase === "meaning" && (
        <>
          <h1 className="text-xl font-bold">Leggi e trova l’immagine</h1>
          <p className="text-4xl font-extrabold">{target}</p>
          <div className="flex flex-wrap justify-center gap-3 py-5">
            {meaningOptions.map((option) => (
              <button
                key={option}
                disabled={answered}
                aria-label={`Scegli l'immagine: ${option}`}
                onClick={() => choose(option)}
                className={`rounded-3xl bg-white p-2 shadow-md ${answered && option === target ? "ring-4 ring-green-600" : ""}`}
              >
                <WordPicture word={option} />
              </button>
            ))}
          </div>
          {help && (
            <p className="text-center">
              Questa è {target}: <WordPicture word={target} />
            </p>
          )}
          <button className="quiet-button px-5" onClick={showHelp}>
            ☝️ Mi aiuti?
          </button>
        </>
      )}
      {phase === "success" && (
        <>
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-4">
            {exercise.type === "word" ? (
              <Discovery word={target} />
            ) : (
              <>
                <h1 className="text-2xl font-extrabold">
                  Hai trovato {target}!
                </h1>
                <button
                  className="focus-tile bg-green-50"
                  onClick={() => void speak(target)}
                  aria-label={`Riascolta ${target}`}
                >
                  {target}
                </button>
                <p className="text-center text-lg">
                  Un altro suono nel tuo giardino 🌱
                </p>
              </>
            )}
          </div>
          <BigButton onClick={onComplete}>Continuiamo →</BigButton>
        </>
      )}
    </div>
  );
}
