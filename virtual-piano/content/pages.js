// Site content: one source for the HTML pages and their Markdown copies.
//
// Inline text supports [links](/path/), **bold** and `code`.
// Block types: h2, h3, p, ul, ol, table, faq, songs, cards, keychart, octave.

import { SONGS, parseMelody } from "../src/data/songs.js";
import { KEY_CODES, codeLabel, midiToFrequency, noteName } from "../src/notes.js";

export const SITE = {
  name: "Nocturne",
  url: (process.env.SITE_URL || "https://onlinevirtualpiano.netlify.app").replace(/\/$/, ""),
  locale: "en",
  tagline: "A free virtual piano with a real concert grand sound",
};

const songList = { type: "songs" };

// Add the brand to a title only when the result stays short enough for search results.
const fitTitle = (base) => (`${base} | Nocturne`.length <= 62 ? `${base} | Nocturne` : base);

const home = {
  id: "home",
  path: "/",
  nav: "Piano",
  title: "Virtual Piano: Play a Free Online Piano Keyboard | Nocturne",
  description:
    "Play a real grand piano online. Nocturne is a free virtual piano keyboard with all 88 keys: play with your mouse, a touch screen or your computer keyboard.",
  h1: "Virtual Piano",
  lede:
    "A free online piano with all 88 keys, recorded from a real concert grand. Play it with your mouse, a touch screen or your computer keyboard — nothing to install, no sign-up.",
  piano: { labels: "keys", demo: true },
  blocks: [
    { type: "h2", text: "Play the online piano using your keyboard" },
    {
      type: "p",
      text: "Your computer keyboard becomes two octaves of piano keys. The bottom letter row **Z X C V B N M** plays the white keys from C3, and the row above, **Q W E R T Y U I**, carries on from middle C. The black keys sit on the rows in between: **S D G H J** and **2 3 5 6 7**. Press **←** or **→** to move up or down an octave, and hold **Space** for the sustain pedal.",
    },
    {
      type: "p",
      text: "The letters printed on the keys always show which key plays which note. For the full key chart and tips for playing chords, see [how to play the online piano using your keyboard](/computer-keyboard-piano/).",
    },
    { type: "h2", text: "A virtual piano keyboard that sounds like a real piano" },
    {
      type: "cards",
      items: [
        { title: "A real concert grand", text: "Every note is a recording of a Yamaha C5 grand piano (the Salamander Grand Piano sample set), not a synthesizer tone." },
        { title: "Touch-sensitive", text: "Strike a key near its front edge to play louder, near the back to play softer. Soft notes also sound darker, as on a real piano." },
        { title: "Sustain pedal", text: "Hold Space, press the on-screen pedal, or use the pedal on your MIDI keyboard to let notes ring." },
        { title: "All 88 keys", text: "From A0 to C8 on wide screens. On phones the interactive piano keyboard shows a window of keys you can move by octave." },
        { title: "MIDI keyboards", text: "Plug in a USB MIDI keyboard and play it straight away in browsers with Web MIDI, such as Chrome and Edge." },
        { title: "Light you can see", text: "Each note sends a ribbon of light up from its key, coloured by pitch, so you can see the shape of what you play." },
      ],
    },
    { type: "h2", text: "How to play this online piano board" },
    {
      type: "ol",
      items: [
        "Press **Start playing** on the piano above. The piano sound loads once (about 2 MB) and then stays ready.",
        "Click or tap a key, or press a letter on your keyboard. Hold several keys at once to play a chord.",
        "Hold **Space** or the gold pedal to sustain notes, and use the **Hall** slider to add room reverb.",
        "Use the arrows next to “Keys on keyboard” to move your computer keys to a higher or lower octave.",
        "Want something to play? Try one of the easy songs below, or press **Play “Evening Study”** to hear a short demo piece.",
      ],
    },
    { type: "h2", text: "Easy songs to play on the virtual piano" },
    {
      type: "p",
      text: "Each song page shows the notes and the matching computer keys, plays the melody for you, and lights up the next key to press so you can learn it note by note.",
    },
    songList,
    { type: "h2", text: "Learn the piano keys" },
    {
      type: "p",
      text: "New to the keyboard? The [piano keys chart](/piano-keys/) labels every white and black key with its note name, explains octaves and middle C, and lets you hear each one.",
    },
    { type: "h2", text: "Frequently asked questions" },
    {
      type: "faq",
      items: [
        { q: "Is this online playable piano free?", a: "Yes. Nocturne is free to use, has no ads, and does not ask you to sign up or install anything." },
        { q: "Can I play the online piano using my computer keyboard?", a: "Yes. The letter rows of your keyboard play two octaves of piano keys, and the arrow keys shift them up or down. The keys are mapped by their position, so QWERTY, AZERTY and QWERTZ keyboards all work. See the [keyboard key chart](/computer-keyboard-piano/)." },
        { q: "Does the virtual piano work on phones and tablets?", a: "Yes. Tap the keys with one or more fingers. Smaller screens show fewer keys at a time; use the octave arrows to move along the keyboard." },
        { q: "Why can't I hear anything?", a: "Browsers only allow sound after you interact with the page, so press **Start playing** first. On an iPhone or iPad, also check that the ring/silent switch is not set to silent, because it mutes web audio." },
        { q: "Why do some chords not play from my computer keyboard?", a: "Many computer keyboards cannot detect more than three or four keys pressed at once (this is called key ghosting). Chords always work with the mouse, a touch screen or a MIDI keyboard." },
        { q: "Can I connect a MIDI keyboard?", a: "Yes, in browsers that support Web MIDI, such as Chrome and Edge. Connect the keyboard, press Start playing and allow MIDI access if asked. Key velocity and the sustain pedal both work." },
        { q: "How many keys does this virtual piano keyboard have?", a: "All 88 keys of a standard piano, from A0 to C8: 52 white keys and 36 black keys." },
        { q: "Does Nocturne record or store what I play?", a: "No. Everything happens in your browser. Nothing you play is uploaded, and the site uses no cookies or analytics. See the [privacy page](/privacy/)." },
      ],
    },
  ],
};

const keyboardPage = {
  id: "keyboard",
  path: "/computer-keyboard-piano/",
  nav: "Keyboard controls",
  title: "Online Piano Using Your Computer Keyboard: Key Chart | Nocturne",
  description:
    "Play the online piano using your computer keyboard. A full chart of which key plays which note, plus black keys, octave shifting, sustain and chord tips.",
  h1: "Play the Piano Using Your Computer Keyboard",
  lede:
    "No piano at hand? Your computer keyboard can play two full octaves of a real grand piano. Here is exactly which key plays which note.",
  piano: { labels: "keys" },
  blocks: [
    { type: "h2", text: "The layout in one sentence" },
    {
      type: "p",
      text: "The bottom letter row is the lower octave and the top letter row is the upper octave; the row just above each one holds its black keys — exactly like the two rows of a piano keyboard.",
    },
    { type: "keychart" },
    { type: "h2", text: "Moving up and down the piano" },
    {
      type: "ul",
      items: [
        "Press **→** to shift every computer key up one octave, and **←** to shift down. The gold line above the piano shows which keys your keyboard is playing.",
        "You can also use the arrow buttons next to “Keys on keyboard” under the piano.",
        "The range goes from C1 up to C8, so every key of the 88-key piano can be reached.",
      ],
    },
    { type: "h2", text: "Sustain, loudness and chords" },
    {
      type: "ul",
      items: [
        "**Sustain:** hold **Space** to keep notes ringing after you let go, just like the right pedal of a real piano. Release it to stop them.",
        "**Chords:** press several keys together. A C major chord is **Q E T** (C, E, G), and A minor is **N Q E** (A, C, E).",
        "**Loudness:** computer keys play at a medium strength. For full control over loud and soft notes, use the mouse (strike near the front of a key to play louder) or a MIDI keyboard.",
      ],
    },
    { type: "h2", text: "Does it work with AZERTY or QWERTZ keyboards?" },
    {
      type: "p",
      text: "Yes. The online piano reads where a key is on the keyboard, not which letter is printed on it, so the layout is the same on any keyboard. In Chrome and Edge the labels on the piano keys even switch to the letters of your own layout.",
    },
    { type: "h2", text: "When a chord doesn't sound" },
    {
      type: "p",
      text: "Most computer keyboards cannot report more than three or four keys at the same time, and some combinations fail even sooner. This is a hardware limit called key ghosting, not a fault of the piano. If a chord drops notes, play it with the mouse or touch screen, or connect a MIDI keyboard.",
    },
    { type: "h2", text: "Keep practising" },
    {
      type: "p",
      text: "Put the chart to use with an [easy song](/songs/), or go back to the [full virtual piano](/).",
    },
  ],
};

const keysPage = {
  id: "keys",
  path: "/piano-keys/",
  nav: "Piano keys",
  title: "Piano Keys Online: Every Key & Note Name, Labeled | Nocturne",
  description:
    "Explore the piano keys online: every white and black key labeled with its note name. Learn how octaves work, find middle C, and hear each key on a real piano.",
  h1: "Piano Keys Online: Every Key and Note, Labeled",
  lede:
    "Every key on this piano shows its note name. Click any key to hear it, and read on to learn how the 88 piano keys are organised.",
  piano: { labels: "notes" },
  blocks: [
    { type: "h2", text: "How piano keys are named" },
    {
      type: "p",
      text: "Piano music uses just seven letters: **A B C D E F G**. The white keys repeat these letters from left to right, over and over. Each repeat of the pattern is called an **octave**, and the same letter one octave higher sounds like a higher version of the same note.",
    },
    {
      type: "p",
      text: "The black keys take their names from their neighbours. The black key just right of C is **C♯** (C sharp), which is the same key as **D♭** (D flat). There is no black key between E and F or between B and C.",
    },
    { type: "h2", text: "Finding your way: groups of two and three" },
    {
      type: "p",
      text: "The black keys come in alternating groups of two and three. **C** is always the white key just left of a group of two black keys, and **F** is just left of a group of three. Once you can spot those two, you can find every other note.",
    },
    { type: "h2", text: "Octave numbers and middle C" },
    {
      type: "p",
      text: "Each octave has a number, which changes at every C. The lowest key on a piano is **A0** and the highest is **C8**. **Middle C** is **C4**, the C closest to the centre of the keyboard; on this site it is also the **Q** key of your computer keyboard.",
    },
    { type: "h2", text: "One octave of piano keys" },
    { type: "octave" },
    {
      type: "p",
      text: "Pitch doubles every octave: A4 is tuned to 440 Hz and A5 to 880 Hz. Neighbouring keys are a **semitone** apart, and twelve semitones make one octave.",
    },
    { type: "h2", text: "How many keys does a piano have?" },
    {
      type: "p",
      text: "A standard piano has **88 keys**: **52 white** and **36 black**, covering a little over seven octaves. Smaller digital keyboards often have 61 or 76 keys. This virtual piano shows all 88 on a wide screen.",
    },
    { type: "h2", text: "Try it" },
    {
      type: "ul",
      items: [
        "Find every C on the piano above, then every F.",
        "Play C, E and G together — that is a C major chord.",
        "Play the [online piano using your keyboard](/computer-keyboard-piano/), or learn an [easy song](/songs/) note by note.",
      ],
    },
  ],
};

const songsHub = {
  id: "songs",
  path: "/songs/",
  nav: "Songs",
  title: "Easy Piano Songs to Play Online, with Letter Notes | Nocturne",
  description:
    "Easy songs to play on the virtual piano: Twinkle Twinkle, Ode to Joy, Happy Birthday, Jingle Bells, Für Elise and more, with letter notes and keyboard keys.",
  h1: "Easy Songs to Play on the Online Piano",
  lede:
    "Pick a song, listen to it, then play it yourself — the next key to press lights up on the piano. Every song shows its letter notes and the matching computer keys.",
  piano: { labels: "keys" },
  blocks: [
    { type: "h2", text: "Songs" },
    songList,
    { type: "h2", text: "How the song pages work" },
    {
      type: "ol",
      items: [
        "Press **Listen** to hear the melody played on the piano.",
        "Press **Start playing**, then play the key that is glowing. The piano waits for you, so go at your own speed.",
        "Read the notes under the piano if you prefer: each note shows its letter name and the computer key that plays it.",
      ],
    },
    {
      type: "p",
      text: "All of these melodies are in the public domain. New to the keys? Start with the [piano keys chart](/piano-keys/).",
    },
  ],
};

const songPages = SONGS.map((song) => ({
  id: `song-${song.slug}`,
  path: `/songs/${song.slug}/`,
  parent: songsHub,
  title: fitTitle(`${song.title}: Easy Piano Notes to Play Online`),
  description: `Learn ${song.title} on the online piano. Letter notes with the matching computer keys; listen to the melody, then play it key by key.`,
  h1: `${song.title}: Easy Piano Notes`,
  lede: `Press **Listen** to hear it, then play the glowing keys to learn ${song.title} one note at a time.`,
  piano: { labels: "keys", song: song.slug, base: song.base },
  song,
  blocks: [
    { type: "h2", text: "Notes" },
    { type: "melody", song },
    { type: "h2", text: "About the piece" },
    { type: "p", text: song.about },
    { type: "p", text: `Composer: ${song.composer}. Level: ${song.level}.` },
    { type: "h2", text: "Practice tips" },
    {
      type: "ul",
      items: [
        "Learn one line at a time. Repeat it until it feels easy, then add the next.",
        "Keep your hand still over the keys and let your fingers do the moving.",
        "Once you know the notes, press **Listen** again and play along with the rhythm.",
        "Hold **Space** for the sustain pedal to make the melody sing — release it between phrases so the notes don't blur.",
      ],
    },
    { type: "h2", text: "More songs" },
    { type: "songs", exclude: song.slug },
  ],
}));

const about = {
  id: "about",
  path: "/about/",
  nav: "About",
  title: "About Nocturne, the Free Virtual Piano",
  description:
    "Nocturne is a free virtual piano that plays a sampled concert grand in your browser. How it works, where the sound comes from, and what it does with your data.",
  h1: "About Nocturne",
  lede: "Nocturne is a free online piano that tries to feel like sitting at a real instrument, in any browser.",
  blocks: [
    { type: "h2", text: "The sound" },
    {
      type: "p",
      text: "The piano you hear is the **Salamander Grand Piano V3**, recorded by Alexander Holm from a Yamaha C5 grand and released under the [Creative Commons Attribution 3.0](https://creativecommons.org/licenses/by/3.0/) licence. Nocturne uses 30 of its recordings, one every three semitones, and tunes the notes in between.",
    },
    { type: "h2", text: "How it works" },
    {
      type: "p",
      text: "Everything runs in your browser with the Web Audio API. Each key press plays a recording through a filter that makes soft notes darker, a volume envelope, a sustain pedal model and a reverb that imitates a concert hall. Up to 64 notes can sound at once.",
    },
    { type: "h2", text: "Accessibility" },
    {
      type: "p",
      text: "Every piano key is a labelled button, the controls work with the keyboard, and the light effects respect your system's reduced-motion setting where they can.",
    },
    { type: "h2", text: "Credits" },
    {
      type: "ul",
      items: [
        "Piano samples: Salamander Grand Piano V3 by Alexander Holm, CC BY 3.0.",
        "Typefaces: Cormorant Garamond and Manrope, SIL Open Font License.",
        "Song melodies: traditional and public-domain works.",
      ],
    },
  ],
};

const privacy = {
  id: "privacy",
  path: "/privacy/",
  nav: "Privacy",
  title: "Privacy | Nocturne Virtual Piano",
  description: "Nocturne collects no personal data: no accounts, no cookies and no analytics. What you play stays in your browser.",
  h1: "Privacy",
  lede: "Short version: Nocturne does not collect, store or share anything about you.",
  blocks: [
    {
      type: "ul",
      items: [
        "**No accounts, no cookies, no analytics, no ads.** The site does not track you.",
        "**What you play stays on your device.** Sound is generated in your browser and is never uploaded.",
        "**MIDI access** is used only to read notes from your MIDI keyboard while the page is open, and only if you allow it.",
        "**Fonts and sounds** are served from this site itself, not from third parties.",
        "**Hosting:** like any web server, our hosting provider (Netlify) may keep standard server logs, such as IP addresses, for security and reliability.",
      ],
    },
  ],
};

export const PAGES = [home, keysPage, keyboardPage, songsHub, ...songPages, about, privacy];
export const NAV = [home, keysPage, keyboardPage, songsHub, about];

// ---------- helpers shared by the HTML and Markdown renderers ----------

export function keyChartRows(base = 48) {
  return Object.entries(KEY_CODES)
    .sort((a, b) => a[1] - b[1])
    .map(([code, offset]) => {
      const midi = base + offset;
      const name = noteName(midi);
      return [codeLabel(code), name + (midi === 60 ? " (middle C)" : ""), name.includes("#") ? "Black" : "White"];
    });
}

export function octaveRows() {
  const out = [];
  for (let midi = 60; midi < 72; midi++) {
    const n = noteName(midi);
    const flat = { "C#": "D♭", "D#": "E♭", "F#": "G♭", "G#": "A♭", "A#": "B♭" }[n.slice(0, 2)];
    out.push([
      n.includes("#") ? `${n.replace("#", "♯")} / ${flat}4` : n,
      n.includes("#") ? "Black" : "White",
      `${midiToFrequency(midi).toFixed(2)} Hz`,
    ]);
  }
  return out;
}

export function melodyPhrases(song) {
  const offsets = Object.entries(KEY_CODES);
  return parseMelody(song.melody).map((phrase) =>
    phrase.map((n) => {
      const hit = offsets.find(([, off]) => song.base + off === n.midi);
      return { note: n.name.replace("#", "♯"), key: hit ? codeLabel(hit[0]) : "", beats: n.beats };
    }),
  );
}
