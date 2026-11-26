# Teaching principles

These decisions shape how Sillabe teaches a child who knows the letters but
does not read yet. They replaced earlier choices: a soft error sound, three
mandatory options, all-or-nothing progress, and no pictures.

## Feedback and motivation

Success gets a short, predictable reaction: the tile is highlighted, a chord
plays, the caterpillar moves and a few confetti fall. There are no random
rewards, streaks or leaderboards, and the celebration does not change with the
number of attempts. The discovery screen stays visible until the child chooses
to go on. Illustrated words come with a gesture and a sentence tied to their
meaning; the sound laboratory offers exploration without any need to make
mistakes.

Mistakes make no sound and do not animate the mascot. On the second attempt a
steady model appears, and the same help can always be asked for explicitly.
Rapid taps are filtered, without punitive waiting times. The game does not try
to guess the child's intention.

## Learning

The first exposure offers a model. After that, the quiz asks the child to
listen without showing the answer, unless help was asked for or audio is not
available. The first-steps mode offers up to two known alternatives; the first
syllable can be compared with a familiar vowel. The first word, when there is
no other known word to compare it with, is treated as a guided exercise, not as
independent recognition.

Syllables are also shown as consonant + vowel; the consonant's letter name has
its own audio request, distinct from the whole syllable. Composition starts
with a model and, in the first steps, without distractors. In word reviews the
child also chooses between pictures, with the word to read.

`practice` stores independent and assisted observations, whether an item needs
a review, and the order of the last attempt. It does not measure a clinical
skill and does not detect deliberately wrong attempts. The review is chosen
when the lesson starts: at most two targets, after at least two other
exercises. Completing a lesson is always possible and is never revoked.

## Persistence

The v2 schema stays compatible: added fields have default values. `session`
keeps the lesson, the exercise index and the review targets, so the sequence
does not change after a reload. A pause stops the voice and restarts from the
exercise's presentation, not halfway through a recording or a drag. Replaying a
completed lesson does not overwrite the current session. URLs of locked lessons
fall back to the current point of the path.

## Audio

`TTSProvider` keeps `speak`, `stop` and `isSupported`. The narrator first tries
a personal recording in IndexedDB, then the selected Italian voice; with no
preference it favours a local voice. The letter name (`lettera:M`) is separate
from MA. Accented words are requested whole, not rebuilt by chaining syllable
recordings. Lowercase text, a natural pitch and a selectable rate give better
control over the synthetic fallback, but do not guarantee its pronunciation.

Recording needs a user gesture and the browser's microphone permission. It
captures at most 10 seconds; alternatively an audio file up to 5 MB can be
imported. The parent listens to the pronunciation and confirms it before it is
saved. Nothing is sent online. Personal files can be removed one by one.
Descriptive sentences keep using the device voice and may need the network if
that voice is a remote one.

No human recordings are shipped: producing and verifying them needs a voice
provided by a person. The full path to use them is implemented, not a
certified catalogue. Phonetic checks on iOS and Android remain essential.

## Visual direction

Three kinds of screen: the activity, the confirmation of success and the
discovery of the word. Family-oriented, educational and playful, accessible.
Light base #FFF3D1, unit accents, text #4A3B2A; moderate saturation, high
lightness. A structured layout with three focal points: mascot, activity,
action. Free space between areas; the Nunito sans-serif in bold, no italics.
Rounded buttons of at least 48 px, with dark text also on yellow surfaces.
Illustrations in the foreground, simple and tied to the meaning. A large,
smiling mascot that stays still while the child listens, and moves only when
relevant. With reduced-motion preferences, feedback is kept through colour and
text.

During play the caterpillar shows at most six segments, to keep its face
visible. The flower garden on the home and celebration screens represents all
completed lessons, without shrinking the mascot. No reward is ever taken away.
