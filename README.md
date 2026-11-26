# Sillabe

Sillabe is a small web game that helps young children take their first steps in
reading Italian with the syllabic method: vowels first, then one consonant at a
time combined with the vowels into syllables, then short words built from the
syllables already met. A friendly caterpillar guides the child along the way.

It is meant for children around 4 to 6 years old who already recognise letters
but do not read yet, playing on a phone with a parent nearby. The game's
interface, voice and content are in Italian on purpose, because Italian is what
it teaches. Documentation, code comments and tests are in English.

## Status

This is a personal project in active development (version 0.1.0). It runs
entirely in the browser, with no backend and no account. The curriculum covers
12 units and 19 lessons (5 of them reviews), with the 5 vowels, 6 consonants
(M, P, L, T, N, S), 30 syllables and 27 words. The game uses the device's
speech synthesis; no human-verified recordings are shipped, and the
pronunciation of isolated syllables and accents still needs to be checked by a
person on real devices.

## How a session works

The home screen offers "Gioca" (play), the "Laboratorio dei suoni" (sound
laboratory) and a lesson map. Play resumes at the current lesson.

- **Presentation.** Each exercise starts with a model: a letter or syllable to
  tap and hear, shown also as consonant + vowel (for example `M + A → MA`). A
  new consonant is introduced with its letter name, separately from its
  syllables. A word is revealed syllable by syllable.
- **Composition (words).** The child drags or taps syllable tiles into slots.
  When the word is complete it is read back syllable by syllable, then whole.
- **Listening.** The game says a target and the child picks it among the
  options, without the answer being shown. In "first steps" mode a target seen
  for the first time is found together first, with the answer visible, then by
  listening.
- **Meaning.** In later encounters with a word, the child reads it and picks the
  matching picture.
- **Discovery.** A solved word becomes a small illustration to explore.
- **Reviews.** A lesson can start with up to two items to find again, chosen
  among those solved with help.
- **Pause.** A pause button, or leaving the tab, stops the voice; the game
  resumes from the interrupted exercise, even after the app is closed.
- **Sound laboratory.** Free listening, and free combination of known syllables;
  when a combination forms a catalogue word, its meaning is shown. Nothing is
  scored there and nothing can be wrong.

A parent area in settings controls audio on/off, a three-level volume, the
"first steps" mode, the Italian voice and speech rate, personal recordings, and
a progress reset with confirmation.

## Design principles

- **No scores, no penalties.** There are no points, streaks, leaderboards or
  lives. A completed lesson is never taken back.
- **Silent mistakes.** A wrong choice makes no sound and no mascot animation.
  Rapid repeated taps are filtered so they do not trigger bursts of feedback.
- **Help that fades.** After two mistakes a model appears, and the same help is
  always available through "Mi aiuti?" without having to fail first. In
  first-steps mode there are at most two options and composition starts with a
  model and no distractors; without it, up to three options and distractors
  made only of syllables already met.
- **Same celebration for everyone.** A correct answer always gets the same short
  reaction (a chime, a highlighted tile, a caterpillar hop and a few confetti),
  whether it came with or without help.
- **Only what has been taught.** Options and distractors only use content the
  child has already met; no word uses a syllable not yet introduced.
- **Private observations.** The game keeps a per-item count of independent and
  assisted answers to choose reviews. It is never shown to the child and is not
  an assessment; settings only show how many items are waiting for a review.
- **Usable without sound.** Targets stay readable on screen. If speech is
  missing, fails or hangs, the game switches to visual support and keeps going.
  It never falls back to a voice in another language.
- **Touch first, portrait only**, with large tap targets.

The reasoning behind these choices is in
[docs/teaching-principles.md](./docs/teaching-principles.md).

## Voice and recordings

Speech goes through the browser's Web Speech API with an Italian voice, a
natural pitch and a selectable rate. Text is spoken in lowercase so that short
syllables are not read as acronyms.

In settings, a parent can record (up to 10 seconds) or import (up to 5 MB) a
pronunciation for any item, listen to it and save it. Saved recordings are
played instead of the synthetic voice. They are stored in the browser's
IndexedDB, work offline, and are never uploaded. Progress lives in
localStorage. Clearing the site data removes both; the in-game progress reset
keeps the recordings.

## Stack

Next.js 16 (App Router, built with webpack), React 19, TypeScript, Tailwind CSS
4, Motion for animations, the Web Speech API and Web Audio API (synthesised
feedback sounds), and Serwist for the PWA service worker. Illustrations are
local SVG and system emoji, with no remote images. The Nunito font is fetched
by `next/font` at build time. Unit tests use Vitest.

## Running it

Requirements: Node.js and npm.

```bash
npm ci            # install dependencies
npm run dev       # development server on http://localhost:3000
npm run build     # production build (needs network access for the font)
npm start         # serve the production build
```

The service worker is disabled in development, so offline behaviour can only be
checked on a production build.

## Testing

```bash
npm test          # Vitest unit tests
npm run lint      # ESLint
npx tsc --noEmit  # type check
```

The unit tests cover the curriculum structure and its progression constraints,
the choice of options and reviews, compatibility and resume of saved progress,
and speech cancellation, timeouts and voice selection. They use a simulated
voice: they check the flow, not pronunciation or device-specific browser
behaviour, which still needs manual testing on iOS Safari and Android Chrome.

## Project structure

```
src/
  app/          routes: home, play, levels (lesson map), laboratory,
                settings; sw.ts is the service worker source
  components/   UI pieces (caterpillar, butterfly, compose phase, tiles,
                word pictures, voice settings, ...)
  data/         worlds.json (the whole curriculum), wordPictures.ts
  hooks/        useProgress (reactive progress), useAudio (voice and sounds)
  lib/          gameData (curriculum navigation), learning (options and
                reviews), progress (localStorage), tts, audio, recordings
                (IndexedDB), shuffle
  types/        game.ts (data model)
  __tests__/    Vitest unit tests
public/         manifest.json, icons/
```

## License

[MIT](./LICENSE)
