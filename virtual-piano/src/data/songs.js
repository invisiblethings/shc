// Public-domain melodies for the song pages. Plain JS: used by the page
// generator (Node) and by the piano widget (browser).
//
// `melody` is a space-separated list of notes, each optionally followed by
// ":<beats>" (default 1). "|" marks the end of a phrase.

import { parseNote } from "../notes.js";

export const SONGS = [
  {
    slug: "twinkle-twinkle-little-star",
    composers: [],
    title: "Twinkle Twinkle Little Star",
    composer: "Traditional (French melody, 18th century)",
    level: "Beginner",
    bpm: 100,
    base: 48,
    about:
      "The tune comes from the French song “Ah ! vous dirai-je, maman”, which was popular in the 18th century; the English words are from Jane Taylor’s poem “The Star”, published in 1806. It uses only six neighbouring notes, so it is the classic first piece on any piano.",
    melody:
      "C4 C4 G4 G4 A4 A4 G4:2 | F4 F4 E4 E4 D4 D4 C4:2 | G4 G4 F4 F4 E4 E4 D4:2 | G4 G4 F4 F4 E4 E4 D4:2 | C4 C4 G4 G4 A4 A4 G4:2 | F4 F4 E4 E4 D4 D4 C4:2",
  },
  {
    slug: "mary-had-a-little-lamb",
    composers: [],
    title: "Mary Had a Little Lamb",
    composer: "Traditional (words by Sarah Josepha Hale, 1830)",
    level: "Beginner",
    bpm: 110,
    base: 48,
    about:
      "An American nursery rhyme whose words were first published by Sarah Josepha Hale in 1830. The melody moves step by step between just four notes, which makes it ideal for practising a steady hand position.",
    melody:
      "E4 D4 C4 D4 E4 E4 E4:2 | D4 D4 D4:2 E4 G4 G4:2 | E4 D4 C4 D4 E4 E4 E4 E4 | D4 D4 E4 D4 C4:4",
  },
  {
    slug: "ode-to-joy",
    composers: ["Ludwig van Beethoven"],
    title: "Ode to Joy",
    composer: "Ludwig van Beethoven (Symphony No. 9, 1824)",
    level: "Beginner",
    bpm: 108,
    base: 48,
    about:
      "The famous theme from the final movement of Beethoven’s Ninth Symphony, first performed in Vienna in 1824. It is also the anthem of Europe. The melody stays within five notes apart from one low G, so it sits comfortably under one hand.",
    melody:
      "E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4:1.5 D4:0.5 D4:2 | E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:1.5 C4:0.5 C4:2 | D4 D4 E4 C4 D4 E4:0.5 F4:0.5 E4 C4 D4 E4:0.5 F4:0.5 E4 D4 C4 D4 G3:2 | E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:1.5 C4:0.5 C4:2",
  },
  {
    slug: "happy-birthday",
    composers: ["Mildred J. Hill", "Patty Smith Hill"],
    title: "Happy Birthday",
    composer: "Mildred J. Hill and Patty Smith Hill (melody, 1893)",
    level: "Beginner",
    bpm: 100,
    base: 48,
    about:
      "The melody first appeared as “Good Morning to All” by the sisters Mildred and Patty Hill in 1893. After a long copyright dispute it is now in the public domain. The leap up to the high G in the third line is the only tricky moment.",
    melody:
      "G3:0.75 G3:0.25 A3 G3 C4 B3:2 | G3:0.75 G3:0.25 A3 G3 D4 C4:2 | G3:0.75 G3:0.25 G4 E4 C4 B3 A3 | F4:0.75 F4:0.25 E4 C4 D4 C4:2",
  },
  {
    slug: "jingle-bells",
    composers: ["James Lord Pierpont"],
    title: "Jingle Bells",
    composer: "James Lord Pierpont (1857)",
    level: "Beginner",
    bpm: 120,
    base: 48,
    about:
      "Written by James Lord Pierpont and published in 1857 as “One Horse Open Sleigh”. This is the chorus everyone knows. Most of it repeats the note E, so watch the rhythm rather than your fingers.",
    melody:
      "E4 E4 E4:2 E4 E4 E4:2 | E4 G4 C4:1.5 D4:0.5 E4:4 | F4 F4 F4:1.5 F4:0.5 F4 E4 E4 E4:0.5 E4:0.5 | E4 D4 D4 E4 D4:2 G4:2 | E4 E4 E4:2 E4 E4 E4:2 | E4 G4 C4:1.5 D4:0.5 E4:4 | F4 F4 F4:1.5 F4:0.5 F4 E4 E4 E4:0.5 E4:0.5 | G4 G4 F4 D4 C4:4",
  },
  {
    slug: "fur-elise",
    composers: ["Ludwig van Beethoven"],
    title: "Für Elise",
    composer: "Ludwig van Beethoven (Bagatelle No. 25, c. 1810)",
    level: "Intermediate",
    bpm: 140,
    base: 60,
    about:
      "Beethoven’s Bagatelle No. 25 in A minor was written around 1810 and only published in 1867, long after his death. This is the opening theme. It needs one black key, D♯, and moves quickly between two octaves.",
    melody:
      "E5:0.5 D#5:0.5 E5:0.5 D#5:0.5 E5:0.5 B4:0.5 D5:0.5 C5:0.5 A4:1.5 | C4:0.5 E4:0.5 A4:0.5 B4:1.5 | E4:0.5 G#4:0.5 B4:0.5 C5:1.5 | E4:0.5 E5:0.5 D#5:0.5 E5:0.5 D#5:0.5 E5:0.5 B4:0.5 D5:0.5 C5:0.5 A4:1.5 | C4:0.5 E4:0.5 A4:0.5 B4:1.5 | E4:0.5 C5:0.5 B4:0.5 A4:3",
  },
];

/** "C4 D4:2 | E4" -> phrases of { name, midi, beats }. */
export function parseMelody(melody) {
  return melody.split("|").map((phrase) =>
    phrase.trim().split(/\s+/).map((token) => {
      const [name, beats] = token.split(":");
      return { name, midi: parseNote(name), beats: beats === undefined ? 1 : Number(beats) };
    }),
  );
}

export const songBySlug = (slug) => SONGS.find((s) => s.slug === slug) ?? null;

/** Timed events for listening to a melody: { at (s), type: on|off|end, midi, vel }. */
export function melodyEvents(song) {
  const beat = 60 / song.bpm;
  const events = [];
  let t = 0;
  for (const phrase of parseMelody(song.melody)) {
    for (const n of phrase) {
      events.push({ at: t * beat, type: "on", midi: n.midi, vel: 0.62 });
      events.push({ at: (t + n.beats) * beat - 0.05, type: "off", midi: n.midi });
      t += n.beats;
    }
  }
  events.push({ at: t * beat + 1, type: "end" });
  return events.sort((a, b) => a.at - b.at);
}
