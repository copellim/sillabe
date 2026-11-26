"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useAudio } from "@/hooks/useAudio";
import { wordPictures } from "@/data/wordPictures";
import WordPicture from "./WordPicture";

export default function Discovery({ word }: { word: string }) {
  const { speak, stop, playPop } = useAudio();
  const reduced = useReducedMotion();
  const [action, setAction] = useState(0);
  const last = useRef(0);
  const picture = wordPictures[word];
  useEffect(() => {
    void speak(word);
    return stop;
  }, [word, speak, stop]);
  if (!picture) return null;
  function explore() {
    if (Date.now() - last.current < 1400) return;
    last.current = Date.now();
    setAction((n) => n + 1);
    playPop();
    void speak(picture.sentence);
  }
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="text-xl font-bold">
        Hai letto <strong>{word}</strong>!
      </p>
      <button
        onClick={explore}
        className="relative flex min-h-44 w-64 items-center justify-center overflow-hidden rounded-[2rem] bg-white/80 shadow-md"
        aria-label={picture.action}
      >
        <motion.span
          key={action}
          initial={false}
          animate={
            reduced || action === 0
              ? {}
              : word === "SOLE"
                ? { y: [40, -10, 0] }
                : word === "MONETA"
                  ? { rotateY: [0, 360] }
                  : { x: [0, -15, 20, 0], y: [0, -12, 0] }
          }
          transition={{ duration: 1 }}
        >
          <WordPicture
            word={word === "PUPA" && action > 0 ? "FARFALLA" : word}
          />
        </motion.span>
        {action > 0 && word === "SAPONE" && (
          <span aria-hidden className="absolute top-3 right-4 text-4xl">
            🫧
          </span>
        )}
      </button>
      <p className="text-base font-bold">{picture.action} ☝️</p>
      <p className="max-w-xs text-base">{picture.sentence}</p>
    </div>
  );
}
