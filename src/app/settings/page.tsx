"use client";

// Settings (parent area): audio, volume, first-steps mode, voice and
// recordings, progress reset. All state goes through `useProgress()` (the only
// access to localStorage); game audio already honours `settings` through
// `useAudio`, so this page only writes settings.

import { useState } from "react";
import VoiceSettings from "@/components/VoiceSettings";
import BigButton from "@/components/BigButton";
import { useProgress } from "@/hooks/useProgress";

// Three volume levels mapped onto 0..1. The active level is the one closest to
// the saved volume.
const VOLUME_LEVELS = [
  { label: "Basso", value: 0.33 },
  { label: "Medio", value: 0.66 },
  { label: "Alto", value: 1 },
] as const;

function levelOf(volume: number): number {
  let nearest: number = VOLUME_LEVELS[0].value;
  for (const { value } of VOLUME_LEVELS) {
    if (Math.abs(value - volume) < Math.abs(nearest - volume)) nearest = value;
  }
  return nearest;
}

export default function SettingsPage() {
  const { progress, updateSettings, reset } = useProgress();
  const { audioEnabled, volume } = progress.settings;
  const [confirming, setConfirming] = useState(false);

  const activeLevel = levelOf(volume);

  function handleReset() {
    reset();
    setConfirming(false);
  }

  return (
    <main className="flex flex-1 flex-col items-center px-6 pb-12">
      <h1 className="pt-6 text-2xl font-extrabold text-[var(--color-ink)]">
        Impostazioni
      </h1>

      <div className="mt-8 flex w-full max-w-lg flex-col gap-8">
        {/* Audio on/off */}
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide opacity-60">
            Audio
          </h2>
          <button
            type="button"
            role="switch"
            aria-checked={audioEnabled}
            aria-label="Attiva o disattiva l'audio"
            onClick={() => updateSettings({ audioEnabled: !audioEnabled })}
            className="flex min-h-12 items-center justify-between rounded-2xl bg-white/70 px-5 text-lg font-bold text-[var(--color-ink)] shadow-sm active:scale-[0.98]"
          >
            <span>{audioEnabled ? "Audio acceso" : "Audio spento"}</span>
            <span className="text-2xl">{audioEnabled ? "🔊" : "🔇"}</span>
          </button>
        </section>

        {/* Three-level volume */}
        <section
          className={`flex flex-col gap-2 transition-opacity ${
            audioEnabled ? "" : "opacity-40"
          }`}
        >
          <h2 className="text-sm font-bold uppercase tracking-wide opacity-60">
            Volume
          </h2>
          <div className="flex gap-2" role="group" aria-label="Livello volume">
            {VOLUME_LEVELS.map(({ label, value }) => {
              const active = value === activeLevel;
              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => updateSettings({ volume: value })}
                  className={`flex min-h-12 flex-1 items-center justify-center rounded-2xl px-2 text-base font-bold active:scale-95 ${
                    active
                      ? "bg-[var(--color-vocali-accent)] text-[var(--color-ink)] shadow-md shadow-black/15"
                      : "bg-white/70 text-[var(--color-ink)] shadow-sm"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-3xl bg-white/70 p-5">
          <h2 className="text-xl font-extrabold">Primi passi</h2>
          <button
            className="quiet-button px-4"
            role="switch"
            aria-checked={progress.settings.beginner}
            onClick={() =>
              updateSettings({ beginner: !progress.settings.beginner })
            }
          >
            {progress.settings.beginner
              ? "Attivi: due scelte e modello iniziale"
              : "Disattivi: fino a tre scelte"}
          </button>
          <p className="text-sm">
            Per chi riconosce le lettere e sta iniziando a unirle. I ripassi
            seguono le risposte con aiuto, senza punteggi.
          </p>
          <p className="text-sm">
            Suoni e parole da ritrovare insieme:{" "}
            {
              Object.values(progress.practice).filter((p) => p.needsReview)
                .length
            }
            .
          </p>
        </section>
        <VoiceSettings />
        {/* Progress reset */}
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide opacity-60">
            Progressi
          </h2>
          {confirming ? (
            <div className="flex flex-col gap-3 rounded-2xl bg-white/70 p-4 shadow-sm">
              <p className="text-center text-base font-semibold text-[var(--color-ink)]">
                Sei sicuro? Tutti i progressi verranno cancellati.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="min-h-12 flex-1 rounded-2xl bg-white px-2 text-base font-bold text-[var(--color-ink)] shadow-sm active:scale-95"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="min-h-12 flex-1 rounded-2xl bg-[var(--color-ink)] px-2 text-base font-bold text-white active:scale-95"
                >
                  Sì, azzera
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="min-h-12 rounded-2xl border-2 border-[var(--color-ink)]/30 px-5 text-base font-bold text-[var(--color-ink)] opacity-80 active:scale-[0.98]"
            >
              Reset progressi
            </button>
          )}
        </section>
      </div>

      {/* Info / credits (minimal) */}
      <div className="mt-10 flex flex-col items-center gap-1 text-center opacity-60">
        <p className="text-base font-extrabold">Sillabe</p>
        <p className="text-sm font-semibold">
          Impara a leggere, una sillaba alla volta.
        </p>
        <p className="text-xs font-semibold">v1</p>
      </div>

      {/* Back to home */}
      <div className="mt-auto flex w-full flex-col items-center pt-10">
        <BigButton href="/" ariaLabel="Torna alla home">
          ← Indietro
        </BigButton>
      </div>
    </main>
  );
}
