"use client";

// The single hook for sounds and speech (see CLAUDE.md): components never call
// `speechSynthesis`/`AudioContext` directly. It honours the `volume` and
// `audioEnabled` settings, read reactively through `useProgress()`.

import { useCallback, useSyncExternalStore } from "react";
import { useProgress } from "@/hooks/useProgress";
import { tts } from "@/lib/tts";
import {
  playCelebration as playCelebrationSound,
  playPop as playPopSound,
  playSuccess as playSuccessSound,
} from "@/lib/audio";

export interface UseAudio {
  /**
   * Speaks `text` and resolves when speech ends (immediately if audio is muted
   * or unsupported), so spoken sequences (syllable by syllable) can await it.
   */
  speak: (text: string) => Promise<void>;
  stop: () => void;
  playSuccess: () => void;
  playPop: () => void;
  playCelebration: () => void;
  audioUnavailable: boolean;
}

export function useAudio(): UseAudio {
  const { progress } = useProgress();
  const { volume, audioEnabled, voiceURI, speechRate } = progress.settings;

  // Effective volume: 0 when audio is off (the single gate).
  const effectiveVolume = audioEnabled ? volume : 0;

  const speak = useCallback(
    (text: string) => {
      if (effectiveVolume <= 0) return Promise.resolve();
      tts.setVolume(effectiveVolume);
      tts.configure(voiceURI, speechRate);
      return tts.speak(text);
    },
    [effectiveVolume, voiceURI, speechRate],
  );

  const stop = useCallback(() => {
    tts.stop();
  }, []);

  const playSuccess = useCallback(() => {
    playSuccessSound(effectiveVolume);
  }, [effectiveVolume]);

  const playPop = useCallback(() => {
    playPopSound(effectiveVolume);
  }, [effectiveVolume]);

  const playCelebration = useCallback(() => {
    playCelebrationSound(effectiveVolume);
  }, [effectiveVolume]);

  const failed = useSyncExternalStore(
    tts.subscribe,
    tts.getFailed,
    () => false,
  );

  return {
    audioUnavailable: effectiveVolume <= 0 || failed,
    speak,
    stop,
    playSuccess,
    playPop,
    playCelebration,
  };
}

/** Preview a parent recording without storing it or touching the game queue. */
export function previewRecording(blob: Blob): () => void {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  const stop = () => {
    audio.pause();
    URL.revokeObjectURL(url);
  };
  audio.onended = stop;
  void audio.play().catch(stop);
  return stop;
}
