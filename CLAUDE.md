# CLAUDE.md — Sillabe

Web game that teaches young children to read Italian with the syllabic method.
The UI, voice and curriculum are Italian by design; everything else (docs,
comments, test names, commit messages) is English. See `README.md` for what the
game does and its design principles, and `docs/teaching-principles.md` for the
reasoning behind them.

## Commands

```bash
npm ci            # install
npm run dev       # dev server (webpack; the service worker is disabled in dev)
npm test          # Vitest unit tests (src/**/*.test.ts)
npm run lint      # ESLint (next core-web-vitals + typescript)
npx tsc --noEmit  # type check (there is no typecheck script)
npm run build     # production build; fetches the Nunito font, needs network
```

`dev` and `build` force webpack because Serwist does not support Turbopack.
Serwist compiles `src/app/sw.ts` into `public/sw.js`, which is git-ignored.

## Structure

```
src/
  app/          page.tsx (home), play/, levels/ (lesson map), laboratory/,
                settings/, sw.ts, layout, globals.css
  components/   UI components (Caterpillar, ComposePhase, OptionButton, ...)
  data/         worlds.json (whole curriculum, root key `units`), wordPictures.ts
  hooks/        useProgress.ts, useAudio.ts
  lib/          gameData, learning, progress, tts, audio, recordings, shuffle
  types/        game.ts
  __tests__/    unit tests
public/         manifest.json, icons/
```

The curriculum is units → lessons → exercises (`intro`, `letter`, `syllable`,
`word`), typed in `src/types/game.ts`. A lesson with `kind: "review"` is a
mixed review. `/play` adds up to two review targets in front of a lesson's
exercises (`lib/learning.ts`).

## Invariants

- Content lives in `src/data/worlds.json` and must match `src/types/game.ts`;
  no curriculum hard-coded in components. Every word needs an entry in
  `src/data/wordPictures.ts` (checked by the tests).
- A word may only use syllables already introduced, and options and
  distractors may only use content the child has already met
  (`src/__tests__/content.test.ts`, `src/__tests__/learning.test.ts`).
- localStorage is accessed only through `lib/progress.ts` (key
  `sillabe-game-progress`, schema version 2); components read it through
  `hooks/useProgress.ts`. A save with another version resets to defaults; new
  fields need defaults in `normalize()` so existing v2 saves keep working.
- Replaying a completed lesson must not move the current lesson, add segments
  or overwrite the saved session (`completeLesson`, `saveSession`).
- Game audio goes through `hooks/useAudio.ts`, which applies the volume and
  audio-off settings. Components never call `speechSynthesis` or
  `AudioContext` directly; `VoiceSettings` uses `lib/tts.ts` and
  `lib/recordings.ts` for the voice list and recordings.
- Keep the `TTSProvider` interface (`speak`, `stop`, `isSupported`) stable.
  The narrator tries a personal IndexedDB recording first, then an Italian
  voice; it never falls back to another language, and a failure or timeout
  must unblock the game and switch to visual support.
- Feedback is positive only: mistakes are silent and unlimited, help appears
  after two mistakes and is always available on request, and the celebration
  is the same with or without help. No scores, streaks or lives. The practice
  observations are private and never shown to the child.
- Touch-first, portrait-only, reference viewport 375px; tap targets at least
  48×48px; the game stays playable without audio.

## Verification

Run lint, type check, tests and build after changes. Browser speech, PWA
install, offline cache and recording behave differently per device: check them
manually on iOS Safari and Android Chrome when the flow changes.
