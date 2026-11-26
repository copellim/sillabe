"use client";

// Reactive reading and writing of progress (see CLAUDE.md): the single hook that
// exposes the state of `lib/progress.ts` to components. It uses
// `useSyncExternalStore` to read localStorage without hydration mismatches.

import { useCallback, useSyncExternalStore } from "react";
import {
  getProgressServerSnapshot,
  getProgressSnapshot,
  resetProgress as resetProgressStore,
  subscribeProgress,
  updateSettings as updateSettingsStore,
} from "@/lib/progress";
import type { GameProgress, Settings } from "@/types/game";

export interface UseProgress {
  progress: GameProgress;
  updateSettings: (partial: Partial<Settings>) => void;
  reset: () => void;
}

export function useProgress(): UseProgress {
  const progress = useSyncExternalStore(
    subscribeProgress,
    getProgressSnapshot,
    getProgressServerSnapshot,
  );

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    updateSettingsStore(partial);
  }, []);

  const reset = useCallback(() => {
    resetProgressStore();
  }, []);

  return { progress, updateSettings, reset };
}
